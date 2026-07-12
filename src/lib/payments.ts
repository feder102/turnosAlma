// Lógica de pagos: crear checkouts (Mercado Pago o simulado), procesar el
// pago enviado por el Payment Brick, aplicar resultados del webhook y
// reembolsos. El importe siempre sale del turno (que ya tiene aplicado el
// copago de obra social si corresponde), nunca del cliente.

import { randomUUID } from "crypto";
import { Payment as MpPayment, PaymentRefund, Preference } from "mercadopago";
import { prisma } from "./prisma";
import { getMercadoPago, mpEnabled, appBaseUrl, mpCurrency } from "./mercadopago";
import type { PaymentKind } from "./domain";

export class PaymentError extends Error {}

export async function createCheckout(params: {
  appointmentId?: string;
  planId?: string;
  kind: PaymentKind;
}): Promise<{ url: string | null; paymentId: string }> {
  const { kind } = params;

  let patientId: string;
  let amountCents: number;
  let appointmentId: string | undefined;
  let planId: string | undefined;

  if (params.planId) {
    // Cobro del plan completo por adelantado
    const plan = await prisma.treatmentPlan.findUnique({
      where: { id: params.planId },
      include: { treatment: true, patient: true, payments: true },
    });
    if (!plan) throw new PaymentError("Plan no encontrado.");
    const already = plan.payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amountCents - p.refundedCents, 0);
    const total = plan.totalCents ?? plan.treatment.priceCents * plan.totalSessions;
    amountCents = total - already;
    if (amountCents <= 0) throw new PaymentError("El plan ya está pagado.");
    patientId = plan.patientId;
    planId = plan.id;
  } else if (params.appointmentId) {
    const appt = await prisma.appointment.findUnique({
      where: { id: params.appointmentId },
      include: { treatment: true, patient: true, payments: true },
    });
    if (!appt) throw new PaymentError("Turno no encontrado.");
    if (appt.status === "CANCELLED") throw new PaymentError("El turno está cancelado.");

    const alreadyPaid = appt.payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amountCents - p.refundedCents, 0);

    if (kind === "DEPOSIT") {
      if (appt.treatment.depositCents == null)
        throw new PaymentError("Este tratamiento no admite seña.");
      amountCents = appt.treatment.depositCents;
    } else {
      amountCents = appt.priceCents - alreadyPaid; // saldo restante
    }
    if (amountCents <= 0) throw new PaymentError("El turno ya está pagado.");
    patientId = appt.patientId;
    appointmentId = appt.id;
  } else {
    throw new PaymentError("Falta el turno o el plan a cobrar.");
  }

  // Modo simulado: sin claves de Mercado Pago, el pago se aprueba localmente.
  if (!mpEnabled()) {
    const payment = await prisma.payment.create({
      data: {
        appointmentId,
        planId,
        patientId,
        amountCents,
        kind,
        status: "PAID",
        provider: "simulated",
      },
    });
    await applyPaidStatus(payment.id);
    return { url: null, paymentId: payment.id };
  }

  // Con Mercado Pago el formulario (Payment Brick) vive en nuestra página
  // /pagar/[id]; acá solo se registra el pago pendiente.
  const payment = await prisma.payment.create({
    data: { appointmentId, planId, patientId, amountCents, kind, status: "PENDING" },
  });

  return { url: `${appBaseUrl()}/pagar/${payment.id}`, paymentId: payment.id };
}

// URL a la que vuelve el paciente después de pagar (o de cancelar el intento).
export function returnUrl(payment: { appointmentId: string | null }, result: "ok" | "cancelado") {
  const base = appBaseUrl();
  return payment.appointmentId
    ? `${base}/reservar/exito/${payment.appointmentId}?pago=${result}`
    : `${base}/dashboard/pagos?pago=${result}`;
}

// Descripción del cobro para mostrar en el Brick y en Mercado Pago.
export async function paymentDescription(paymentId: string): Promise<string> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      patient: true,
      appointment: { include: { treatment: true } },
      plan: { include: { treatment: true } },
    },
  });
  if (!payment) throw new PaymentError("Pago no encontrado.");
  const treatment = payment.appointment?.treatment.name ?? payment.plan?.treatment.name ?? "Turno";
  return `${treatment} — ${payment.patient.firstName} ${payment.patient.lastName}`;
}

// Preferencia para la opción "Cuenta de Mercado Pago" (wallet) del Payment
// Brick: el monto y la referencia se fijan acá, en el backend.
export async function createBrickPreference(paymentId: string): Promise<string> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new PaymentError("Pago no encontrado.");

  // Mercado Pago rechaza auto_return (y notification_url) con URLs no públicas
  // como http://localhost, así que en desarrollo se omiten. En producción, con
  // un dominio https, el retorno automático de la opción wallet funciona.
  const base = appBaseUrl();
  const isPublic = base.startsWith("https://");

  const preference = await new Preference(getMercadoPago()).create({
    body: {
      items: [
        {
          id: payment.id,
          title: await paymentDescription(paymentId),
          quantity: 1,
          unit_price: payment.amountCents / 100,
          currency_id: mpCurrency(),
        },
      ],
      external_reference: payment.id,
      back_urls: {
        success: returnUrl(payment, "ok"),
        pending: returnUrl(payment, "ok"),
        failure: returnUrl(payment, "cancelado"),
      },
      ...(isPublic
        ? {
            notification_url: `${base}/api/payments/webhook`,
            auto_return: "approved",
          }
        : {}),
    },
  });
  if (!preference.id) throw new PaymentError("No pudimos crear la preferencia de pago.");
  return preference.id;
}

