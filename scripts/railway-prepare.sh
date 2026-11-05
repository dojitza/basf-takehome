#!/bin/sh
set -eu
cd /app/apps/api
../../node_modules/.bin/prisma migrate deploy
cd /app
node scripts/railway-seed.mjs
