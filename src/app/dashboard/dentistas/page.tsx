import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { SPECIALTY_LABELS, type Specialty } from "@/lib/domain";
import { formatShortDate } from "@/lib/format";
import { PageTitle } from "../ui";
import { DentistRowActions } from "./row-actions";

export const metadata = { title: "Profesionales — Centro" };
export const dynamic = "force-dynamic";

// ABM de profesionales: solo el administrador.
export default async function DentistasPage() {
  await requireUser(["ADMIN"]);

  const dentists = await prisma.dentist.findMany({
    orderBy: [{ active: "desc" }, { lastName: "asc" }, { name: "asc" }],
    include: {
      chairs: { select: { id: true, name: true }, orderBy: { name: "asc" } },
      _count: { select: { appointments: true } },
    },
  });

  return (
    <div>
      <PageTitle
        title="Profesionales"
        action={
          <Link
            href="/dashboard/dentistas/nuevo"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            + Nuevo profesional
          </Link>
        }
      />

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-500">
              <th className="px-4 py-3">Profesional</th>
              <th className="px-4 py-3">Especialidad</th>
              <th className="px-4 py-3">Matrícula</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Ingreso</th>
              <th className="px-4 py-3">Turnos</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {dentists.map((d) => (
              <tr key={d.id} className={`hover:bg-neutral-50 ${d.active ? "" : "opacity-60"}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      photoUrl={d.photoUrl}
                      firstName={d.firstName}
                      lastName={d.lastName}
                      color={d.color}
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/dentistas/${d.id}/editar`}
                        className="font-medium hover:underline"
                      >
                        {d.name}
                      </Link>
                      {!d.active && (
                        <span className="ml-2 rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
                          Baja
                        </span>
                      )}
                      {d.chairs.length > 0 && (
                        <p className="text-xs text-neutral-400">
                          {d.chairs
                            .map((c) => (c.id === d.defaultChairId ? `${c.name} ★` : c.name))
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: `${d.color}22`, color: d.color }}
                  >
                    {SPECIALTY_LABELS[d.specialty as Specialty] ?? d.specialty}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {d.license || <span className="text-neutral-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  {d.phone && <div>{d.phone}</div>}
                  {d.email && <div className="text-xs text-neutral-400">{d.email}</div>}
                  {!d.phone && !d.email && <span className="text-neutral-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  {d.hiredAt ? (
                    formatShortDate(d.hiredAt)
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">{d._count.appointments}</td>
                <td className="px-4 py-3">
                  <DentistRowActions id={d.id} name={d.name} active={d.active} />
                </td>
              </tr>
            ))}
            {dentists.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                  Todavía no hay profesionales cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Avatar({
  photoUrl,
  firstName,
  lastName,
  color,
}: {
  photoUrl: string | null;
  firstName: string;
  lastName: string;
  color: string;
}) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={`${firstName} ${lastName}`}
        className="h-10 w-10 shrink-0 rounded-full border border-neutral-200 object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
      style={{ borderColor: color, color }}
    >
      {initials || "✨"}
    </div>
  );
}
