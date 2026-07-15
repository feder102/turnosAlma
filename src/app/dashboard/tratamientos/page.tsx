import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { PageTitle } from "../ui";
import { upsertTreatment, toggleTreatment } from "../actions";

export const metadata = { title: "Tratamientos — Centro" };
export const dynamic = "force-dynamic";

export default async function TratamientosPage() {
  await requireUser(["ADMIN"]);
  const treatments = await prisma.treatment.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-3xl">
      <PageTitle title="Tratamientos" />

      <div className="flex flex-col gap-3">
        {treatments.map((t) => (
          <details
            key={t.id}
            className={`rounded-xl border bg-white shadow-sm ${t.active ? "border-neutral-200" : "border-neutral-200 opacity-60"}`}
          >
            <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-2 px-5 py-3.5">
              <span className="font-semibold">
                {t.name}
                {!t.active && <span className="ml-2 text-xs font-normal text-neutral-400">(inactivo)</span>}
                {t.multiSession && (
                  <span className="ml-2 text-xs font-normal text-violet-600">
                    {t.defaultSessions} sesiones
                  </span>
                )}
              </span>
              <span className="text-sm text-neutral-500">
                {t.durationMin} min · {formatMoney(t.priceCents)}
                {t.insurancePriceCents != null && ` · OS ${formatMoney(t.insurancePriceCents)}`}
              </span>
            </summary>
            <div className="border-t border-neutral-100 px-5 py-4">
              <TreatmentForm treatment={t} />
              <form
                action={toggleTreatment.bind(null, t.id, !t.active)}
                className="mt-3 border-t border-neutral-100 pt-3"
              >
                <button className="text-sm text-neutral-500 underline-offset-2 hover:underline">
                  {t.active ? "Dar de baja (dejar de ofrecer)" : "Reactivar tratamiento"}
                </button>
              </form>
            </div>
          </details>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white p-5">
        <h2 className="mb-3 font-semibold">Agregar tratamiento</h2>
        <TreatmentForm />
      </section>
    </div>
  );
}

function TreatmentForm({
  treatment,
}: {
  treatment?: {
    id: string;
    name: string;
    description: string;
    durationMin: number;
    priceCents: number;
    insurancePriceCents: number | null;
    depositCents: number | null;
    multiSession: boolean;
    defaultSessions: number;
    sessionIntervalDays: number;
    preparationNotes: string | null;
    postCareNotes: string | null;
  };
}) {
  const t = treatment;
  return (
    <form action={upsertTreatment} className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
      {t && <input type="hidden" name="id" value={t.id} />}
      <label className="col-span-2 text-neutral-500 sm:col-span-2">
        Nombre
        <input name="name" required defaultValue={t?.name} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900" />
      </label>
      <label className="text-neutral-500">
        Duración (min)
        <input name="durationMin" type="number" min={5} step={5} required defaultValue={t?.durationMin ?? 30} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900" />
      </label>
      <label className="col-span-2 text-neutral-500 sm:col-span-3">
        Descripción
        <input name="description" defaultValue={t?.description} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900" />
      </label>
      <label className="text-neutral-500">
        Precio particular ($)
        <input name="price" type="number" min={0} step="0.01" required defaultValue={t ? t.priceCents / 100 : ""} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900" />
      </label>
      <label className="text-neutral-500">
        Copago obra social ($)
        <input name="insurancePrice" type="number" min={0} step="0.01" defaultValue={t?.insurancePriceCents != null ? t.insurancePriceCents / 100 : ""} placeholder="No cubierto" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900" />
      </label>
      <label className="text-neutral-500">
        Seña ($)
        <input name="deposit" type="number" min={0} step="0.01" defaultValue={t?.depositCents != null ? t.depositCents / 100 : ""} placeholder="Sin seña" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900" />
      </label>
      <label className="flex items-center gap-2 text-neutral-700">
        <input type="checkbox" name="multiSession" defaultChecked={t?.multiSession} />
        Varias sesiones
      </label>
      <label className="text-neutral-500">
        Sesiones
        <input name="defaultSessions" type="number" min={1} defaultValue={t?.defaultSessions ?? 1} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900" />
      </label>
      <label className="text-neutral-500">
        Días entre sesiones
        <input name="sessionIntervalDays" type="number" min={1} defaultValue={t?.sessionIntervalDays ?? 21} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900" />
      </label>
      <label className="col-span-2 text-neutral-500 sm:col-span-3">
        Preparación previa (va en el recordatorio 24 hs)
        <textarea name="preparationNotes" rows={2} defaultValue={t?.preparationNotes ?? ""} placeholder="Ej.: venir en ayunas, suspender medicación…" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900" />
      </label>
      <label className="col-span-2 text-neutral-500 sm:col-span-3">
        Cuidados post-tratamiento (se envía al completar el turno)
        <textarea name="postCareNotes" rows={2} defaultValue={t?.postCareNotes ?? ""} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900" />
      </label>
      <div className="col-span-2 sm:col-span-3">
        <button className="rounded-lg bg-sky-600 px-5 py-2.5 font-semibold text-white transition hover:bg-sky-700">
          {t ? "Guardar cambios" : "Crear tratamiento"}
        </button>
      </div>
    </form>
  );
}
