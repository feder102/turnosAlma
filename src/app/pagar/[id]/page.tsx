import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { mpEnabled, mpPublicKey } from "@/lib/mercadopago";
import { createBrickPreference, paymentDescription, returnUrl } from "@/lib/payments";
import { formatMoney } from "@/lib/format";
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
      <h1 className="text-2xl font-bold">Pagá tu turno</h1>
      <p className="mt-1 text-neutral-500">
        {description} — <span className="font-medium">{formatMoney(payment.amountCents)}</span>
      </p>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <PaymentBrick
          paymentId={payment.id}
          publicKey={mpPublicKey()}
          amount={payment.amountCents / 100}
          preferenceId={preferenceId}
          payerEmail={payment.patient.email ?? undefined}
          successUrl={returnUrl(payment, "ok")}
          cancelUrl={returnUrl(payment, "cancelado")}
        />
      </div>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Procesado de forma segura por Mercado Pago.
      </p>
    </main>
  );
}
