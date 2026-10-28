#!/bin/sh
set -e

run_with_retry() {
  description="$1"
  shift
  max_attempts="${STARTUP_RETRY_ATTEMPTS:-10}"
  retry_delay="${STARTUP_RETRY_DELAY_SECONDS:-5}"
  attempt=1

  while ! "$@"; do
    if [ "$attempt" -ge "$max_attempts" ]; then
      echo "[STARTUP ERROR] ${description} failed after ${max_attempts} attempts."
      return 1
    fi

    echo "[STARTUP WARNING] ${description} failed (attempt ${attempt}/${max_attempts}); retrying in ${retry_delay}s..."
    attempt=$((attempt + 1))
    sleep "$retry_delay"
  done
}

echo "[STARTUP] Running database migrations..."
run_with_retry "Database migration" npm run migrate

echo "[STARTUP] Seeding administrator..."
run_with_retry "Administrator seed" npm run seed:admin

if [ "${SEED_TEST_DATA:-false}" = "true" ]; then
  echo "[STARTUP] Seeding development users..."
  run_with_retry "Development user seed" npm run seed:test-users

  echo "[STARTUP] Seeding development products..."
  run_with_retry "Development product seed" npm run seed:test-products
else
  echo "[STARTUP] Development seeds disabled (SEED_TEST_DATA is not true)."
fi

echo "[STARTUP] Starting API server..."
if [ "$NODE_ENV" = "development" ]; then
  exec npm run dev
else
  exec node src/server.js
fi
