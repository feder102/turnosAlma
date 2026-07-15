// Cálculo de horarios disponibles: cruza horario del centro, horario del
// profesional, turnos ya ocupados (por profesional Y por cabina) y disponibilidad
// de cabinas. Un turno bloquea a su profesional y a su cabina.

import { prisma } from "./prisma";
import type { OpeningHour } from "./domain";
import { timeToMinutes, minutesToTime, zonedToUtc, utcToZonedParts } from "./format";

const SLOT_STEP_MIN = 15;
const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "COMPLETED"];

export type Slot = {
  time: string; // "09:30" hora del centro
  startsAt: string; // ISO UTC
  dentistId: string;
  chairId: string;
};

type Interval = { start: number; end: number }; // minutos desde 00:00

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

// Días no laborables vigentes en una fecha ("YYYY-MM-DD" en zona del centro).
// Incluye feriados del centro (dentistId null) y ausencias de profesionales.
export async function getTimeOffForDate(dateStr: string) {
  return prisma.timeOff.findMany({
    where: { startDate: { lte: dateStr }, endDate: { gte: dateStr } },
    select: { dentistId: true, reason: true },
  });
}

// ¿Está bloqueada la fecha para un profesional? Devuelve el motivo o null.
// Contempla feriados del centro y ausencias del propio profesional.
export async function findDayOffConflict(params: {
  dentistId: string;
  dateStr: string;
}): Promise<string | null> {
  const blocks = await getTimeOffForDate(params.dateStr);
  const holiday = blocks.find((b) => b.dentistId === null);
  if (holiday) return `El centro no atiende ese día${holiday.reason ? ` (${holiday.reason})` : " (feriado)"}.`;
  const off = blocks.find((b) => b.dentistId === params.dentistId);
  if (off) return `El profesional no atiende ese día${off.reason ? ` (${off.reason})` : " (ausencia)"}.`;
  return null;
}

function intersect(a: Interval[], b: Interval[]): Interval[] {
  const out: Interval[] = [];
  for (const x of a)
    for (const y of b) {
      const start = Math.max(x.start, y.start);
      const end = Math.min(x.end, y.end);
      if (start < end) out.push({ start, end });
    }
  return out;
}

