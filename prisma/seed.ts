// Seed: consultorio con 3 sillones, 2 odontólogas, 6 tratamientos,
// 10 pacientes, turnos de la semana actual, un plan de ortodoncia en curso
// y usuarios del sistema. Credenciales de prueba en el README.

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { zonedToUtc, addDaysStr, todayStr } from "../src/lib/format";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TZ = "America/Argentina/Buenos_Aires";

async function main() {
  console.log("🧹 Limpiando base…");
  await prisma.messageLog.deleteMany();
  await prisma.messageTemplate.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.clinicalNote.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.treatmentPlan.deleteMany();
  await prisma.user.deleteMany();
  await prisma.dentistSchedule.deleteMany();
  await prisma.dentist.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.chair.deleteMany();
  await prisma.clinic.deleteMany();

  console.log("🏥 Consultorio y sillones…");
  const clinic = await prisma.clinic.create({
    data: {
      name: "Consultorio Odontológico Sonrisa",
      address: "Av. Rivadavia 4820, CABA",
      phone: "+541148670000",
      timezone: TZ,
      openingHours: JSON.stringify([
        { weekday: 1, open: "09:00", close: "19:00" },
        { weekday: 2, open: "09:00", close: "19:00" },
        { weekday: 3, open: "09:00", close: "19:00" },
        { weekday: 4, open: "09:00", close: "19:00" },
        { weekday: 5, open: "09:00", close: "18:00" },
        { weekday: 6, open: "09:00", close: "13:00" },
      ]),
    },
  });

  const [chair1, chair2, chair3] = await Promise.all(
    ["Sillón 1", "Sillón 2", "Sillón 3"].map((name) =>
      prisma.chair.create({ data: { name, clinicId: clinic.id } })
    )
  );

  console.log("🦷 Odontólogas…");
  const weekdaysFull = [1, 2, 3, 4, 5];
  const draGomez = await prisma.dentist.create({
    data: {
      name: "Dra. Laura Gómez",
      title: "Dra.",
      firstName: "Laura",
      lastName: "Gómez",
      specialty: "GENERAL",
      color: "#0ea5e9",
      phone: "+5491144440001",
      email: "lgomez@sonrisa.com",
      license: "MN 45231",
      hiredAt: new Date("2019-03-01T00:00:00Z"),
      defaultChairId: chair1.id,
      chairs: { connect: [{ id: chair1.id }, { id: chair3.id }] }, // atiende en 2 sillones
      schedules: {
        create: [
          ...weekdaysFull.map((weekday) => ({ weekday, startTime: "09:00", endTime: "17:00" })),
          { weekday: 6, startTime: "09:00", endTime: "13:00" },
        ],
      },
    },
  });
  const drRuiz = await prisma.dentist.create({
    data: {
      name: "Dr. Martín Ruiz",
      title: "Dr.",
      firstName: "Martín",
      lastName: "Ruiz",
      specialty: "ORTODONCIA",
      color: "#8b5cf6",
      phone: "+5491144440002",
      email: "mruiz@sonrisa.com",
      license: "MN 52890",
      hiredAt: new Date("2021-07-15T00:00:00Z"),
      defaultChairId: chair2.id,
      chairs: { connect: [{ id: chair2.id }] },
      schedules: {
        create: [1, 2, 3, 4, 5].map((weekday) => ({
          weekday,
          startTime: "13:00",
          endTime: "19:00",
        })),
      },
    },
  });

  console.log("💉 Tratamientos…");
  const consulta = await prisma.treatment.create({
    data: {
      name: "Consulta / evaluación inicial",
      description: "Primera visita: diagnóstico y plan de tratamiento.",
      durationMin: 30,
      priceCents: 2000000, // $20.000
      insurancePriceCents: 500000,
    },
  });
  const limpieza = await prisma.treatment.create({
    data: {
      name: "Limpieza y profilaxis",
      description: "Limpieza profunda, remoción de sarro y pulido.",
      durationMin: 45,
      priceCents: 3500000,
      insurancePriceCents: 800000,
    },
  });
  const extraccion = await prisma.treatment.create({
    data: {
      name: "Extracción simple",
      durationMin: 45,
      priceCents: 5000000,
      insurancePriceCents: 1500000,
      preparationNotes:
        "Vení habiendo comido liviano. Si tomás anticoagulantes, avisanos con anticipación.",
      postCareNotes:
        "Mordé la gasa 30-40 min. No enjuagues ni escupas por 24 hs. Dieta blanda y fría. Ante sangrado abundante o fiebre, contactanos.",
    },
  });
  const endodoncia = await prisma.treatment.create({
    data: {
      name: "Endodoncia (tratamiento de conducto)",
      durationMin: 60,
      priceCents: 12000000,
      insurancePriceCents: 4000000,
      multiSession: true,
      defaultSessions: 2,
      sessionIntervalDays: 7,
      depositCents: 4000000,
      preparationNotes: "Tomá tu medicación habitual salvo indicación contraria.",
      postCareNotes:
        "Es normal sentir molestia 24-48 hs; podés tomar el analgésico indicado. Evitá masticar del lado tratado hasta la próxima sesión.",
    },
  });
  const ortodoncia = await prisma.treatment.create({
    data: {
      name: "Ortodoncia (control mensual)",
      description: "Colocación y controles periódicos de brackets/alineadores.",
      durationMin: 30,
      priceCents: 4500000,
      insurancePriceCents: null,
      multiSession: true,
      defaultSessions: 4,
      sessionIntervalDays: 21,
      depositCents: 1500000,
    },
  });
  const blanqueamiento = await prisma.treatment.create({
    data: {
      name: "Blanqueamiento dental",
      durationMin: 60,
      priceCents: 8000000,
      postCareNotes:
        "Evitá café, té, vino tinto y cigarrillo por 48 hs. Puede haber sensibilidad leve los primeros días.",
    },
  });

  console.log("🧑‍🤝‍🧑 Pacientes…");
  const patientData = [
    { firstName: "María", lastName: "Pérez", phone: "+5491155550001", email: "maria.perez@example.com", birthDate: new Date("1988-04-12T12:00:00Z"), insuranceProvider: "OSDE", insuranceNumber: "61234567801", medicalNotes: "Alergia a la penicilina." },
    { firstName: "Jorge", lastName: "Fernández", phone: "+5491155550002", email: "jorge.f@example.com", birthDate: new Date("1975-09-30T12:00:00Z"), insuranceProvider: "Swiss Medical", insuranceNumber: "40098812" },
    { firstName: "Lucía", lastName: "Martínez", phone: "+5491155550003", email: "lucia.mtz@example.com", birthDate: new Date("2001-01-22T12:00:00Z") },
    { firstName: "Carlos", lastName: "Suárez", phone: "+5491155550004", email: "csuarez@example.com", birthDate: new Date("1969-11-05T12:00:00Z"), insuranceProvider: "OSDE", insuranceNumber: "60011223344", medicalNotes: "Hipertenso, toma enalapril." },
    { firstName: "Ana", lastName: "Rodríguez", phone: "+5491155550005", email: "ana.rdz@example.com", birthDate: new Date("1995-06-17T12:00:00Z") },
    { firstName: "Pedro", lastName: "López", phone: "+5491155550006", email: "plopez@example.com", birthDate: new Date("1982-02-08T12:00:00Z"), insuranceProvider: "Galeno", insuranceNumber: "77812" },
    { firstName: "Sofía", lastName: "García", phone: "+5491155550007", email: "sofia.g@example.com", birthDate: new Date("2010-08-25T12:00:00Z"), medicalNotes: "Paciente pediátrica. Madre: Carla García." },
    { firstName: "Diego", lastName: "Torres", phone: "+5491155550008", email: "dtorres@example.com", birthDate: new Date("1990-12-01T12:00:00Z") },
    { firstName: "Valentina", lastName: "Ríos", phone: "+5491155550009", email: "vrios@example.com", birthDate: new Date("1998-03-14T12:00:00Z"), insuranceProvider: "OSDE", insuranceNumber: "60987654321" },
    { firstName: "Roberto", lastName: "Núñez", phone: "+5491155550010", email: "rnunez@example.com", birthDate: new Date("1957-07-19T12:00:00Z"), medicalNotes: "Diabético tipo 2. Prótesis parcial superior." },
  ];
  const patients = [];
  for (const p of patientData) patients.push(await prisma.patient.create({ data: p }));

  console.log("👤 Usuarios…");
  const pw = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: { email: "admin@sonrisa.com", name: "Admin", passwordHash: pw, role: "ADMIN" },
  });
  await prisma.user.create({
    data: {
      email: "recepcion@sonrisa.com",
      name: "Carla (Recepción)",
      passwordHash: await bcrypt.hash("recepcion123", 10),
      role: "RECEPTION",
    },
  });
  await prisma.user.create({
    data: {
      email: "lgomez@sonrisa.com",
      name: "Dra. Laura Gómez",
      passwordHash: await bcrypt.hash("dentista123", 10),
      role: "DENTIST",
      dentistId: draGomez.id,
    },
  });
  await prisma.user.create({
    data: {
      email: "mruiz@sonrisa.com",
      name: "Dr. Martín Ruiz",
      passwordHash: await bcrypt.hash("dentista123", 10),
      role: "DENTIST",
      dentistId: drRuiz.id,
    },
  });

  console.log("📅 Turnos de la semana…");
  const today = todayStr(TZ);
  // Lunes de esta semana
  const todayDate = new Date(today + "T12:00:00Z");
  const monday = addDaysStr(today, todayDate.getUTCDay() === 0 ? -6 : 1 - todayDate.getUTCDay());

  type Appt = {
    day: number; // offset desde el lunes
    time: string;
    patient: number; // índice
    dentist: typeof draGomez;
    treatment: { id: string; durationMin: number; priceCents: number; insurancePriceCents: number | null };
    chairId: string;
    status: string;
    paymentStatus?: string;
    paymentMethod?: string;
  };
  const week: Appt[] = [
    { day: 0, time: "09:30", patient: 0, dentist: draGomez, treatment: limpieza, chairId: chair1.id, status: "COMPLETED", paymentStatus: "PAID", paymentMethod: "CASH" },
    { day: 0, time: "11:00", patient: 3, dentist: draGomez, treatment: consulta, chairId: chair1.id, status: "COMPLETED", paymentStatus: "PAID", paymentMethod: "CARD_IN_PERSON" },
    { day: 0, time: "14:00", patient: 7, dentist: drRuiz, treatment: consulta, chairId: chair2.id, status: "NO_SHOW" },
    { day: 1, time: "10:00", patient: 4, dentist: draGomez, treatment: blanqueamiento, chairId: chair1.id, status: "COMPLETED", paymentStatus: "PAID", paymentMethod: "TRANSFER" },
    { day: 1, time: "15:00", patient: 5, dentist: drRuiz, treatment: consulta, chairId: chair2.id, status: "COMPLETED", paymentStatus: "UNPAID" },
    { day: 2, time: "09:00", patient: 9, dentist: draGomez, treatment: extraccion, chairId: chair1.id, status: "CONFIRMED" },
    { day: 2, time: "16:00", patient: 2, dentist: drRuiz, treatment: consulta, chairId: chair2.id, status: "CONFIRMED", paymentStatus: "PAID", paymentMethod: "ONLINE" },
    { day: 3, time: "10:30", patient: 1, dentist: draGomez, treatment: limpieza, chairId: chair1.id, status: "CONFIRMED" },
    { day: 3, time: "14:30", patient: 6, dentist: drRuiz, treatment: consulta, chairId: chair2.id, status: "PENDING" },
    { day: 4, time: "09:30", patient: 3, dentist: draGomez, treatment: endodoncia, chairId: chair1.id, status: "CONFIRMED", paymentStatus: "DEPOSIT_PAID", paymentMethod: "ONLINE" },
    { day: 4, time: "11:00", patient: 8, dentist: draGomez, treatment: consulta, chairId: chair3.id, status: "PENDING" },
  ];

  for (const a of week) {
    const startsAt = zonedToUtc(addDaysStr(monday, a.day), a.time, TZ);
    const endsAt = new Date(startsAt.getTime() + a.treatment.durationMin * 60000);
    const patient = patients[a.patient];
    const price =
      patient.insuranceProvider && a.treatment.insurancePriceCents != null
        ? a.treatment.insurancePriceCents
        : a.treatment.priceCents;
    const appt = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        dentistId: a.dentist.id,
        treatmentId: a.treatment.id,
        chairId: a.chairId,
        startsAt,
        endsAt,
        status: a.status,
        paymentStatus: a.paymentStatus ?? "UNPAID",
        paymentMethod: a.paymentMethod ?? null,
        priceCents: price,
      },
    });
    if (a.status === "COMPLETED") {
      await prisma.clinicalNote.create({
        data: {
          patientId: patient.id,
          appointmentId: appt.id,
          content: "Procedimiento realizado sin complicaciones.",
          nextSteps: "Control en 6 meses.",
        },
      });
      if (a.paymentStatus === "PAID") {
        await prisma.payment.create({
          data: {
            appointmentId: appt.id,
            patientId: patient.id,
            amountCents: price,
            kind: "FULL",
            status: "PAID",
            provider: "manual",
          },
        });
      }
    }
  }

  console.log("🪥 Plan de ortodoncia (Valentina, sesión 2 de 4 completada)…");
  const valentina = patients[8];
  const plan = await prisma.treatmentPlan.create({
    data: {
      patientId: valentina.id,
      treatmentId: ortodoncia.id,
      dentistId: drRuiz.id,
      totalSessions: 4,
      billingMode: "PER_SESSION",
    },
  });
  // 2 sesiones pasadas completadas, 2 futuras agendadas (cada 3 semanas)
  const planStart = addDaysStr(monday, -42);
  for (let i = 0; i < 4; i++) {
    const dateStr = addDaysStr(planStart, i * 21);
    const startsAt = zonedToUtc(dateStr, "17:00", TZ);
    const endsAt = new Date(startsAt.getTime() + ortodoncia.durationMin * 60000);
    const done = startsAt.getTime() < Date.now();
    const appt = await prisma.appointment.create({
      data: {
        patientId: valentina.id,
        dentistId: drRuiz.id,
        treatmentId: ortodoncia.id,
        chairId: chair2.id,
        startsAt,
        endsAt,
        status: done ? "COMPLETED" : "CONFIRMED",
        paymentStatus: done ? "PAID" : "UNPAID",
        paymentMethod: done ? "CASH" : null,
        priceCents: ortodoncia.priceCents,
        planId: plan.id,
        sessionNumber: i + 1,
      },
    });
    if (done) {
      await prisma.clinicalNote.create({
        data: {
          patientId: valentina.id,
          appointmentId: appt.id,
          content: `Ajuste de brackets — sesión ${i + 1}. Buena evolución.`,
          nextSteps: "Continuar con el plan; próximo ajuste en 3 semanas.",
        },
      });
      await prisma.payment.create({
        data: {
          appointmentId: appt.id,
          planId: plan.id,
          patientId: valentina.id,
          amountCents: ortodoncia.priceCents,
          kind: "FULL",
          status: "PAID",
          provider: "manual",
        },
      });
    }
  }

  console.log("💬 Plantillas de WhatsApp…");
  const templates = [
    {
      key: "booking_confirmed",
      name: "Confirmación de turno",
      body: "Hola {{paciente}} 👋 Tu turno en {{consultorio}} quedó confirmado.\n\n🦷 {{tratamiento}}\n📅 {{fecha}} a las {{hora}} hs\n👩‍⚕️ {{odontologo}}\n📍 {{direccion}}\n\nSi necesitás reprogramar, respondé este mensaje o llamanos. ¡Te esperamos!",
    },
    {
      key: "reminder_24h",
      name: "Recordatorio 24 hs antes",
      body: "Hola {{paciente}}, te recordamos tu turno de mañana en {{consultorio}}.\n\n🦷 {{tratamiento}}\n📅 {{fecha}} a las {{hora}} hs\n👩‍⚕️ {{odontologo}}\n\n{{preparacion}}\n\nSi no podés asistir, avisanos así ofrecemos el horario a otro paciente. ¡Gracias!",
    },
    {
      key: "reminder_2h",
      name: "Recordatorio 2 hs antes",
      body: "Hola {{paciente}}, ¡te esperamos hoy a las {{hora}} hs en {{consultorio}}! 📍 {{direccion}}. Si estás demorado/a, avisanos.",
    },
    {
      key: "post_care",
      name: "Cuidados post-tratamiento",
      body: "Hola {{paciente}}, gracias por tu visita de hoy. Indicaciones para tu recuperación:\n\n{{cuidados}}\n\nAnte cualquier duda o molestia inusual, escribinos. Que te mejores pronto 🙂",
    },
    {
      key: "recall_6m",
      name: "Recordatorio de control periódico",
      body: "Hola {{paciente}} 👋 Pasaron 6 meses desde tu última visita a {{consultorio}}. Te recomendamos agendar un control y limpieza para mantener tu salud bucal. Podés reservar online acá: {{link}}",
    },
    {
      key: "staff_new_booking",
      name: "Aviso al staff: turno nuevo",
      body: "📥 Turno nuevo: {{paciente}} — {{tratamiento}} con {{odontologo}} el {{fecha}} a las {{hora}} hs.",
    },
    {
      key: "staff_cancelled",
      name: "Aviso al staff: turno cancelado",
      body: "❌ Turno cancelado: {{paciente}} — {{tratamiento}} con {{odontologo}} el {{fecha}} a las {{hora}} hs.",
    },
    {
      key: "clinic_cancelled",
      name: "Cancelación por parte del consultorio",
      body: "Hola {{paciente}}, lamentamos informarte que tuvimos que {{accion}} tu turno del {{fecha}} a las {{hora}} hs ({{tratamiento}}). Disculpá las molestias. Escribinos o reservá un nuevo horario acá: {{link}}",
    },
  ];
  for (const t of templates) await prisma.messageTemplate.create({ data: t });

  console.log("✅ Seed completo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
