#!/bin/bash

# Weekly/monthly Postgres backup for Personal Finance Manager.
# Called by cron as: backup.sh weekly   or   backup.sh monthly
# Dumps land in $BACKUP_DIR (bind-mounted to a host path in docker-compose.yml),
# so pointing that host path at your HDD/Time Machine/rsync target is all that's
# needed to get these off the server.

set -euo pipefail

KIND="${1:?Usage: backup.sh weekly|monthly}"

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-financeuser}"
DB_NAME="${DB_NAME:-financedb}"
export PGPASSWORD="${DB_PASSWORD:-financepass}"

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_WEEKLY="${RETENTION_WEEKLY:-8}"
RETENTION_MONTHLY="${RETENTION_MONTHLY:-12}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="personal_finance_${KIND}_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

echo "==================================="
echo "Running ${KIND} backup"
echo "Date: $(date)"
echo "==================================="

if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$FILEPATH"; then
  echo "✅ SUCCESS: wrote ${FILEPATH} ($(du -h "$FILEPATH" | cut -f1))"
else
  echo "❌ FAILED: pg_dump for ${KIND} backup"
  rm -f "$FILEPATH"
  exit 1
fi

case "$KIND" in
  weekly)  RETENTION="$RETENTION_WEEKLY" ;;
  monthly) RETENTION="$RETENTION_MONTHLY" ;;
  *)       echo "Unknown backup kind '${KIND}', skipping retention prune"; exit 0 ;;
esac

# Keep only the newest $RETENTION dumps of this kind; delete the rest.
mapfile -t OLD_DUMPS < <(ls -1t "${BACKUP_DIR}"/personal_finance_"${KIND}"_*.sql.gz 2>/dev/null | tail -n +$((RETENTION + 1)))
for old in "${OLD_DUMPS[@]:-}"; do
  [ -n "$old" ] || continue
  echo "🗑  Pruning old ${KIND} backup: ${old}"
  rm -f "$old"
done

echo "Done. $(ls -1 "${BACKUP_DIR}"/personal_finance_"${KIND}"_*.sql.gz 2>/dev/null | wc -l) ${KIND} backup(s) retained."
