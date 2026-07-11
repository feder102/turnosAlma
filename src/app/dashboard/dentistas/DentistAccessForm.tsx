"use client";

import { useState, useTransition } from "react";
import { setDentistPassword } from "../actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900";

export function DentistAccessForm({
  dentistId,
  hasAccount,
  loginEmail,
  contactEmail,
}: {
  dentistId: string;
  hasAccount: boolean;
  loginEmail: string | null;
  contactEmail: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    setSuccess(null);
    // Capturamos si había cuenta antes de enviar: al revalidar, la prop cambia.
    const created = !hasAccount;
    startTransition(async () => {
      const res = await setDentistPassword(formData);
      if (!res.ok) setError(res.error ?? "Error");
      else setSuccess(created ? "Cuenta de acceso creada." : "Contraseña actualizada.");
    });
  }

  return (
    <section className="max-w-2xl rounded-xl border border-neutral-200 bg-white p-5 text-sm shadow-sm">
      <h2 className="font-semibold text-neutral-800">Acceso al sistema</h2>
      <p className="mt-1 text-xs text-neutral-400">
        {hasAccount
          ? "Actualizá la contraseña con la que el odontólogo ingresa al panel."
          : "Este odontólogo todavía no tiene cuenta de acceso. Creá una para que pueda ingresar al panel."}
      </p>

      <form
        action={submit}
        className="mt-4 flex flex-col gap-3"
        autoComplete="off"
      >
        <input type="hidden" name="dentistId" value={dentistId} />

        <label className="text-neutral-500">
          Email de acceso
          {hasAccount ? (
            <>
              <input
                type="email"
                value={loginEmail ?? ""}
                readOnly
                disabled
                className={`${inputClass} bg-neutral-50 text-neutral-500`}
              />
              <span className="mt-1 block text-xs text-neutral-400">
                El email de acceso no se cambia desde aquí.
              </span>
            </>
          ) : (
            <input
              name="email"
              type="email"
              required
              defaultValue={contactEmail ?? ""}
              placeholder="odontologo@consultorio.com"
              className={inputClass}
            />
          )}
        </label>

        <label className="text-neutral-500">
          {hasAccount ? "Nueva contraseña" : "Contraseña"}
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            className={inputClass}
          />
        </label>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
            {success}
          </p>
        )}

        <div>
          <button
            disabled={pending}
            className="rounded-lg bg-neutral-900 px-6 py-3 font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {pending
              ? "Guardando…"
              : hasAccount
                ? "Actualizar contraseña"
                : "Crear acceso"}
          </button>
        </div>
      </form>
    </section>
  );
}
