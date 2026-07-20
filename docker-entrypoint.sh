#!/bin/sh
# Aplica migraciones pendientes contra DATABASE_URL antes de levantar el server.
# `migrate deploy` (a diferencia de `migrate dev`) no es interactivo y no resetea
# la base: es seguro correrlo en cada arranque del contenedor en producción.
set -e

echo "[docker-entrypoint] Aplicando migraciones de Prisma..."
node_modules/.bin/prisma migrate deploy

echo "[docker-entrypoint] Iniciando servidor..."
exec "$@"
