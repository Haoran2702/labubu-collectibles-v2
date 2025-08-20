#!/bin/bash

# Railway Log Capture Script
# Captures logs for both backend and frontend services

LOG_DIR="logs"
mkdir -p "$LOG_DIR"

# Get current timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🚂 Railway Log Capture Started at $(date)"
echo "📁 Logs will be saved to: $LOG_DIR/"

# Function to capture logs for a service
capture_service_logs() {
    local service_name=$1
    local log_file="$LOG_DIR/${service_name}_${TIMESTAMP}.log"
    
    echo "📝 Capturing logs for $service_name..."
    echo "📄 Log file: $log_file"
    
    # Capture logs with timestamp and timeout (macOS compatible)
    (railway logs --service "$service_name" & sleep 12; kill $! 2>/dev/null) > "$log_file" 2>&1 || true
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully captured logs for $service_name"
        echo "📊 Log file size: $(du -h "$log_file" | cut -f1)"
    else
        echo "❌ Failed to capture logs for $service_name"
    fi
    
    echo "---"
}

# Capture logs for both services
echo "🔧 Capturing backend logs..."
capture_service_logs "labubu-backend"

echo "🎨 Capturing frontend logs..."
capture_service_logs "labubu-frontend"

# Create a combined log file
COMBINED_LOG="$LOG_DIR/combined_${TIMESTAMP}.log"
echo "🔗 Creating combined log file: $COMBINED_LOG"

{
    echo "=== RAILWAY LOGS COMBINED ==="
    echo "Timestamp: $(date)"
    echo "Project: Labubu-Collectibles"
    echo "Environment: production"
    echo ""
    echo "=== BACKEND LOGS ==="
    cat "$LOG_DIR/labubu-backend_${TIMESTAMP}.log"
    echo ""
    echo "=== FRONTEND LOGS ==="
    cat "$LOG_DIR/labubu-frontend_${TIMESTAMP}.log"
} > "$COMBINED_LOG"

echo "✅ Combined log created: $COMBINED_LOG"
echo "📊 Combined log size: $(du -h "$COMBINED_LOG" | cut -f1)"

echo ""
echo "🎯 Log capture complete!"
echo "📁 Check the '$LOG_DIR' directory for log files"
echo "📄 Most recent combined log: $COMBINED_LOG"
