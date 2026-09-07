#!/bin/sh
set -e

echo "==> Applying database migrations"
npx prisma migrate deploy

if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "==> Seeding database (set SEED_ON_START=false to skip)"
  npx prisma db seed
fi

echo "==> Starting API"
exec node dist/main
