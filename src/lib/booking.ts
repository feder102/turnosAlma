// Creación de turnos compartida entre la reserva pública y el dashboard.
// Toda reserva pasa por acá: validación anti doble-reserva + notificaciones.

import { prisma } from "./prisma";
import { findConflict, findDayOffConflict, getAvailableSlots } from "./availability";
import { priceForPatient } from "./domain";
import { sendWhatsApp, STAFF_PHONE } from "./messaging";
import { formatDate, formatTime, utcToZonedParts, addDaysStr } from "./format";

export type NewPatientInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  birthDate?: string | null; // "YYYY-MM-DD"
  insuranceProvider?: string | null;
  insuranceNumber?: string | null;
  medicalNotes?: string | null;
};

export class BookingError extends Error {}

// Busca paciente por teléfono o email; si no existe y hay datos, lo crea.
export async function findOrCreatePatient(input: {
  patientId?: string;
  patient?: NewPatientInput;
}) {
  if (input.patientId) {
    const found = await prisma.patient.findUnique({ where: { id: input.patientId } });
    if (!found) throw new BookingError("Paciente no encontrado.");
    return found;
  }
  const p = input.patient;
  if (!p) throw new BookingError("Faltan los datos del paciente.");

  const existing = await prisma.patient.findFirst({
    where: {
      OR: [
        { phone: p.phone },
        ...(p.email ? [{ email: p.email }] : []),
      ],
    },
  });
  if (existing) {
    // Actualiza datos de contacto/obra social si vinieron nuevos
    return prisma.patient.update({
      where: { id: existing.id },
      data: {
        email: p.email || existing.email,
        insuranceProvider: p.insuranceProvider ?? existing.insuranceProvider,
        insuranceNumber: p.insuranceNumber ?? existing.insuranceNumber,
      },
    });
  }
  return prisma.patient.create({
    data: {
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      email: p.email || null,
      birthDate: p.birthDate ? new Date(p.birthDate + "T12:00:00Z") : null,
      insuranceProvider: p.insuranceProvider || null,
      insuranceNumber: p.insuranceNumber || null,
      medicalNotes: p.medicalNotes || null,
    },
  });
}

export async function createAppointment(params: {
  patientId: string;
  dentistId: string;
  treatmentId: string;
  chairId: string;
  startsAt: Date;
  status?: string;
  planId?: string;
  sessionNumber?: number;
  notifyPatient?: boolean;
  notifyStaff?: boolean;
}) {
  const treatment = await prisma.treatment.findUnique({
    where: { id: params.treatmentId },
  });
  if (!treatment) throw new BookingError("Tratamiento no encontrado.");

  const patient = await prisma.patient.findUnique({ where: { id: params.patientId } });
  if (!patient) throw new BookingError("Paciente no encontrado.");

  const endsAt = new Date(params.startsAt.getTime() + treatment.durationMin * 60000);

  // Feriado del centro o ausencia del profesional en esa fecha.
  const clinicTz = (await prisma.clinic.findFirst({ select: { timezone: true } }))?.timezone;
  const dateStr = utcToZonedParts(params.startsAt, clinicTz).dateStr;
  const dayOff = await findDayOffConflict({ dentistId: params.dentistId, dateStr });
  if (dayOff) throw new BookingError(dayOff);

  // Validación anti doble-reserva dentro de una transacción: SQLite serializa
  // escrituras, así que chequear+crear en la misma transacción evita la carrera.
  const appointment = await prisma.$transaction(async (tx) => {
    const conflict = await findConflict({
      dentistId: params.dentistId,
      chairId: params.chairId,
      startsAt: params.startsAt,
      endsAt,
    });
    if (conflict) throw new BookingError(conflict);
    return tx.appointment.create({
      data: {
        patientId: params.patientId,
        dentistId: params.dentistId,
        treatmentId: params.treatmentId,
        chairId: params.chairId,
        startsAt: params.startsAt,
        endsAt,
        status: params.status ?? "PENDING",
        priceCents: priceForPatient(treatment, patient),
        planId: params.planId,
        sessionNumber: params.sessionNumber,
      },
      include: { dentist: true, treatment: true, patient: true },
    });
  });

  const clinic = await prisma.clinic.findFirst();
  const vars = {
    paciente: patient.firstName,
    centro: clinic?.name ?? "",
    direccion: clinic?.address ?? "",
    tratamiento: treatment.name,
    fecha: formatDate(appointment.startsAt, clinic?.timezone),
    hora: formatTime(appointment.startsAt, clinic?.timezone),
    odontologo: appointment.dentist.name,
  };
  if (params.notifyPatient !== false) {
    await sendWhatsApp({
      to: patient.phone,
      templateKey: "booking_confirmed",
      vars,
      appointmentId: appointment.id,
    });
  }
  if (params.notifyStaff !== false) {
    await sendWhatsApp({
      to: STAFF_PHONE(),
      templateKey: "staff_new_booking",
      vars: { ...vars, paciente: `${patient.firstName} ${patient.lastName}` },
      appointmentId: appointment.id,
    });
  }
  return appointment;
}

