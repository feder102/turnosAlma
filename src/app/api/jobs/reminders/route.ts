import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsApp, alreadySent } from "@/lib/messaging";
import { formatDate, formatTime } from "@/lib/format";
import { appBaseUrl } from "@/lib/mercadopago";

// TODO: Recordatorios de citas por WhatsApp. Deshabilitado porque Vercel Hobby no permite
// crons que se ejecuten más de una vez por día. Habilitar nuevamente con Vercel Pro.
// Job de recordatorios. Ejecutarlo cada 15-30 min:
//  - En producción: Vercel Cron (ver vercel.json) con CRON_SECRET.
//  - En desarrollo: GET http://localhost:3000/api/jobs/reminders
// Envía: recordatorio 24 hs (con preparación), recordatorio 2-3 hs y
// recall a los 6 meses de la última visita para pacientes sin turno futuro.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Configurá CRON_SECRET" }, { status: 500 });
  }

  const clinic = await prisma.clinic.findFirst();
  const tz = clinic?.timezone;
  const now = Date.now();
  let sent24 = 0,
    sent2 = 0,
    sentRecall = 0;

  const baseVars = (appt: {
    patient: { firstName: string };
    treatment: { name: string };
    dentist: { name: string };
    startsAt: Date;
  }) => ({
    paciente: appt.patient.firstName,
    consultorio: clinic?.name ?? "",
    direccion: clinic?.address ?? "",
    tratamiento: appt.treatment.name,
    fecha: formatDate(appt.startsAt, tz),
    hora: formatTime(appt.startsAt, tz),
    odontologo: appt.dentist.name,
  });

  // ── Recordatorio 24 hs (ventana 23-25 hs) ────────────────────────────────
  const in24 = await prisma.appointment.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      startsAt: {
        gte: new Date(now + 23 * 3600 * 1000),
        lte: new Date(now + 25 * 3600 * 1000),
      },
    },
    include: { patient: true, treatment: true, dentist: true },
  });
  for (const appt of in24) {
    if (await alreadySent(appt.id, "reminder_24h")) continue;
    await sendWhatsApp({
      to: appt.patient.phone,
      templateKey: "reminder_24h",
      vars: {
        ...baseVars(appt),
        ...(appt.treatment.preparationNotes
          ? { preparacion: `📋 Preparación: ${appt.treatment.preparationNotes}` }
          : {}),
      },
      appointmentId: appt.id,
    });
    sent24++;
  }

  // ── Recordatorio 2-3 hs ──────────────────────────────────────────────────
  const in2 = await prisma.appointment.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      startsAt: {
        gte: new Date(now + 2 * 3600 * 1000),
        lte: new Date(now + 3 * 3600 * 1000),
      },
    },
    include: { patient: true, treatment: true, dentist: true },
  });
  for (const appt of in2) {
    if (await alreadySent(appt.id, "reminder_2h")) continue;
    await sendWhatsApp({
      to: appt.patient.phone,
      templateKey: "reminder_2h",
      vars: baseVars(appt),
      appointmentId: appt.id,
    });
    sent2++;
  }

  // ── Recall 6 meses: última visita completada hace 6-7 meses, sin turno futuro ──
  const sixMonthsAgo = new Date(now - 182 * 24 * 3600 * 1000);
  const sevenMonthsAgo = new Date(now - 212 * 24 * 3600 * 1000);
  const candidates = await prisma.patient.findMany({
    where: {
      appointments: {
        some: {
          status: "COMPLETED",
          startsAt: { gte: sevenMonthsAgo, lte: sixMonthsAgo },
        },
        none: { startsAt: { gte: new Date() }, status: { in: ["PENDING", "CONFIRMED"] } },
      },
    },
    include: {
      appointments: {
        where: { status: "COMPLETED" },
        orderBy: { startsAt: "desc" },
        take: 1,
      },
    },
  });
  for (const patient of candidates) {
    const last = patient.appointments[0];
    if (!last || last.startsAt > sixMonthsAgo) continue; // la última visita es más reciente
    // no repetir el recall si ya se mandó en los últimos 3 meses
    const recent = await prisma.messageLog.findFirst({
      where: {
        to: patient.phone,
        templateKey: "recall_6m",
        createdAt: { gte: new Date(now - 90 * 24 * 3600 * 1000) },
        status: { in: ["SENT", "SIMULATED"] },
      },
    });
    if (recent) continue;
    await sendWhatsApp({
      to: patient.phone,
      templateKey: "recall_6m",
      vars: {
        paciente: patient.firstName,
        consultorio: clinic?.name ?? "",
        link: `${appBaseUrl()}/reservar`,
      },
    });
    sentRecall++;
  }

  return NextResponse.json({
    ok: true,
    reminders24h: sent24,
    reminders2h: sent2,
    recalls: sentRecall,
  });
}
