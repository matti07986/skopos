#!/bin/bash
echo "=== ULTIMO BACKUP LOCALE (log) ==="
tail -20 /var/log/skopos/backup.log 2>/dev/null || echo "(nessun log ancora)"
echo ""
echo "=== BACKUP SULLA STORAGE BOX ==="
ssh storagebox "ls -lh backups/postgres/ | tail -10"
echo ""
echo "=== SPAZIO USATO SULLA BOX ==="
ssh storagebox "du -sh backups/"
