"use server";

// Acciones del dashboard. Todas validan sesión y rol.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, destroySession, canManageBookings, hashPassword } from "@/lib/auth";
import { BookingError, createAppointment, findOrCreatePatient } from "@/lib/booking";
import { findConflict, findDayOffConflict } from "@/lib/availability";
import { refundPayment, PaymentError, totalPaidForAppointment } from "@/lib/payments";
import { sendWhatsApp, STAFF_PHONE } from "@/lib/messaging";
import { formatDate, formatTime, zonedToUtc } from "@/lib/format";
import { appBaseUrl } from "@/lib/mercadopago";
import { SPECIALTIES, DENTIST_TITLES, composeDentistName } from "@/lib/domain";

export async function logout() {
  await destroySession();
  redirect("/");
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
      centro: clinic?.name ?? "",
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
  // El profesional solo opera sobre sus propios turnos
  if (session.role === "DENTIST" && appt.dentistId !== session.dentistId) {
    throw new Error("Sin permiso sobre este turno");
  }

  await prisma.appointment.update({
    where: { id },
    data: { status, ...(status === "CANCELLED" ? { cancelReason: "Cancelado por el centro" } : {}) },
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
    const dentist = await prisma.dentist.findUnique({
      where: { id: dentistId },
      include: { chairs: { select: { id: true } } },
    });
    const chairId = String(formData.get("chairId") || "") || dentist?.defaultChairId;
    if (!chairId) return { ok: false, error: "Elegí una cabina" };
    // Si el profesional tiene cabinas asignados, solo puede agendarse en uno de ellos.
    if (dentist && dentist.chairs.length > 0 && !dentist.chairs.some((c) => c.id === chairId)) {
      return { ok: false, error: "Ese cabina no está asignado a este profesional" };
    }

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

  const dayOff = await findDayOffConflict({ dentistId: appt.dentistId, dateStr });
  if (dayOff) return { ok: false, error: dayOff };

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

// ── Cabinas (solo admin) ───────────────────────────────────────────────────

export async function upsertChair(formData: FormData): Promise<ActionResult> {
  await requireUser(["ADMIN"]);
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) return { ok: false, error: "El nombre es obligatorio" };

  const clinic = await prisma.clinic.findFirst();
  if (!clinic) return { ok: false, error: "No hay centro configurado" };

  const duplicate = await prisma.chair.findFirst({
    where: { clinicId: clinic.id, name, ...(id ? { NOT: { id } } : {}) },
  });
  if (duplicate) return { ok: false, error: "Ya existe una cabina con ese nombre" };

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
  if (totalChairs <= 1) return { ok: false, error: "Debe existir al menos una cabina" };

  const appointmentsCount = await prisma.appointment.count({ where: { chairId: id } });
  if (appointmentsCount > 0) {
    return { ok: false, error: "No se puede eliminar: tiene turnos asociados (histórico). Desactivalo en su lugar." };
  }

  const assignedToDentist = await prisma.dentist.count({ where: { chairs: { some: { id } } } });
  if (assignedToDentist > 0) {
    return { ok: false, error: "Está asignado a un profesional. Quitáselo antes de eliminar." };
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

// ── Profesionales (solo admin) ────────────────────────────────────────────────

// Límite de la foto de perfil ya redimensionada en el cliente (~data URL).
const MAX_PHOTO_CHARS = 700_000; // ~500 KB de imagen

export async function upsertDentist(formData: FormData): Promise<ActionResult> {
  await requireUser(["ADMIN"]);

  const id = String(formData.get("id") || "");
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const specialty = String(formData.get("specialty") || "GENERAL").trim();
  const color = String(formData.get("color") || "#0ea5e9").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const license = String(formData.get("license") || "").trim();
  const hiredAtStr = String(formData.get("hiredAt") || "").trim();
  const photoUrl = String(formData.get("photoUrl") || "").trim();
  const chairIds = [...new Set(formData.getAll("chairIds").map((v) => String(v).trim()).filter(Boolean))];
  const defaultChairId = String(formData.get("defaultChairId") || "").trim() || null;

  if (!firstName || !lastName) {
    return { ok: false, error: "Nombre y apellido son obligatorios" };
  }
  if (title && !DENTIST_TITLES.includes(title as (typeof DENTIST_TITLES)[number])) {
    return { ok: false, error: "Título inválido" };
  }
  if (!SPECIALTIES.includes(specialty as (typeof SPECIALTIES)[number])) {
    return { ok: false, error: "Especialidad inválida" };
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return { ok: false, error: "Color de agenda inválido" };
  }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Ingresá un email válido" };
  }
  if (hiredAtStr && !DATE_RE.test(hiredAtStr)) {
    return { ok: false, error: "Fecha de contratación inválida" };
  }
  if (photoUrl && (!photoUrl.startsWith("data:image/") || photoUrl.length > MAX_PHOTO_CHARS)) {
    return { ok: false, error: "La foto no es válida o es demasiado grande" };
  }
  if (chairIds.length > 0) {
    const found = await prisma.chair.count({ where: { id: { in: chairIds } } });
    if (found !== chairIds.length) return { ok: false, error: "Alguna de las cabinas elegidas no existe" };
  }
  if (defaultChairId && !chairIds.includes(defaultChairId)) {
    return { ok: false, error: "El cabina preferido debe ser uno de los asignados" };
  }

  const data = {
    name: composeDentistName({ title, firstName, lastName }),
    title,
    firstName,
    lastName,
    specialty,
    color,
    phone,
    email: email || null,
    license: license || null,
    hiredAt: hiredAtStr ? new Date(`${hiredAtStr}T00:00:00`) : null,
    photoUrl: photoUrl || null,
    defaultChairId,
  };
  const chairRefs = chairIds.map((cid) => ({ id: cid }));

  try {
    if (id) {
      // `set` reemplaza la lista completa de cabinas asignados por la nueva.
      await prisma.dentist.update({ where: { id }, data: { ...data, chairs: { set: chairRefs } } });
    } else {
      await prisma.dentist.create({ data: { ...data, chairs: { connect: chairRefs } } });
    }
  } catch (err) {
    console.error(err);
    return { ok: false, error: "No se pudo guardar el profesional" };
  }

  // El nombre del profesional aparece en toda la app: revalidar el layout.
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function toggleDentist(id: string, active: boolean): Promise<ActionResult> {
  await requireUser(["ADMIN"]);
  if (!active) {
    const pending = await prisma.appointment.count({
      where: { dentistId: id, status: { in: ["PENDING", "CONFIRMED"] }, endsAt: { gt: new Date() } },
    });
    if (pending > 0) {
      return {
        ok: false,
        error: `No se puede dar de baja: tiene ${pending} turno(s) pendiente(s) o confirmado(s). Reasignalos o cancelalos primero.`,
      };
    }
  }
  await prisma.dentist.update({ where: { id }, data: { active } });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

// Gestión de la contraseña de acceso de un profesional. Solo el admin.
// Si el profesional todavía no tiene cuenta de acceso, la crea usando el email
// indicado (por defecto, su email de contacto).
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MIN_PASSWORD = 8;

export async function setDentistPassword(formData: FormData): Promise<ActionResult> {
  await requireUser(["ADMIN"]);

  const dentistId = String(formData.get("dentistId") || "").trim();
  const password = String(formData.get("password") || "");
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (password.length < MIN_PASSWORD) {
    return { ok: false, error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres` };
  }

  const dentist = await prisma.dentist.findUnique({
    where: { id: dentistId },
    include: { user: true },
  });
  if (!dentist) return { ok: false, error: "Profesional no encontrado" };

  const passwordHash = await hashPassword(password);

  if (dentist.user) {
    await prisma.user.update({ where: { id: dentist.user.id }, data: { passwordHash } });
    return { ok: true };
  }

  // Sin cuenta de acceso todavía: la creamos con el email indicado.
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Ingresá un email válido para el acceso" };
  }
  const taken = await prisma.user.findUnique({ where: { email } });
  if (taken) return { ok: false, error: "Ya existe un usuario con ese email" };

  await prisma.user.create({
    data: {
      email,
      name: dentist.name,
      passwordHash,
      role: "DENTIST",
      dentistId: dentist.id,
    },
  });
  revalidatePath(`/dashboard/dentistas/${dentistId}/editar`);
  return { ok: true };
}

export async function deleteDentist(id: string): Promise<ActionResult> {
  await requireUser(["ADMIN"]);

  const appointmentsCount = await prisma.appointment.count({ where: { dentistId: id } });
  if (appointmentsCount > 0) {
    return {
      ok: false,
      error: "No se puede eliminar: tiene turnos asociados (histórico). Dalo de baja en su lugar.",
    };
  }
  const plansCount = await prisma.treatmentPlan.count({ where: { dentistId: id } });
  if (plansCount > 0) {
    return { ok: false, error: "No se puede eliminar: tiene planes de tratamiento asociados." };
  }
  const user = await prisma.user.count({ where: { dentistId: id } });
  if (user > 0) {
    return { ok: false, error: "Tiene un usuario de acceso vinculado. Desvinculalo antes de eliminar." };
  }

  // Los horarios y ausencias se borran en cascada (onDelete: Cascade).
  await prisma.dentist.delete({ where: { id } });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

// ── Ausencias y feriados ────────────────────────────────────────────────────
// Feriados del centro (dentistId null) los administra el admin.
// Cada profesional administra sus propias ausencias desde su perfil.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function upsertTimeOff(formData: FormData): Promise<ActionResult> {
  const session = await requireUser(["ADMIN", "DENTIST"]);

  const startDate = String(formData.get("startDate") || "").trim();
  const endDate = String(formData.get("endDate") || "").trim() || startDate;
  const reason = String(formData.get("reason") || "").trim();

  if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
    return { ok: false, error: "Ingresá fechas válidas" };
  }
  if (endDate < startDate) {
    return { ok: false, error: "La fecha de fin no puede ser anterior al inicio" };
  }

  // Un profesional solo puede cargar sus propias ausencias; nunca feriados.
  let dentistId: string | null;
  if (session.role === "DENTIST") {
    if (!session.dentistId) {
      return { ok: false, error: "Tu usuario no está vinculado a un profesional" };
    }
    dentistId = session.dentistId;
  } else {
    dentistId = String(formData.get("dentistId") || "").trim() || null;
    if (dentistId) {
      const exists = await prisma.dentist.count({ where: { id: dentistId } });
      if (!exists) return { ok: false, error: "Profesional inexistente" };
    }
  }

  await prisma.timeOff.create({ data: { dentistId, startDate, endDate, reason } });
  revalidatePath("/dashboard/ausencias");
  return { ok: true };
}

export async function deleteTimeOff(id: string): Promise<ActionResult> {
  const session = await requireUser(["ADMIN", "DENTIST"]);
  const existing = await prisma.timeOff.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Registro no encontrado" };
  if (session.role === "DENTIST" && existing.dentistId !== session.dentistId) {
    return { ok: false, error: "Sin permiso sobre este registro" };
  }
  await prisma.timeOff.delete({ where: { id } });
  revalidatePath("/dashboard/ausencias");
  return { ok: true };
}

// ── Horarios de atención ────────────────────────────────────────────────────
// Cada profesional carga sus bloques semanales (día + franja + cabina opcional).
// El admin puede gestionar los horarios de cualquier profesional.

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// Resuelve sobre qué profesional opera la acción según el rol de la sesión.
async function resolveScheduleDentistId(
  session: { role: string; dentistId: string | null },
  formDentistId: string
): Promise<{ dentistId?: string; error?: string }> {
  if (session.role === "DENTIST") {
    if (!session.dentistId) {
      return { error: "Tu usuario no está vinculado a un profesional" };
    }
    return { dentistId: session.dentistId };
  }
  if (!formDentistId) return { error: "Elegí un profesional" };
  const exists = await prisma.dentist.count({ where: { id: formDentistId } });
  if (!exists) return { error: "Profesional inexistente" };
  return { dentistId: formDentistId };
}

export async function addScheduleBlock(formData: FormData): Promise<ActionResult> {
  const session = await requireUser(["ADMIN", "DENTIST"]);

  const resolved = await resolveScheduleDentistId(
    session,
    String(formData.get("dentistId") || "").trim()
  );
  if (resolved.error || !resolved.dentistId) return { ok: false, error: resolved.error };
  const dentistId = resolved.dentistId;

  const weekday = Number(formData.get("weekday"));
  const startTime = String(formData.get("startTime") || "").trim();
  const endTime = String(formData.get("endTime") || "").trim();
  const chairId = String(formData.get("chairId") || "").trim() || null;

  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    return { ok: false, error: "Día inválido" };
  }
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
    return { ok: false, error: "Ingresá horarios válidos (HH:MM)" };
  }
  if (endTime <= startTime) {
    return { ok: false, error: "La hora de fin debe ser posterior a la de inicio" };
  }

  // El cabina (opcional) tiene que estar asignado al profesional y activo.
  if (chairId) {
    const chair = await prisma.chair.findFirst({
      where: { id: chairId, active: true, dentists: { some: { id: dentistId } } },
      select: { id: true },
    });
    if (!chair) {
      return { ok: false, error: "El cabina no está asignado a este profesional" };
    }
  }

  // Sin superposición con otros bloques del mismo día (comparación HH:MM textual).
  const sameDay = await prisma.dentistSchedule.findMany({
    where: { dentistId, weekday },
    select: { startTime: true, endTime: true },
  });
  const overlapping = sameDay.some((b) => startTime < b.endTime && b.startTime < endTime);
  if (overlapping) {
    return { ok: false, error: "El bloque se superpone con otro horario ya cargado ese día" };
  }

  await prisma.dentistSchedule.create({
    data: { dentistId, weekday, startTime, endTime, chairId },
  });
  revalidatePath("/dashboard/horarios");
  return { ok: true };
}

export async function deleteScheduleBlock(id: string): Promise<ActionResult> {
  const session = await requireUser(["ADMIN", "DENTIST"]);
  const existing = await prisma.dentistSchedule.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Registro no encontrado" };
  if (session.role === "DENTIST" && existing.dentistId !== session.dentistId) {
    return { ok: false, error: "Sin permiso sobre este registro" };
  }
  await prisma.dentistSchedule.delete({ where: { id } });
  revalidatePath("/dashboard/horarios");
  return { ok: true };
}
