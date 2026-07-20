"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";

// Payment Brick de Mercado Pago: renderiza el formulario de pago embebido
// (tarjetas + cuenta de Mercado Pago vía preferenceId) y envía el formData
// a nuestro backend, que crea el pago contra la API de MP.
export function PaymentBrick({
  paymentId,
  publicKey,
  amount,
  preferenceId,
  payerEmail,
  successUrl,
  cancelUrl,
}: {
  paymentId: string;
  publicKey: string;
  amount: number;
  preferenceId: string;
  payerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    initMercadoPago(publicKey, { locale: "es-AR" });
  }, [publicKey]);

  async function onSubmit({ formData }: { formData: unknown }) {
    setMessage(null);
    const res = await fetch("/api/payments/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId, formData }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMessage({ kind: "error", text: data.error ?? "No pudimos procesar el pago." });
      throw new Error(data.error ?? "process failed");
    }
    if (data.status === "approved") {
      window.location.href = successUrl;
      return;
    }
    if (data.status === "pending" || data.status === "in_process") {
      setMessage({
        kind: "info",
        text: "Tu pago quedó en revisión. Te avisaremos cuando se acredite.",
      });
      return;
    }
    setMessage({
      kind: "error",
      text: "El pago fue rechazado. Probá con otro medio de pago.",
    });
    throw new Error(`payment ${data.status}`);
  }

  return (
    <div>
      {!ready && (
        <p className="py-8 text-center text-sm font-medium text-clay-muted">
          Cargando medios de pago…
        </p>
      )}
      {message && (
        <div
          className={
            message.kind === "error"
              ? "mb-3 rounded-[20px] bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-clay-pressed"
              : "mb-3 rounded-[20px] bg-clay-warning/10 px-4 py-3 text-sm font-medium text-clay-warning shadow-clay-pressed"
          }
        >
          {message.text}
        </div>
      )}
      <Payment
        initialization={{
          amount,
          preferenceId,
          ...(payerEmail ? { payer: { email: payerEmail } } : {}),
        }}
        customization={{
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            mercadoPago: "all",
            maxInstallments: 12,
          },
        }}
        locale="es-AR"
        onReady={() => setReady(true)}
        onSubmit={onSubmit}
        onError={(error) => {
          console.error("Payment Brick error:", error);
          // "non_critical" son avisos del propio formulario (p. ej. una
          // tarjeta cuyo número aún no reconoce): el usuario puede seguir
          // completando el formulario sin recargar la página.
          if (error.type !== "critical") return;
          setMessage({
            kind: "error",
            text: "Hubo un problema cargando el formulario de pago. Recargá la página.",
          });
        }}
      />
      <div className="mt-4 text-center">
        <Link
          href={cancelUrl}
          className="text-sm font-medium text-clay-muted underline hover:text-clay-accent"
        >
          Pagar más tarde
        </Link>
      </div>
    </div>
  );
}
