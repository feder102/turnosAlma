import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { zonedToUtc, formatDateTime } from "@/lib/format";
import {
  APPOINTMENT_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type AppointmentStatus,
  type PaymentStatus,
} from "@/lib/domain";

// Exportación CSV de turnos o pagos del mes (solo admin).
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const mes = req.nextUrl.searchParams.get("mes") ?? "";
  const tipo = req.nextUrl.searchParams.get("tipo") ?? "turnos";
  if (!/^\d{4}-\d{2}$/.test(mes)) {
    return NextResponse.json({ error: "Mes inválido" }, { status: 400 });
  }

  const clinic = await prisma.clinic.findFirst();
  const tz = clinic?.timezone;
  const [y, m] = mes.split("-").map(Number);
  const start = zonedToUtc(`${mes}-01`, "00:00", tz);
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const end = zonedToUtc(`${nextMonth}-01`, "00:00", tz);

  let rows: string[][];
  let header: string[];

  if (tipo === "pagos") {
    const payments = await prisma.payment.findMany({
      where: { createdAt: { gte: start, lt: end } },
      include: { patient: true, appointment: { include: { treatment: true } } },
      orderBy: { createdAt: "asc" },
    });
    header = ["Fecha", "Paciente", "Concepto", "Tipo", "Medio", "Estado", "Importe", "Reembolsado"];
    rows = payments.map((p) => [
      formatDateTime(p.createdAt, tz),
      `${p.patient.lastName}, ${p.patient.firstName}`,
      p.appointment?.treatment.name ?? "Plan",
      p.kind,
      p.provider,
      PAYMENT_STATUS_LABELS[p.status as PaymentStatus] ?? p.status,
      (p.amountCents / 100).toFixed(2),
      (p.refundedCents / 100).toFixed(2),
    ]);
  } else {
    const appointments = await prisma.appointment.findMany({
      where: { startsAt: { gte: start, lt: end } },
      include: { patient: true, dentist: true, treatment: true, chair: true },
      orderBy: { startsAt: "asc" },
    });
    header = ["Fecha", "Paciente", "Teléfono", "Tratamiento", "Profesional", "Cabina", "Estado", "Estado de pago", "Importe"];
    rows = appointments.map((a) => [
      formatDateTime(a.startsAt, tz),
      `${a.patient.lastName}, ${a.patient.firstName}`,
      a.patient.phone,
      a.treatment.name,
      a.dentist.name,
      a.chair.name,
      APPOINTMENT_STATUS_LABELS[a.status as AppointmentStatus] ?? a.status,
      PAYMENT_STATUS_LABELS[a.paymentStatus as PaymentStatus] ?? a.paymentStatus,
      (a.priceCents / 100).toFixed(2),
    ]);
  }

  const escape = (v: string) => (/[",\n;]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
  const csv = [header, ...rows].map((r) => r.map(escape).join(";")).join("\n");

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${tipo}-${mes}.csv"`,
    },
  });
}
