import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  formatTime,
  todayStr,
  addDaysStr,
  zonedToUtc,
  utcToZonedParts,
} from "@/lib/format";
import { APPOINTMENT_STATUS_COLORS, type AppointmentStatus, WEEKDAY_LABELS } from "@/lib/domain";
import { PageTitle } from "../ui";

export const metadata = { title: "Agenda — Consultorio" };
export const dynamic = "force-dynamic";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string; vista?: string; profesional?: string }>;
}) {
  const session = await requireUser();
  const params = await searchParams;
  const weekOffset = Number(params.semana ?? 0);
  const vista = params.vista === "sillon" ? "sillon" : "odontologo";

  const clinic = await prisma.clinic.findFirst();
  const tz = clinic?.timezone;

  // Lunes de la semana pedida
  const today = todayStr(tz);
  const todayWeekday = utcToZonedParts(zonedToUtc(today, "12:00", tz), tz).weekday;
  const monday = addDaysStr(today, (todayWeekday === 0 ? -6 : 1 - todayWeekday) + weekOffset * 7);
  const days = Array.from({ length: 6 }, (_, i) => addDaysStr(monday, i)); // lun-sáb

  const rangeStart = zonedToUtc(days[0], "00:00", tz);
  const rangeEnd = zonedToUtc(addDaysStr(days[5], 1), "00:00", tz);

  const dentistFilter =
    session.role === "DENTIST" && session.dentistId
      ? { dentistId: session.dentistId }
      : params.profesional
        ? { dentistId: params.profesional }
        : {};

  const [appointments, dentists, chairs] = await Promise.all([
    prisma.appointment.findMany({
      where: { startsAt: { gte: rangeStart, lt: rangeEnd }, ...dentistFilter },
      include: { patient: true, dentist: true, treatment: true, chair: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.dentist.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.chair.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const groups = vista === "sillon" ? chairs : dentists;

  return (
    <div>
      <PageTitle
        title="Agenda semanal"
        action={
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={`/dashboard/agenda?semana=${weekOffset - 1}&vista=${vista}`}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 hover:bg-neutral-100"
            >
              ← Anterior
            </Link>
            <Link
              href={`/dashboard/agenda?vista=${vista}`}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 hover:bg-neutral-100"
            >
              Hoy
            </Link>
            <Link
              href={`/dashboard/agenda?semana=${weekOffset + 1}&vista=${vista}`}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 hover:bg-neutral-100"
            >
              Siguiente →
            </Link>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link
          href={`/dashboard/agenda?semana=${weekOffset}&vista=odontologo`}
          className={`rounded-full px-4 py-1.5 font-medium ${
            vista === "odontologo" ? "bg-sky-600 text-white" : "border border-neutral-300 bg-white"
          }`}
        >
          Por odontólogo
        </Link>
        <Link
          href={`/dashboard/agenda?semana=${weekOffset}&vista=sillon`}
          className={`rounded-full px-4 py-1.5 font-medium ${
            vista === "sillon" ? "bg-sky-600 text-white" : "border border-neutral-300 bg-white"
          }`}
        >
          Por sillón
        </Link>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Cabecera de días */}
          <div className="grid grid-cols-[140px_repeat(6,1fr)] gap-1">
            <div />
            {days.map((d) => {
              const wd = utcToZonedParts(zonedToUtc(d, "12:00", tz), tz).weekday;
              const isToday = d === today;
              return (
                <div
                  key={d}
                  className={`rounded-t-lg px-2 py-2 text-center text-sm font-semibold ${
                    isToday ? "bg-sky-600 text-white" : "bg-neutral-100"
                  }`}
                >
                  {WEEKDAY_LABELS[wd]} <span className="font-normal">{d.slice(8)}/{d.slice(5, 7)}</span>
                </div>
              );
            })}
          </div>

          {/* Filas por odontólogo o sillón */}
          {groups.map((g) => (
            <div key={g.id} className="mt-1 grid grid-cols-[140px_repeat(6,1fr)] gap-1">
              <div className="flex items-center rounded-lg bg-white px-3 py-2 text-sm font-medium shadow-sm">
                {g.name}
              </div>
              {days.map((d) => {
                const dayAppts = appointments.filter((a) => {
                  const belongs = vista === "sillon" ? a.chairId === g.id : a.dentistId === g.id;
                  return belongs && utcToZonedParts(a.startsAt, tz).dateStr === d;
                });
                return (
                  <div key={d} className="flex min-h-16 flex-col gap-1 rounded-lg bg-white p-1 shadow-sm">
                    {dayAppts.map((a) => (
                      <Link
                        key={a.id}
                        href={`/dashboard/turnos/${a.id}`}
                        title={`${a.patient.firstName} ${a.patient.lastName} — ${a.treatment.name}`}
                        className={`rounded border px-1.5 py-1 text-xs leading-tight transition hover:opacity-80 ${
                          APPOINTMENT_STATUS_COLORS[a.status as AppointmentStatus] ?? ""
                        }`}
                      >
                        <span className="font-mono font-semibold">{formatTime(a.startsAt, tz)}</span>{" "}
                        {a.patient.lastName}
                        <br />
                        <span className="opacity-75">
                          {a.treatment.name.slice(0, 22)}
                          {vista === "odontologo" ? ` · ${a.chair.name}` : ` · ${a.dentist.name.split(" ").at(-1)}`}
                        </span>
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {(
          [
            ["CONFIRMED", "Confirmado"],
            ["PENDING", "Pendiente"],
            ["COMPLETED", "Completado"],
            ["NO_SHOW", "Ausente"],
            ["CANCELLED", "Cancelado"],
          ] as const
        ).map(([s, label]) => (
          <span
            key={s}
            className={`rounded-full border px-2.5 py-1 font-medium ${APPOINTMENT_STATUS_COLORS[s]}`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
