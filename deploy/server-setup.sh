#!/usr/bin/env bash
# Prepares a fresh Ubuntu 24.04 arm64 server. Safe to run again.
#   SITE_ORIGIN=https://xxxx.cloudfront.net BACKUP_BUCKET=nombre bash deploy/server-setup.sh
# The secrets are generated here and stay in /etc/portafolio: they are never printed.
set -euo pipefail

: "${SITE_ORIGIN:?Falta SITE_ORIGIN}"
: "${BACKUP_BUCKET:?Falta BACKUP_BUCKET}"

APP_DIR=/opt/portafolio/api
CONFIG_DIR=/etc/portafolio
ENV_FILE="$CONFIG_DIR/api.env"
UPLOADS_DIR=/var/lib/portafolio/uploads
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export DEBIAN_FRONTEND=noninteractive

# 1 GB of RAM is not enough to compile: swap covers the builds.
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo 'vm.swappiness=10' > /etc/sysctl.d/90-portafolio.conf
  sysctl --system > /dev/null
fi

apt-get update -q
apt-get install -y -q ca-certificates curl git nginx unattended-upgrades

if [ ! -f /etc/apt/sources.list.d/pgdg.list ]; then
  install -d /usr/share/postgresql-common/pgdg
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
    -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc
  echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt noble-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list
  apt-get update -q
fi
apt-get install -y -q postgresql-18

snap list node > /dev/null 2>&1 || snap install node --channel=22/stable --classic
snap list aws-cli > /dev/null 2>&1 || snap install aws-cli --classic

id portafolio > /dev/null 2>&1 || useradd --system --create-home --home-dir /opt/portafolio --shell /usr/sbin/nologin portafolio
install -d -o portafolio -g portafolio "$(dirname "$UPLOADS_DIR")" "$UPLOADS_DIR"
install -d -m 750 -o root -g portafolio "$CONFIG_DIR"

cat > /etc/postgresql/18/main/conf.d/portafolio.conf <<'CONF'
# Sized for a server with 1 GB of RAM shared with the API.
max_connections = 20
shared_buffers = 128MB
effective_cache_size = 384MB
work_mem = 4MB
maintenance_work_mem = 32MB
CONF
systemctl restart postgresql

if [ ! -f "$ENV_FILE" ]; then
  db_password="$(openssl rand -hex 32)"
  jwt_secret="$(openssl rand -hex 48)"
  sudo -u postgres psql -v ON_ERROR_STOP=1 -q <<SQL
CREATE ROLE portafolio LOGIN PASSWORD '$db_password';
CREATE DATABASE portafolio OWNER portafolio;
SQL
  umask 027
  cat > "$ENV_FILE" <<ENV
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://portafolio:$db_password@localhost:5432/portafolio?schema=public
JWT_SECRET=$jwt_secret
JWT_EXPIRES_IN=2h
CORS_ORIGINS=$SITE_ORIGIN
COOKIE_SECURE=true
SWAGGER_ENABLED=false
RATE_LIMIT_ENABLED=true
TRUST_PROXY_HOPS=2
UPLOADS_DIR=$UPLOADS_DIR
ENV
  chown root:portafolio "$ENV_FILE"
  umask 022
fi
sed -i "s#^CORS_ORIGINS=.*#CORS_ORIGINS=$SITE_ORIGIN#" "$ENV_FILE"
echo "BACKUP_BUCKET=$BACKUP_BUCKET" > "$CONFIG_DIR/backup.env"

if [ ! -d "$APP_DIR/.git" ]; then
  sudo -u portafolio git clone --quiet https://github.com/Ayllescas34/portafolio-backend.git "$APP_DIR"
fi

install -m 644 "$SOURCE_DIR/portafolio-api.service" "$SOURCE_DIR/portafolio-backup.service" \
  "$SOURCE_DIR/portafolio-backup.timer" /etc/systemd/system/
install -m 644 "$SOURCE_DIR/nginx.conf" /etc/nginx/sites-available/portafolio
ln -sf /etc/nginx/sites-available/portafolio /etc/nginx/sites-enabled/portafolio
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl daemon-reload
systemctl enable --quiet portafolio-api portafolio-backup.timer nginx
systemctl restart nginx
systemctl start portafolio-backup.timer

bash "$SOURCE_DIR/update.sh"
echo 'Servidor listo.'
