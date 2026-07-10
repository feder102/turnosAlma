"use server";

// Acciones del dashboard. Todas validan sesión y rol.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, destroySession, canManageBookings } from "@/lib/auth";
import { BookingError, createAppointment, findOrCreatePatient } from "@/lib/booking";
import { findConflict } from "@/lib/availability";
import { refundPayment, PaymentError, totalPaidForAppointment } from "@/lib/payments";
import { sendWhatsApp, STAFF_PHONE } from "@/lib/messaging";
import { formatDate, formatTime, zonedToUtc } from "@/lib/format";
import { appBaseUrl } from "@/lib/stripe";

export async function logout() {
  await destroySession();
  redirect("/login");
}

// ── Turnos ─────────────────────────────────────────────────────────────────

async function apptWithContext(id: string) {
  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { patient: true, dentist: true, treatment: true },
  });
  if (!appt) throw new Error("Turno no encontrado");
  const clinic = await prisma.clinic.findFirst();
  const tz = clinic?.timezone;
  return {
    appt,
    clinic,
    vars: {
      paciente: appt.patient.firstName,
      consultorio: clinic?.name ?? "",
      direccion: clinic?.address ?? "",
      tratamiento: appt.treatment.name,
      fecha: formatDate(appt.startsAt, tz),
      hora: formatTime(appt.startsAt, tz),
      odontologo: appt.dentist.name,
      link: `${appBaseUrl()}/reservar`,
    },
  };
}

export async function setAppointmentStatus(id: string, status: string) {
  const session = await requireUser();
  const allowed = ["PENDING", "CONFIRMED", "CANCELLED", "NO_SHOW", "COMPLETED"];
  if (!allowed.includes(status)) throw new Error("Estado inválido");

  const { appt, vars } = await apptWithContext(id);
  // El odontólogo solo opera sobre sus propios turnos
  if (session.role === "DENTIST" && appt.dentistId !== session.dentistId) {
    throw new Error("Sin permiso sobre este turno");
  }

  await prisma.appointment.update({
    where: { id },
    data: { status, ...(status === "CANCELLED" ? { cancelReason: "Cancelado por el consultorio" } : {}) },
  });

  if (status === "CANCELLED") {
    await sendWhatsApp({
      to: appt.patient.phone,
      templateKey: "clinic_cancelled",
      vars: { ...vars, accion: "cancelar" },
      appointmentId: appt.id,
    });
    await sendWhatsApp({
      to: STAFF_PHONE(),
      templateKey: "staff_cancelled",
      vars: { ...vars, paciente: `${appt.patient.firstName} ${appt.patient.lastName}` },
      appointmentId: appt.id,
    });
  }
  if (status === "COMPLETED" && appt.treatment.postCareNotes) {
    await sendWhatsApp({
      to: appt.patient.phone,
      templateKey: "post_care",
      vars: { ...vars, cuidados: appt.treatment.postCareNotes },
      appointmentId: appt.id,
    });
  }
  revalidatePath("/dashboard", "layout");
}

export type ActionResult = { ok: boolean; error?: string };

export async function createManualAppointment(formData: FormData): Promise<ActionResult> {
  const session = await requireUser();
  if (!canManageBookings(session.role)) return { ok: false, error: "Sin permiso" };

  try {
    const patientId = String(formData.get("patientId") || "");
    let pid = patientId;
    if (!pid) {
      const patient = await findOrCreatePatient({
        patient: {
          firstName: String(formData.get("firstName") || ""),
          lastName: String(formData.get("lastName") || ""),
          phone: String(formData.get("phone") || ""),
          email: String(formData.get("email") || "") || null,
        },
      });
      pid = patient.id;
    }
    const dateStr = String(formData.get("date") || "");
    const time = String(formData.get("time") || "");
    const clinic = await prisma.clinic.findFirst();
    const dentistId = String(formData.get("dentistId") || "");
    const dentist = await prisma.dentist.findUnique({ where: { id: dentistId } });
    const chairId = String(formData.get("chairId") || "") || dentist?.defaultChairId;
    if (!chairId) return { ok: false, error: "Elegí un sillón" };

    await createAppointment({
      patientId: pid,
      dentistId,
      treatmentId: String(formData.get("treatmentId") || ""),
      chairId,
      startsAt: zonedToUtc(dateStr, time, clinic?.timezone),
      status: "CONFIRMED",
    });
    revalidatePath("/dashboard", "layout");
    return { ok: true };
  } catch (err) {
    if (err instanceof BookingError) return { ok: false, error: err.message };
    console.error(err);
    return { ok: false, error: "No se pudo crear el turno" };
  }
}

