import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Alma San Juan — Depilación Definitiva Láser | Centro Oficial Soprano ICE",
  description:
    "Único centro oficial Soprano ICE en San Juan. Depilación definitiva láser para mujer y hombre. Reservá tu turno online.",
};

// Información tomada de instagram.com/almasopranoicesj
const CLINIC = {
  name: "Alma San Juan",
  tagline: "Centro Oficial Soprano ICE",
  address: "Paula Albarracín de Sarmiento 1085 (Sur), Capital, San Juan",
  phone: "264 419-1588",
  whatsapp: "https://wa.me/542644191588",
  instagram: "https://www.instagram.com/almasopranoicesj/",
  instagramHandle: "@almasopranoicesj",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Paula+Albarrac%C3%ADn+de+Sarmiento+1085+Sur%2C+San+Juan%2C+Argentina",
};

const SERVICES = [
  {
    icon: "🦵",
    title: "Piernas completas",
    description:
      "El tratamiento más elegido: piernas enteras con tecnología Soprano ICE, prácticamente indoloro y apto todo el año.",
  },
  {
    icon: "✨",
    title: "Cavado, axilas y tira de cola",
    description:
      "Las zonas más sensibles tratadas con el sistema ICE de frío continuo, para una experiencia cómoda y segura.",
  },
  {
    icon: "💆‍♀️",
    title: "Rostro y bozo",
    description:
      "Depilación facial delicada y precisa, ideal para bozo, mentón y rostro completo.",
  },
  {
    icon: "💪",
    title: "Depilación masculina",
    description:
      "Espalda, tórax, piernas y más. Planes pensados para el vello masculino, más grueso y resistente.",
  },
];

