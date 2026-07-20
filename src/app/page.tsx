import type { Metadata } from "next";
import Link from "next/link";
import { Blobs } from "@/components/clay/Blobs";
import { ButtonLink } from "@/components/clay/Button";
import { Card } from "@/components/clay/Card";
import { Asterisk, Logo } from "@/components/clay/Logo";
import { Figure, IconOrb, ReelCard } from "@/components/clay/Media";
import { cn } from "@/lib/cn";

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

// Marca real de Alma San Juan (public/brand, public/media).
const MEDIA = {
  logo: "/brand/alma-mark.png",
  hero: "/media/soprano-vs-cera.jpg",
  sede: undefined as string | undefined, // sin foto de fachada todavía
};

const REELS = [
  {
    src: "/media/reel-pelo-blanco.mp4",
    caption: "¿Sabías que el láser no elimina el pelo blanco? Te contamos por qué.",
  },
  {
    src: "/media/reel-rutina-depilacion.mp4",
    caption:
      "El vello no desaparece solo… con depilación definitiva te despedís de esa rutina.",
  },
];

const SERVICES = [
  {
    icon: "🦵",
    title: "Piernas completas",
    description:
      "El tratamiento más elegido: piernas enteras con tecnología Soprano ICE, prácticamente indoloro y apto todo el año.",
    gradient: "from-purple-400 to-purple-600",
    image: undefined as string | undefined, // "/img/zona-piernas.jpg"
  },
  {
    icon: "✨",
    title: "Cavado, axilas y tira de cola",
    description:
      "Las zonas más sensibles tratadas con el sistema ICE de frío continuo, para una experiencia cómoda y segura.",
    gradient: "from-pink-400 to-pink-600",
    image: undefined as string | undefined, // "/img/zona-cavado.jpg"
  },
  {
    icon: "💆‍♀️",
    title: "Rostro y bozo",
    description:
      "Depilación facial delicada y precisa, ideal para bozo, mentón y rostro completo.",
    gradient: "from-sky-400 to-sky-600",
    image: undefined as string | undefined, // "/img/zona-rostro.jpg"
  },
  {
    icon: "💪",
    title: "Depilación masculina",
    description:
      "Espalda, tórax, piernas y más. Planes pensados para el vello masculino, más grueso y resistente.",
    gradient: "from-amber-400 to-amber-600",
    image: undefined as string | undefined, // "/img/zona-hombre.jpg"
  },
];

