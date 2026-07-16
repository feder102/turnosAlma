import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  Dumbbell,
  LogIn,
  MapPin,
  Snowflake,
  Sparkles,
  Sun,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
    icon: Dumbbell,
    title: "Piernas completas",
    description:
      "El tratamiento más elegido: piernas enteras con tecnología Soprano ICE, prácticamente indoloro y apto todo el año.",
  },
  {
    icon: Sparkles,
    title: "Cavado, axilas y tira de cola",
    description:
      "Las zonas más sensibles tratadas con el sistema ICE de frío continuo, para una experiencia cómoda y segura.",
  },
  {
    icon: Snowflake,
    title: "Rostro y bozo",
    description:
      "Depilación facial delicada y precisa, ideal para bozo, mentón y rostro completo.",
  },
  {
    icon: Award,
    title: "Depilación masculina",
    description:
      "Espalda, tórax, piernas y más. Planes pensados para el vello masculino, más grueso y resistente.",
  },
];

const REELS = [
  {
    src: "/media/reel-pelo-blanco.mp4",
    caption:
      "¿Sabías que el láser no elimina el pelo blanco? Te contamos por qué.",
  },
  {
    src: "/media/reel-rutina-depilacion.mp4",
    caption:
      "El vello no desaparece solo… con depilación definitiva te despedís de esa rutina.",
  },
];