const BENEFITS = [
  {
    icon: "❄️",
    title: "Tecnología ICE",
    description:
      "Frío continuo en la piel durante todo el disparo: un tratamiento prácticamente indoloro.",
  },
  {
    icon: "🏅",
    title: "Centro oficial",
    description:
      "Somos el único centro oficial Soprano ICE en San Juan. Equipamiento original de Alma Lasers.",
  },
  {
    icon: "🌞",
    title: "Todo el año",
    description:
      "Apto para todo tipo de piel, incluso piel bronceada. Podés tratarte los 365 días del año.",
  },
  {
    icon: "📈",
    title: "Resultados reales",
    description:
      "Reducción progresiva y definitiva del vello, sesión a sesión, con seguimiento profesional.",
  },
];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.668-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function LoginIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-100 to-fuchsia-100 text-lg font-bold text-fuchsia-700">
              A
            </span>
            <span className="truncate text-base font-bold leading-tight tracking-tight sm:text-lg">
              Alma <span className="font-normal text-neutral-500">San Juan</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-600 lg:flex">
            <a href="#servicios" className="transition hover:text-neutral-900">
              Zonas
            </a>
            <a href="#soprano" className="transition hover:text-neutral-900">
              Soprano ICE
            </a>
            <a href="#contacto" className="transition hover:text-neutral-900">
              Contacto
            </a>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/login"
              aria-label="Acceso profesionales"
              title="Acceso profesionales"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 transition hover:bg-neutral-100 sm:hidden"
            >
              <LoginIcon className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="hidden rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 sm:inline-block"
            >
              Acceso profesionales
            </Link>
            <Link
              href="/reservar"
              className="whitespace-nowrap rounded-full bg-fuchsia-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-fuchsia-500 sm:px-5"
            >
              Turnos online
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-rose-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div className="text-center md:text-left">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-fuchsia-600">
              {CLINIC.tagline}
            </p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Tu piel merece la{" "}
              <span className="text-fuchsia-600">mejor tecnología</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-600 md:mx-0">
              Depilación definitiva láser con Soprano ICE, el equipo líder en el
              mundo. No pierdas tiempo llamando: autogestioná tu turno, 24/7, en
              pocos clics.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row md:items-start">
              <Link
                href="/reservar"
                className="w-full rounded-full bg-fuchsia-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-fuchsia-600/30 transition hover:bg-fuchsia-500 sm:w-auto"
              >
                ¡Quiero mi turno!
              </Link>
              <a
                href={CLINIC.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-500 px-8 py-4 text-lg font-semibold text-emerald-600 transition hover:bg-emerald-50 sm:w-auto"
              >
                <WhatsAppIcon className="h-5 w-5" />
                WhatsApp
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-rose-100 via-fuchsia-50 to-violet-100 shadow-xl ring-1 ring-neutral-200">
              <div className="px-10 text-center">
                <p className="text-7xl">✨</p>
                <p className="mt-6 text-2xl font-bold text-fuchsia-900">
                  Resultados reales.
                </p>
                <p className="text-2xl font-semibold text-fuchsia-700">
                  Tecnología original.
                </p>
                <p className="mt-4 text-sm uppercase tracking-widest text-fuchsia-500">
                  Soprano ICE · Alma Lasers
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Destacados */}
      <section className="border-y border-neutral-100 bg-neutral-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 text-center sm:grid-cols-3">
          <div>
            <p className="font-semibold">Prácticamente indoloro</p>
            <p className="mt-1 text-sm text-neutral-500">
              Sistema ICE de frío continuo en la piel
            </p>
          </div>
          <div>
            <p className="font-semibold">Turnos online 24/7</p>
            <p className="mt-1 text-sm text-neutral-500">
              Reservá desde la compu o el celu, sin esperas
            </p>
          </div>
          <div>
            <p className="font-semibold">Atención personalizada</p>
            <p className="mt-1 text-sm text-neutral-500">
              Consultas por WhatsApp al {CLINIC.phone}
            </p>
          </div>
        </div>
      </section>

      {/* Zonas / Servicios */}
      <section id="servicios" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          ¿Qué zonas tratamos?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-neutral-600">
          Depilación definitiva para mujer y hombre, con planes por zona o
          combos de cuerpo completo.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {SERVICES.map((service) => (
            <div
              key={service.title}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-fuchsia-200 hover:shadow-md"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-2xl">
                {service.icon}
              </div>
              <h3 className="text-lg font-semibold">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Soprano ICE */}
      <section id="soprano" className="scroll-mt-20 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            ¿Por qué Soprano ICE?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-neutral-600">
            Cada vez que te depilás con cera, el folículo resiste. Con láser, no
            tiene chance.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm"
              >
                <p className="text-3xl">{benefit.icon}</p>
                <h3 className="mt-3 font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/reservar"
              className="inline-block rounded-full bg-fuchsia-600 px-6 py-3 font-bold text-white transition hover:bg-fuchsia-500"
            >
              Empezá tu tratamiento
            </Link>
          </div>
        </div>
      </section>

      {/* Sede / Contacto */}
      <section id="contacto" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <div className="grid items-stretch gap-10 md:grid-cols-2">
          <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-violet-100 via-fuchsia-50 to-rose-100 shadow-lg ring-1 ring-neutral-200 md:aspect-auto">
            <div className="px-10 text-center">
              <p className="text-6xl">📍</p>
              <p className="mt-4 text-xl font-bold text-fuchsia-900">
                Paula Albarracín de Sarmiento 1085 (Sur)
              </p>
              <p className="text-lg text-fuchsia-700">Capital · San Juan</p>
              <p className="mt-3 text-sm text-fuchsia-500">
                Lunes a sábado · 7:30 a 22:00 hs
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-bold tracking-tight">¿Dónde estamos?</h2>
            <ul className="mt-6 space-y-4 text-neutral-700">
              <li className="flex items-start gap-3">
                <span aria-hidden>📍</span>
                <a
                  href={CLINIC.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-4 transition hover:text-fuchsia-600 hover:underline"
                >
                  {CLINIC.address}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span aria-hidden>📲</span>
                <a
                  href={CLINIC.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-4 transition hover:text-fuchsia-600 hover:underline"
                >
                  Turnos y consultas: {CLINIC.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span aria-hidden>📷</span>
                <a
                  href={CLINIC.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-4 transition hover:text-fuchsia-600 hover:underline"
                >
                  {CLINIC.instagramHandle}
                </a>
              </li>
            </ul>
            <div className="mt-8 rounded-3xl bg-neutral-900 p-8 text-center text-white sm:text-left">
              <h3 className="text-2xl font-bold">¡No esperes más!</h3>
              <p className="mt-2 text-neutral-300">
                Reservá tu turno online y empezá tu depilación definitiva.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/reservar"
                  className="rounded-full bg-fuchsia-600 px-6 py-3 text-center font-bold text-white transition hover:bg-fuchsia-500"
                >
                  Reservar un turno
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-neutral-600 px-6 py-3 text-center font-medium text-neutral-200 transition hover:bg-neutral-800"
                >
                  Acceso profesionales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-neutral-500 sm:flex-row">
          <p>
            {CLINIC.name} · {CLINIC.tagline} · {CLINIC.address}
          </p>
          <Link href="/login" className="transition hover:text-fuchsia-600">
            Acceso al centro
          </Link>
        </div>
      </footer>

      {/* WhatsApp flotante */}
      <a
        href={CLINIC.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Consultar por WhatsApp"
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:bg-emerald-600"
      >
        <WhatsAppIcon className="h-7 w-7" />
      </a>
    </main>
  );
}
