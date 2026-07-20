"use client";

// Wizard público de reservas, mobile-first:
// 1. tratamiento → 2. profesional → 3. fecha y hora → 4. datos → 5. confirmar

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Blobs } from "@/components/clay/Blobs";
import { Button } from "@/components/clay/Button";
import { Card } from "@/components/clay/Card";
import { Input, Textarea } from "@/components/clay/Input";
import { cn } from "@/lib/cn";

type Treatment = {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  insurancePriceCents: number | null;
  multiSession: boolean;
  defaultSessions: number;
  sessionIntervalDays: number;
};
type Dentist = { id: string; name: string; specialtyLabel: string };
type Clinic = { name: string; address: string; timezone: string };
type Slot = { time: string; startsAt: string; dentistId: string; chairId: string };

type KnownPatient = { patientId: string; firstName: string };

const STEPS = ["Tratamiento", "Profesional", "Fecha y hora", "Tus datos", "Confirmar"];

function money(cents: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function next21Days(): { dateStr: string; label: string; weekday: string }[] {
  const out = [];
  const fmtDay = new Intl.DateTimeFormat("es-AR", { weekday: "short" });
  const fmtDate = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" });
  for (let i = 0; i < 21; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({
      dateStr,
      label: i === 0 ? "Hoy" : i === 1 ? "Mañana" : fmtDate.format(d),
      weekday: fmtDay.format(d),
    });
  }
  return out;
}

// Tarjeta de selección clay: convexa por defecto, se hunde (concava) al
// quedar seleccionada, simulando que quedó "presionada" en la superficie.
function OptionCard({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-[24px] p-4 text-left transition-all duration-300",
        selected
          ? "shadow-clay-pressed bg-clay-accent/5 ring-2 ring-clay-accent"
          : "bg-white shadow-clay-card hover:-translate-y-1 hover:shadow-clay-card-hover"
      )}
    >
      {children}
    </button>
  );
}

