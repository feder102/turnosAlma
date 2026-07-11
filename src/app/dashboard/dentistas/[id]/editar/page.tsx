import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageTitle } from "../../../ui";
import { DentistForm } from "../../DentistForm";
import { DentistAccessForm } from "../../DentistAccessForm";

export const metadata = { title: "Editar odontólogo — Consultorio" };
export const dynamic = "force-dynamic";

export default async function EditarDentistaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser(["ADMIN"]);
  const { id } = await params;

  const [dentist, chairs] = await Promise.all([
    prisma.dentist.findUnique({
      where: { id },
      include: {
        chairs: { select: { id: true } },
        user: { select: { email: true } },
      },
    }),
    prisma.chair.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!dentist) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={`Editar — ${dentist.name}`} />
      <DentistForm
        chairs={chairs}
        dentist={{
          id: dentist.id,
          title: dentist.title,
          firstName: dentist.firstName,
          lastName: dentist.lastName,
          specialty: dentist.specialty,
          color: dentist.color,
          phone: dentist.phone,
          email: dentist.email,
          license: dentist.license,
          hiredAt: dentist.hiredAt,
          photoUrl: dentist.photoUrl,
          defaultChairId: dentist.defaultChairId,
          chairIds: dentist.chairs.map((c) => c.id),
        }}
      />
      <DentistAccessForm
        dentistId={dentist.id}
        hasAccount={dentist.user !== null}
        loginEmail={dentist.user?.email ?? null}
        contactEmail={dentist.email}
      />
    </div>
  );
}
