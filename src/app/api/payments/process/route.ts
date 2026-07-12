import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processBrickPayment, PaymentError } from "@/lib/payments";

// Recibe el formData que emite el Payment Brick en onSubmit y crea el pago
// en Mercado Pago. El monto se toma del pago registrado, no del cliente.
const bodySchema = z.object({
  paymentId: z.string(),
  formData: z.record(z.string(), z.unknown()),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  try {
    const result = await processBrickPayment(parsed.data.paymentId, parsed.data.formData);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof PaymentError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("Error procesando el pago:", err);
    return NextResponse.json({ error: "No pudimos procesar el pago." }, { status: 500 });
  }
}
