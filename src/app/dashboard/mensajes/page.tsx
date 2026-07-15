import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { PageTitle } from "../ui";
import { saveTemplate } from "../actions";

export const metadata = { title: "Mensajes — Centro" };
export const dynamic = "force-dynamic";

export default async function MensajesPage() {
  await requireUser(["ADMIN", "RECEPTION"]);
  const clinic = await prisma.clinic.findFirst();
  const [templates, logs] = await Promise.all([
    prisma.messageTemplate.findMany({ orderBy: { name: "asc" } }),
    prisma.messageLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const provider = process.env.WHATSAPP_PROVIDER || "simulated";

  return (
    <div className="max-w-3xl">
      <PageTitle title="Mensajes de WhatsApp" />

      <p className={`mb-5 rounded-lg px-4 py-3 text-sm ${provider === "simulated" ? "border border-amber-200 bg-amber-50 text-amber-800" : "border border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
        {provider === "simulated"
          ? "Modo simulado: los mensajes se registran acá y en la consola, pero no se envían. Configurá Twilio en las variables de entorno para envío real (ver README)."
          : "Envío real activo vía Twilio."}
      </p>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Plantillas</h2>
        <p className="mb-3 text-sm text-neutral-500">
          Variables disponibles: {"{{paciente}}, {{tratamiento}}, {{fecha}}, {{hora}}, {{odontologo}}, {{centro}}, {{direccion}}, {{preparacion}}, {{cuidados}}, {{link}}, {{accion}}"}
        </p>
        <div className="flex flex-col gap-3">
          {templates.map((t) => (
            <details key={t.key} className="rounded-xl border border-neutral-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between gap-2 px-5 py-3.5">
                <span className="font-semibold">{t.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.enabled ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
                  {t.enabled ? "Activa" : "Desactivada"}
                </span>
              </summary>
              <form action={saveTemplate} className="flex flex-col gap-3 border-t border-neutral-100 px-5 py-4">
                <input type="hidden" name="key" value={t.key} />
                <textarea
                  name="body"
                  rows={6}
                  defaultValue={t.body}
                  className="rounded-lg border border-neutral-300 px-3 py-2.5 font-mono text-xs"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-neutral-600">
                    <input type="checkbox" name="enabled" defaultChecked={t.enabled} />
                    Plantilla activa
                  </label>
                  <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">
                    Guardar
                  </button>
                </div>
              </form>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Últimos mensajes</h2>
        <div className="flex flex-col gap-2">
          {logs.map((log) => (
            <details key={log.id} className="rounded-lg border border-neutral-200 bg-white text-sm shadow-sm">
              <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-2.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    log.status === "FAILED"
                      ? "bg-red-100 text-red-700"
                      : log.status === "SENT"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {log.status === "SIMULATED" ? "Simulado" : log.status === "SENT" ? "Enviado" : "Falló"}
                </span>
                <span className="font-mono text-xs text-neutral-500">
                  {formatDateTime(log.createdAt, clinic?.timezone)}
                </span>
                <span className="font-medium">{log.to}</span>
                <span className="text-neutral-500">· {log.templateKey}</span>
              </summary>
              <pre className="whitespace-pre-wrap border-t border-neutral-100 px-4 py-3 text-xs text-neutral-600">
                {log.body || log.error}
              </pre>
            </details>
          ))}
          {logs.length === 0 && (
            <p className="text-sm text-neutral-500">Todavía no se enviaron mensajes.</p>
          )}
        </div>
      </section>
    </div>
  );
}
