"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { upsertPatient } from "../actions";

export type PatientFormData = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  birthDate: Date | null;
  insuranceProvider: string | null;
  insuranceNumber: string | null;
  medicalNotes: string | null;
};

function toDateInput(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900";

export function PatientForm({ patient }: { patient?: PatientFormData }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await upsertPatient(formData);
      if (!res.ok) setError(res.error ?? "Error");
      else router.push("/dashboard/pacientes");
    });
  }

  return (
    <form action={submit} className="flex max-w-2xl flex-col gap-5">
      {patient && <input type="hidden" name="id" value={patient.id} />}

      <section className="grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-white p-5 text-sm shadow-sm sm:grid-cols-2">
        <label className="text-neutral-500">
          Nombre *
          <input name="firstName" required defaultValue={patient?.firstName} className={inputClass} />
        </label>
        <label className="text-neutral-500">
          Apellido *
          <input name="lastName" required defaultValue={patient?.lastName} className={inputClass} />
        </label>
        <label className="text-neutral-500">
          WhatsApp * <span className="text-neutral-400">(+549…)</span>
          <input name="phone" required defaultValue={patient?.phone} className={inputClass} />
        </label>
        <label className="text-neutral-500">
          Email
          <input name="email" type="email" defaultValue={patient?.email ?? ""} className={inputClass} />
        </label>
        <label className="text-neutral-500">
          Fecha de nacimiento
          <input name="birthDate" type="date" defaultValue={toDateInput(patient?.birthDate ?? null)} className={inputClass} />
        </label>
        <label className="text-neutral-500">
          Obra social / prepaga
          <input
            name="insuranceProvider"
            placeholder="Particular"
            defaultValue={patient?.insuranceProvider ?? ""}
            className={inputClass}
          />
        </label>
        <label className="text-neutral-500">
          N° de afiliado
          <input name="insuranceNumber" defaultValue={patient?.insuranceNumber ?? ""} className={inputClass} />
        </label>
        <label className="text-neutral-500 sm:col-span-2">
          Notas médicas <span className="text-neutral-400">(alergias, medicación…)</span>
          <textarea name="medicalNotes" rows={3} defaultValue={patient?.medicalNotes ?? ""} className={inputClass} />
        </label>
      </section>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded-lg bg-sky-600 px-6 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
        >
          {pending ? "Guardando…" : patient ? "Guardar cambios" : "Crear paciente"}
        </button>
        <Link href="/dashboard/pacientes" className="text-sm text-neutral-500 hover:underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
