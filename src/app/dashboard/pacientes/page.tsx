import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { togglePatient } from "../actions";
import { PageTitle } from "../ui";

export const metadata = { title: "Pacientes — Consultorio" };
export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; estado?: string }>;
}) {
  const session = await requireUser();
  const { q = "", page: pageStr = "", estado = "activos" } = await searchParams;
  const canManage = session.role === "ADMIN" || session.role === "RECEPTION";

  const page = Math.max(1, Number(pageStr) || 1);
  const skip = (page - 1) * PER_PAGE;

  // El odontólogo ve solo pacientes que atendió
  const dentistFilter =
    session.role === "DENTIST" && session.dentistId
      ? { appointments: { some: { dentistId: session.dentistId } } }
      : {};

  // Filtro de estado (solo admin/recepción pueden ver bajas)
  const activeFilter =
    !canManage || estado === "activos"
      ? { active: true }
      : estado === "inactivos"
        ? { active: false }
        : {};

  const where = {
    ...dentistFilter,
    ...activeFilter,
    ...(q
      ? {
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { phone: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {}),
  };

  const [patients, total] = await prisma.$transaction([
    prisma.patient.findMany({
      where,
      orderBy: { lastName: "asc" },
      skip,
      take: PER_PAGE,
      include: {
        _count: { select: { appointments: true } },
        plans: { where: { status: "ACTIVE" } },
      },
    }),
    prisma.patient.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const colSpan = canManage ? 6 : 5;

  const buildQuery = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (canManage && estado !== "activos") params.set("estado", estado);
    for (const [k, v] of Object.entries(overrides)) {
      if (v === "" || v === "activos") params.delete(k);
      else params.set(k, String(v));
    }
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  const filters = [
    { key: "activos", label: "Activos" },
    { key: "inactivos", label: "Bajas" },
    { key: "todos", label: "Todos" },
  ];

  return (
    <div>
      <PageTitle
        title="Pacientes"
        action={
          canManage ? (
            <Link
              href="/dashboard/pacientes/nuevo"
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              + Nuevo paciente
            </Link>
          ) : undefined
        }
      />

      <form className="mb-4 flex flex-wrap items-center gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, teléfono o email…"
          className="w-full max-w-md rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm"
        />
        {canManage && estado !== "activos" && <input type="hidden" name="estado" value={estado} />}
      </form>

      {canManage && (
        <div className="mb-4 flex gap-1 text-sm">
          {filters.map((f) => (
            <Link
              key={f.key}
              href={`/dashboard/pacientes${buildQuery({ estado: f.key, page: "" })}`}
              className={`rounded-full px-4 py-1.5 font-medium transition ${
                estado === f.key
                  ? "bg-sky-600 text-white"
                  : "border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-500">
              <th className="px-4 py-3">Paciente</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Obra social</th>
              <th className="px-4 py-3">Turnos</th>
              <th className="px-4 py-3">Plan activo</th>
              {canManage && <th className="px-4 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {patients.map((p) => (
              <tr key={p.id} className={`hover:bg-neutral-50 ${p.active ? "" : "opacity-60"}`}>
                <td className="px-4 py-3 font-medium">
                  <Link href={`/dashboard/pacientes/${p.id}`} className="hover:underline">
                    {p.lastName}, {p.firstName}
                  </Link>
                  {!p.active && (
                    <span className="ml-2 rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
                      Baja
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{p.phone}</td>
                <td className="px-4 py-3">
                  {p.insuranceProvider ?? <span className="text-neutral-400">Particular</span>}
                </td>
                <td className="px-4 py-3">{p._count.appointments}</td>
                <td className="px-4 py-3">
                  {p.plans.length > 0 ? (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                      Sí
                    </span>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
                {canManage && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/dashboard/pacientes/${p.id}/editar`}
                        className="text-sky-600 hover:underline"
                      >
                        Editar
                      </Link>
                      <form action={togglePatient.bind(null, p.id, !p.active)}>
                        <button
                          className={p.active ? "text-red-600 hover:underline" : "text-emerald-600 hover:underline"}
                        >
                          {p.active ? "Dar de baja" : "Reactivar"}
                        </button>
                      </form>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {patients.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="px-4 py-8 text-center text-neutral-500">
                  No se encontraron pacientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
          <span>
            {total} paciente{total === 1 ? "" : "s"} · Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={`/dashboard/pacientes${buildQuery({ page: page - 1 })}`}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 font-medium text-neutral-700 hover:bg-neutral-100"
              >
                ← Anterior
              </Link>
            ) : (
              <span className="rounded-lg border border-neutral-200 px-3 py-1.5 text-neutral-300">← Anterior</span>
            )}
            {page < totalPages ? (
              <Link
                href={`/dashboard/pacientes${buildQuery({ page: page + 1 })}`}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Siguiente →
              </Link>
            ) : (
              <span className="rounded-lg border border-neutral-200 px-3 py-1.5 text-neutral-300">Siguiente →</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
