# syntax=docker/dockerfile:1

# ---- deps: install all dependencies (needed to build) ----------------------
# --ignore-scripts: el postinstall corre `prisma generate`, que necesita el
# schema (prisma/schema.prisma) — todavía no copiado en esta etapa. Se genera
# explícitamente en la etapa "builder", una vez copiado el código completo.
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ---- builder: generate Prisma client and build the Next.js app ------------
FROM node:20-slim AS builder
WORKDIR /app
# Prisma necesita OpenSSL para detectar la versión correcta del motor.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables NEXT_PUBLIC_* : Next.js las inlinea en el bundle del cliente en
# build time, no en runtime — deben llegar como build args desde Coolify.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_CLINIC_TZ
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_CLINIC_TZ=$NEXT_PUBLIC_CLINIC_TZ

RUN npx prisma generate
RUN npm run build

# ---- runner: minimal production image --------------------------------------
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# El server.js standalone usa HOSTNAME como dirección de bind. Docker fija
# HOSTNAME al ID del contenedor por defecto, lo que hace que Next.js escuche
# solo en esa dirección puntual (inalcanzable desde otros contenedores, ej.
# el proxy de Coolify). Forzamos 0.0.0.0 para escuchar en todas las interfaces.
ENV HOSTNAME=0.0.0.0

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system nodejs && useradd --system --gid nodejs nextjs

# Next.js standalone output (traced runtime deps only)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma CLI (con todas sus dependencias internas, ej. el motor wasm) +
# schema/migrations, necesarios en el arranque para correr `migrate deploy`.
# Se copia node_modules completo (no solo el subset trazado por standalone)
# porque la CLI de Prisma no es parte del bundle de servidor rastreado.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules ./node_modules

# El cliente generado de Prisma (output custom en src/generated/prisma) ya
# queda embebido en el bundle de Next.js vía webpack, pero scripts sueltos
# como prisma/seed.ts lo requieren directamente desde el filesystem — se
# copia para poder correr `db:seed` dentro del contenedor desplegado.
COPY --from=builder /app/src/generated ./src/generated

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
