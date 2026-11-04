#!/usr/bin/env bash
# Installs the latest code from main, applies migrations and restarts the API.
set -euo pipefail

APP_DIR=/opt/portafolio/api
ENV_FILE=/etc/portafolio/api.env

as_app() {
  sudo -u portafolio -H bash -c "set -euo pipefail; cd $APP_DIR; export PATH=/snap/node/current/bin:\$PATH NODE_OPTIONS=--max-old-space-size=768; set -a; . $ENV_FILE; set +a; export NODE_ENV=development; $1"
}

# Everything runs from main(): git may replace this file while it runs, and bash
# reads scripts as it goes. Inside a function the whole body is already in memory.
main() {
  as_app 'git fetch --quiet origin main && git reset --quiet --hard origin/main'
  as_app 'npm ci --no-audit --no-fund'
  as_app 'npx prisma generate'
  as_app 'npx prisma migrate deploy'
  as_app 'npm run build'
  systemctl restart portafolio-api

  for _ in $(seq 1 30); do
    if curl -fs -o /dev/null http://127.0.0.1:3000/api/health; then
      echo 'API en linea.'
      return 0
    fi
    sleep 2
  done
  echo 'La API no respondio despues de reiniciar.' >&2
  return 1
}

main "$@"
exit
