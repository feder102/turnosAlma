import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatMoney, formatTime, todayStr, zonedToUtc, addDaysStr } from "@/lib/format";
import { StatusBadge, PayBadge, StatCard, PageTitle } from "./ui";

export const metadata = { title: "Dashboard — Centro" };
export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const session = await requireUser();
  const clinic = await prisma.clinic.findFirst();
  const tz = clinic?.timezone;

  const today = todayStr(tz);
  const dayStart = zonedToUtc(today, "00:00", tz);
  const dayEnd = zonedToUtc(addDaysStr(today, 1), "00:00", tz);
  const monthStart = zonedToUtc(today.slice(0, 8) + "01", "00:00", tz);

  // El profesional ve solo su agenda
  const dentistFilter =
    session.role === "DENTIST" && session.dentistId
      ? { dentistId: session.dentistId }
      : {};

  const [todayAppts, monthPayments, activePatients, monthAppts, upcoming] =
    await Promise.all([
      prisma.appointment.findMany({
        where: { startsAt: { gte: dayStart, lt: dayEnd }, ...dentistFilter },
        include: { patient: true, dentist: true, treatment: true, chair: true },
        orderBy: { startsAt: "asc" },
      }),
      prisma.payment.aggregate({
        where: { status: { in: ["PAID", "REFUNDED"] }, createdAt: { gte: monthStart } },
        _sum: { amountCents: true, refundedCents: true },
      }),
      prisma.patient.count({
        where: {
          appointments: {
            some: { startsAt: { gte: new Date(Date.now() - 180 * 24 * 3600 * 1000) } },
          },
        },
      }),
      prisma.appointment.findMany({
        where: { startsAt: { gte: monthStart, lt: dayEnd }, ...dentistFilter },
        select: { status: true },
      }),
      prisma.appointment.findMany({
        where: {
          startsAt: { gte: new Date() },
          status: { in: ["PENDING", "CONFIRMED"] },
          ...dentistFilter,
        },
        include: { patient: true, dentist: true, treatment: true },
        orderBy: { startsAt: "asc" },
        take: 8,
      }),
    ]);

  const income =
    (monthPayments._sum.amountCents ?? 0) - (monthPayments._sum.refundedCents ?? 0);
  const finished = monthAppts.filter((a) =>
    ["COMPLETED", "NO_SHOW"].includes(a.status)
  );
  const noShowRate =
    finished.length > 0
      ? Math.round(
          (finished.filter((a) => a.status === "NO_SHOW").length / finished.length) * 100
        )
      : 0;

  // Agrupar turnos de hoy por profesional
  const byDentist = new Map<string, typeof todayAppts>();
  for (const a of todayAppts) {
    const list = byDentist.get(a.dentist.name) ?? [];
    list.push(a);
    byDentist.set(a.dentist.name, list);
  }

  return (
    <div>
      <PageTitle
        title={`Hola, ${session.name.replace(/^Dra?\.\s*/, "").split(" ")[0]} 👋`}
        action={
          session.role !== "DENTIST" ? (
            <Link
              href="/dashboard/turnos/nuevo"
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              + Nuevo turno
            </Link>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Turnos hoy" value={String(todayAppts.length)} />
        {session.role !== "DENTIST" && (
          <StatCard label="Ingresos del mes" value={formatMoney(income)} />
        )}
        <StatCard label="Pacientes activos" value={String(activePatients)} hint="últimos 6 meses" />
        <StatCard label="Ausentismo del mes" value={`${noShowRate}%`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Turnos de hoy por profesional */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Hoy, por profesional</h2>
          {todayAppts.length === 0 && (
            <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
              No hay turnos para hoy.
            </p>
          )}
          <div className="flex flex-col gap-4">
            {[...byDentist.entries()].map(([dentistName, appts]) => (
              <div key={dentistName} className="rounded-xl border border-neutral-200 bg-white shadow-sm">
                <p className="border-b border-neutral-100 px-4 py-2.5 font-semibold">
                  {dentistName}
                </p>
                <ul className="divide-y divide-neutral-100">
                  {appts.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                      <span className="w-12 font-mono font-semibold">{formatTime(a.startsAt, tz)}</span>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/dashboard/pacientes/${a.patientId}`}
                          className="truncate font-medium hover:underline"
                        >
                          {a.patient.firstName} {a.patient.lastName}
                        </Link>
                        <p className="truncate text-neutral-500">
                          {a.treatment.name} · {a.chair.name}
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Próximos turnos */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Próximos turnos</h2>
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
            <ul className="divide-y divide-neutral-100">
              {upcoming.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <div className="w-24">
                    <p className="font-mono text-xs text-neutral-500">
                      {new Intl.DateTimeFormat("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        timeZone: tz,
                      }).format(a.startsAt)}
                    </p>
                    <p className="font-mono font-semibold">{formatTime(a.startsAt, tz)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {a.patient.firstName} {a.patient.lastName}
                    </p>
                    <p className="truncate text-neutral-500">
                      {a.treatment.name} · {a.dentist.name}
                    </p>
                  </div>
                  <PayBadge status={a.paymentStatus} />
                </li>
              ))}
              {upcoming.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-neutral-500">
                  Sin turnos próximos.
                </li>
              )}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