const BENEFITS = [
  {
    icon: "❄️",
    title: "Tecnología ICE",
    description:
      "Frío continuo en la piel durante todo el disparo: un tratamiento prácticamente indoloro.",
    gradient: "from-cyan-400 to-cyan-600",
  },
  {
    icon: "🏅",
    title: "Centro oficial",
    description:
      "Somos el único centro oficial Soprano ICE en San Juan. Equipamiento original de Alma Lasers.",
    gradient: "from-violet-400 to-violet-600",
  },
  {
    icon: "🌞",
    title: "Todo el año",
    description:
      "Apto para todo tipo de piel, incluso piel bronceada. Podés tratarte los 365 días del año.",
    gradient: "from-amber-400 to-amber-600",
  },
  {
    icon: "📈",
    title: "Resultados reales",
    description:
      "Reducción progresiva y definitiva del vello, sesión a sesión, con seguimiento profesional.",
    gradient: "from-emerald-400 to-emerald-600",
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
    <main className="min-h-screen">
      <Blobs />

      {/* Header */}
      <header className="sticky top-4 z-20 mx-4 sm:mx-6">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 rounded-[32px] bg-white/70 px-4 shadow-clay-card backdrop-blur-xl sm:h-20 sm:gap-4 sm:rounded-[40px] sm:px-8">
          <Link href="/" aria-label="Alma San Juan — inicio" className="min-w-0">
            <Logo src={MEDIA.logo} />
          </Link>
          <nav
            className="hidden items-center gap-7 text-sm font-bold text-clay-muted lg:flex"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <a href="#servicios" className="transition hover:text-clay-accent">
              Zonas
            </a>
            <a href="#soprano" className="transition hover:text-clay-accent">
              Soprano ICE
            </a>
            <a href="#contacto" className="transition hover:text-clay-accent">
              Contacto
            </a>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/login"
              aria-label="Acceso profesionales"
              title="Acceso profesionales"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-clay-muted shadow-clay-button transition-all duration-200 hover:-translate-y-1 hover:text-clay-accent active:scale-[0.92] active:shadow-clay-pressed sm:hidden"
            >
              <LoginIcon className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="hidden rounded-[20px] bg-white px-5 py-3 text-sm font-bold text-clay-muted shadow-clay-button transition-all duration-200 hover:-translate-y-1 hover:text-clay-accent active:scale-[0.92] active:shadow-clay-pressed sm:inline-block"
            >
              Acceso profesionales
            </Link>
            <ButtonLink href="/reservar" size="sm" className="whitespace-nowrap">
              Turnos online
            </ButtonLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div className="text-center md:text-left">
            <span
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/70 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-clay-accent shadow-clay-card backdrop-blur-xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <Asterisk className="h-4 w-4" />
              {CLINIC.tagline}
            </span>
            <h1
              className="clay-text-gradient max-w-2xl text-5xl font-black leading-[1.1] tracking-tight sm:text-6xl md:text-7xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Tu piel merece la mejor tecnología
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-relaxed text-clay-muted md:mx-0">
              Depilación definitiva láser con Soprano ICE, el equipo líder en el
              mundo. No pierdas tiempo llamando: autogestioná tu turno, 24/7, en
              pocos clics.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row md:items-start">
              <ButtonLink href="/reservar" size="lg" className="w-full sm:w-auto">
                ¡Agendá tu turno ahora!
              </ButtonLink>
              <ButtonLink
                href={CLINIC.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                WhatsApp
              </ButtonLink>
            </div>
          </div>
          <div className="relative">
            {/* Formas clay que orbitan la foto, rompiendo el contenedor */}
            <div className="animate-clay-float-slow absolute -left-6 -top-6 z-10 hidden h-24 w-24 rounded-[32px] bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] shadow-clay-button lg:block" />
            <div className="animate-clay-float-delayed absolute -bottom-8 -right-6 z-10 hidden h-28 w-28 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 shadow-clay-button lg:block" />
            <Figure
              src={MEDIA.hero}
              alt="Cada vez que te depilás con cera, el folículo resiste. Con láser, no tiene chance — aplicación de Soprano ICE en Alma San Juan"
              className="animate-clay-breathe aspect-[3/4]"
            >
              <div className="px-10 text-center">
                <Asterisk className="mx-auto h-16 w-16 text-clay-accent/70" />
                <p
                  className="mt-8 text-3xl font-black leading-tight text-clay-accent"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Resultados reales.
                  <br />
                  Tecnología original.
                </p>
                <p className="mt-5 text-xs font-bold uppercase tracking-widest text-clay-muted">
                  Soprano ICE · Alma Lasers
                </p>
              </div>
            </Figure>
          </div>
        </div>
      </section>

      {/* Destacados */}
      <section className="px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Card
            className="rounded-[48px] p-8 sm:p-12"
            contentClassName="grid gap-10 text-center sm:grid-cols-3"
          >
            <div className="group">
              <div className="animate-clay-breathe mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-3xl shadow-clay-button transition-transform duration-300 group-hover:scale-110">
                ❄️
              </div>
              <p className="font-extrabold" style={{ fontFamily: "var(--font-heading)" }}>
                Prácticamente indoloro
              </p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-clay-muted">
                Sistema ICE de frío continuo en la piel
              </p>
            </div>
            <div className="group">
              <div className="animate-clay-breathe animation-delay-2000 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-600 text-3xl shadow-clay-button transition-transform duration-300 group-hover:scale-110">
                📅
              </div>
              <p className="font-extrabold" style={{ fontFamily: "var(--font-heading)" }}>
                Turnos online 24/7
              </p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-clay-muted">
                Reservá desde la compu o el celu, sin esperas
              </p>
            </div>
            <div className="group">
              <div className="animate-clay-breathe animation-delay-4000 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-3xl shadow-clay-button transition-transform duration-300 group-hover:scale-110">
                💬
              </div>
              <p className="font-extrabold" style={{ fontFamily: "var(--font-heading)" }}>
                Atención personalizada
              </p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-clay-muted">
                Consultas por WhatsApp al {CLINIC.phone}
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Zonas / Servicios */}
      <section id="servicios" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-20 sm:px-6">
        <h2
          className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          ¿Qué zonas tratamos?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-lg font-medium leading-relaxed text-clay-muted">
          Depilación definitiva para mujer y hombre, con planes por zona o
          combos de cuerpo completo.
        </p>
        {/* Bento: la primera zona ocupa 2×2, el resto se acomoda alrededor */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {SERVICES.map((service, i) => {
            const hero = i === 0;
            const wide = i === 3;
            return (
              <Card
                key={service.title}
                hoverLift
                className={cn(
                  hero && "md:col-span-2 md:row-span-2 md:p-10 md:hover:scale-[1.02]",
                  wide && "md:col-span-3"
                )}
                contentClassName={wide ? "sm:flex-row sm:items-center sm:gap-6" : undefined}
              >
                <IconOrb
                  emoji={service.icon}
                  src={service.image}
                  gradient={service.gradient}
                  className={cn("mb-4", hero && "h-20 w-20 text-4xl", wide && "sm:mb-0")}
                />
                <div>
                  <h3
                    className={cn("font-extrabold", hero ? "text-3xl" : "text-xl")}
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {service.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-2 font-medium leading-relaxed text-clay-muted",
                      hero ? "max-w-md text-lg" : "text-sm"
                    )}
                  >
                    {service.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Reels / Instagram */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2
          className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Mirá cómo trabajamos
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-lg font-medium leading-relaxed text-clay-muted">
          Contenido real de nuestro centro, directo desde{" "}
          <a
            href={CLINIC.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-clay-accent underline-offset-4 hover:underline"
          >
            {CLINIC.instagramHandle}
          </a>
          .
        </p>
        <div className="mx-auto mt-12 grid max-w-2xl gap-6 sm:grid-cols-2">
          {REELS.map((reel) => (
            <ReelCard key={reel.src} src={reel.src} caption={reel.caption} />
          ))}
        </div>
      </section>

      {/* Soprano ICE */}
      <section id="soprano" className="scroll-mt-28 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl py-20">
          <h2
            className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            ¿Por qué Soprano ICE?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-lg font-medium leading-relaxed text-clay-muted">
            Cada vez que te depilás con cera, el folículo resiste. Con láser, no
            tiene chance.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit) => (
              <Card key={benefit.title} hoverLift className="group text-center">
                <IconOrb
                  emoji={benefit.icon}
                  gradient={benefit.gradient}
                  className="mx-auto mb-4 h-20 w-20 rounded-full text-3xl group-hover:scale-110"
                />
                <h3 className="font-extrabold" style={{ fontFamily: "var(--font-heading)" }}>
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-clay-muted">
                  {benefit.description}
                </p>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <ButtonLink href="/reservar" size="lg">
              Empezá tu tratamiento
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Sede / Contacto */}
      <section id="contacto" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-20 sm:px-6">
        <div className="grid items-stretch gap-10 md:grid-cols-2">
          <Figure
            src={MEDIA.sede}
            alt="Fachada del centro Alma San Juan"
            className="animate-clay-float-delayed aspect-[4/3] md:aspect-auto"
          >
            <div className="px-10 text-center">
              <p className="text-6xl" aria-hidden>
                📍
              </p>
              <p
                className="mt-4 text-xl font-extrabold text-clay-accent"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Paula Albarracín de Sarmiento 1085 (Sur)
              </p>
              <p className="text-lg font-bold text-clay-accent-alt">Capital · San Juan</p>
              <p className="mt-3 text-sm font-medium text-clay-muted">
                Lunes a sábado · 7:30 a 22:00 hs
              </p>
            </div>
          </Figure>
          <div className="flex flex-col justify-center">
            <h2
              className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              ¿Dónde estamos?
            </h2>
            <ul className="mt-6 space-y-4 font-medium text-clay-foreground">
              <li className="flex items-start gap-3">
                <span aria-hidden>📍</span>
                <a
                  href={CLINIC.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-4 transition hover:text-clay-accent hover:underline"
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
                  className="underline-offset-4 transition hover:text-clay-accent hover:underline"
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
                  className="underline-offset-4 transition hover:text-clay-accent hover:underline"
                >
                  {CLINIC.instagramHandle}
                </a>
              </li>
            </ul>
            <div className="relative mt-8 overflow-hidden rounded-[48px] bg-gradient-to-br from-[#A78BFA] via-[#7C3AED] to-[#DB2777] p-8 text-center text-white shadow-clay-deep sm:p-10 sm:text-left">
              <Asterisk className="animate-clay-float-slow absolute -right-8 -top-8 h-36 w-36 text-white/15" />
              <h3
                className="relative text-3xl font-black leading-tight sm:text-4xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                ¿Qué zona estás harta de depilarte?
              </h3>
              <p className="relative mt-3 font-medium leading-relaxed text-white/85">
                Acá podemos tratarla. Reservá tu turno online y empezá tu
                depilación definitiva.
              </p>
              <div className="relative mt-6 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/reservar" variant="secondary" className="text-clay-accent">
                  Reservar un turno
                </ButtonLink>
                <ButtonLink
                  href="/login"
                  variant="outline"
                  className="border-white/40 text-white hover:border-white hover:bg-white/10"
                >
                  Acceso profesionales
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 pb-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 rounded-[32px] bg-white/70 px-6 py-6 text-sm font-medium text-clay-muted shadow-clay-card backdrop-blur-xl sm:flex-row sm:rounded-[40px] sm:px-8">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <Logo src={MEDIA.logo} className="h-8 sm:h-8" />
            <p>
              {CLINIC.tagline} · {CLINIC.address}
            </p>
          </div>
          <Link
            href="/login"
            className="font-bold transition hover:text-clay-accent"
            style={{ fontFamily: "var(--font-heading)" }}
          >
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
        className="fixed bottom-6 right-6 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-[#10B981] text-white shadow-clay-button transition-all duration-200 hover:-translate-y-1 hover:shadow-clay-button-hover active:scale-[0.92] active:shadow-clay-pressed"
      >
        <WhatsAppIcon className="h-7 w-7" />
      </a>
    </main>
  );
}
