# Railway Log Capture Scripts

This directory contains scripts to automatically capture Railway deployment logs.

## Quick Usage

### Capture logs quickly (when issues occur)
```bash
npm run logs
```
This creates a single log file with recent logs from both backend and frontend services.

### Capture detailed logs
```bash
npm run logs:detailed
```
This creates separate log files for each service plus a combined file with more detailed information.

## Log Files

Logs are saved to the `logs/` directory with timestamps:
- `logs/railway_logs_YYYYMMDD_HHMMSS.txt` - Quick capture
- `logs/backend_YYYYMMDD_HHMMSS.log` - Backend only
- `logs/frontend_YYYYMMDD_HHMMSS.log` - Frontend only
- `logs/combined_YYYYMMDD_HHMMSS.log` - Combined detailed logs

## Manual Commands

You can also run Railway CLI commands directly:

```bash
# View backend logs
railway logs --service backend

# View frontend logs  
railway logs --service frontend

# View all logs
railway logs

# Follow logs in real-time
railway logs --follow
```

## Troubleshooting

If you get authentication errors, run:
```bash
railway login --browserless
```

If the project isn't linked, run:
```bash
railway link
```
