import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatMoney, formatDateTime } from "@/lib/format";
import { PAYMENT_KIND_LABELS, type PaymentKind } from "@/lib/domain";
import { PayBadge, PageTitle, StatCard } from "../ui";

export const metadata = { title: "Pagos — Centro" };
export const dynamic = "force-dynamic";

export default async function PagosPage() {
  await requireUser(["ADMIN", "RECEPTION"]);
  const clinic = await prisma.clinic.findFirst();
  const tz = clinic?.timezone;

  const [payments, completedUnpaid] = await Promise.all([
    prisma.payment.findMany({
      include: {
        patient: true,
        appointment: { include: { treatment: true } },
        plan: { include: { treatment: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    // Deudores: turnos completados sin pago total
    prisma.appointment.findMany({
      where: {
        status: "COMPLETED",
        paymentStatus: { in: ["UNPAID", "DEPOSIT_PAID", "FAILED"] },
      },
      include: { patient: true, treatment: true, payments: { where: { status: "PAID" } } },
      orderBy: { startsAt: "desc" },
    }),
  ]);

  const totalOwed = completedUnpaid.reduce((sum, a) => {
    const paid = a.payments.reduce((s, p) => s + p.amountCents - p.refundedCents, 0);
    return sum + Math.max(0, a.priceCents - paid);
  }, 0);

  return (
    <div>
      <PageTitle title="Pagos" />

      <div className="grid max-w-md grid-cols-2 gap-3">
        <StatCard label="Saldos pendientes" value={formatMoney(totalOwed)} hint={`${completedUnpaid.length} turnos`} />
        <StatCard
          label="Cobrado (últimos 100)"
          value={formatMoney(
            payments
              .filter((p) => p.status === "PAID")
              .reduce((s, p) => s + p.amountCents - p.refundedCents, 0)
          )}
        />
      </div>

      {completedUnpaid.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-semibold">Saldos pendientes por paciente</h2>
          <div className="overflow-x-auto rounded-xl border border-red-200 bg-white shadow-sm">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-500">
                  <th className="px-4 py-3">Paciente</th>
                  <th className="px-4 py-3">Turno</th>
                  <th className="px-4 py-3">Tratamiento</th>
                  <th className="px-4 py-3 text-right">Debe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {completedUnpaid.map((a) => {
                  const paid = a.payments.reduce((s, p) => s + p.amountCents - p.refundedCents, 0);
                  return (
                    <tr key={a.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/dashboard/pacientes/${a.patientId}`} className="hover:underline">
                          {a.patient.firstName} {a.patient.lastName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/turnos/${a.id}`} className="font-mono text-xs hover:underline">
                          {formatDateTime(a.startsAt, tz)}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{a.treatment.name}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600">
                        {formatMoney(Math.max(0, a.priceCents - paid))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Historial de pagos</h2>
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-500">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Paciente</th>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Medio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                    {formatDateTime(p.createdAt, tz)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/dashboard/pacientes/${p.patientId}`} className="hover:underline">
                      {p.patient.firstName} {p.patient.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {p.appointment ? (
                      <Link href={`/dashboard/turnos/${p.appointmentId}`} className="hover:underline">
                        {p.appointment.treatment.name}
                      </Link>
                    ) : p.plan ? (
                      `Plan: ${p.plan.treatment.name}`
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">{PAYMENT_KIND_LABELS[p.kind as PaymentKind] ?? p.kind}</td>
                  <td className="px-4 py-3">{p.provider}</td>
                  <td className="px-4 py-3">
                    <PayBadge status={p.status === "PAID" ? "PAID" : p.status === "REFUNDED" ? "REFUNDED" : p.status === "FAILED" ? "FAILED" : "UNPAID"} />
                  </td>
                  <td className="px-4 py-3 text-right">{formatMoney(p.amountCents)}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    Sin pagos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
