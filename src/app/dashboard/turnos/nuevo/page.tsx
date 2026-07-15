import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageTitle } from "../../ui";
import { NewAppointmentForm } from "./client";

export const metadata = { title: "Nuevo turno — Centro" };
export const dynamic = "force-dynamic";

export default async function NuevoTurnoPage() {
  await requireUser(["ADMIN", "RECEPTION"]);
  const [patients, dentists, treatments, chairs] = await Promise.all([
    prisma.patient.findMany({
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true, phone: true },
    }),
    prisma.dentist.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: { chairs: { select: { id: true } } },
    }),
    prisma.treatment.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.chair.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl">
      <PageTitle title="Nuevo turno" />
      <NewAppointmentForm
        patients={patients}
        dentists={dentists.map((d) => ({
          id: d.id,
          name: d.name,
          defaultChairId: d.defaultChairId,
          chairIds: d.chairs.map((c) => c.id),
        }))}
        treatments={treatments.map((t) => ({ id: t.id, name: t.name, durationMin: t.durationMin }))}
        chairs={chairs.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
