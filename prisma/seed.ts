// Seed: centro de depilación con 2 cabinas Soprano ICE, 2 profesionales,
// servicios por zona (mujer y hombre), 10 pacientes, turnos de la semana
// actual, un plan de piernas completas en curso y usuarios del sistema.
// Credenciales de prueba en el README.
//
// Datos del negocio tomados de instagram.com/almasopranoicesj.
// Los nombres de las profesionales son PLACEHOLDERS (no figuran públicamente
// en el Instagram): reemplazalos por los reales.

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { zonedToUtc, addDaysStr, todayStr } from "../src/lib/format";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TZ = "America/Argentina/San_Juan";

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

  console.log("💖 Centro y cabinas…");
  const clinic = await prisma.clinic.create({
    data: {
      name: "Alma San Juan — Centro Oficial Soprano ICE",
      address: "Paula Albarracín de Sarmiento 1085 (Sur), Capital, San Juan",
      phone: "+542644191588",
      timezone: TZ,
      openingHours: JSON.stringify([
        { weekday: 1, open: "07:30", close: "22:00" },
        { weekday: 2, open: "07:30", close: "22:00" },
        { weekday: 3, open: "07:30", close: "22:00" },
        { weekday: 4, open: "07:30", close: "22:00" },
        { weekday: 5, open: "07:30", close: "22:00" },
        { weekday: 6, open: "07:30", close: "22:00" },
      ]),
    },
  });

  const [cabina1, cabina2] = await Promise.all(
    ["Cabina 1 — Soprano ICE", "Cabina 2 — Soprano ICE"].map((name) =>
      prisma.chair.create({ data: { name, clinicId: clinic.id } })
    )
  );

  console.log("✨ Profesionales…");
  const weekdaysFull = [1, 2, 3, 4, 5, 6];
  const licCastro = await prisma.dentist.create({
    data: {
      name: "Lic. Vanina Castro",
      title: "Lic.",
      firstName: "Vanina",
      lastName: "Castro",
      specialty: "LASER_CORPORAL",
      color: "#d946ef",
      phone: "+5492644190001",
      email: "vcastro@almasanjuan.com",
      license: "MP 1201",
      hiredAt: new Date("2020-02-01T00:00:00Z"),
      defaultChairId: cabina1.id,
      chairs: { connect: [{ id: cabina1.id }, { id: cabina2.id }] },
      schedules: {
        create: weekdaysFull.map((weekday) => ({
          weekday,
          startTime: "07:30",
          endTime: "14:30",
        })),
      },
    },
  });
  const tecMorales = await prisma.dentist.create({
    data: {
      name: "Téc. Julieta Morales",
      title: "Téc.",
      firstName: "Julieta",
      lastName: "Morales",
      specialty: "LASER_FACIAL",
      color: "#8b5cf6",
      phone: "+5492644190002",
      email: "jmorales@almasanjuan.com",
      license: "MP 1587",
      hiredAt: new Date("2022-08-15T00:00:00Z"),
      defaultChairId: cabina2.id,
      chairs: { connect: [{ id: cabina2.id }] },
      schedules: {
        create: weekdaysFull.map((weekday) => ({
          weekday,
          startTime: "14:30",
          endTime: "22:00",
        })),
      },
    },
  });

  console.log("💉 Servicios…");
  const POST_LASER =
    "No te expongas al sol directo por 48 hs y usá protector solar FPS 50. Hidratá la zona con crema neutra. Evitá saunas, piletas con cloro y ejercicio intenso por 24 hs.";
  const PRE_LASER =
    "Vení con la zona rasurada 24 hs antes (no cera ni pinza los 30 días previos). Piel limpia, sin cremas ni desodorante. Evitá exposición solar intensa la semana previa.";

  const consulta = await prisma.treatment.create({
    data: {
      name: "Evaluación inicial (sin cargo)",
      description:
        "Primera visita: evaluamos tu piel y tu vello, respondemos dudas y armamos tu plan de sesiones.",
      durationMin: 15,
      priceCents: 0,
    },
  });
  const axilas = await prisma.treatment.create({
    data: {
      name: "Axilas",
      durationMin: 15,
      priceCents: 1200000, // $12.000
      multiSession: true,
      defaultSessions: 8,
      sessionIntervalDays: 30,
      preparationNotes: PRE_LASER,
      postCareNotes: POST_LASER,
    },
  });
  const cavado = await prisma.treatment.create({
    data: {
      name: "Cavado completo",
      durationMin: 20,
      priceCents: 1800000,
      multiSession: true,
      defaultSessions: 8,
      sessionIntervalDays: 30,
      preparationNotes: PRE_LASER,
      postCareNotes: POST_LASER,
    },
  });
  await prisma.treatment.create({
    data: {
      name: "Tira de cola",
      durationMin: 15,
      priceCents: 1000000,
      multiSession: true,
      defaultSessions: 8,
      sessionIntervalDays: 30,
      preparationNotes: PRE_LASER,
      postCareNotes: POST_LASER,
    },
  });
  const bozo = await prisma.treatment.create({
    data: {
      name: "Bozo",
      durationMin: 10,
      priceCents: 800000,
      multiSession: true,
      defaultSessions: 10,
      sessionIntervalDays: 30,
      postCareNotes: POST_LASER,
    },
  });
  const rostro = await prisma.treatment.create({
    data: {
      name: "Rostro completo",
      durationMin: 25,
      priceCents: 1800000,
      multiSession: true,
      defaultSessions: 10,
      sessionIntervalDays: 30,
      postCareNotes: POST_LASER,
    },
  });
  const mediaPierna = await prisma.treatment.create({
    data: {
      name: "Media pierna",
      durationMin: 30,
      priceCents: 2500000,
      multiSession: true,
      defaultSessions: 8,
      sessionIntervalDays: 30,
      preparationNotes: PRE_LASER,
      postCareNotes: POST_LASER,
    },
  });
  const piernasCompletas = await prisma.treatment.create({
    data: {
      name: "Piernas completas",
      durationMin: 45,
      priceCents: 4000000,
      multiSession: true,
      defaultSessions: 8,
      sessionIntervalDays: 30,
      depositCents: 1000000,
      preparationNotes: PRE_LASER,
      postCareNotes: POST_LASER,
    },
  });
  const comboFull = await prisma.treatment.create({
    data: {
      name: "Combo mujer: piernas + cavado + tira de cola + axilas",
      description: "El plan más completo, con precio de combo.",
      durationMin: 75,
      priceCents: 6000000,
      multiSession: true,
      defaultSessions: 8,
      sessionIntervalDays: 30,
      depositCents: 1500000,
      preparationNotes: PRE_LASER,
      postCareNotes: POST_LASER,
    },
  });
  const espalda = await prisma.treatment.create({
    data: {
      name: "Espalda completa (hombre)",
      durationMin: 40,
      priceCents: 3000000,
      multiSession: true,
      defaultSessions: 10,
      sessionIntervalDays: 40,
      preparationNotes: PRE_LASER,
      postCareNotes: POST_LASER,
    },
  });
  await prisma.treatment.create({
    data: {
      name: "Tórax completo (hombre)",
      durationMin: 40,
      priceCents: 3000000,
      multiSession: true,
      defaultSessions: 10,
      sessionIntervalDays: 40,
      preparationNotes: PRE_LASER,
      postCareNotes: POST_LASER,
    },
  });

  console.log("🧑‍🤝‍🧑 Pacientes…");
  const patientData = [
    { firstName: "María", lastName: "Pérez", phone: "+5492645550001", email: "maria.perez@example.com", birthDate: new Date("1988-04-12T12:00:00Z"), medicalNotes: "Piel sensible; usar parámetros suaves." },
    { firstName: "Julia", lastName: "Fernández", phone: "+5492645550002", email: "julia.f@example.com", birthDate: new Date("1975-09-30T12:00:00Z") },
    { firstName: "Lucía", lastName: "Martínez", phone: "+5492645550003", email: "lucia.mtz@example.com", birthDate: new Date("2001-01-22T12:00:00Z") },
    { firstName: "Carlos", lastName: "Suárez", phone: "+5492645550004", email: "csuarez@example.com", birthDate: new Date("1985-11-05T12:00:00Z") },
    { firstName: "Ana", lastName: "Rodríguez", phone: "+5492645550005", email: "ana.rdz@example.com", birthDate: new Date("1995-06-17T12:00:00Z"), medicalNotes: "Fototipo V: controlar fluencia." },
    { firstName: "Pedro", lastName: "López", phone: "+5492645550006", email: "plopez@example.com", birthDate: new Date("1982-02-08T12:00:00Z") },
    { firstName: "Sofía", lastName: "García", phone: "+5492645550007", email: "sofia.g@example.com", birthDate: new Date("2003-08-25T12:00:00Z") },
    { firstName: "Diego", lastName: "Torres", phone: "+5492645550008", email: "dtorres@example.com", birthDate: new Date("1990-12-01T12:00:00Z") },
    { firstName: "Valentina", lastName: "Ríos", phone: "+5492645550009", email: "vrios@example.com", birthDate: new Date("1998-03-14T12:00:00Z") },
    { firstName: "Romina", lastName: "Núñez", phone: "+5492645550010", email: "rnunez@example.com", birthDate: new Date("1992-07-19T12:00:00Z"), medicalNotes: "Embarazo consultado: retomar tratamiento después del parto." },
  ];
  const patients = [];
  for (const p of patientData) patients.push(await prisma.patient.create({ data: p }));

  console.log("👤 Usuarios…");
  const pw = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: { email: "admin@almasanjuan.com", name: "Admin", passwordHash: pw, role: "ADMIN" },
  });
  await prisma.user.create({
    data: {
      email: "recepcion@almasanjuan.com",
      name: "Carla (Recepción)",
      passwordHash: await bcrypt.hash("recepcion123", 10),
      role: "RECEPTION",
    },
  });
  await prisma.user.create({
    data: {
      email: "vcastro@almasanjuan.com",
      name: "Lic. Vanina Castro",
      passwordHash: await bcrypt.hash("profesional123", 10),
      role: "DENTIST",
      dentistId: licCastro.id,
    },
  });
  await prisma.user.create({
    data: {
      email: "jmorales@almasanjuan.com",
      name: "Téc. Julieta Morales",
      passwordHash: await bcrypt.hash("profesional123", 10),
      role: "DENTIST",
      dentistId: tecMorales.id,
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
    dentist: typeof licCastro;
    treatment: { id: string; durationMin: number; priceCents: number; insurancePriceCents: number | null };
    chairId: string;
    status: string;
    paymentStatus?: string;
    paymentMethod?: string;
  };
  const week: Appt[] = [
    { day: 0, time: "08:30", patient: 0, dentist: licCastro, treatment: axilas, chairId: cabina1.id, status: "COMPLETED", paymentStatus: "PAID", paymentMethod: "CASH" },
    { day: 0, time: "11:00", patient: 3, dentist: licCastro, treatment: consulta, chairId: cabina1.id, status: "COMPLETED", paymentStatus: "PAID", paymentMethod: "CARD_IN_PERSON" },
    { day: 0, time: "15:00", patient: 7, dentist: tecMorales, treatment: consulta, chairId: cabina2.id, status: "NO_SHOW" },
    { day: 1, time: "10:00", patient: 4, dentist: licCastro, treatment: piernasCompletas, chairId: cabina1.id, status: "COMPLETED", paymentStatus: "PAID", paymentMethod: "TRANSFER" },
    { day: 1, time: "16:00", patient: 5, dentist: tecMorales, treatment: consulta, chairId: cabina2.id, status: "COMPLETED", paymentStatus: "UNPAID" },
    { day: 2, time: "09:00", patient: 9, dentist: licCastro, treatment: cavado, chairId: cabina1.id, status: "CONFIRMED" },
    { day: 2, time: "17:00", patient: 2, dentist: tecMorales, treatment: bozo, chairId: cabina2.id, status: "CONFIRMED", paymentStatus: "PAID", paymentMethod: "ONLINE" },
    { day: 3, time: "10:30", patient: 1, dentist: licCastro, treatment: mediaPierna, chairId: cabina1.id, status: "CONFIRMED" },
    { day: 3, time: "15:30", patient: 6, dentist: tecMorales, treatment: rostro, chairId: cabina2.id, status: "PENDING" },
    { day: 4, time: "08:00", patient: 3, dentist: licCastro, treatment: espalda, chairId: cabina1.id, status: "CONFIRMED", paymentStatus: "DEPOSIT_PAID", paymentMethod: "ONLINE" },
    { day: 4, time: "11:00", patient: 8, dentist: licCastro, treatment: consulta, chairId: cabina2.id, status: "PENDING" },
  ];

  for (const a of week) {
    const startsAt = zonedToUtc(addDaysStr(monday, a.day), a.time, TZ);
    const endsAt = new Date(startsAt.getTime() + a.treatment.durationMin * 60000);
    const patient = patients[a.patient];
    const price = a.treatment.priceCents;
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
          content: "Sesión realizada sin complicaciones. Buena tolerancia al tratamiento.",
          nextSteps: "Próxima sesión en 30 días.",
        },
      });
      if (a.paymentStatus === "PAID" && price > 0) {
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

  console.log("🦵 Plan combo mujer (Valentina, sesión 2 de 8 completada)…");
  const valentina = patients[8];
  const plan = await prisma.treatmentPlan.create({
    data: {
      patientId: valentina.id,
      treatmentId: comboFull.id,
      dentistId: licCastro.id,
      totalSessions: 8,
      billingMode: "PER_SESSION",
    },
  });
  // 2 sesiones pasadas completadas, el resto agendado (cada 30 días)
  const planStart = addDaysStr(monday, -60);
  for (let i = 0; i < 4; i++) {
    const dateStr = addDaysStr(planStart, i * 30);
    const startsAt = zonedToUtc(dateStr, "09:00", TZ);
    const endsAt = new Date(startsAt.getTime() + comboFull.durationMin * 60000);
    const done = startsAt.getTime() < Date.now();
    const appt = await prisma.appointment.create({
      data: {
        patientId: valentina.id,
        dentistId: licCastro.id,
        treatmentId: comboFull.id,
        chairId: cabina1.id,
        startsAt,
        endsAt,
        status: done ? "COMPLETED" : "CONFIRMED",
        paymentStatus: done ? "PAID" : "UNPAID",
        paymentMethod: done ? "CASH" : null,
        priceCents: comboFull.priceCents,
        planId: plan.id,
        sessionNumber: i + 1,
      },
    });
    if (done) {
      await prisma.clinicalNote.create({
        data: {
          patientId: valentina.id,
          appointmentId: appt.id,
          content: `Sesión ${i + 1} de combo completada. Reducción visible del vello.`,
          nextSteps: "Continuar con el plan; próxima sesión en 30 días.",
        },
      });
      await prisma.payment.create({
        data: {
          appointmentId: appt.id,
          planId: plan.id,
          patientId: valentina.id,
          amountCents: comboFull.priceCents,
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
      body: "Hola {{paciente}} 👋 Tu turno en {{centro}} quedó confirmado.\n\n✨ {{tratamiento}}\n📅 {{fecha}} a las {{hora}} hs\n💁‍♀️ {{odontologo}}\n📍 {{direccion}}\n\nSi necesitás reprogramar, respondé este mensaje o llamanos. ¡Te esperamos!",
    },
    {
      key: "reminder_24h",
      name: "Recordatorio 24 hs antes",
      body: "Hola {{paciente}}, te recordamos tu turno de mañana en {{centro}}.\n\n✨ {{tratamiento}}\n📅 {{fecha}} a las {{hora}} hs\n💁‍♀️ {{odontologo}}\n\n{{preparacion}}\n\nSi no podés asistir, avisanos así ofrecemos el horario a otra persona. ¡Gracias!",
    },
    {
      key: "reminder_2h",
      name: "Recordatorio 2 hs antes",
      body: "Hola {{paciente}}, ¡te esperamos hoy a las {{hora}} hs en {{centro}}! 📍 {{direccion}}. Si estás demorado/a, avisanos.",
    },
    {
      key: "post_care",
      name: "Cuidados post-sesión",
      body: "Hola {{paciente}}, gracias por tu visita de hoy. Cuidados para tu piel después de la sesión:\n\n{{cuidados}}\n\nAnte cualquier duda o reacción inusual, escribinos 💖",
    },
    {
      key: "recall_6m",
      name: "Recordatorio de próxima sesión",
      body: "Hola {{paciente}} 👋 Ya pasó un tiempo desde tu última sesión en {{centro}}. Para mantener los resultados de tu depilación definitiva te recomendamos agendar la próxima. Podés reservar online acá: {{link}}",
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
      name: "Cancelación por parte del centro",
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