export default function BookingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);

  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [dentistId, setDentistId] = useState<string | null>(null); // null = cualquiera
  const [dateStr, setDateStr] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);

  // Paso datos del paciente
  const [lookupValue, setLookupValue] = useState("");
  const [lookupState, setLookupState] = useState<"idle" | "searching" | "found" | "notfound">("idle");
  const [knownPatient, setKnownPatient] = useState<KnownPatient | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    birthDate: "",
    insuranceProvider: "",
    insuranceNumber: "",
    medicalNotes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const days = useMemo(next21Days, []);

  useEffect(() => {
    fetch("/api/public/booking-data")
      .then((r) => r.json())
      .then((data) => {
        setClinic(data.clinic);
        setTreatments(data.treatments);
        setDentists(data.dentists);
      })
      .catch(() => setError("No pudimos cargar los datos. Recargá la página."))
      .finally(() => setLoading(false));
  }, []);

  const loadSlots = useCallback(
    (date: string, tId: string, dId: string | null) => {
      setSlots(null);
      setSlot(null);
      const params = new URLSearchParams({ date, treatmentId: tId });
      if (dId) params.set("dentistId", dId);
      fetch(`/api/public/slots?${params}`)
        .then((r) => r.json())
        .then((data) => setSlots(data.slots ?? []))
        .catch(() => setSlots([]));
    },
    []
  );

  function pickDate(d: string) {
    setDateStr(d);
    if (treatment) loadSlots(d, treatment.id, dentistId);
  }

  async function doLookup() {
    if (lookupValue.trim().length < 4) return;
    setLookupState("searching");
    const res = await fetch("/api/public/patient-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneOrEmail: lookupValue.trim() }),
    });
    const data = await res.json();
    if (data.found) {
      setKnownPatient({ patientId: data.patientId, firstName: data.firstName });
      setLookupState("found");
    } else {
      setKnownPatient(null);
      setLookupState("notfound");
      setForm((f) => ({
        ...f,
        phone: lookupValue.includes("@") ? f.phone : lookupValue.trim(),
        email: lookupValue.includes("@") ? lookupValue.trim() : f.email,
      }));
    }
  }

  const newPatientReady =
    form.firstName.trim() && form.lastName.trim() && form.phone.trim().length >= 8;
  const patientReady = knownPatient != null || newPatientReady;

  async function confirm() {
    if (!treatment || !slot) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/public/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        treatmentId: treatment.id,
        dentistId: slot.dentistId,
        chairId: slot.chairId,
        startsAt: slot.startsAt,
        ...(knownPatient
          ? { patientId: knownPatient.patientId }
          : { patient: form }),
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "No pudimos crear el turno.");
      if (res.status === 409 && dateStr) loadSlots(dateStr, treatment.id, dentistId);
      return;
    }
    router.push(`/reservar/exito/${data.appointmentId}`);
  }

  const dentistName = (id: string) => dentists.find((d) => d.id === id)?.name ?? "";

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center font-medium text-clay-muted">
        <Blobs />
        Cargando…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <Blobs />

      {/* Encabezado + progreso */}
      <header className="mb-6">
        <h1
          className="text-2xl font-extrabold tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {clinic?.name ?? "Reservar turno"}
        </h1>
        <div className="mt-4 flex items-center gap-1.5">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i <= step
                    ? "bg-gradient-to-r from-clay-accent-light to-clay-accent shadow-clay-button"
                    : "bg-white shadow-clay-pressed"
                )}
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-sm font-medium text-clay-muted">
          Paso {step + 1} de {STEPS.length}:{" "}
          <span className="font-bold text-clay-foreground">{STEPS[step]}</span>
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-[20px] bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-clay-pressed">
          {error}
        </div>
      )}

      {/* Paso 1: tratamiento */}
      {step === 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-clay-muted">
            ¿Qué necesitás? Si es tu primera visita, te recomendamos la consulta de evaluación.
          </p>
          {treatments.map((t) => (
            <OptionCard
              key={t.id}
              selected={treatment?.id === t.id}
              onClick={() => {
                setTreatment(t);
                setSlot(null);
                setSlots(null);
                setDateStr(null);
                setStep(1);
              }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-extrabold" style={{ fontFamily: "var(--font-heading)" }}>
                  {t.name}
                </span>
                <span className="whitespace-nowrap text-sm font-medium text-clay-muted">
                  {t.durationMin} min
                </span>
              </div>
              {t.description && (
                <p className="mt-1 text-sm font-medium text-clay-muted">{t.description}</p>
              )}
              <p className="mt-1 text-sm font-bold text-clay-foreground">
                {money(t.priceCents)}
                {t.insurancePriceCents != null && (
                  <span className="font-medium text-clay-muted">
                    {" "}
                    · con obra social {money(t.insurancePriceCents)}
                  </span>
                )}
              </p>
              {t.multiSession && (
                <p className="mt-1 text-xs font-medium text-clay-accent">
                  Tratamiento de {t.defaultSessions} sesiones
                </p>
              )}
            </OptionCard>
          ))}
        </div>
      )}

      {/* Paso 2: profesional */}
      {step === 1 && treatment && (
        <div className="flex flex-col gap-3">
          <OptionCard
            onClick={() => {
              setDentistId(null);
              setStep(2);
            }}
          >
            <span className="font-extrabold" style={{ fontFamily: "var(--font-heading)" }}>
              Cualquier profesional disponible
            </span>
            <p className="text-sm font-medium text-clay-muted">Más horarios para elegir</p>
          </OptionCard>
          {dentists.map((d) => (
            <OptionCard
              key={d.id}
              onClick={() => {
                setDentistId(d.id);
                setStep(2);
              }}
            >
              <span className="font-extrabold" style={{ fontFamily: "var(--font-heading)" }}>
                {d.name}
              </span>
              <p className="text-sm font-medium text-clay-muted">{d.specialtyLabel}</p>
            </OptionCard>
          ))}
        </div>
      )}

      {/* Paso 3: fecha y hora */}
      {step === 2 && treatment && (
        <div>
          <div className="-mx-4 overflow-x-auto px-4 pb-2">
            <div className="flex gap-2" style={{ width: "max-content" }}>
              {days.map((d) => (
                <button
                  key={d.dateStr}
                  onClick={() => pickDate(d.dateStr)}
                  className={cn(
                    "flex w-16 flex-col items-center rounded-[20px] px-2 py-3 text-sm transition-all duration-200",
                    dateStr === d.dateStr
                      ? "bg-gradient-to-br from-clay-accent-light to-clay-accent text-white shadow-clay-button"
                      : "bg-white text-clay-foreground shadow-clay-card hover:-translate-y-1"
                  )}
                >
                  <span className="text-xs font-bold uppercase opacity-70">{d.weekday}</span>
                  <span className="font-extrabold" style={{ fontFamily: "var(--font-heading)" }}>
                    {d.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {dateStr && slots === null && (
            <p className="py-8 text-center font-medium text-clay-muted">Buscando horarios…</p>
          )}
          {dateStr && slots !== null && slots.length === 0 && (
            <p className="py-8 text-center font-medium text-clay-muted">
              No quedan horarios para ese día. Probá con otra fecha.
            </p>
          )}
          {slots !== null && slots.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  key={s.startsAt + s.dentistId}
                  onClick={() => {
                    setSlot(s);
                    setStep(3);
                  }}
                  className={cn(
                    "rounded-[20px] py-2.5 text-sm font-bold transition-all duration-200",
                    slot?.startsAt === s.startsAt
                      ? "bg-gradient-to-br from-clay-accent-light to-clay-accent text-white shadow-clay-button"
                      : "bg-white text-clay-foreground shadow-clay-card hover:-translate-y-1"
                  )}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
          {!dateStr && (
            <p className="py-8 text-center font-medium text-clay-muted">
              Elegí un día para ver los horarios.
            </p>
          )}
        </div>
      )}

      {/* Paso 4: datos del paciente */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <Card>
            <p className="font-extrabold" style={{ fontFamily: "var(--font-heading)" }}>
              ¿Ya sos paciente del centro?
            </p>
            <p className="mt-1 text-sm font-medium text-clay-muted">
              Ingresá tu teléfono o email y no te pedimos el resto.
            </p>
            <div className="mt-3 flex gap-2">
              <Input
                value={lookupValue}
                onChange={(e) => setLookupValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doLookup()}
                placeholder="+54911… o tu email"
                className="h-12"
              />
              <Button
                onClick={doLookup}
                disabled={lookupState === "searching"}
                variant="secondary"
                size="sm"
                className="shrink-0"
              >
                {lookupState === "searching" ? "…" : "Buscar"}
              </Button>
            </div>
            {lookupState === "found" && knownPatient && (
              <div className="mt-3 rounded-[20px] bg-clay-success/10 px-4 py-3 text-sm font-medium text-clay-success shadow-clay-pressed">
                ¡Hola de nuevo, <strong>{knownPatient.firstName}</strong>! Ya tenemos tus datos.
              </div>
            )}
            {lookupState === "notfound" && (
              <div className="mt-3 rounded-[20px] bg-clay-warning/10 px-4 py-3 text-sm font-medium text-clay-warning shadow-clay-pressed">
                No te encontramos — completá tus datos abajo y quedás registrado.
              </div>
            )}
          </Card>

          {!knownPatient && (
            <Card>
              <p className="mb-3 font-extrabold" style={{ fontFamily: "var(--font-heading)" }}>
                Tus datos
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Nombre *"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
                <Input
                  placeholder="Apellido *"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
                <Input
                  placeholder="WhatsApp * (+54911…)"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="col-span-2"
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="col-span-2"
                />
                <label className="col-span-2 text-sm font-medium text-clay-muted">
                  Fecha de nacimiento
                  <Input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    className="mt-1 text-clay-foreground"
                  />
                </label>
                <Textarea
                  placeholder="Datos que debamos saber (piel sensible, medicación, embarazo, tatuajes en la zona)"
                  value={form.medicalNotes}
                  onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })}
                  rows={2}
                  className="col-span-2"
                />
              </div>
            </Card>
          )}

          <Button onClick={() => setStep(4)} disabled={!patientReady} size="lg">
            Continuar
          </Button>
        </div>
      )}

      {/* Paso 5: confirmación */}
      {step === 4 && treatment && slot && (
        <div className="flex flex-col gap-4">
          <Card>
            <p className="mb-4 text-lg font-extrabold" style={{ fontFamily: "var(--font-heading)" }}>
              Revisá tu turno
            </p>
            <dl className="flex flex-col gap-2.5 text-sm">
              <Row label="Tratamiento" value={`${treatment.name} (${treatment.durationMin} min)`} />
              <Row
                label="Fecha"
                value={new Intl.DateTimeFormat("es-AR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  timeZone: clinic?.timezone,
                }).format(new Date(slot.startsAt))}
              />
              <Row label="Hora" value={`${slot.time} hs`} />
              <Row label="Profesional" value={dentistName(slot.dentistId)} />
              {clinic && <Row label="Dirección" value={clinic.address} />}
              <Row
                label="Paciente"
                value={knownPatient ? knownPatient.firstName : `${form.firstName} ${form.lastName}`}
              />
            </dl>
          </Card>
          {treatment.multiSession && (
            <p className="rounded-[20px] bg-clay-accent-soft/50 px-4 py-3 text-sm font-medium text-clay-muted shadow-clay-pressed">
              Este tratamiento lleva {treatment.defaultSessions} sesiones. Después de confirmar
              te vamos a proponer las fechas de las siguientes.
            </p>
          )}
          <Button onClick={confirm} disabled={submitting} size="lg">
            {submitting ? "Confirmando…" : "Confirmar turno"}
          </Button>
        </div>
      )}

      {/* Volver */}
      {step > 0 && (
        <button
          onClick={() => setStep(step - 1)}
          className="mt-6 text-sm font-medium text-clay-muted underline-offset-2 hover:text-clay-accent hover:underline"
        >
          ← Volver al paso anterior
        </button>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="font-medium text-clay-muted">{label}</dt>
      <dd className="text-right font-bold">{value}</dd>
    </div>
  );
}
