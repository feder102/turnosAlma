"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/clay/Button";

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
    <div className="mt-6 rounded-[24px] bg-clay-accent-soft/50 p-5 shadow-clay-pressed">
      <p className="font-extrabold text-clay-accent" style={{ fontFamily: "var(--font-heading)" }}>
        Este tratamiento lleva {totalSessions} sesiones
      </p>
      <p className="mt-1 text-sm font-medium text-clay-muted">
        {totalSessions - 1 === 1
          ? `Podemos agendarte la sesión siguiente, a los ${intervalDays} días en el mismo horario (o el más cercano disponible).`
          : `Podemos agendarte las ${totalSessions - 1} sesiones siguientes, una cada ${intervalDays} días en el mismo horario (o el más cercano disponible).`}
      </p>
      {state === "error" && (
        <p className="mt-2 text-sm font-medium text-red-600">
          No pudimos agendar las sesiones. Coordinalas en el centro.
        </p>
      )}
      <Button onClick={schedule} disabled={state === "working"} size="sm" className="mt-3">
        {state === "working" ? "Agendando…" : "Agendar las sesiones siguientes"}
      </Button>
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
    <div className="mt-6 rounded-[24px] bg-clay-accent-soft/40 p-5 shadow-clay-pressed">
      <p className="font-extrabold text-clay-accent" style={{ fontFamily: "var(--font-heading)" }}>
        Aboná tu turno online
      </p>
      <p className="mt-1 text-sm font-medium text-clay-muted">
        Es opcional: también podés pagar en el centro.
        {!mpLive && " (Modo de prueba: el pago se simula.)"}
      </p>
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => pay("FULL")} disabled={working} size="sm">
          Pagar {amountLabel}
        </Button>
        {depositLabel && (
          <Button onClick={() => pay("DEPOSIT")} disabled={working} variant="outline" size="sm">
            Seña de {depositLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
