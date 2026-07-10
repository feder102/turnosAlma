import { requireUser } from "@/lib/auth";
import { PageTitle } from "../../ui";
import { PatientForm } from "../PatientForm";

export const metadata = { title: "Nuevo paciente — Consultorio" };
export const dynamic = "force-dynamic";

export default async function NuevoPacientePage() {
  await requireUser(["ADMIN", "RECEPTION"]);
  return (
    <div>
      <PageTitle title="Nuevo paciente" />
      <PatientForm />
    </div>
  );
}
