import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatTime } from "@/lib/format";
import { PageTitle } from "../ui";
import { AutoRefresh } from "./client";
import { ChairManager } from "./manage-client";

export const metadata = { title: "Sillones — Consultorio" };
export const dynamic = "force-dynamic";

// Ocupación de sillones en tiempo real (se refresca solo cada 30 segundos).
// El ABM (alta/baja/modificación) de sillones sólo lo puede operar el administrador.
export default async function SillonesPage() {
  const session = await requireUser(["ADMIN", "RECEPTION"]);
  const clinic = await prisma.clinic.findFirst();
  const tz = clinic?.timezone;
  const now = new Date();
  const inTwoHours = new Date(now.getTime() + 2 * 3600 * 1000);

  const chairs = await prisma.chair.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: {
      appointments: {
        where: {
          status: { in: ["PENDING", "CONFIRMED"] },
          endsAt: { gt: now },
          startsAt: { lt: inTwoHours },
        },
        include: { patient: true, dentist: true, treatment: true },
        orderBy: { startsAt: "asc" },
      },
    },
  });

  return (
    <div>
      <AutoRefresh seconds={30} />
      <PageTitle title="Sillones" />

      {session.role === "ADMIN" && <AdminChairManager />}

      <p className="mb-4 text-sm text-neutral-500">
        Ocupación actual y próximas 2 horas. Se actualiza automáticamente cada 30 segundos —
        última actualización: {formatTime(now, tz)} hs.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {chairs.map((chair) => {
          const current = chair.appointments.find(
            (a) => a.startsAt <= now && a.endsAt > now
          );
          const upcoming = chair.appointments.filter((a) => a.startsAt > now);
          return (
            <div
              key={chair.id}
              className={`rounded-xl border-2 bg-white p-5 shadow-sm ${
                current ? "border-red-300" : "border-emerald-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{chair.name}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    current ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {current ? "Ocupado" : "Libre"}
                </span>
              </div>

              {current && (
                <div className="mt-3 rounded-lg bg-red-50 px-3 py-2.5 text-sm">
                  <Link href={`/dashboard/turnos/${current.id}`} className="font-semibold hover:underline">
                    {current.patient.firstName} {current.patient.lastName}
                  </Link>
                  <p className="text-neutral-600">
                    {current.treatment.name} · {current.dentist.name}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-neutral-500">
                    hasta {formatTime(current.endsAt, tz)} hs
                  </p>
                </div>
              )}

              {upcoming.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase text-neutral-400">Próximos</p>
                  <ul className="mt-1 flex flex-col gap-1 text-sm">
                    {upcoming.slice(0, 3).map((a) => (
                      <li key={a.id}>
                        <span className="font-mono font-semibold">{formatTime(a.startsAt, tz)}</span>{" "}
                        {a.patient.lastName} — {a.treatment.name.slice(0, 24)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!current && upcoming.length === 0 && (
                <p className="mt-3 text-sm text-neutral-400">Sin turnos en las próximas 2 horas.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

async function AdminChairManager() {
  const allChairs = await prisma.chair.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { appointments: true } } },
  });
  return (
    <ChairManager
      chairs={allChairs.map((c) => ({
        id: c.id,
        name: c.name,
        active: c.active,
        appointmentsCount: c._count.appointments,
      }))}
    />
  );
}
