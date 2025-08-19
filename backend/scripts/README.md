# Disaster Recovery & Backup System

This directory contains comprehensive disaster recovery tools for the Labubu Collectibles e-commerce platform.

## 📁 Files Overview

- **`backup.js`** - Database backup and restore utility
- **`health-check.js`** - System health monitoring and alerting
- **`setup-cron.js`** - Automated cron job setup for backups and monitoring
- **`disaster-recovery.md`** - Complete disaster recovery procedures

## 🚀 Quick Start

### 1. Manual Backup
```bash
# Create a backup
npm run backup

# List available backups
npm run backup:list

# Restore from backup
npm run backup:restore backups/backup-2024-01-15T10-30-00.sqlite

# Clean up old backups
npm run backup:cleanup
```

### 2. Health Monitoring
```bash
# Run health check
npm run health:check

# Start continuous monitoring
npm run health:monitor
```

### 3. Automated Setup
```bash
# Set up automated cron jobs
node scripts/setup-cron.js install

# Check cron job status
node scripts/setup-cron.js status

# Remove cron jobs
node scripts/setup-cron.js remove
```

## 🔧 Backup System

### Features
- **Automated backups** with timestamping
- **Integrity verification** of backup files
- **Retention management** (30 days, max 30 files)
- **Compression** and efficient storage
- **Restore procedures** with safety checks

### Backup Schedule
- **Daily backup**: 2:00 AM
- **Cleanup**: 3:00 AM (removes old backups)
- **Manual backups**: On-demand via npm scripts

### Backup Location
- **Directory**: `backend/backups/`
- **Format**: `backup-YYYY-MM-DDTHH-MM-SS.sqlite`
- **Size**: Typically 1-5 MB per backup

### Restore Process
1. **Safety check**: Creates temporary backup of current database
2. **Integrity verification**: Validates backup file before restore
3. **Restore**: Copies backup to main database location
4. **Cleanup**: Removes temporary files
5. **Verification**: Confirms restore success

## 🏥 Health Monitoring

### What's Monitored
- **Database integrity** and connectivity
- **Disk usage** and space availability
- **Backup health** and age verification
- **Application file** presence and accessibility
- **System performance** metrics

### Alert Thresholds
- **Database errors**: > 10 per hour
- **Response time**: > 5 seconds
- **Disk usage**: > 90%
- **Backup age**: > 24 hours

### Alert Channels
- **Console output** with timestamps
- **Log files** in `backend/logs/`
- **Emergency backups** when issues detected
- **Extensible** for email/SMS/Slack alerts

## ⚡ Automated Cron Jobs

### Installed Jobs
1. **Daily Database Backup** (2:00 AM)
   - Creates timestamped backup
   - Verifies integrity
   - Logs success/failure

2. **Backup Cleanup** (3:00 AM)
   - Removes backups older than 30 days
   - Keeps maximum 30 backup files
   - Maintains disk space

3. **Health Check** (Every 15 minutes)
   - Monitors system health
   - Sends alerts for issues
   - Creates emergency backups if needed

### Cron Job Management
```bash
# Install cron jobs
node scripts/setup-cron.js install

# Check status
node scripts/setup-cron.js status

# Remove cron jobs
node scripts/setup-cron.js remove

# Generate crontab entries
node scripts/setup-cron.js generate
```

## 🚨 Disaster Scenarios

### 1. Database Corruption
**Symptoms**: Application crashes, database errors
**Recovery**: 
```bash
# Stop application
# Restore from backup
npm run backup:restore backups/backup-[timestamp].sqlite
# Restart application
```

### 2. Server Failure
**Symptoms**: Server unreachable, no response
**Recovery**:
1. Restore server from backup
2. Install dependencies
3. Restore database
4. Restart services
5. Verify functionality

### 3. Data Loss
**Symptoms**: Missing orders, inconsistent data
**Recovery**:
1. Identify affected data
2. Restore from appropriate backup
3. Replay missing transactions
4. Verify data consistency