// Procesa el formData que devuelve el Payment Brick en onSubmit creando el
// pago en Mercado Pago. Devuelve el estado resultante para que el cliente
// decida qué mostrar.
export async function processBrickPayment(
  paymentId: string,
  formData: Record<string, unknown>
): Promise<{ status: string; detail: string }> {
  if (!mpEnabled()) throw new PaymentError("Mercado Pago no está configurado.");

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new PaymentError("Pago no encontrado.");
  if (payment.status === "PAID") throw new PaymentError("El pago ya fue realizado.");

  const base = appBaseUrl();
  const mpPayment = await new MpPayment(getMercadoPago()).create({
    body: {
      ...formData,
      // El monto y la descripción salen SIEMPRE de nuestra base, nunca del cliente.
      transaction_amount: payment.amountCents / 100,
      description: await paymentDescription(paymentId),
      external_reference: payment.id,
      // MP rechaza notification_url no pública (localhost): solo en producción.
      ...(base.startsWith("https://")
        ? { notification_url: `${base}/api/payments/webhook` }
        : {}),
    },
    requestOptions: { idempotencyKey: randomUUID() },
  });

  const status = mpPayment.status ?? "unknown";
  await prisma.payment.update({
    where: { id: payment.id },
    data: { mpPaymentId: String(mpPayment.id) },
  });

  if (status === "approved") {
    await applyPaidStatus(payment.id, String(mpPayment.id));
  } else if (status === "rejected" || status === "cancelled") {
    await applyFailedStatus(payment.id);
  }
  // "pending" / "in_process": queda PENDING; el webhook confirma después.

  return { status, detail: mpPayment.status_detail ?? "" };
}

// Marca el pago como aprobado y actualiza el estado de pago del turno/plan.
export async function applyPaidStatus(paymentId: string, mpPaymentId?: string) {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "PAID",
      ...(mpPaymentId ? { mpPaymentId } : {}),
    },
    include: { appointment: true },
  });

  if (payment.appointmentId && payment.appointment) {
    const paid = await totalPaidForAppointment(payment.appointmentId);
    await prisma.appointment.update({
      where: { id: payment.appointmentId },
      data: {
        paymentStatus: paid >= payment.appointment.priceCents ? "PAID" : "DEPOSIT_PAID",
        paymentMethod: "ONLINE",
      },
    });
  }

  // Pago total de un plan: marca las sesiones como pagadas
  if (payment.planId && payment.kind === "PLAN_TOTAL") {
    await prisma.appointment.updateMany({
      where: { planId: payment.planId, status: { not: "CANCELLED" } },
      data: { paymentStatus: "PAID", paymentMethod: "ONLINE" },
    });
  }
}

export async function applyFailedStatus(paymentId: string) {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "FAILED" },
  });
  if (payment.appointmentId) {
    const appt = await prisma.appointment.findUnique({ where: { id: payment.appointmentId } });
    if (appt && appt.paymentStatus === "UNPAID") {
      await prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: { paymentStatus: "FAILED" },
      });
    }
  }
}

// Marca el pago como reembolsado (desde el webhook o tras un reembolso manual).
export async function applyRefundedStatus(paymentId: string, refundedCents?: number) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status === "REFUNDED") return;
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "REFUNDED", refundedCents: refundedCents ?? payment.amountCents },
  });
  if (payment.appointmentId) {
    await prisma.appointment.update({
      where: { id: payment.appointmentId },
      data: { paymentStatus: "REFUNDED" },
    });
  }
}

export async function totalPaidForAppointment(appointmentId: string): Promise<number> {
  const payments = await prisma.payment.findMany({
    where: { appointmentId, status: { in: ["PAID", "REFUNDED"] } },
  });
  return payments.reduce((sum, p) => sum + p.amountCents - p.refundedCents, 0);
}

// Reembolso (total) de un pago, típicamente al cancelar un turno ya pagado.
export async function refundPayment(paymentId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new PaymentError("Pago no encontrado.");
  if (payment.status !== "PAID") throw new PaymentError("El pago no está aprobado.");

  if (payment.provider === "mercadopago" && mpEnabled()) {
    if (!payment.mpPaymentId)
      throw new PaymentError("El pago no tiene un pago de Mercado Pago asociado.");
    await new PaymentRefund(getMercadoPago()).create({
      payment_id: payment.mpPaymentId,
      requestOptions: { idempotencyKey: `refund-${payment.id}` },
    });
    // El webhook lo confirma; igualmente lo reflejamos ya.
  }

  await applyRefundedStatus(payment.id);
}
