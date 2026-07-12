import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/domain";
import { logout } from "./actions";

const NAV = [
  { href: "/dashboard", label: "Inicio", icon: "🏠", roles: ["ADMIN", "RECEPTION", "DENTIST"] },
  { href: "/dashboard/agenda", label: "Agenda", icon: "📅", roles: ["ADMIN", "RECEPTION", "DENTIST"] },
  { href: "/dashboard/turnos", label: "Turnos", icon: "🗓️", roles: ["ADMIN", "RECEPTION", "DENTIST"] },
  { href: "/dashboard/sillones", label: "Sillones", icon: "🪑", roles: ["ADMIN", "RECEPTION"] },
  { href: "/dashboard/dentistas", label: "Odontólogos", icon: "👩‍⚕️", roles: ["ADMIN"] },
  { href: "/dashboard/ausencias", label: "Ausencias", icon: "🌴", roles: ["ADMIN", "DENTIST"] },
  { href: "/dashboard/pacientes", label: "Pacientes", icon: "🧑‍🤝‍🧑", roles: ["ADMIN", "RECEPTION", "DENTIST"] },
  { href: "/dashboard/tratamientos", label: "Tratamientos", icon: "🦷", roles: ["ADMIN"] },
  { href: "/dashboard/pagos", label: "Pagos", icon: "💳", roles: ["ADMIN", "RECEPTION"] },
  { href: "/dashboard/mensajes", label: "Mensajes", icon: "💬", roles: ["ADMIN", "RECEPTION"] },
  { href: "/dashboard/reportes", label: "Reportes", icon: "📊", roles: ["ADMIN"] },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  const nav = NAV.filter((n) => n.roles.includes(session.role));

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 flex-col border-r border-neutral-200 bg-white md:flex">
        <div className="border-b border-neutral-200 px-4 py-4">
          <p className="font-bold">🦷 Sonrisa</p>
          <p className="mt-0.5 truncate text-sm text-neutral-500">{session.name}</p>
          <p className="text-xs text-neutral-400">{ROLE_LABELS[session.role]}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              <span className="mr-2">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="border-t border-neutral-200 p-2">
          <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-500 transition hover:bg-neutral-100">
            ↪ Cerrar sesión
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Nav mobile */}
        <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-2 py-2 md:hidden">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              {n.icon} {n.label}
            </Link>
          ))}
          <form action={logout} className="shrink-0">
            <button className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100">
              ↪ Salir
            </button>
          </form>
        </div>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
