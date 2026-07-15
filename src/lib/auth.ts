import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { Role } from "./domain";

const COOKIE_NAME = "turnero_session";
const SESSION_HOURS = 12;

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET no está configurado");
    }
    return new TextEncoder().encode("dev-secret-no-usar-en-produccion");
  }
  return new TextEncoder().encode(secret);
}

export type Session = {
  userId: string;
  name: string;
  role: Role;
  dentistId: string | null;
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(session: Session): Promise<void> {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secretKey());
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_HOURS * 3600,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      userId: payload.userId as string,
      name: payload.name as string,
      role: payload.role as Role,
      dentistId: (payload.dentistId as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

// Para páginas y acciones del dashboard. Redirige a /login si no hay sesión
// y a /dashboard si el rol no alcanza.
export async function requireUser(roles?: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (roles && !roles.includes(session.role)) redirect("/dashboard");
  return session;
}

// Recepción y admin gestionan turnos/cobros; el profesional solo ve lo suyo.
export function canManageBookings(role: Role): boolean {
  return role === "ADMIN" || role === "RECEPTION";
}
