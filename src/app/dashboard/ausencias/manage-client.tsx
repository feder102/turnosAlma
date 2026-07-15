"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/domain";
import { deleteTimeOff, upsertTimeOff } from "../actions";

type TimeOffRow = {
  id: string;
  dentistId: string | null;
  dentistName: string | null;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;
  reason: string;
};

type Dentist = { id: string; name: string };

export function AusenciasManager({
  role,
  myDentistId,
  dentists,
  rows,
  today,
}: {
  role: Role;
  myDentistId: string | null;
  dentists: Dentist[];
  rows: TimeOffRow[];
  today: string;
}) {
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

  const isAdmin = role === "ADMIN";
  const holidays = rows.filter((r) => r.dentistId === null);
  const absences = rows.filter((r) => r.dentistId !== null);

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* ── Feriados del centro ── */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-semibold">Feriados del centro</h2>
        <p className="mb-4 text-sm text-neutral-500">
          {isAdmin
            ? "Días en que el centro no atiende a nadie (feriados, cierres)."
            : "Días en que el centro permanece cerrado. Solo administración puede modificarlos."}
        </p>

        <TimeOffList
          rows={holidays}
          today={today}
          canDelete={isAdmin}
          pending={pending}
          onDelete={(id) => run(() => deleteTimeOff(id))}
          emptyText="No hay feriados cargados."
        />

        {isAdmin && (
          <TimeOffForm
            pending={pending}
            onSubmit={(fd) => run(() => upsertTimeOff(fd))}
            reasonPlaceholder='Ej.: "Feriado nacional"'
          />
        )}
      </section>

      {/* ── Ausencias de profesionales ── */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-semibold">
          {isAdmin ? "Ausencias de profesionales" : "Mis ausencias"}
        </h2>
        <p className="mb-4 text-sm text-neutral-500">
          Vacaciones, francos o licencias. Esos días el profesional no recibe turnos.
        </p>

        <TimeOffList
          rows={absences}
          today={today}
          showDentist={isAdmin}
          canDelete
          pending={pending}
          onDelete={(id) => run(() => deleteTimeOff(id))}
          emptyText={isAdmin ? "No hay ausencias cargadas." : "No tenés ausencias cargadas."}
        />

        <TimeOffForm
          pending={pending}
          onSubmit={(fd) => run(() => upsertTimeOff(fd))}
          reasonPlaceholder='Ej.: "Vacaciones"'
          dentistSelector={
            isAdmin
              ? { dentists }
              : undefined /* el profesional se toma de la sesión en el servidor */
          }
          hiddenDentistId={!isAdmin ? (myDentistId ?? undefined) : undefined}
        />
      </section>
    </div>
  );
}

function TimeOffList({
  rows,
  today,
  showDentist,
  canDelete,
  pending,
  onDelete,
  emptyText,
}: {
  rows: TimeOffRow[];
  today: string;
  showDentist?: boolean;
  canDelete: boolean;
  pending: boolean;
  onDelete: (id: string) => void;
  emptyText: string;
}) {
  if (rows.length === 0) {
    return <p className="mb-4 text-sm text-neutral-400">{emptyText}</p>;
  }
  return (
    <ul className="mb-4 flex flex-col gap-2">
      {rows.map((r) => {
        const past = r.endDate < today;
        return (
          <li
            key={r.id}
            className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              past ? "border-neutral-200 bg-neutral-50 text-neutral-400" : "border-neutral-200"
            }`}
          >
            <span className="font-mono font-semibold">{formatRange(r.startDate, r.endDate)}</span>
            {showDentist && r.dentistName && (
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                {r.dentistName}
              </span>
            )}
            {r.reason && <span className="text-neutral-600">— {r.reason}</span>}
            {past && <span className="text-xs text-neutral-400">(pasado)</span>}
            <span className="flex-1" />
            {canDelete && (
              <button
                type="button"
                disabled={pending}
                onClick={() => onDelete(r.id)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Eliminar
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function TimeOffForm({
  pending,
  onSubmit,
  reasonPlaceholder,
  dentistSelector,
  hiddenDentistId,
}: {
  pending: boolean;
  onSubmit: (fd: FormData) => void;
  reasonPlaceholder: string;
  dentistSelector?: { dentists: Dentist[] };
  hiddenDentistId?: string;
}) {
  return (
    <form
      action={(fd) => onSubmit(fd)}
      className="flex flex-wrap items-end gap-3 border-t border-dashed border-neutral-300 pt-4 text-sm"
    >
      {dentistSelector && (
        <label className="text-neutral-500">
          Profesional
          <select
            name="dentistId"
            required
            defaultValue=""
            className="mt-1 block rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900"
          >
            <option value="" disabled>
              Elegí…
            </option>
            {dentistSelector.dentists.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {hiddenDentistId && <input type="hidden" name="dentistId" value={hiddenDentistId} />}

      <label className="text-neutral-500">
        Desde
        <input
          type="date"
          name="startDate"
          required
          className="mt-1 block rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900"
        />
      </label>
      <label className="text-neutral-500">
        Hasta
        <input
          type="date"
          name="endDate"
          className="mt-1 block rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900"
        />
      </label>
      <label className="flex-1 text-neutral-500">
        Motivo (opcional)
        <input
          name="reason"
          placeholder={reasonPlaceholder}
          className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900"
        />
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

// "2026-07-11" → "11/07/2026"; rango de un solo día no se repite.
function formatRange(startDate: string, endDate: string): string {
  const s = toDisplay(startDate);
  if (startDate === endDate) return s;
  return `${s} → ${toDisplay(endDate)}`;
}

function toDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
