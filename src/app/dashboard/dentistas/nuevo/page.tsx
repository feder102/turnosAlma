import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PageTitle } from "../../ui";
import { DentistForm } from "../DentistForm";

export const metadata = { title: "Nuevo profesional — Centro" };
export const dynamic = "force-dynamic";

export default async function NuevoDentistaPage() {
  await requireUser(["ADMIN"]);
  const chairs = await prisma.chair.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageTitle title="Nuevo profesional" />
      <DentistForm chairs={chairs} />
    </div>
  );
}
