"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteChair, setChairActive, upsertChair } from "../actions";

type ChairRow = {
  id: string;
  name: string;
  active: boolean;
  appointmentsCount: number;
};

export function ChairManager({ chairs }: { chairs: ChairRow[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) setError(res.error ?? "Error");
      else router.refresh();
    });
  }

  return (
    <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 font-semibold">Gestionar cabinas</h2>
      <p className="mb-4 text-sm text-neutral-500">
        Solo el administrador puede crear, renombrar, desactivar o eliminar cabinas.
      </p>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mb-4 flex flex-col gap-2">
        {chairs.map((c) => (
          <ChairRowForm
            key={c.id}
            chair={c}
            pending={pending}
            onToggle={() => run(() => setChairActive(c.id, !c.active))}
            onDelete={() => {
              if (!confirm(`¿Eliminar "${c.name}"? Esta acción no se puede deshacer.`)) return;
              run(() => deleteChair(c.id));
            }}
            onRename={(name) => run(() => upsertChair(buildFormData({ id: c.id, name })))}
          />
        ))}
      </div>

      <form
        action={(formData) => run(() => upsertChair(formData))}
        className="flex flex-wrap items-end gap-3 border-t border-dashed border-neutral-300 pt-4 text-sm"
      >
        <label className="text-neutral-500">
          Nueva cabina
          <input
            name="name"
            required
            placeholder='Ej.: "Cabina 4"'
            className="mt-1 block rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </label>
        <button
          disabled={pending}
          className="rounded-lg bg-sky-600 px-5 py-2.5 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
        >
          Agregar
        </button>
      </form>
    </section>
  );
}

function buildFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

function ChairRowForm({
  chair,
  pending,
  onToggle,
  onDelete,
  onRename,
}: {
  chair: ChairRow;
  pending: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}) {
  const [name, setName] = useState(chair.name);
  const dirty = name.trim() !== chair.name && name.trim().length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="min-w-[10rem] flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-neutral-900"
      />
      {dirty && (
        <button
          type="button"
          disabled={pending}
          onClick={() => onRename(name.trim())}
          className="rounded-lg bg-sky-600 px-3 py-1.5 font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
        >
          Guardar
        </button>
      )}
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          chair.active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"
        }`}
      >
        {chair.active ? "Activo" : "Inactivo"}
      </span>
      <span className="text-xs text-neutral-400">{chair.appointmentsCount} turno(s) histórico(s)</span>
      <button
        type="button"
        disabled={pending}
        onClick={onToggle}
        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
      >
        {chair.active ? "Desactivar" : "Reactivar"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onDelete}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Eliminar
      </button>
    </div>
  );
}
