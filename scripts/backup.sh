#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
destination=${1:-backups}
mkdir -p "$destination"
umask 077
archive="$destination/quizzle-$(date -u +%Y%m%dT%H%M%SZ)-$$.dump"
partial="$archive.partial"
cleanup() {
  local result=$?
  trap - EXIT
  rm -f "$partial"
  exit "$result"
}
trap cleanup EXIT
docker compose exec -T postgres sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" exec pg_dump --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --format=custom' \
  >"$partial"
test -s "$partial"
mv "$partial" "$archive"
echo "Backup written to $archive"
