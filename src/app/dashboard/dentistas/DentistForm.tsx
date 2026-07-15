"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { upsertDentist } from "../actions";
import { DENTIST_TITLES, SPECIALTIES, SPECIALTY_LABELS } from "@/lib/domain";

export type DentistFormData = {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  specialty: string;
  color: string;
  phone: string;
  email: string | null;
  license: string | null;
  hiredAt: Date | null;
  photoUrl: string | null;
  defaultChairId: string | null;
  chairIds: string[];
};

export type ChairOption = { id: string; name: string };

function toDateInput(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm text-neutral-900";

// Máximo lado de la foto ya redimensionada, en px. Mantiene el data URL chico.
const PHOTO_MAX_SIZE = 320;

export function DentistForm({
  dentist,
  chairs,
}: {
  dentist?: DentistFormData;
  chairs: ChairOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [photo, setPhoto] = useState<string | null>(dentist?.photoUrl ?? null);
  const [color, setColor] = useState(dentist?.color ?? "#0ea5e9");
  const [selectedChairIds, setSelectedChairIds] = useState<string[]>(dentist?.chairIds ?? []);
  const [defaultChairId, setDefaultChairId] = useState(dentist?.defaultChairId ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleChair(chairId: string, checked: boolean) {
    setSelectedChairIds((prev) =>
      checked ? [...prev, chairId] : prev.filter((id) => id !== chairId)
    );
    // El cabina preferido tiene que seguir siendo uno de los asignados.
    if (!checked && defaultChairId === chairId) setDefaultChairId("");
  }

  async function onPickPhoto(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen");
      return;
    }
    try {
      const dataUrl = await downscaleImage(file, PHOTO_MAX_SIZE);
      setPhoto(dataUrl);
    } catch {
      setError("No se pudo procesar la imagen");
    }
  }

  function submit(formData: FormData) {
    setError(null);
    // La foto viaja por estado (el <input type=file> no serializa el data URL).
    formData.set("photoUrl", photo ?? "");
    startTransition(async () => {
      const res = await upsertDentist(formData);
      if (!res.ok) setError(res.error ?? "Error");
      else router.push("/dashboard/dentistas");
    });
  }

  const initials =
    `${dentist?.firstName?.[0] ?? ""}${dentist?.lastName?.[0] ?? ""}`.toUpperCase() || "✨";

  return (
    <form action={submit} className="flex max-w-2xl flex-col gap-5">
      {dentist && <input type="hidden" name="id" value={dentist.id} />}

      {/* Foto de perfil */}
      <section className="flex items-center gap-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div
          className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-neutral-200 bg-neutral-100 text-2xl font-bold text-neutral-400"
          style={photo ? undefined : { borderColor: color }}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Foto de perfil" className="h-full w-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="text-sm">
          <p className="font-medium text-neutral-700">Foto de perfil</p>
          <p className="mb-2 text-xs text-neutral-400">JPG o PNG. Se recorta a un cuadrado.</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {photo ? "Cambiar" : "Subir foto"}
            </button>
            {photo && (
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="rounded-lg border border-red-200 px-3 py-1.5 font-medium text-red-600 hover:bg-red-50"
              >
                Quitar
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickPhoto(f);
              e.target.value = "";
            }}
          />
        </div>
      </section>

      {/* Datos del profesional */}
      <section className="grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-white p-5 text-sm shadow-sm sm:grid-cols-2">
        <label className="text-neutral-500">
          Título
          <select name="title" defaultValue={dentist?.title ?? ""} className={inputClass}>
            {DENTIST_TITLES.map((t) => (
              <option key={t || "none"} value={t}>
                {t || "Sin título"}
              </option>
            ))}
          </select>
        </label>
        <label className="text-neutral-500">
          Especialidad
          <select name="specialty" defaultValue={dentist?.specialty ?? "GENERAL"} className={inputClass}>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {SPECIALTY_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-neutral-500">
          Nombre *
          <input name="firstName" required defaultValue={dentist?.firstName} className={inputClass} />
        </label>
        <label className="text-neutral-500">
          Apellido *
          <input name="lastName" required defaultValue={dentist?.lastName} className={inputClass} />
        </label>
        <label className="text-neutral-500">
          Matrícula
          <input
            name="license"
            placeholder="Ej.: MN 12345"
            defaultValue={dentist?.license ?? ""}
            className={inputClass}
          />
        </label>
        <label className="text-neutral-500">
          Fecha de contratación
          <input
            name="hiredAt"
            type="date"
            defaultValue={toDateInput(dentist?.hiredAt ?? null)}
            className={inputClass}
          />
        </label>
        <label className="text-neutral-500">
          Teléfono
          <input
            name="phone"
            placeholder="+549…"
            defaultValue={dentist?.phone ?? ""}
            className={inputClass}
          />
        </label>
        <label className="text-neutral-500">
          Email de contacto
          <input name="email" type="email" defaultValue={dentist?.email ?? ""} className={inputClass} />
        </label>
      </section>

      {/* Configuración de agenda */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5 text-sm shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="text-neutral-500">
            Cabinas asignados
            <p className="mb-1 text-xs text-neutral-400">
              Puede atender en más de uno (incluso de otros centros).
            </p>
            <div className="flex flex-col gap-1.5">
              {chairs.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-neutral-700">
                  <input
                    type="checkbox"
                    name="chairIds"
                    value={c.id}
                    checked={selectedChairIds.includes(c.id)}
                    onChange={(e) => toggleChair(c.id, e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300"
                  />
                  {c.name}
                </label>
              ))}
              {chairs.length === 0 && (
                <p className="text-xs text-neutral-400">No hay cabinas activos para asignar.</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <label className="text-neutral-500">
              Cabina preferido
              <select
                name="defaultChairId"
                value={defaultChairId}
                onChange={(e) => setDefaultChairId(e.target.value)}
                className={inputClass}
              >
                <option value="">Sin preferencia</option>
                {chairs
                  .filter((c) => selectedChairIds.includes(c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-neutral-500">
              Color en la agenda
              <div className="mt-1 flex items-center gap-3">
                <input
                  name="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded-lg border border-neutral-300"
                />
                <span className="font-mono text-xs text-neutral-500">{color}</span>
              </div>
            </label>
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded-lg bg-sky-600 px-6 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
        >
          {pending ? "Guardando…" : dentist ? "Guardar cambios" : "Crear profesional"}
        </button>
        <Link href="/dashboard/dentistas" className="text-sm text-neutral-500 hover:underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}

// Redimensiona y recorta la imagen a un cuadrado `size`×`size` y devuelve un
// data URL JPEG. Todo en el cliente para no subir el archivo original al server.
function downscaleImage(file: File, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read error"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode error"));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
