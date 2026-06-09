#!/bin/sh
set -e

echo "[entrypoint] Running migrations..."
npx node-pg-migrate up

echo "[entrypoint] Starting server..."
exec node dist/index.js
