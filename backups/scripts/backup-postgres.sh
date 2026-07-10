#!/bin/bash
set -euo pipefail

# === CONFIG ===
DB_CONTAINER="infra-db-1"
DB_USER="logtail"
DB_NAME="logtail"
REMOTE_DIR="backups/postgres"
RETENTION_DAYS=30
LOG_FILE="/var/log/skopos/backup.log"
TMP_DIR="/tmp/skopos-backup"

# === SETUP ===
mkdir -p "$TMP_DIR"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
DUMP_FILE="$TMP_DIR/skopos_${TIMESTAMP}.sql.gz"

log() { echo "[$(date -u +'%Y-%m-%d %H:%M:%S UTC')] $*" | tee -a "$LOG_FILE"; }
fail() { log "ERROR: $*"; rm -f "$DUMP_FILE"; exit 1; }

log "=== Backup started: skopos_${TIMESTAMP}.sql.gz ==="

# === DUMP ===
log "Dumping database '$DB_NAME' from container '$DB_CONTAINER'..."
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --quote-all-identifiers \
    | gzip -9 > "$DUMP_FILE" || fail "pg_dump failed"

DUMP_SIZE=$(stat -c%s "$DUMP_FILE")
log "Dump created: $(numfmt --to=iec-i --suffix=B "$DUMP_SIZE")"

# Verifica integrità gzip
gzip -t "$DUMP_FILE" || fail "gzip integrity check failed"

# === UPLOAD ===
log "Uploading to Storage Box..."
scp -q "$DUMP_FILE" "storagebox:$REMOTE_DIR/" || fail "scp upload failed"

# Verifica dimensione remota
REMOTE_SIZE=$(ssh storagebox "stat -c%s $REMOTE_DIR/skopos_${TIMESTAMP}.sql.gz" 2>/dev/null || echo "0")
[ "$REMOTE_SIZE" = "$DUMP_SIZE" ] || fail "Size mismatch (local=$DUMP_SIZE remote=$REMOTE_SIZE)"
log "Upload verified ($REMOTE_SIZE bytes match)"

# === CLEANUP LOCAL ===
rm -f "$DUMP_FILE"

# === RETENTION (remote) ===
log "Pruning remote backups older than $RETENTION_DAYS days..."
CUTOFF=$(date -u -d "$RETENTION_DAYS days ago" +"%Y%m%d")
REMOTE_FILES=$(ssh storagebox "ls $REMOTE_DIR/" 2>/dev/null | grep -E '^skopos_[0-9]{8}_.*\.sql\.gz$' || true)
DELETED=0
for f in $REMOTE_FILES; do
    FDATE=$(echo "$f" | sed -E 's/skopos_([0-9]{8})_.*/\1/')
    if [ "$FDATE" \< "$CUTOFF" ]; then
        ssh storagebox "rm -f $REMOTE_DIR/$f" && log "deleted $f" && DELETED=$((DELETED+1))
    fi
done
log "Retention: $DELETED file(s) removed"

log "=== Backup completed successfully ==="
