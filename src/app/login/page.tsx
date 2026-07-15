import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, getSession, verifyPassword } from "@/lib/auth";
import type { Role } from "@/lib/domain";

export const metadata = { title: "Ingresar — Alma San Juan" };

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=1");
  }
  await createSession({
    userId: user.id,
    name: user.name,
    role: user.role as Role,
    dentistId: user.dentistId,
  });
  redirect("/dashboard");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getSession()) redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <div className="mb-2 text-5xl">✨</div>
        <h1 className="text-2xl font-bold">Acceso al centro</h1>
        <p className="mt-1 text-sm text-neutral-500">Profesionales y recepción</p>
      </div>
      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Email o contraseña incorrectos.
        </p>
      )}
      <form action={login} className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="rounded-lg border border-neutral-300 bg-white px-4 py-3"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Contraseña"
          className="rounded-lg border border-neutral-300 bg-white px-4 py-3"
        />
        <button
          type="submit"
          className="mt-2 rounded-lg bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700"
        >
          Ingresar
        </button>
      </form>
    </main>
  );
}
