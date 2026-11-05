#!/bin/sh
set -eu
cd /app/apps/api
if [ "${RESET_DEMO_DATABASE_ONCE:-}" = "yes" ]; then
  ../../node_modules/.bin/prisma migrate reset --force --skip-seed
fi
../../node_modules/.bin/prisma migrate deploy
cd /app
node scripts/railway-seed.mjs
