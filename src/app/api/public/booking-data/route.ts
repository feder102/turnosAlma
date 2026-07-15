import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SPECIALTY_LABELS, type Specialty } from "@/lib/domain";

export const dynamic = "force-dynamic";

// Datos que necesita el wizard público: tratamientos, profesionales y centro.
export async function GET() {
  const [clinic, treatments, dentists] = await Promise.all([
    prisma.clinic.findFirst(),
    prisma.treatment.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        durationMin: true,
        priceCents: true,
        insurancePriceCents: true,
        multiSession: true,
        defaultSessions: true,
        sessionIntervalDays: true,
      },
    }),
    prisma.dentist.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, specialty: true },
    }),
  ]);

  return NextResponse.json({
    clinic: clinic
      ? { name: clinic.name, address: clinic.address, timezone: clinic.timezone }
      : null,
    treatments,
    dentists: dentists.map((d) => ({
      ...d,
      specialtyLabel: SPECIALTY_LABELS[d.specialty as Specialty] ?? d.specialty,
    })),
  });
}