### 4. Security Breach
**Symptoms**: Unusual activity, suspicious transactions
**Recovery**:
1. Isolate affected systems
2. Change passwords/keys
3. Restore from clean backup
4. Implement security measures

## 📊 Monitoring & Alerts

### Health Check Commands
```bash
# Single health check
npm run health:check

# Continuous monitoring
npm run health:monitor

# Check specific components
node scripts/health-check.js check
```

### Log Files
- **Health check logs**: `backend/logs/health-check.log`
- **Backup logs**: Console output with timestamps
- **Application logs**: Standard application logging

### Alert Integration
The system is designed to integrate with:
- **Email notifications** (SendGrid, Mailgun)
- **Slack/Discord webhooks**
- **SMS alerts**
- **Monitoring services** (DataDog, New Relic)

## 🔒 Security Considerations

### Backup Security
- **Backup files** are excluded from git
- **Temporary files** are automatically cleaned up
- **Integrity checks** prevent corrupted restores
- **Access control** via file permissions

### Monitoring Security
- **Health checks** don't expose sensitive data
- **Log files** contain only system information
- **Alert messages** are sanitized
- **No credentials** stored in logs

## 📈 Performance Impact

### Backup Performance
- **Backup time**: ~1-5 seconds for typical database
- **Storage**: ~1-5 MB per backup
- **CPU usage**: Minimal during backup
- **I/O impact**: Brief file copy operation

### Monitoring Performance
- **Health check time**: ~2-5 seconds
- **Memory usage**: < 10 MB
- **CPU usage**: < 1% during checks
- **Network**: No external calls (local only)

## 🛠️ Troubleshooting

### Common Issues

**Backup fails**
```bash
# Check disk space
df -h

# Check file permissions
ls -la backend/database.sqlite

# Check backup directory
ls -la backend/backups/
```

**Health check fails**
```bash
# Check database file
ls -la backend/database.sqlite

# Check application files
ls -la backend/app.ts backend/bin/www.ts

# Check logs
tail -f backend/logs/health-check.log
```

**Cron jobs not running**
```bash
# Check cron service
sudo systemctl status cron

# Check crontab
crontab -l

# Check cron logs
sudo tail -f /var/log/cron
```

### Recovery Procedures

**Emergency backup creation**
```bash
# Force backup creation
node scripts/backup.js backup

# Verify backup
node scripts/backup.js list
```

**Manual health check**
```bash
# Run comprehensive check
node scripts/health-check.js check

# Check specific component
node -e "const { checkDatabaseHealth } = require('./health-check.js'); checkDatabaseHealth().then(console.log)"
```

## 📚 Documentation

### Related Files
- **`disaster-recovery.md`** - Complete disaster recovery procedures
- **`../package.json`** - NPM scripts for easy access
- **`../.gitignore`** - Backup files excluded from version control

### External Resources
- **SQLite documentation**: https://www.sqlite.org/
- **Cron documentation**: https://man7.org/linux/man-pages/man5/crontab.5.html
- **Node.js file system**: https://nodejs.org/api/fs.html

## 🤝 Contributing

### Adding New Health Checks
1. Add check function to `health-check.js`
2. Integrate into `generateHealthReport()`
3. Add appropriate alerts
4. Update documentation

### Adding New Backup Features
1. Extend `backup.js` with new functionality
2. Add npm scripts to `package.json`
3. Update cron job setup if needed
4. Test thoroughly before deployment

### Reporting Issues
1. Check logs in `backend/logs/`
2. Run health check: `npm run health:check`
3. Verify backup integrity: `npm run backup:list`
4. Document issue with timestamps and error messages

## 📞 Support

For issues with the disaster recovery system:
1. Check this README for troubleshooting steps
2. Review `disaster-recovery.md` for procedures
3. Check health status: `npm run health:check`
4. Verify backups: `npm run backup:list`
5. Contact system administrator with logs and error details 