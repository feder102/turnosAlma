import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageTitle } from "../../../ui";
import { PatientForm } from "../../PatientForm";

export const metadata = { title: "Editar paciente — Consultorio" };
export const dynamic = "force-dynamic";

export default async function EditarPacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser(["ADMIN", "RECEPTION"]);
  const { id } = await params;

  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) notFound();

  return (
    <div>
      <PageTitle title={`Editar: ${patient.lastName}, ${patient.firstName}`} />
      <PatientForm
        patient={{
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          phone: patient.phone,
          email: patient.email,
          birthDate: patient.birthDate,
          insuranceProvider: patient.insuranceProvider,
          insuranceNumber: patient.insuranceNumber,
          medicalNotes: patient.medicalNotes,
        }}
      />
    </div>
  );
}