export async function rescheduleAppointment(
  id: string,
  dateStr: string,
  time: string,
  notify: boolean
): Promise<ActionResult> {
  const session = await requireUser();
  if (!canManageBookings(session.role)) return { ok: false, error: "Sin permiso" };

  const { appt, clinic, vars } = await apptWithContext(id);
  const startsAt = zonedToUtc(dateStr, time, clinic?.timezone);
  const endsAt = new Date(startsAt.getTime() + appt.treatment.durationMin * 60000);

  const conflict = await findConflict({
    dentistId: appt.dentistId,
    chairId: appt.chairId,
    startsAt,
    endsAt,
    excludeAppointmentId: id,
  });
  if (conflict) return { ok: false, error: conflict };

  await prisma.appointment.update({
    where: { id },
    data: { startsAt, endsAt, status: "CONFIRMED" },
  });

  if (notify) {
    await sendWhatsApp({
      to: appt.patient.phone,
      templateKey: "clinic_cancelled",
      vars: { ...vars, accion: "reprogramar" },
      appointmentId: id,
    });
    await sendWhatsApp({
      to: appt.patient.phone,
      templateKey: "booking_confirmed",
      vars: {
        ...vars,
        fecha: formatDate(startsAt, clinic?.timezone),
        hora: formatTime(startsAt, clinic?.timezone),
      },
      appointmentId: id,
    });
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

// ── Ficha clínica ──────────────────────────────────────────────────────────

export async function saveClinicalNote(formData: FormData): Promise<void> {
  const session = await requireUser();
  const appointmentId = String(formData.get("appointmentId") || "");
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) throw new Error("Turno no encontrado");
  if (session.role === "DENTIST" && appt.dentistId !== session.dentistId) {
    throw new Error("Sin permiso");
  }
  const content = String(formData.get("content") || "").trim();
  const nextSteps = String(formData.get("nextSteps") || "").trim() || null;
  if (!content) return;

  await prisma.clinicalNote.upsert({
    where: { appointmentId },
    create: { appointmentId, patientId: appt.patientId, content, nextSteps },
    update: { content, nextSteps },
  });
  revalidatePath(`/dashboard/pacientes/${appt.patientId}`);
}

// ── Tratamientos (solo admin) ──────────────────────────────────────────────

export async function upsertTreatment(formData: FormData): Promise<void> {
  await requireUser(["ADMIN"]);
  const id = String(formData.get("id") || "");
  const data = {
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || ""),
    durationMin: Number(formData.get("durationMin") || 30),
    priceCents: Math.round(Number(formData.get("price") || 0) * 100),
    insurancePriceCents: formData.get("insurancePrice")
      ? Math.round(Number(formData.get("insurancePrice")) * 100)
      : null,
    depositCents: formData.get("deposit")
      ? Math.round(Number(formData.get("deposit")) * 100)
      : null,
    multiSession: formData.get("multiSession") === "on",
    defaultSessions: Number(formData.get("defaultSessions") || 1),
    sessionIntervalDays: Number(formData.get("sessionIntervalDays") || 21),
    preparationNotes: String(formData.get("preparationNotes") || "") || null,
    postCareNotes: String(formData.get("postCareNotes") || "") || null,
  };
  if (!data.name || data.durationMin <= 0) return;

  if (id) {
    await prisma.treatment.update({ where: { id }, data });
  } else {
    await prisma.treatment.create({ data });
  }
  revalidatePath("/dashboard/tratamientos");
}

export async function toggleTreatment(id: string, active: boolean): Promise<void> {
  await requireUser(["ADMIN"]);
  await prisma.treatment.update({ where: { id }, data: { active } });
  revalidatePath("/dashboard/tratamientos");
}

// ── Sillones (solo admin) ───────────────────────────────────────────────────

export async function upsertChair(formData: FormData): Promise<ActionResult> {
  await requireUser(["ADMIN"]);
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) return { ok: false, error: "El nombre es obligatorio" };

  const clinic = await prisma.clinic.findFirst();
  if (!clinic) return { ok: false, error: "No hay consultorio configurado" };

  const duplicate = await prisma.chair.findFirst({
    where: { clinicId: clinic.id, name, ...(id ? { NOT: { id } } : {}) },
  });
  if (duplicate) return { ok: false, error: "Ya existe un sillón con ese nombre" };

  if (id) {
    await prisma.chair.update({ where: { id }, data: { name } });
  } else {
    await prisma.chair.create({ data: { name, clinicId: clinic.id } });
  }
  revalidatePath("/dashboard/sillones");
  return { ok: true };
}

export async function setChairActive(id: string, active: boolean): Promise<ActionResult> {
  await requireUser(["ADMIN"]);
  if (!active) {
    const pending = await prisma.appointment.count({
      where: { chairId: id, status: { in: ["PENDING", "CONFIRMED"] }, endsAt: { gt: new Date() } },
    });
    if (pending > 0) {
      return { ok: false, error: `No se puede desactivar: tiene ${pending} turno(s) pendiente(s) o confirmado(s)` };
    }
  }
  await prisma.chair.update({ where: { id }, data: { active } });
  revalidatePath("/dashboard/sillones");
  return { ok: true };
}

