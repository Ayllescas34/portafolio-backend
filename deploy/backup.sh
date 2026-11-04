#!/usr/bin/env bash
# Daily copy of the database and the uploaded files to S3.
set -euo pipefail

set -a
. /etc/portafolio/api.env
. /etc/portafolio/backup.env
set +a

stamp="$(date -u +%Y-%m-%dT%H%M%SZ)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# pg_dump rejects Prisma's ?schema= parameter.
pg_dump --format=custom --no-owner --dbname="${DATABASE_URL%%\?*}" --file="$work/portafolio.dump"
tar -czf "$work/uploads.tar.gz" -C "$UPLOADS_DIR" .

/snap/aws-cli/current/bin/aws s3 cp --only-show-errors "$work/portafolio.dump" "s3://$BACKUP_BUCKET/db/$stamp.dump"
/snap/aws-cli/current/bin/aws s3 cp --only-show-errors "$work/uploads.tar.gz" "s3://$BACKUP_BUCKET/uploads/$stamp.tar.gz"
echo "Copia completada: $stamp"
