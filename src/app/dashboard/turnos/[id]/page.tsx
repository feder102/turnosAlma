import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, canManageBookings } from "@/lib/auth";
import { formatDate, formatTime, formatMoney, utcToZonedParts } from "@/lib/format";
import { PAYMENT_KIND_LABELS, type PaymentKind } from "@/lib/domain";
import { StatusBadge, PayBadge, PageTitle } from "../../ui";
import { setAppointmentStatus, saveClinicalNote } from "../../actions";
import { RescheduleForm, ManualPaymentButton, RefundButton } from "./client";

export const metadata = { title: "Turno — Centro" };
export const dynamic = "force-dynamic";

export default async function TurnoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;
  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: true,
      dentist: true,
      treatment: true,
      chair: true,
      clinicalNote: true,
      payments: { orderBy: { createdAt: "desc" } },
      plan: true,
    },
  });
  if (!appt) notFound();
  if (session.role === "DENTIST" && appt.dentistId !== session.dentistId) notFound();

  const clinic = await prisma.clinic.findFirst();
  const tz = clinic?.timezone;
  const manager = canManageBookings(session.role);
  const parts = utcToZonedParts(appt.startsAt, tz);
  const isOpen = !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(appt.status);

  return (
    <div className="max-w-3xl">
      <PageTitle
        title={`Turno de ${appt.patient.firstName} ${appt.patient.lastName}`}
        action={<StatusBadge status={appt.status} />}
      />

      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <Row label="Fecha" value={formatDate(appt.startsAt, tz)} />
          <Row label="Hora" value={`${formatTime(appt.startsAt, tz)} — ${formatTime(appt.endsAt, tz)} hs`} />
          <Row
            label="Tratamiento"
            value={`${appt.treatment.name}${appt.sessionNumber ? ` (sesión ${appt.sessionNumber}${appt.plan ? ` de ${appt.plan.totalSessions}` : ""})` : ""}`}
          />
          <Row label="Profesional" value={appt.dentist.name} />
          <Row label="Cabina" value={appt.chair.name} />
          <Row label="Importe" value={formatMoney(appt.priceCents)} />
        </dl>
        <div className="mt-3 border-t border-neutral-100 pt-3 text-sm">
          <Link href={`/dashboard/pacientes/${appt.patientId}`} className="text-sky-600 hover:underline">
            Ver ficha del paciente →
          </Link>
        </div>
      </div>

      {/* Acciones de estado */}
      <div className="mt-5 flex flex-wrap gap-2">
        {isOpen && appt.status === "PENDING" && (
          <ActionButton id={id} status="CONFIRMED" label="✓ Confirmar" cls="bg-emerald-600 hover:bg-emerald-700" />
        )}
        {isOpen && (
          <ActionButton id={id} status="COMPLETED" label="Marcar completado" cls="bg-sky-600 hover:bg-sky-700" />
        )}
        {isOpen && (
          <ActionButton id={id} status="NO_SHOW" label="Marcar ausente" cls="bg-red-500 hover:bg-red-600" />
        )}
        {isOpen && manager && (
          <ActionButton id={id} status="CANCELLED" label="Cancelar turno" cls="bg-neutral-500 hover:bg-neutral-600" />
        )}
        {!isOpen && manager && appt.status !== "COMPLETED" && (
          <ActionButton id={id} status="CONFIRMED" label="Reactivar" cls="bg-emerald-600 hover:bg-emerald-700" />
        )}
      </div>

      {/* Reprogramar */}
      {manager && isOpen && (
        <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold">Reprogramar</h2>
          <RescheduleForm appointmentId={id} currentDate={parts.dateStr} currentTime={parts.time} />
        </section>
      )}

      {/* Pagos */}
      <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Pagos</h2>
          <PayBadge status={appt.paymentStatus} />
        </div>
        {appt.payments.length > 0 ? (
          <ul className="divide-y divide-neutral-100 text-sm">
            {appt.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <p className="font-medium">
                    {formatMoney(p.amountCents)}{" "}
                    <span className="text-neutral-500">
                      · {PAYMENT_KIND_LABELS[p.kind as PaymentKind] ?? p.kind} · {p.provider}
                    </span>
                  </p>
                  <p className="text-xs text-neutral-400">
                    {new Intl.DateTimeFormat("es-AR", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: tz,
                    }).format(p.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <PayBadge status={p.status === "PAID" ? "PAID" : p.status === "REFUNDED" ? "REFUNDED" : p.status === "FAILED" ? "FAILED" : "UNPAID"} />
                  {manager && p.status === "PAID" && <RefundButton paymentId={p.id} />}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">Sin pagos registrados.</p>
        )}
        {manager && appt.paymentStatus !== "PAID" && appt.paymentStatus !== "REFUNDED" && (
          <div className="mt-3 border-t border-neutral-100 pt-3">
            <ManualPaymentButton appointmentId={id} />
          </div>
        )}
      </section>

      {/* Nota clínica */}
      <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold">Nota clínica de la sesión</h2>
        <form action={saveClinicalNote} className="flex flex-col gap-3">
          <input type="hidden" name="appointmentId" value={id} />
          <textarea
            name="content"
            rows={3}
            defaultValue={appt.clinicalNote?.content ?? ""}
            placeholder="Qué se hizo en esta sesión…"
            className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
          />
          <textarea
            name="nextSteps"
            rows={2}
            defaultValue={appt.clinicalNote?.nextSteps ?? ""}
            placeholder="Próximos pasos…"
            className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
          />
          <button className="self-start rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-900">
            Guardar nota
          </button>
        </form>
      </section>
    </div>
  );
}

function ActionButton({
  id,
  status,
  label,
  cls,
}: {
  id: string;
  status: string;
  label: string;
  cls: string;
}) {
  return (
    <form action={setAppointmentStatus.bind(null, id, status)}>
      <button className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${cls}`}>
        {label}
      </button>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 sm:flex-col sm:gap-0.5">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