// Agenda las sesiones restantes de un tratamiento multi-sesión: crea el plan,
// vincula el primer turno como sesión 1 y busca horarios cada N días
// (corriendo hacia adelante hasta 14 días si el día exacto no tiene lugar).
export async function schedulePlanSessions(firstAppointmentId: string) {
  const first = await prisma.appointment.findUnique({
    where: { id: firstAppointmentId },
    include: { treatment: true, patient: true },
  });
  if (!first) throw new BookingError("Turno no encontrado.");
  if (!first.treatment.multiSession)
    throw new BookingError("El tratamiento no es de varias sesiones.");
  if (first.planId) throw new BookingError("Las sesiones ya fueron agendadas.");

  const clinic = await prisma.clinic.findFirst();
  const tz = clinic?.timezone;
  const total = first.treatment.defaultSessions;
  const interval = first.treatment.sessionIntervalDays;

  const plan = await prisma.treatmentPlan.create({
    data: {
      patientId: first.patientId,
      treatmentId: first.treatmentId,
      dentistId: first.dentistId,
      totalSessions: total,
      billingMode: "PER_SESSION",
    },
  });
  await prisma.appointment.update({
    where: { id: first.id },
    data: { planId: plan.id, sessionNumber: 1 },
  });

  const firstParts = utcToZonedParts(first.startsAt, tz);
  const preferredTime = firstParts.time;
  const booked: { sessionNumber: number; startsAt: Date }[] = [];

  for (let session = 2; session <= total; session++) {
    const targetDate = addDaysStr(firstParts.dateStr, interval * (session - 1));
    let slot = null;
    // busca el día objetivo y hasta 14 días después
    for (let offset = 0; offset <= 14 && !slot; offset++) {
      const dateStr = addDaysStr(targetDate, offset);
      const slots = await getAvailableSlots({
        dateStr,
        treatmentId: first.treatmentId,
        dentistId: first.dentistId,
      });
      // preferir el mismo horario; si no, el más cercano
      slot =
        slots.find((s) => s.time === preferredTime) ??
        slots.sort(
          (a, b) =>
            Math.abs(minutes(a.time) - minutes(preferredTime)) -
            Math.abs(minutes(b.time) - minutes(preferredTime))
        )[0] ??
        null;
    }
    if (!slot) continue; // sin disponibilidad en la ventana: se agenda a mano después

    const appt = await createAppointment({
      patientId: first.patientId,
      dentistId: first.dentistId,
      treatmentId: first.treatmentId,
      chairId: slot.chairId,
      startsAt: new Date(slot.startsAt),
      status: "PENDING",
      planId: plan.id,
      sessionNumber: session,
      notifyPatient: false, // una sola confirmación resumen, no N mensajes
      notifyStaff: false,
    });
    booked.push({ sessionNumber: session, startsAt: appt.startsAt });
  }

  return { plan, booked };
}

function minutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
