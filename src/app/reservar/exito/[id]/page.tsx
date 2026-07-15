import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime, formatMoney } from "@/lib/format";
import { PlanScheduler, PayBox } from "./client";
import { mpEnabled } from "@/lib/mercadopago";

export const metadata = { title: "Turno confirmado" };

export default async function ExitoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pago?: string }>;
}) {
  const { id } = await params;
  const { pago } = await searchParams;
  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: true,
      dentist: true,
      treatment: true,
      plan: { include: { appointments: { orderBy: { sessionNumber: "asc" } } } },
    },
  });
  if (!appt) notFound();
  const clinic = await prisma.clinic.findFirst();
  const tz = clinic?.timezone;

  const showPlanOffer = appt.treatment.multiSession && !appt.planId;
  const canPay =
    (appt.paymentStatus === "UNPAID" || appt.paymentStatus === "FAILED") &&
    appt.status !== "CANCELLED";

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          ✓
        </div>
        <h1 className="text-2xl font-bold">¡Turno confirmado!</h1>
        <p className="mt-1 text-neutral-500">
          Te enviamos la confirmación por WhatsApp a {appt.patient.phone}.
        </p>
      </div>

      {pago === "ok" && (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          ¡Pago recibido! Muchas gracias.
        </div>
      )}
      {pago === "cancelado" && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          El pago quedó pendiente. Podés intentarlo de nuevo abajo o abonar en el centro.
        </div>
      )}

      <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <dl className="flex flex-col gap-2.5 text-sm">
          <Row label="Paciente" value={`${appt.patient.firstName} ${appt.patient.lastName}`} />
          <Row label="Tratamiento" value={appt.treatment.name} />
          <Row label="Fecha" value={formatDate(appt.startsAt, tz)} />
          <Row label="Hora" value={`${formatTime(appt.startsAt, tz)} hs`} />
          <Row label="Profesional" value={appt.dentist.name} />
          {clinic && <Row label="Dirección" value={`${clinic.name} — ${clinic.address}`} />}
          <Row label="Importe" value={formatMoney(appt.priceCents)} />
        </dl>
      </div>

      {canPay && (
        <PayBox
          appointmentId={appt.id}
          amountLabel={formatMoney(appt.priceCents)}
          depositLabel={
            appt.treatment.depositCents != null && appt.treatment.depositCents < appt.priceCents
              ? formatMoney(appt.treatment.depositCents)
              : null
          }
          mpLive={mpEnabled()}
        />
      )}

      {showPlanOffer && (
        <PlanScheduler
          appointmentId={appt.id}
          totalSessions={appt.treatment.defaultSessions}
          intervalDays={appt.treatment.sessionIntervalDays}
        />
      )}

      {appt.plan && (
        <div className="mt-6 rounded-xl border border-violet-200 bg-violet-50 p-5">
          <p className="font-semibold text-violet-900">
            Plan de tratamiento: {appt.plan.appointments.length} de {appt.plan.totalSessions}{" "}
            sesiones agendadas
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm text-violet-800">
            {appt.plan.appointments.map((a) => (
              <li key={a.id}>
                Sesión {a.sessionNumber}: {formatDate(a.startsAt, tz)} — {formatTime(a.startsAt, tz)} hs
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-neutral-500">
        ¿Necesitás cambiar el turno? Escribinos por WhatsApp o llamanos al{" "}
        {clinic?.phone ?? "centro"}.
      </p>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-block rounded-lg border border-neutral-300 px-5 py-2.5 font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
