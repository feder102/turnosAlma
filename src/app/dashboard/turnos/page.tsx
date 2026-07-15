import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMoney } from "@/lib/format";
import { StatusBadge, PayBadge, PageTitle } from "../ui";

export const metadata = { title: "Turnos — Centro" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "proximos", label: "Próximos" },
  { key: "hoy", label: "Hoy" },
  { key: "pasados", label: "Pasados" },
  { key: "cancelados", label: "Cancelados" },
] as const;

export default async function TurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const session = await requireUser();
  const { filtro = "proximos" } = await searchParams;
  const clinic = await prisma.clinic.findFirst();
  const tz = clinic?.timezone;

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 3600 * 1000);

  const where: Record<string, unknown> = {};
  if (filtro === "hoy") where.startsAt = { gte: startOfDay, lt: endOfDay };
  else if (filtro === "pasados") where.startsAt = { lt: now };
  else if (filtro === "cancelados") where.status = "CANCELLED";
  else {
    where.startsAt = { gte: now };
    where.status = { not: "CANCELLED" };
  }
  if (session.role === "DENTIST" && session.dentistId) {
    where.dentistId = session.dentistId;
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { patient: true, dentist: true, treatment: true, chair: true },
    orderBy: { startsAt: filtro === "pasados" ? "desc" : "asc" },
    take: 100,
  });

  return (
    <div>
      <PageTitle
        title="Turnos"
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

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/dashboard/turnos?filtro=${f.key}`}
            className={`rounded-full px-4 py-1.5 font-medium ${
              filtro === f.key ? "bg-sky-600 text-white" : "border border-neutral-300 bg-white"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-500">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Paciente</th>
              <th className="px-4 py-3">Tratamiento</th>
              <th className="px-4 py-3">Profesional</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3 text-right">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {appointments.map((a) => (
              <tr key={a.id} className="hover:bg-neutral-50">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                  <Link href={`/dashboard/turnos/${a.id}`} className="hover:underline">
                    {formatDateTime(a.startsAt, tz)}
                  </Link>
                </td>
                <td className="px-4 py-3 font-medium">
                  <Link href={`/dashboard/pacientes/${a.patientId}`} className="hover:underline">
                    {a.patient.firstName} {a.patient.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {a.treatment.name}
                  {a.sessionNumber && (
                    <span className="ml-1 text-xs text-violet-600">
                      (sesión {a.sessionNumber})
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{a.dentist.name}</td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3"><PayBadge status={a.paymentStatus} /></td>
                <td className="px-4 py-3 text-right">{formatMoney(a.priceCents)}</td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  No hay turnos con este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
