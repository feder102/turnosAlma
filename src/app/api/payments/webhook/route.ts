import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Payment as MpPayment } from "mercadopago";
import { getMercadoPago, mpEnabled } from "@/lib/mercadopago";
import {
  applyPaidStatus,
  applyFailedStatus,
  applyRefundedStatus,
} from "@/lib/payments";

// Webhook de Mercado Pago. Configurar en el panel de desarrolladores
// (Tus integraciones → Webhooks) apuntando a /api/payments/webhook con el
// evento "Pagos". Ver README.
//
// MP notifica solo el id del pago; el estado real siempre se consulta a la
// API (nunca se confía en el cuerpo de la notificación).
export async function POST(req: NextRequest) {
  if (!mpEnabled()) {
    return NextResponse.json({ error: "Mercado Pago no configurado" }, { status: 501 });
  }

  const body = await req.json().catch(() => null);
  const dataId: string | undefined =
    body?.data?.id?.toString() ?? req.nextUrl.searchParams.get("data.id") ?? undefined;
  const type: string | undefined =
    body?.type ?? req.nextUrl.searchParams.get("type") ?? undefined;

  // Validación de firma (x-signature). Obligatoria si hay clave configurada.
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (secret) {
    if (!verifySignature(req, dataId, secret)) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("Falta MP_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook sin configurar" }, { status: 500 });
  }

  if (type !== "payment" || !dataId) {
    return NextResponse.json({ received: true }); // otros eventos no nos interesan
  }

  const mpPayment = await new MpPayment(getMercadoPago())
    .get({ id: dataId })
    .catch(() => null);
  const paymentId = mpPayment?.external_reference;
  if (!mpPayment || !paymentId) {
    return NextResponse.json({ received: true });
  }

  switch (mpPayment.status) {
    case "approved":
      await applyPaidStatus(paymentId, String(mpPayment.id));
      break;
    case "rejected":
    case "cancelled":
      await applyFailedStatus(paymentId);
      break;
    case "refunded":
    case "charged_back": {
      const refundedCents = Math.round((mpPayment.transaction_amount_refunded ?? 0) * 100);
      await applyRefundedStatus(paymentId, refundedCents || undefined);
      break;
    }
    // "pending" / "in_process": sin cambios, esperamos la resolución.
  }

  return NextResponse.json({ received: true });
}

// Verifica el header x-signature según la doc de MP:
// HMAC-SHA256 de "id:{data.id};request-id:{x-request-id};ts:{ts};"
function verifySignature(req: NextRequest, dataId: string | undefined, secret: string): boolean {
  const signature = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  if (!signature) return false;

  const parts = Object.fromEntries(
    signature.split(",").map((p) => p.trim().split("=", 2) as [string, string])
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId?.toLowerCase() ?? ""};request-id:${requestId ?? ""};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}
