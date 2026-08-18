#!/bin/sh
set -e

# NOTE: This automatic startup sequencing (migrations + seeding) is intended for local 
# development via Docker Compose. In a true production environment, migrations and 
# seeds should generally be handled explicitly by the CI/CD pipeline or deployment scripts.

echo "[STARTUP] Running database migrations..."
npm run migrate

echo "[STARTUP] Seeding administrator..."
npm run seed:admin

echo "[STARTUP] Seeding development users..."
npm run seed:test-users

echo "[STARTUP] Seeding development products..."
npm run seed:test-products

echo "[STARTUP] Starting API server..."
if [ "$NODE_ENV" = "development" ]; then
  exec npm run dev
else
  exec npm start
fi
