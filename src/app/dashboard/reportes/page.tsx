import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatMoney, todayStr, zonedToUtc } from "@/lib/format";
import { APPOINTMENT_STATUS_LABELS, type AppointmentStatus } from "@/lib/domain";
import { PageTitle, StatCard } from "../ui";

export const metadata = { title: "Reportes — Consultorio" };
export const dynamic = "force-dynamic";

function monthRange(mes: string, tz?: string) {
  const [y, m] = mes.split("-").map(Number);
  const start = zonedToUtc(`${mes}-01`, "00:00", tz);
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const end = zonedToUtc(`${nextMonth}-01`, "00:00", tz);
  return { start, end };
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  await requireUser(["ADMIN"]);
  const clinic = await prisma.clinic.findFirst();
  const tz = clinic?.timezone;
  const currentMonth = todayStr(tz).slice(0, 7);
  const { mes = currentMonth } = await searchParams;
  const { start, end } = monthRange(mes, tz);

  const [appointments, payments] = await Promise.all([
    prisma.appointment.findMany({
      where: { startsAt: { gte: start, lt: end } },
      include: { dentist: true, treatment: true },
    }),
    prisma.payment.findMany({
      where: { status: { in: ["PAID", "REFUNDED"] }, createdAt: { gte: start, lt: end } },
      include: { appointment: { include: { dentist: true } } },
    }),
  ]);

  const income = payments.reduce((s, p) => s + p.amountCents - p.refundedCents, 0);

  const byStatus = new Map<string, number>();
  for (const a of appointments) byStatus.set(a.status, (byStatus.get(a.status) ?? 0) + 1);

  const byDentist = new Map<string, { count: number; income: number }>();
  for (const a of appointments) {
    const e = byDentist.get(a.dentist.name) ?? { count: 0, income: 0 };
    e.count++;
    byDentist.set(a.dentist.name, e);
  }
  for (const p of payments) {
    const name = p.appointment?.dentist.name;
    if (!name) continue;
    const e = byDentist.get(name) ?? { count: 0, income: 0 };
    e.income += p.amountCents - p.refundedCents;
    byDentist.set(name, e);
  }

  const byTreatment = new Map<string, number>();
  for (const a of appointments) {
    if (a.status === "CANCELLED") continue;
    byTreatment.set(a.treatment.name, (byTreatment.get(a.treatment.name) ?? 0) + 1);
  }
  const topTreatments = [...byTreatment.entries()].sort((a, b) => b[1] - a[1]);

  const finished = appointments.filter((a) => ["COMPLETED", "NO_SHOW"].includes(a.status));
  const noShowRate =
    finished.length > 0
      ? Math.round((finished.filter((a) => a.status === "NO_SHOW").length / finished.length) * 100)
      : 0;

  return (
    <div className="max-w-4xl">
      <PageTitle
        title="Reportes"
        action={
          <form className="flex items-center gap-2">
            <input
              type="month"
              name="mes"
              defaultValue={mes}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
            />
            <button className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white">
              Ver
            </button>
          </form>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Turnos del mes" value={String(appointments.length)} />
        <StatCard label="Ingresos" value={formatMoney(income)} />
        <StatCard label="Ausentismo" value={`${noShowRate}%`} />
        <StatCard
          label="Completados"
          value={String(byStatus.get("COMPLETED") ?? 0)}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold">Turnos por estado</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {[...byStatus.entries()].map(([status, count]) => (
              <li key={status} className="flex justify-between">
                <span>{APPOINTMENT_STATUS_LABELS[status as AppointmentStatus] ?? status}</span>
                <span className="font-semibold">{count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold">Por odontólogo</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {[...byDentist.entries()].map(([name, e]) => (
              <li key={name} className="flex justify-between gap-2">
                <span>{name}</span>
                <span className="whitespace-nowrap font-semibold">
                  {e.count} turnos · {formatMoney(e.income)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm md:col-span-2">
          <h2 className="mb-3 font-semibold">Tratamientos más frecuentes</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {topTreatments.map(([name, count]) => (
              <li key={name} className="flex items-center gap-3">
                <span className="w-56 truncate">{name}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full bg-sky-500"
                    style={{ width: `${(count / (topTreatments[0]?.[1] ?? 1)) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right font-semibold">{count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={`/api/reports/export?mes=${mes}&tipo=turnos`}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
        >
          ⬇ Exportar turnos (CSV)
        </a>
        <a
          href={`/api/reports/export?mes=${mes}&tipo=pagos`}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-neutral-100"
        >
          ⬇ Exportar pagos (CSV)
        </a>
      </div>
    </div>
  );
}
