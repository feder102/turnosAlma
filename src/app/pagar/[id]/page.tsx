import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { mpEnabled, mpPublicKey } from "@/lib/mercadopago";
import { createBrickPreference, paymentDescription, returnUrl } from "@/lib/payments";
import { formatMoney } from "@/lib/format";
import { Blobs } from "@/components/clay/Blobs";
import { Card } from "@/components/clay/Card";
import { PaymentBrick } from "./client";

export const metadata = { title: "Pagar" };

// Página de pago con el Payment Brick de Mercado Pago (Checkout Bricks).
export default async function PagarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { patient: true },
  });
  if (!payment) notFound();

  // Ya resuelto (pagado o reembolsado): volvemos a la página de origen.
  if (payment.status === "PAID" || payment.status === "REFUNDED") {
    redirect(returnUrl(payment, "ok"));
  }
  if (!mpEnabled() || !mpPublicKey()) {
    redirect(returnUrl(payment, "cancelado"));
  }

  const [description, preferenceId] = await Promise.all([
    paymentDescription(payment.id),
    createBrickPreference(payment.id),
  ]);

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <Blobs />
      <h1
        className="text-2xl font-extrabold tracking-tight"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Pagá tu turno
      </h1>
      <p className="mt-1 font-medium text-clay-muted">
        {description} — <span className="font-bold text-clay-foreground">{formatMoney(payment.amountCents)}</span>
      </p>

      <Card className="mt-6 p-4 sm:p-4">
        <PaymentBrick
          paymentId={payment.id}
          publicKey={mpPublicKey()}
          amount={payment.amountCents / 100}
          preferenceId={preferenceId}
          payerEmail={payment.patient.email ?? undefined}
          successUrl={returnUrl(payment, "ok")}
          cancelUrl={returnUrl(payment, "cancelado")}
        />
      </Card>

      <p className="mt-6 text-center text-sm font-medium text-clay-muted">
        Procesado de forma segura por Mercado Pago.
      </p>
    </main>
  );
}
