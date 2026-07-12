import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Maxilofacial San Juan — Medicina de Alta Complejidad",
  description:
    "Cirugía oral y maxilofacial, implantes, ortodoncia y estética dental en San Juan. Reservá tu turno online.",
};

// Información e imágenes tomadas de instagram.com/maxilofacialsanjuan
const CLINIC = {
  name: "Maxilofacial San Juan",
  tagline: "Medicina de Alta Complejidad",
  address: "Santiago del Estero Sur 615, San Juan, Argentina",
  phone: "264 460-5493",
  whatsapp: "https://wa.me/542644605493",
  instagram: "https://www.instagram.com/maxilofacialsanjuan/",
  instagramHandle: "@maxilofacialsanjuan",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Santiago+del+Estero+Sur+615%2C+San+Juan%2C+Argentina",
};

const SERVICES = [
  {
    icon: "🏥",
    title: "Cirugía Oral y Maxilofacial",
    description:
      "Cirugías realizadas en forma minuciosa, buscando la mayor armonía posible del rostro y mitigando excesos y defectos.",
  },
  {
    icon: "🦷",
    title: "Implantología",
    description:
      "Implantes dentales con equipos de última generación y tecnología de punta.",
  },
  {
    icon: "😁",
    title: "Ortodoncia y Ortopedia",
    description:
      "Tu tratamiento en manos de especialistas. La consulta temprana es clave para lograr resultados oportunos y predecibles.",
  },
  {
    icon: "✨",
    title: "Estética Dental",
    description:
      "Tratamientos estéticos para lograr la armonía de tu sonrisa y de tu rostro.",
  },
];