const BENEFITS = [
  {
    icon: Snowflake,
    title: "Tecnología ICE",
    description:
      "Frío continuo en la piel durante todo el disparo: un tratamiento prácticamente indoloro.",
  },
  {
    icon: Award,
    title: "Centro oficial",
    description:
      "Somos el único centro oficial Soprano ICE en San Juan. Equipamiento original de Alma Lasers.",
  },
  {
    icon: Sun,
    title: "Todo el año",
    description:
      "Apto para todo tipo de piel, incluso piel bronceada. Podés tratarte los 365 días del año.",
  },
  {
    icon: TrendingUp,
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

function InstagramIcon({ className }: { className?: string }) {
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
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
          <Link href="/" className="flex min-w-0 shrink-0 items-center">
            <Image
              src="/brand/alma-mark.png"
              alt="Alma San Juan"
              width={657}
              height={320}
              priority
              className="h-11 w-auto sm:h-14"
            />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex">
            <a href="#servicios" className="transition hover:text-foreground">
              Zonas
            </a>
            <a href="#soprano" className="transition hover:text-foreground">
              Soprano ICE
            </a>
            <a href="#contacto" className="transition hover:text-foreground">
              Contacto
            </a>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              nativeButton={false}
              variant="outline"
              size="icon"
              className="rounded-full sm:hidden"
              render={
                <Link href="/login" aria-label="Acceso profesionales" title="Acceso profesionales">
                  <LogIn />
                </Link>
              }
            />
            <Button
              nativeButton={false}
              variant="outline"
              className="hidden rounded-full sm:inline-flex"
              render={<Link href="/login">Acceso profesionales</Link>}
            />
            <Button
              nativeButton={false}
              className="rounded-full bg-fuchsia-600 text-white shadow-sm hover:bg-fuchsia-500"
              render={<Link href="/reservar">Turnos online</Link>}
            />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-rose-50 to-background">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div className="text-center md:text-left">
            <Badge className="mb-4 bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-100">
              {CLINIC.tagline}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Tu piel merece la{" "}
              <span className="text-fuchsia-600">mejor tecnología</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground md:mx-0">
              Depilación definitiva láser con Soprano ICE, el equipo líder en el
              mundo. No pierdas tiempo llamando: autogestioná tu turno, 24/7, en
              pocos clics.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row md:items-start">
              <Button
                nativeButton={false}
                size="lg"
                className="w-full rounded-full bg-fuchsia-600 px-8 py-6 text-lg font-bold text-white shadow-lg shadow-fuchsia-600/30 hover:bg-fuchsia-500 sm:w-auto"
                render={<Link href="/reservar">¡Quiero mi turno!</Link>}
              />
              <Button
                nativeButton={false}
                variant="outline"
                size="lg"
                className="w-full rounded-full border-emerald-500 px-8 py-6 text-lg font-semibold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-600 sm:w-auto"
                render={
                  <a href={CLINIC.whatsapp} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon className="size-5" />
                    WhatsApp
                  </a>
                }
              />
            </div>
          </div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-3xl shadow-xl ring-1 ring-border">
            <Image
              src="/media/soprano-vs-cera.jpg"
              alt="Aplicación de depilación láser Soprano ICE en Alma San Juan"
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Destacados */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 text-center sm:grid-cols-3">
          <div>
            <p className="font-semibold">Prácticamente indoloro</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Sistema ICE de frío continuo en la piel
            </p>
          </div>
          <div>
            <p className="font-semibold">Turnos online 24/7</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Reservá desde la compu o el celu, sin esperas
            </p>
          </div>
          <div>
            <p className="font-semibold">Atención personalizada</p>
            <p className="mt-1 text-sm text-muted-foreground">
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
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Depilación definitiva para mujer y hombre, con planes por zona o
          combos de cuerpo completo.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {SERVICES.map((service) => (
            <Card
              key={service.title}
              className="border-none ring-1 ring-border transition hover:ring-fuchsia-200 hover:shadow-md"
            >
              <CardHeader>
                <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-fuchsia-700">
                  <service.icon className="size-6" />
                </div>
                <CardTitle className="text-lg">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {service.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Soprano ICE */}
      <section id="soprano" className="scroll-mt-20 bg-muted/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            ¿Por qué Soprano ICE?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Cada vez que te depilás con cera, el folículo resiste. Con láser, no
            tiene chance.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit) => (
              <Card key={benefit.title} className="border-none text-center ring-1 ring-border">
                <CardHeader className="items-center justify-items-center">
                  <benefit.icon className="size-8 text-fuchsia-600" />
                  <CardTitle className="mt-2 text-base">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button
              nativeButton={false}
              className="rounded-full bg-fuchsia-600 px-6 py-5 font-bold text-white hover:bg-fuchsia-500"
              render={<Link href="/reservar">Empezá tu tratamiento</Link>}
            />
          </div>
        </div>
      </section>

      {/* Reels / Instagram */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Mirá cómo trabajamos
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Contenido real de nuestro centro, directo desde{" "}
          <a
            href={CLINIC.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-fuchsia-600 underline-offset-4 hover:underline"
          >
            {CLINIC.instagramHandle}
          </a>
          .
        </p>
        <div className="mx-auto mt-12 grid max-w-2xl gap-6 sm:grid-cols-2">
          {REELS.map((reel) => (
            <Card key={reel.src} className="overflow-hidden border-none ring-1 ring-border">
              <div className="relative aspect-[9/16] bg-neutral-900">
                <video
                  src={reel.src}
                  className="h-full w-full object-cover"
                  controls
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              </div>
              <CardContent className="pt-4">
                <CardDescription className="text-sm leading-relaxed">
                  {reel.caption}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button
            nativeButton={false}
            variant="outline"
            className="rounded-full"
            render={
              <a href={CLINIC.instagram} target="_blank" rel="noopener noreferrer">
                <InstagramIcon className="size-4" />
                Seguinos en Instagram
              </a>
            }
          />
        </div>
      </section>

      {/* Sede / Contacto */}
      <section id="contacto" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <div className="grid items-stretch gap-10 md:grid-cols-2">
          <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-violet-100 via-fuchsia-50 to-rose-100 shadow-lg ring-1 ring-border md:aspect-auto">
            <div className="px-10 text-center">
              <MapPin className="mx-auto size-14 text-fuchsia-600" />
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
            <ul className="mt-6 space-y-4 text-foreground/90">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
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
                <WhatsAppIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
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
                <InstagramIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
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
            <Card className="mt-8 border-none bg-neutral-900 text-white">
              <CardContent className="p-8 text-center sm:text-left">
                <h3 className="text-2xl font-bold">¡No esperes más!</h3>
                <p className="mt-2 text-neutral-300">
                  Reservá tu turno online y empezá tu depilación definitiva.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    nativeButton={false}
                    className="rounded-full bg-fuchsia-600 px-6 py-5 font-bold text-white hover:bg-fuchsia-500"
                    render={<Link href="/reservar">Reservar un turno</Link>}
                  />
                  <Button
                    nativeButton={false}
                    variant="outline"
                    className="rounded-full border-neutral-600 bg-transparent px-6 py-5 font-medium text-neutral-200 hover:bg-neutral-800 hover:text-neutral-100"
                    render={<Link href="/login">Acceso profesionales</Link>}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator />

      {/* Footer */}
      <footer className="bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Image
              src="/brand/alma-mark.png"
              alt="Alma San Juan"
              width={657}
              height={320}
              className="h-7 w-auto opacity-80"
            />
            <p className="text-center sm:text-left">
              {CLINIC.name} · {CLINIC.tagline} · {CLINIC.address}
            </p>
          </div>
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