export async function getAvailableSlots(params: {
  dateStr: string; // "YYYY-MM-DD" en zona del centro
  treatmentId: string;
  dentistId?: string | null; // null/undefined = cualquiera disponible
  excludeAppointmentId?: string; // para reprogramar sin que el propio turno bloquee
}): Promise<Slot[]> {
  const { dateStr, treatmentId, dentistId, excludeAppointmentId } = params;

  const [clinic, treatment] = await Promise.all([
    prisma.clinic.findFirst(),
    prisma.treatment.findUnique({ where: { id: treatmentId } }),
  ]);
  if (!clinic || !treatment) return [];

  const tz = clinic.timezone;
  const weekday = zonedWeekday(dateStr, tz);

  const opening = (JSON.parse(clinic.openingHours) as OpeningHour[])
    .filter((h) => h.weekday === weekday)
    .map((h) => ({ start: timeToMinutes(h.open), end: timeToMinutes(h.close) }));
  if (opening.length === 0) return [];

  // Feriados del centro y ausencias de profesionales para esta fecha.
  const timeOff = await getTimeOffForDate(dateStr);
  if (timeOff.some((t) => t.dentistId === null)) return []; // centro cerrado
  const blockedDentistIds = new Set(
    timeOff.map((t) => t.dentistId).filter((id): id is string => id !== null)
  );

  const dentists = (
    await prisma.dentist.findMany({
      where: { active: true, ...(dentistId ? { id: dentistId } : {}) },
      include: {
        schedules: {
          where: { weekday },
          include: { chair: { select: { id: true, active: true } } },
        },
        chairs: { where: { active: true }, select: { id: true } },
      },
    })
  ).filter((d) => !blockedDentistIds.has(d.id));

  // Turnos del día (con margen) que ocupan profesional o cabina
  const dayStart = zonedToUtc(dateStr, "00:00", tz);
  const dayEnd = new Date(dayStart.getTime() + 36 * 3600 * 1000);
  const appointments = await prisma.appointment.findMany({
    where: {
      status: { in: ACTIVE_STATUSES },
      startsAt: { lt: dayEnd },
      endsAt: { gt: dayStart },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
    select: { dentistId: true, chairId: true, startsAt: true, endsAt: true },
  });

  const now = Date.now();
  const duration = treatment.durationMin;
  const slots: Slot[] = [];
  const seenTimes = new Set<string>();

  for (const dentist of dentists) {
    // Cada bloque horario se procesa por separado: si fija una cabina, los
    // slots de ese bloque solo pueden usar esa cabina.
    for (const block of dentist.schedules) {
      const windows = intersect(opening, [
        { start: timeToMinutes(block.startTime), end: timeToMinutes(block.endTime) },
      ]);

      // Cabinas candidatos para este bloque. Con cabina fijado (y activo) se
      // usa solo ese; si no, el por defecto y después el resto de los asignados.
      const chairIds =
        block.chair && block.chair.active
          ? [block.chair.id]
          : [
              ...(dentist.defaultChairId ? [dentist.defaultChairId] : []),
              ...dentist.chairs.map((c) => c.id).filter((id) => id !== dentist.defaultChairId),
            ];
      if (chairIds.length === 0) continue; // sin cabinas asignados: no se puede agendar

      for (const w of windows) {
        for (let t = w.start; t + duration <= w.end; t += SLOT_STEP_MIN) {
          const time = minutesToTime(t);
          if (dentistId == null && seenTimes.has(time)) continue; // ya cubierto por otro profesional

          const startsAt = zonedToUtc(dateStr, time, tz);
          const endsAt = new Date(startsAt.getTime() + duration * 60000);
          if (startsAt.getTime() <= now) continue;

          // ¿El profesional está libre?
          const dentistBusy = appointments.some(
            (a) =>
              a.dentistId === dentist.id &&
              overlaps(startsAt.getTime(), endsAt.getTime(), a.startsAt.getTime(), a.endsAt.getTime())
          );
          if (dentistBusy) continue;

          const freeChair = chairIds.find(
            (chairId) =>
              !appointments.some(
                (a) =>
                  a.chairId === chairId &&
                  overlaps(startsAt.getTime(), endsAt.getTime(), a.startsAt.getTime(), a.endsAt.getTime())
              )
          );
          if (!freeChair) continue;

          slots.push({ time, startsAt: startsAt.toISOString(), dentistId: dentist.id, chairId: freeChair });
          seenTimes.add(time);
        }
      }
    }
  }

  slots.sort((a, b) => a.time.localeCompare(b.time));
  return slots;
}

function zonedWeekday(dateStr: string, tz: string): number {
  // Mediodía local para evitar corrimientos por offset
  return utcToZonedParts(zonedToUtc(dateStr, "12:00", tz), tz).weekday;
}

// Validación anti doble-reserva al confirmar (se corre dentro de la creación).
// Devuelve un mensaje de error o null si el horario sigue libre.
export async function findConflict(params: {
  dentistId: string;
  chairId: string;
  startsAt: Date;
  endsAt: Date;
  excludeAppointmentId?: string;
}): Promise<string | null> {
  const { dentistId, chairId, startsAt, endsAt, excludeAppointmentId } = params;
  const conflict = await prisma.appointment.findFirst({
    where: {
      status: { in: ACTIVE_STATUSES },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
      OR: [{ dentistId }, { chairId }],
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
    select: { id: true, dentistId: true },
  });
  if (!conflict) return null;
  return conflict.dentistId === dentistId
    ? "El profesional ya tiene un turno en ese horario."
    : "El cabina ya está ocupado en ese horario.";
}
