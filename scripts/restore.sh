#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
archive=${1:?Usage: bash scripts/restore.sh BACKUP.dump [--confirm]}
test -f "$archive" && test -s "$archive"
if [[ ${2:-} != --confirm ]]; then
  read -r -p "Replace the configured Quizzle database from $archive? Type RESTORE: " confirmation
  [[ $confirmation == RESTORE ]] || { echo "Restore cancelled" >&2; exit 1; }
fi
docker compose exec -T postgres pg_restore --list <"$archive" >/dev/null
docker compose exec -T postgres sh -c \
  'case "$POSTGRES_DB" in postgres|template0|template1|"") echo "Refusing to replace a maintenance database" >&2; exit 1;; esac'
docker compose stop quizzle
# Replace the database, not just backed-up objects: otherwise post-backup migrations survive.
# A failed restore intentionally leaves the application stopped; retain the original backup.
docker compose exec -T postgres sh -c \
  'export PGPASSWORD="$POSTGRES_PASSWORD"; dropdb --username="$POSTGRES_USER" --maintenance-db=postgres --force --if-exists -- "$POSTGRES_DB" && createdb --username="$POSTGRES_USER" --owner="$POSTGRES_USER" -- "$POSTGRES_DB"'
docker compose exec -T postgres sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" exec pg_restore --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --no-owner --no-privileges --single-transaction --exit-on-error' \
  <"$archive"
echo "Restore completed; application remains stopped. Select the compatible application version, then run docker compose up -d quizzle and confirm health."
