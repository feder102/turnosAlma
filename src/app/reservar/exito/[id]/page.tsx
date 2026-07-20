import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime, formatMoney } from "@/lib/format";
import { PlanScheduler, PayBox } from "./client";
import { mpEnabled } from "@/lib/mercadopago";
import { Blobs } from "@/components/clay/Blobs";
import { ButtonLink } from "@/components/clay/Button";
import { Card } from "@/components/clay/Card";

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
      <Blobs />
      <div className="text-center">
        <div className="animate-clay-breathe mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-clay-accent-light to-clay-accent text-3xl text-white shadow-clay-button">
          ✓
        </div>
        <h1
          className="text-2xl font-extrabold tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          ¡Turno confirmado!
        </h1>
        <p className="mt-1 font-medium text-clay-muted">
          Te enviamos la confirmación por WhatsApp a {appt.patient.phone}.
        </p>
      </div>

      {pago === "ok" && (
        <div className="mt-6 rounded-[20px] bg-clay-success/10 px-4 py-3 text-sm font-medium text-clay-success shadow-clay-pressed">
          ¡Pago recibido! Muchas gracias.
        </div>
      )}
      {pago === "cancelado" && (
        <div className="mt-6 rounded-[20px] bg-clay-warning/10 px-4 py-3 text-sm font-medium text-clay-warning shadow-clay-pressed">
          El pago quedó pendiente. Podés intentarlo de nuevo abajo o abonar en el centro.
        </div>
      )}

      <Card className="mt-8">
        <dl className="flex flex-col gap-2.5 text-sm">
          <Row label="Paciente" value={`${appt.patient.firstName} ${appt.patient.lastName}`} />
          <Row label="Tratamiento" value={appt.treatment.name} />
          <Row label="Fecha" value={formatDate(appt.startsAt, tz)} />
          <Row label="Hora" value={`${formatTime(appt.startsAt, tz)} hs`} />
          <Row label="Profesional" value={appt.dentist.name} />
          {clinic && <Row label="Dirección" value={`${clinic.name} — ${clinic.address}`} />}
          <Row label="Importe" value={formatMoney(appt.priceCents)} />
        </dl>
      </Card>

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
        <div className="mt-6 rounded-[24px] bg-clay-accent-soft/50 p-5 shadow-clay-pressed">
          <p className="font-extrabold text-clay-accent" style={{ fontFamily: "var(--font-heading)" }}>
            Plan de tratamiento: {appt.plan.appointments.length} de {appt.plan.totalSessions}{" "}
            sesiones agendadas
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm font-medium text-clay-foreground">
            {appt.plan.appointments.map((a) => (
              <li key={a.id}>
                Sesión {a.sessionNumber}: {formatDate(a.startsAt, tz)} — {formatTime(a.startsAt, tz)} hs
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-8 text-center text-sm font-medium text-clay-muted">
        ¿Necesitás cambiar el turno? Escribinos por WhatsApp o llamanos al{" "}
        {clinic?.phone ?? "centro"}.
      </p>

      <div className="mt-6 text-center">
        <ButtonLink href="/" variant="secondary" size="sm">
          Volver al inicio
        </ButtonLink>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="font-medium text-clay-muted">{label}</dt>
      <dd className="text-right font-bold">{value}</dd>
    </div>
  );
}