const TEAM = [
  {
    name: "Dr. Javier Peñate",
    role: "Médico y odontólogo · Cirujano maxilofacial",
    photo: "/clinica/equipo-penate.jpg",
  },
  {
    name: "Dra. Alejandra Alé",
    role: "Odontóloga Ortodoncista · M.P. 988",
    photo: "/clinica/equipo-ale.jpg",
  },
  {
    name: "Dra. Marianela Bueno",
    role: "Odontóloga Ortodoncista · M.P. 957",
    photo: "/clinica/equipo-marianela.jpg",
  },
  {
    name: "Dr. Héctor Herrero",
    role: "Odontólogo · Estética dental · M.P. 1040",
    photo: "/clinica/equipo-herrero.jpg",
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
            <Image
              src="/clinica/logo.jpg"
              alt="Maxilofacial San Juan"
              width={44}
              height={44}
              className="h-10 w-10 shrink-0 rounded-lg object-cover"
              priority
            />
            <span className="truncate text-base font-bold leading-tight tracking-tight sm:text-lg">
              Maxilofacial{" "}
              <span className="font-normal text-neutral-500">San Juan</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-600 lg:flex">
            <a href="#servicios" className="transition hover:text-neutral-900">
              Servicios
            </a>
            <a href="#equipo" className="transition hover:text-neutral-900">
              Equipo
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
              className="whitespace-nowrap rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-neutral-900 shadow-sm transition hover:bg-amber-300 sm:px-5"
            >
              Turnos online
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-amber-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div className="text-center md:text-left">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-amber-600">
              {CLINIC.tagline}
            </p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Tu nueva agenda de{" "}
              <span className="text-amber-500">turnos online</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-600 md:mx-0">
              Cirugía oral y maxilofacial · Implantes · Ortodoncia · Estética
              dental. No pierdas tiempo llamando: autogestioná tu turno, 24/7,
              en pocos clics.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row md:items-start">
              <Link
                href="/reservar"
                className="w-full rounded-full bg-amber-400 px-8 py-4 text-lg font-bold text-neutral-900 shadow-lg shadow-amber-400/30 transition hover:bg-amber-300 sm:w-auto"
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
            <div className="overflow-hidden rounded-3xl shadow-xl ring-1 ring-neutral-200">
              <Image
                src="/clinica/implantes.jpg"
                alt="Atención en Maxilofacial San Juan con tecnología de punta"
                width={640}
                height={640}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Destacados */}
      <section className="border-y border-neutral-100 bg-neutral-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 text-center sm:grid-cols-3">
          <div>
            <p className="font-semibold">Equipos de última generación</p>
            <p className="mt-1 text-sm text-neutral-500">
              Tecnología de punta al servicio de tu salud
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

      {/* Servicios */}
      <section id="servicios" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Nuestros servicios
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-neutral-600">
          Medicina de alta complejidad en cirugía oral y maxilofacial,
          implantología, ortodoncia y estética dental.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {SERVICES.map((service) => (
            <div
              key={service.title}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-amber-200 hover:shadow-md"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-2xl">
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

      {/* Cirugía ortognática — imagen + texto */}
      <section className="bg-neutral-50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-2">
          <div className="order-2 overflow-hidden rounded-3xl shadow-lg ring-1 ring-neutral-200 md:order-1">
            <Image
              src="/clinica/cirugia.jpg"
              alt="Cirugía ortognática en Maxilofacial San Juan"
              width={640}
              height={640}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Armonía del rostro
            </h2>
            <p className="mt-4 text-neutral-600">
              Como expertos maxilofaciales tenemos una gran pasión por la
              armonía del rostro. Cuando nos enfrentamos a una cirugía
              maxilofacial, la llevamos a cabo en forma minuciosa, buscando la
              mayor armonía posible y mitigando excesos y defectos del rostro.
            </p>
            <p className="mt-4 text-neutral-600">
              La cirugía ortognática permite lograr cambios faciales en el
              paciente, mejorando funciones y estética a la vez.
            </p>
            <Link
              href="/reservar"
              className="mt-6 inline-block rounded-full bg-amber-400 px-6 py-3 font-bold text-neutral-900 transition hover:bg-amber-300"
            >
              Pedí tu consulta
            </Link>
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section id="equipo" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Nuestro equipo
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-neutral-600">
          Grandes profesionales, correctamente capacitados, para acompañarte en
          cada tratamiento.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((member) => (
            <figure
              key={member.name}
              className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <Image
                src={member.photo}
                alt={`${member.name} — ${member.role}`}
                width={640}
                height={640}
                className="h-full w-full object-cover"
              />
            </figure>
          ))}
        </div>
      </section>

      {/* Sede / Contacto */}
      <section id="contacto" className="scroll-mt-20 bg-neutral-50">
        <div className="mx-auto grid max-w-6xl items-stretch gap-10 px-6 py-20 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl shadow-lg ring-1 ring-neutral-200">
            <Image
              src="/clinica/clinica.jpg"
              alt="Sede de Maxilofacial San Juan"
              width={640}
              height={640}
              className="h-full w-full object-cover"
            />
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
                  className="underline-offset-4 transition hover:text-amber-600 hover:underline"
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
                  className="underline-offset-4 transition hover:text-amber-600 hover:underline"
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
                  className="underline-offset-4 transition hover:text-amber-600 hover:underline"
                >
                  {CLINIC.instagramHandle}
                </a>
              </li>
            </ul>
            <div className="mt-8 rounded-3xl bg-neutral-900 p-8 text-center text-white sm:text-left">
              <h3 className="text-2xl font-bold">¡No esperes más!</h3>
              <p className="mt-2 text-neutral-300">
                Reservá tu turno online y recibí atención personalizada.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/reservar"
                  className="rounded-full bg-amber-400 px-6 py-3 text-center font-bold text-neutral-900 transition hover:bg-amber-300"
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
          <div className="flex items-center gap-2.5">
            <Image
              src="/clinica/logo.jpg"
              alt="Maxilofacial San Juan"
              width={32}
              height={32}
              className="h-8 w-8 rounded-md object-cover"
            />
            <p>
              {CLINIC.name} · {CLINIC.address}
            </p>
          </div>
          <Link href="/login" className="transition hover:text-amber-600">
            Acceso al consultorio
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
