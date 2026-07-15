import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatMoney, formatShortDate } from "@/lib/format";
import { StatusBadge, PayBadge, PageTitle } from "../../ui";

export const metadata = { title: "Ficha de paciente — Centro" };
export const dynamic = "force-dynamic";

export default async function PacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        include: { dentist: true, treatment: true, clinicalNote: true },
        orderBy: { startsAt: "desc" },
      },
      plans: {
        include: {
          treatment: true,
          dentist: true,
          appointments: { orderBy: { sessionNumber: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      },
      payments: { where: { status: "PAID" } },
    },
  });
  if (!patient) notFound();

  // El profesional accede solo a fichas de pacientes que atendió
  if (
    session.role === "DENTIST" &&
    session.dentistId &&
    !patient.appointments.some((a) => a.dentistId === session.dentistId)
  ) {
    notFound();
  }

  const clinic = await prisma.clinic.findFirst();
  const tz = clinic?.timezone;

  const totalBilled = patient.appointments
    .filter((a) => ["COMPLETED"].includes(a.status))
    .reduce((s, a) => s + a.priceCents, 0);
  const totalPaid = patient.payments.reduce(
    (s, p) => s + p.amountCents - p.refundedCents,
    0
  );
  const balance = totalBilled - totalPaid;

  const age = patient.birthDate
    ? Math.floor((Date.now() - patient.birthDate.getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div className="max-w-4xl">
      <PageTitle
        title={`${patient.firstName} ${patient.lastName}`}
        action={
          session.role === "ADMIN" || session.role === "RECEPTION" ? (
            <Link
              href={`/dashboard/pacientes/${patient.id}/editar`}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              Editar
            </Link>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Datos personales */}
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="mb-3 font-semibold">Datos</h2>
          <dl className="flex flex-col gap-2 text-sm">
            <Item label="WhatsApp" value={patient.phone} />
            <Item label="Email" value={patient.email ?? "—"} />
            <Item
              label="Nacimiento"
              value={
                patient.birthDate
                  ? `${formatShortDate(patient.birthDate, tz)}${age != null ? ` (${age} años)` : ""}`
                  : "—"
              }
            />
            <Item label="Obra social" value={patient.insuranceProvider ?? "Particular"} />
            {patient.insuranceNumber && (
              <Item label="N° afiliado" value={patient.insuranceNumber} />
            )}
          </dl>
          {patient.medicalNotes && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
              <p className="text-xs font-semibold uppercase">⚠️ Observaciones médicas</p>
              <p className="mt-1">{patient.medicalNotes}</p>
            </div>
          )}
          {balance > 0 && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
              Saldo pendiente: <strong>{formatMoney(balance)}</strong>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Planes de tratamiento */}
          {patient.plans.length > 0 && (
            <section className="rounded-xl border border-violet-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold">Planes de tratamiento</h2>
              <div className="flex flex-col gap-4">
                {patient.plans.map((plan) => {
                  const completed = plan.appointments.filter(
                    (a) => a.status === "COMPLETED"
                  ).length;
                  return (
                    <div key={plan.id}>
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-medium">
                          {plan.treatment.name}{" "}
                          <span className="text-sm text-neutral-500">
                            · {plan.dentist.name}
                          </span>
                        </p>
                        <p className="text-sm font-semibold text-violet-700">
                          Sesión {Math.min(completed + 1, plan.totalSessions)} de{" "}
                          {plan.totalSessions}
                        </p>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full bg-violet-500"
                          style={{ width: `${(completed / plan.totalSessions) * 100}%` }}
                        />
                      </div>
                      <ul className="mt-2 flex flex-col gap-1 text-sm text-neutral-600">
                        {plan.appointments.map((a) => (
                          <li key={a.id} className="flex items-center justify-between gap-2">
                            <Link href={`/dashboard/turnos/${a.id}`} className="hover:underline">
                              Sesión {a.sessionNumber}: {formatDateTime(a.startsAt, tz)}
                            </Link>
                            <StatusBadge status={a.status} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Historial de turnos y notas clínicas */}
          <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold">Historial clínico</h2>
            <div className="flex flex-col gap-3">
              {patient.appointments.map((a) => (
                <div key={a.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/dashboard/turnos/${a.id}`}
                      className="font-medium hover:underline"
                    >
                      {formatDateTime(a.startsAt, tz)} — {a.treatment.name}
                    </Link>
                    <div className="flex gap-1.5">
                      <StatusBadge status={a.status} />
                      <PayBadge status={a.paymentStatus} />
                    </div>
                  </div>
                  <p className="mt-1 text-neutral-500">
                    {a.dentist.name} · {formatMoney(a.priceCents)}
                  </p>
                  {a.clinicalNote && (
                    <div className="mt-2 rounded-md bg-white px-3 py-2">
                      <p>{a.clinicalNote.content}</p>
                      {a.clinicalNote.nextSteps && (
                        <p className="mt-1 text-neutral-500">
                          Próximos pasos: {a.clinicalNote.nextSteps}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {patient.appointments.length === 0 && (
                <p className="text-sm text-neutral-500">Sin turnos registrados.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
