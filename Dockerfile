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
RUN npx prisma generate
RUN npm run build

# ---- runner: minimal production image --------------------------------------
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

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

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
