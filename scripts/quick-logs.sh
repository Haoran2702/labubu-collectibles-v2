#!/bin/bash

# Quick Railway Log Capture
# Simple script to quickly capture logs when issues occur

LOG_DIR="logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/railway_logs_${TIMESTAMP}.txt"

echo "🚂 Capturing Railway logs..."
echo "📄 Saving to: $LOG_FILE"

# Capture backend logs with timeout (macOS compatible)
echo "=== BACKEND LOGS ===" > "$LOG_FILE"
(railway logs --service labubu-backend & sleep 8; kill $! 2>/dev/null) >> "$LOG_FILE" 2>&1 || true

echo "" >> "$LOG_FILE"
echo "=== FRONTEND LOGS ===" >> "$LOG_FILE"
(railway logs --service labubu-frontend & sleep 8; kill $! 2>/dev/null) >> "$LOG_FILE" 2>&1 || true

# If frontend logs are empty, add a note
if [ ! -s "$LOG_FILE" ] || [ $(wc -l < "$LOG_FILE") -lt 10 ]; then
    echo "" >> "$LOG_FILE"
    echo "Note: Frontend logs may be minimal as Next.js is mostly static in production" >> "$LOG_FILE"
fi

echo "✅ Logs captured: $LOG_FILE"
echo "📊 File size: $(du -h "$LOG_FILE" | cut -f1)"
