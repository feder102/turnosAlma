// Integración con Mercado Pago (Checkout Bricks: Payment Brick embebido).
// Sin MP_ACCESS_TOKEN el sistema funciona en "modo simulado": el botón de
// pago marca el pago como aprobado localmente para poder probar el flujo.

import { MercadoPagoConfig } from "mercadopago";

let _mp: MercadoPagoConfig | null = null;

export function mpEnabled(): boolean {
  return !!process.env.MP_ACCESS_TOKEN;
}

// Public key para inicializar los Bricks en el navegador.
export function mpPublicKey(): string {
  return process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || "";
}

export function getMercadoPago(): MercadoPagoConfig {
  if (!_mp) {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) throw new Error("MP_ACCESS_TOKEN no está configurado");
    _mp = new MercadoPagoConfig({ accessToken });
  }
  return _mp;
}

export function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

// Moneda de los cobros (Mercado Pago opera en la moneda del país de la cuenta).
export function mpCurrency(): string {
  return (process.env.MP_CURRENCY || "ARS").toUpperCase();
}
