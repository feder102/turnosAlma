"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { WEEKDAY_LABELS } from "@/lib/domain";
import { addScheduleBlock, deleteScheduleBlock } from "../actions";

type ScheduleBlock = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  chair: { id: string; name: string } | null;
};

type DentistData = {
  id: string;
  name: string;
  defaultChairId: string | null;
  chairs: { id: string; name: string }[];
  schedules: ScheduleBlock[];
};

// Orden de presentación de la semana: lunes a domingo.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function HorariosManager({
  isAdmin,
  dentists,
  initialDentistId,
}: {
  isAdmin: boolean;
  dentists: DentistData[];
  initialDentistId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState(
    dentists.find((d) => d.id === initialDentistId)?.id ?? dentists[0]?.id ?? ""
  );

  const dentist = dentists.find((d) => d.id === selectedId) ?? dentists[0];

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) setError(res.error ?? "Error");
      else router.refresh();
    });
  }

  if (!dentist) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
        {isAdmin
          ? "No hay profesionales activos cargados."
          : "Tu usuario no está vinculado a un profesional. Pedile al administrador que lo vincule."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {isAdmin && (
        <label className="text-sm text-neutral-500">
          Profesional
          <select
            value={dentist.id}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setError(null);
            }}
            className="mt-1 block rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
          >
            {dentists.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {dentist.chairs.length === 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          {isAdmin ? "Este profesional" : "No tenés"} cabinas asignados: aunque cargue horarios,
          no se van a poder ofrecer turnos. {isAdmin ? "Asignale una cabina desde su ficha." : "Pedile al administrador que te asigne una."}
        </p>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-semibold">
          {isAdmin ? `Semana de ${dentist.name}` : "Mi semana"}
        </h2>
        <p className="mb-4 text-sm text-neutral-500">
          Los días sin bloques no reciben turnos.
        </p>

        <ul className="mb-4 flex flex-col gap-2">
          {WEEK_ORDER.map((weekday) => {
            const blocks = dentist.schedules.filter((s) => s.weekday === weekday);
            return (
              <li
                key={weekday}
                className={`flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm ${
                  blocks.length === 0 ? "bg-neutral-50 text-neutral-400" : ""
                }`}
              >
                <span className="w-24 font-medium">{WEEKDAY_LABELS[weekday]}</span>
                {blocks.length === 0 && <span className="text-xs">No atiende</span>}
                {blocks.map((b) => (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800"
                  >
                    <span className="font-mono font-semibold">
                      {b.startTime}–{b.endTime}
                    </span>
                    {b.chair && <span className="text-sky-600">🪑 {b.chair.name}</span>}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => deleteScheduleBlock(b.id))}
                      title="Eliminar bloque"
                      className="text-sky-400 transition hover:text-red-600 disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </li>
            );
          })}
        </ul>

        <AddBlockForm
          key={dentist.id}
          dentist={dentist}
          isAdmin={isAdmin}
          pending={pending}
          onSubmit={(fd) => run(() => addScheduleBlock(fd))}
        />
      </section>
    </div>
  );
}

function AddBlockForm({
  dentist,
  isAdmin,
  pending,
  onSubmit,
}: {
  dentist: DentistData;
  isAdmin: boolean;
  pending: boolean;
  onSubmit: (fd: FormData) => void;
}) {
  return (
    <form
      action={(fd) => onSubmit(fd)}
      className="flex flex-wrap items-end gap-3 border-t border-dashed border-neutral-300 pt-4 text-sm"
    >
      {isAdmin && <input type="hidden" name="dentistId" value={dentist.id} />}

      <label className="text-neutral-500">
        Día
        <select
          name="weekday"
          required
          defaultValue=""
          className="mt-1 block rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
        >
          <option value="" disabled>
            Elegí…
          </option>
          {WEEK_ORDER.map((w) => (
            <option key={w} value={w}>
              {WEEKDAY_LABELS[w]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-neutral-500">
        Desde
        <input
          type="time"
          name="startTime"
          required
          className="mt-1 block rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900"
        />
      </label>
      <label className="text-neutral-500">
        Hasta
        <input
          type="time"
          name="endTime"
          required
          className="mt-1 block rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900"
        />
      </label>
      <label className="text-neutral-500">
        Cabina
        <select
          name="chairId"
          defaultValue=""
          className="mt-1 block rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
        >
          <option value="">Automático{dentist.defaultChairId ? " (por defecto ★)" : ""}</option>
          {dentist.chairs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.id === dentist.defaultChairId ? " ★" : ""}
            </option>
          ))}
        </select>
      </label>
      <button
        disabled={pending}
        className="rounded-lg bg-sky-600 px-5 py-2.5 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
      >
        Agregar
      </button>
    </form>
  );
}
