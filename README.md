# 🦷 Turnero — Sistema de turnos para consultorio odontológico

Sistema completo de turnos online para un consultorio con varios odontólogos y sillones:
reservas públicas, dashboard privado con roles, pagos con Mercado Pago, notificaciones por
WhatsApp y planes de tratamiento de varias sesiones (ortodoncia, endodoncia, etc.).

**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Prisma 7 + PostgreSQL (Neon, dev y prod).

---

## Correr el proyecto localmente

Requisitos: Node.js 20+ y una base PostgreSQL (recomendado: [Neon](https://neon.tech), tiene free tier).

```bash
npm install
# Configurar DATABASE_URL en .env con la connection string de Neon (ver .env.example)
npx prisma migrate dev   # aplica migraciones contra la base
npm run db:seed          # datos de ejemplo
npm run dev              # http://localhost:3000
```

### Usuarios de prueba (seed)

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `admin@sonrisa.com` | `admin123` |
| Recepción | `recepcion@sonrisa.com` | `recepcion123` |
| Odontóloga (Dra. Gómez) | `lgomez@sonrisa.com` | `dentista123` |
| Odontólogo (Dr. Ruiz) | `mruiz@sonrisa.com` | `dentista123` |

### Qué probar

- **`/reservar`** — flujo público: tratamiento → profesional → fecha/hora (solo horarios
  realmente libres) → datos del paciente (probá reconocerte con `+5491155550001`) →
  confirmación. Con un tratamiento multi-sesión (ortodoncia, endodoncia) la página de
  éxito ofrece agendar las sesiones siguientes.
- **`/dashboard`** — vista general, agenda semanal por odontólogo/sillón, ficha de
  paciente con historia clínica y progreso de planes, gestión de turnos, pagos,
  plantillas de WhatsApp, ocupación de sillones y reportes exportables.
- **Recordatorios** — `curl http://localhost:3000/api/jobs/reminders` dispara los
  recordatorios de 24 hs / 2 hs y el recall de 6 meses (en modo simulado se ven en la
  consola y en Dashboard → Mensajes).

---

## Decisiones de arquitectura

### Modelo de datos (Prisma)

- **`Clinic` / `Chair`**: un consultorio con N sillones. Cada turno ocupa *un odontólogo
  y un sillón*: ambos se validan contra dobles reservas.
- **`Dentist` + `DentistSchedule`**: horario propio por día de semana, que se intersecta
  con el horario del consultorio al calcular disponibilidad.
- **`Treatment`**: duración, precio particular y copago de obra social
  (`insurancePriceCents`, null = no cubierto), seña opcional (`depositCents`) y textos
  configurables de preparación previa y cuidados post-tratamiento (usados por WhatsApp).
- **Tratamientos multi-sesión**: `Treatment.multiSession` + `defaultSessions` +
  `sessionIntervalDays` definen la *plantilla*; **`TreatmentPlan`** es la *instancia*
  para un paciente concreto, y cada `Appointment` del plan lleva `sessionNumber`.
  El progreso ("sesión 3 de 4") se calcula contando sesiones `COMPLETED` del plan, así
  nunca queda desincronizado. Cobro por sesión o total por adelantado (`billingMode`).
- **`ClinicalNote`**: 1:1 con el turno (qué se hizo + próximos pasos), indexada por
  paciente → la ficha del paciente es la suma cronológica de sus notas.
- **Estados como `String`**: se mantienen como string validado (uniones de TypeScript +
  Zod en `src/lib/domain.ts` y los endpoints) en lugar de enums nativos de Prisma, por
  simplicidad — se pueden promover a enums nativos si se quiere.
- **Dinero en centavos (`Int`)** para evitar errores de punto flotante.
- **Fechas en UTC** en la base; la zona horaria del consultorio (`Clinic.timezone`) se
  aplica solo al mostrar y al convertir "fecha + hora local" → UTC (`src/lib/format.ts`).

### Disponibilidad y anti doble-reserva

`src/lib/availability.ts` genera slots de 15 min cruzando: horario del consultorio ∩
horario del odontólogo, menos turnos existentes del odontólogo, y asignando un sillón
libre (prefiere el sillón por defecto del profesional). Al confirmar, la creación corre
dentro de una transacción que re-chequea conflictos (`findConflict`) por odontólogo *y*
por sillón — la doble validación evita la carrera entre ver el slot y reservarlo.

### Pagos (Mercado Pago — Checkout Bricks)

Se eligió **Payment Brick** (Checkout Bricks): el formulario de pago vive embebido en
nuestra página `/pagar/[id]`, MP maneja 3DS/antifraude y la tokenización de tarjetas
(PCI simplificado). `src/lib/payments.ts`:

- Pago completo o **seña** (si el tratamiento define `depositCents`), y **plan completo
  por adelantado** para planes multi-sesión.
- El importe siempre sale del turno (nunca del navegador), que ya tiene aplicado el
  **copago de obra social**.
- Medios de pago: tarjetas de crédito/débito y **cuenta de Mercado Pago** (Wallet, vía
  preferencia creada en el backend).
- Webhook (`/api/payments/webhook`) valida la firma `x-signature`, consulta el pago a la
  API de MP y actualiza pagado/fallido/reembolsado.
- **Modo simulado sin claves**: sin `MP_ACCESS_TOKEN`, "pagar" aprueba el pago
  localmente para poder probar todo el flujo.
- Reembolsos desde el detalle del turno en el dashboard.

### WhatsApp

`src/lib/messaging.ts` con dos proveedores: `simulated` (default: consola + tabla
`MessageLog`) y `twilio`. Las **plantillas viven en la base** (`MessageTemplate`) y se
editan desde Dashboard → Mensajes. Mensajes: confirmación, recordatorio 24 hs (con
preparación según tratamiento), recordatorio 2-3 hs, cuidados post-tratamiento al
completar el turno, recall a los 6 meses, avisos al staff y cancelación/reprogramación.
Los recordatorios los dispara `/api/jobs/reminders`, con deduplicación vía `MessageLog`.
**Nota:** el cron automático está deshabilitado (ver TODO en el archivo) porque Vercel
Hobby no permite crons con frecuencia mayor a 1 vez/día; se puede llamar manualmente o
reactivar el cron con un plan Pro.

### Roles

- **ADMIN**: todo (incluye tratamientos y reportes).
- **RECEPTION**: agenda, turnos (crear/reprogramar/cancelar/cobrar), pacientes, pagos,
  mensajes, sillones.
- **DENTIST**: su propia agenda, sus turnos y las fichas clínicas de sus pacientes.

Sesión: JWT firmado (jose) en cookie httpOnly; cada página y server action re-valida rol.

---

## Configurar Mercado Pago (producción)

1. Crear una aplicación en el [panel de desarrolladores](https://www.mercadopago.com.ar/developers/panel/app)
   y copiar las credenciales: **Access Token** → `MP_ACCESS_TOKEN` y **Public Key** →
   `NEXT_PUBLIC_MP_PUBLIC_KEY` (usar las de **prueba** en dev y las **productivas** en prod).
2. En **Webhooks → Configurar notificaciones**: URL `https://TU-DOMINIO/api/payments/webhook`,
   evento **Pagos**.
3. Copiar la **clave secreta** del webhook → `MP_WEBHOOK_SECRET`.
4. `MP_CURRENCY`: `ARS` por defecto (debe coincidir con el país de la cuenta).
5. Para probar local: exponer el puerto con un túnel (p. ej. `ngrok http 3000`) y apuntar
   el webhook de prueba a esa URL; tarjetas de test en la doc de MP.

## Configurar WhatsApp (producción)

Opción recomendada para empezar: **Twilio API for WhatsApp**.

1. Cuenta en Twilio → activar WhatsApp (sandbox para pruebas, número propio para prod).
2. Para producción real hay que registrar un **WhatsApp Business Profile** con Meta
   (lo gestiona Twilio) y aprobar **message templates** para mensajes iniciados por el
   negocio (recordatorios, recalls). Los textos de las plantillas del dashboard deben
   coincidir con las aprobadas en Meta.
3. Variables: `WHATSAPP_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
   `TWILIO_WHATSAPP_FROM="whatsapp:+549…"`.
4. Mientras tanto, `WHATSAPP_PROVIDER=simulated` deja todo el sistema funcionando sin
   cuenta activa.

---

## Deploy en Vercel

1. Subir el repo a GitHub e importarlo en Vercel.
2. Configurar las variables de entorno (ver `.env.example`):
   - `DATABASE_URL` (connection string de Neon; usar la misma base que en dev o crear
     otra para producción)
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `NEXT_PUBLIC_APP_URL` (dominio final)
   - `CRON_SECRET` (para `/api/jobs/reminders`, si se llama manualmente o se reactiva el cron)
   - Mercado Pago y Twilio según arriba
3. Aplicar migraciones contra la base de producción (si es distinta de la de dev):
   `DATABASE_URL=… npx prisma migrate deploy`.

### Backups

`npm run db:backup` (o `scripts/backup.sh` desde cron del sistema): copia SQLite en dev
y `pg_dump --format=custom` en producción, con retención de 30 copias. Con base
administrada, activar además los **backups automáticos del proveedor** (Neon/Supabase
los incluyen) y verificar restauración periódicamente.

---

## Checklist antes de usar con pacientes reales

**Seguridad**
- [ ] `AUTH_SECRET` fuerte y único; HTTPS en todo el dominio (Vercel lo da por defecto).
- [ ] Cambiar TODAS las contraseñas del seed (o borrar los usuarios seed y crear reales).
- [ ] Revisar que ninguna cuenta tenga rol de más (principio de mínimo privilegio).
- [ ] Rate limiting / captcha en `/api/public/*` si hay abuso (Vercel WAF o middleware).

**Permisos**
- [ ] Probar con un usuario DENTIST que solo ve su agenda y sus pacientes.
- [ ] Probar con RECEPTION que no accede a tratamientos ni reportes.

**Pagos**
- [ ] Webhook de Mercado Pago verificado (notificación de prueba desde el panel de MP).
- [ ] Flujo de reembolso probado con un pago de test.

**Datos de salud (privacidad)**
- [ ] Backups automáticos activos y restauración probada.
- [ ] Acceso a la base restringido (IP allowlist / conexión SSL obligatoria).
- [ ] Las fichas clínicas solo son visibles para roles clínicos (ya implementado; verificar).
- [ ] Cumplimiento local: en Argentina, Ley 25.326 de Protección de Datos Personales y
      Ley 26.529 de Derechos del Paciente (consentimiento, acceso a la historia clínica,
      plazo de conservación). Consultar con un profesional legal.
- [ ] Política de retención y borrado de datos de pacientes definida.

**Operación**
- [ ] Cron de recordatorios corriendo (revisar logs de Vercel).
- [ ] Plantillas de WhatsApp aprobadas en Meta antes de activar `twilio`.
- [ ] Monitoreo de errores (Sentry o similar) y alertas.
- [ ] Zona horaria del consultorio correcta en la tabla `Clinic`.