export async function deleteChair(id: string): Promise<ActionResult> {
  await requireUser(["ADMIN"]);

  const totalChairs = await prisma.chair.count();
  if (totalChairs <= 1) return { ok: false, error: "Debe existir al menos un sillón" };

  const appointmentsCount = await prisma.appointment.count({ where: { chairId: id } });
  if (appointmentsCount > 0) {
    return { ok: false, error: "No se puede eliminar: tiene turnos asociados (histórico). Desactivalo en su lugar." };
  }

  const defaultForDentist = await prisma.dentist.count({ where: { defaultChairId: id } });
  if (defaultForDentist > 0) {
    return { ok: false, error: "Es el sillón por defecto de un odontólogo. Cambialo antes de eliminar." };
  }

  await prisma.chair.delete({ where: { id } });
  revalidatePath("/dashboard/sillones");
  return { ok: true };
}

// ── Pagos ──────────────────────────────────────────────────────────────────

export async function recordManualPayment(formData: FormData): Promise<ActionResult> {
  const session = await requireUser();
  if (!canManageBookings(session.role)) return { ok: false, error: "Sin permiso" };

  const appointmentId = String(formData.get("appointmentId") || "");
  const method = String(formData.get("method") || "CASH");
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) return { ok: false, error: "Turno no encontrado" };

  const paid = await totalPaidForAppointment(appointmentId);
  const remaining = appt.priceCents - paid;
  if (remaining <= 0) return { ok: false, error: "El turno ya está pagado" };

  await prisma.payment.create({
    data: {
      appointmentId,
      patientId: appt.patientId,
      amountCents: remaining,
      kind: paid > 0 ? "BALANCE" : "FULL",
      status: "PAID",
      provider: "manual",
    },
  });
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { paymentStatus: "PAID", paymentMethod: method },
  });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function refundAppointmentPayment(paymentId: string): Promise<ActionResult> {
  const session = await requireUser();
  if (!canManageBookings(session.role)) return { ok: false, error: "Sin permiso" };
  try {
    await refundPayment(paymentId);
    revalidatePath("/dashboard", "layout");
    return { ok: true };
  } catch (err) {
    if (err instanceof PaymentError) return { ok: false, error: err.message };
    console.error(err);
    return { ok: false, error: "No se pudo reembolsar" };
  }
}

// ── Plantillas de mensajes ─────────────────────────────────────────────────

export async function saveTemplate(formData: FormData): Promise<void> {
  const session = await requireUser();
  if (!canManageBookings(session.role)) throw new Error("Sin permiso");
  const key = String(formData.get("key") || "");
  await prisma.messageTemplate.update({
    where: { key },
    data: {
      body: String(formData.get("body") || ""),
      enabled: formData.get("enabled") === "on",
    },
  });
  revalidatePath("/dashboard/mensajes");
}

// ── Pacientes (admin y recepción) ───────────────────────────────────────────

export async function upsertPatient(formData: FormData): Promise<ActionResult> {
  await requireUser(["ADMIN", "RECEPTION"]);

  const id = String(formData.get("id") || "");
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (!firstName || !lastName) return { ok: false, error: "Nombre y apellido son obligatorios" };
  if (phone.length < 8) return { ok: false, error: "Ingresá un teléfono válido" };

  const birthDateStr = String(formData.get("birthDate") || "").trim();
  if (birthDateStr && !/^\d{4}-\d{2}-\d{2}$/.test(birthDateStr)) {
    return { ok: false, error: "Fecha de nacimiento inválida" };
  }

  const data = {
    firstName,
    lastName,
    phone,
    email: String(formData.get("email") || "").trim() || null,
    birthDate: birthDateStr ? new Date(`${birthDateStr}T00:00:00`) : null,
    insuranceProvider: String(formData.get("insuranceProvider") || "").trim() || null,
    insuranceNumber: String(formData.get("insuranceNumber") || "").trim() || null,
    medicalNotes: String(formData.get("medicalNotes") || "").trim() || null,
  };

  try {
    if (id) {
      await prisma.patient.update({ where: { id }, data });
      revalidatePath(`/dashboard/pacientes/${id}`);
    } else {
      await prisma.patient.create({ data });
    }
  } catch (err) {
    console.error(err);
    return { ok: false, error: "No se pudo guardar el paciente" };
  }

  revalidatePath("/dashboard/pacientes");
  return { ok: true };
}

export async function togglePatient(id: string, active: boolean): Promise<void> {
  await requireUser(["ADMIN", "RECEPTION"]);
  await prisma.patient.update({ where: { id }, data: { active } });
  revalidatePath("/dashboard/pacientes");
}
