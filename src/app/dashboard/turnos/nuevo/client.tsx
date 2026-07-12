"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createManualAppointment } from "../../actions";

type Patient = { id: string; firstName: string; lastName: string; phone: string };

export function NewAppointmentForm({
  patients,
  dentists,
  treatments,
  chairs,
}: {
  patients: Patient[];
  dentists: { id: string; name: string; defaultChairId: string | null; chairIds: string[] }[];
  treatments: { id: string; name: string; durationMin: number }[];
  chairs: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [search, setSearch] = useState("");
  const [patientId, setPatientId] = useState("");
  const [dentistId, setDentistId] = useState(dentists[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedDentist = dentists.find((d) => d.id === dentistId);
  // Si el odontólogo no tiene sillones asignados, se ofrecen todos como
  // fallback (evita bloquear el alta por falta de configuración).
  const availableChairs =
    selectedDentist && selectedDentist.chairIds.length > 0
      ? chairs.filter((c) => selectedDentist.chairIds.includes(c.id))
      : chairs;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients.slice(0, 8);
    return patients
      .filter(
        (p) =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) || p.phone.includes(q)
      )
      .slice(0, 8);
  }, [search, patients]);

  function submit(formData: FormData) {
    setError(null);
    if (mode === "existing") {
      if (!patientId) {
        setError("Elegí un paciente.");
        return;
      }
      formData.set("patientId", patientId);
    }
    startTransition(async () => {
      const res = await createManualAppointment(formData);
      if (!res.ok) setError(res.error ?? "Error");
      else router.push("/dashboard/turnos");
    });
  }

  return (
    <form action={submit} className="flex flex-col gap-5">
      {/* Paciente */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={`rounded-full px-4 py-1.5 font-medium ${mode === "existing" ? "bg-sky-600 text-white" : "border border-neutral-300"}`}
          >
            Paciente existente
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`rounded-full px-4 py-1.5 font-medium ${mode === "new" ? "bg-sky-600 text-white" : "border border-neutral-300"}`}
          >
            Paciente nuevo
          </button>
        </div>

        {mode === "existing" ? (
          <div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o teléfono…"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"
            />
            <div className="mt-2 flex flex-col gap-1">
              {filtered.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPatientId(p.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                    patientId === p.id
                      ? "border-sky-500 bg-sky-50"
                      : "border-neutral-200 hover:border-sky-300"
                  }`}
                >
                  <span className="font-medium">
                    {p.lastName}, {p.firstName}
                  </span>{" "}
                  <span className="text-neutral-500">· {p.phone}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <input name="firstName" placeholder="Nombre *" required className="rounded-lg border border-neutral-300 px-3 py-2.5" />
            <input name="lastName" placeholder="Apellido *" required className="rounded-lg border border-neutral-300 px-3 py-2.5" />
            <input name="phone" placeholder="WhatsApp *" required className="rounded-lg border border-neutral-300 px-3 py-2.5" />
            <input name="email" type="email" placeholder="Email" className="rounded-lg border border-neutral-300 px-3 py-2.5" />
          </div>
        )}
      </section>

      {/* Detalle del turno */}
      <section className="grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-white p-5 text-sm shadow-sm">
        <label className="col-span-2 text-neutral-500">
          Tratamiento
          <select name="treatmentId" required className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900">
            {treatments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.durationMin} min)
              </option>
            ))}
          </select>
        </label>
        <label className="text-neutral-500">
          Odontólogo
          <select
            name="dentistId"
            required
            value={dentistId}
            onChange={(e) => setDentistId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900"
          >
            {dentists.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-neutral-500">
          Sillón
          <select
            key={dentistId}
            name="chairId"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900"
          >
            <option value="">(el preferido del odontólogo)</option>
            {availableChairs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {selectedDentist && selectedDentist.chairIds.length === 0 && (
            <span className="mt-1 block text-xs text-amber-600">
              Este odontólogo no tiene sillones asignados; elegí uno manualmente.
            </span>
          )}
        </label>
        <label className="text-neutral-500">
          Fecha
          <input name="date" type="date" required className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900" />
        </label>
        <label className="text-neutral-500">
          Hora
          <input name="time" type="time" required className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900" />
        </label>
      </section>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        disabled={pending}
        className="self-start rounded-lg bg-sky-600 px-6 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear turno"}
      </button>
    </form>
  );
}
