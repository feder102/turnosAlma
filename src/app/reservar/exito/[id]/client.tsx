"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Oferta de agendar las sesiones restantes de un tratamiento multi-sesión.
export function PlanScheduler({
  appointmentId,
  totalSessions,
  intervalDays,
}: {
  appointmentId: string;
  totalSessions: number;
  intervalDays: number;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "working" | "error">("idle");

  async function schedule() {
    setState("working");
    const res = await fetch(`/api/public/bookings/${appointmentId}/plan`, {
      method: "POST",
    });
    if (res.ok) {
      router.refresh();
    } else {
      setState("error");
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-violet-200 bg-violet-50 p-5">
      <p className="font-semibold text-violet-900">
        Este tratamiento lleva {totalSessions} sesiones
      </p>
      <p className="mt-1 text-sm text-violet-700">
        {totalSessions - 1 === 1
          ? `Podemos agendarte la sesión siguiente, a los ${intervalDays} días en el mismo horario (o el más cercano disponible).`
          : `Podemos agendarte las ${totalSessions - 1} sesiones siguientes, una cada ${intervalDays} días en el mismo horario (o el más cercano disponible).`}
      </p>
      {state === "error" && (
        <p className="mt-2 text-sm text-red-600">
          No pudimos agendar las sesiones. Coordinalas en el consultorio.
        </p>
      )}
      <button
        onClick={schedule}
        disabled={state === "working"}
        className="mt-3 rounded-lg bg-violet-600 px-5 py-2.5 font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
      >
        {state === "working" ? "Agendando…" : "Agendar las sesiones siguientes"}
      </button>
    </div>
  );
}

// Pago online (Mercado Pago, o modo simulado si no hay claves configuradas).
export function PayBox({
  appointmentId,
  amountLabel,
  depositLabel,
  mpLive,
}: {
  appointmentId: string;
  amountLabel: string;
  depositLabel: string | null;
  mpLive: boolean;
}) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay(kind: "FULL" | "DEPOSIT") {
    setWorking(true);
    setError(null);
    const res = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, kind }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "No pudimos iniciar el pago.");
      setWorking(false);
      return;
    }
    if (data.url) {
      window.location.href = data.url; // página de pago con Mercado Pago
    } else {
      router.refresh(); // modo simulado: ya quedó pagado
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-5">
      <p className="font-semibold text-sky-900">Aboná tu turno online</p>
      <p className="mt-1 text-sm text-sky-700">
        Es opcional: también podés pagar en el consultorio.
        {!mpLive && " (Modo de prueba: el pago se simula.)"}
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => pay("FULL")}
          disabled={working}
          className="rounded-lg bg-sky-600 px-5 py-2.5 font-medium text-white transition hover:bg-sky-700 disabled:opacity-50"
        >
          Pagar {amountLabel}
        </button>
        {depositLabel && (
          <button
            onClick={() => pay("DEPOSIT")}
            disabled={working}
            className="rounded-lg border border-sky-600 px-5 py-2.5 font-medium text-sky-700 transition hover:bg-sky-100 disabled:opacity-50"
          >
            Seña de {depositLabel}
          </button>
        )}
      </div>
    </div>
  );
}
