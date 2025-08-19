const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { createBackup } = require('./backup');

// Configuration
const DB_PATH = path.join(__dirname, '../database.sqlite');
const LOG_FILE = path.join(__dirname, '../logs/health-check.log');
const ALERT_THRESHOLD = {
  dbErrors: 10,
  responseTime: 5000, // 5 seconds
  diskUsage: 90, // 90%
  backupAge: 24 * 60 * 60 * 1000 // 24 hours
};

// Ensure logs directory exists
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Logging function
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  // Append to log file
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// Check database health
async function checkDatabaseHealth() {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(DB_PATH);
    
    // Check if database file exists and is accessible
    if (!fs.existsSync(DB_PATH)) {
      log('Database file not found', 'ERROR');
      resolve({ healthy: false, error: 'Database file not found' });
      return;
    }
    
    // Check database integrity
    db.get('PRAGMA integrity_check', (err, row) => {
      if (err) {
        log(`Database integrity check failed: ${err.message}`, 'ERROR');
        resolve({ healthy: false, error: err.message });
        return;
      }
      
      if (row && row.integrity_check === 'ok') {
        log('Database integrity check passed', 'INFO');
      } else {
        log('Database integrity check failed', 'ERROR');
        resolve({ healthy: false, error: 'Database corruption detected' });
        return;
      }
      
      // Check if tables exist
      db.get('SELECT COUNT(*) as count FROM sqlite_master WHERE type="table"', (err, row) => {
        if (err) {
          log(`Table count check failed: ${err.message}`, 'ERROR');
          resolve({ healthy: false, error: err.message });
          return;
        }
        
        const expectedTables = ['users', 'products', 'orders', 'order_items', 'support_tickets'];
        log(`Found ${row.count} tables in database`, 'INFO');
        
        // Check specific tables
        let missingTables = [];
        expectedTables.forEach(table => {
          db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`, (err, row) => {
            if (err || !row) {
              missingTables.push(table);
            }
          });
        });
        
        setTimeout(() => {
          if (missingTables.length > 0) {
            log(`Missing tables: ${missingTables.join(', ')}`, 'ERROR');
            resolve({ healthy: false, error: `Missing tables: ${missingTables.join(', ')}` });
          } else {
            log('All expected tables present', 'INFO');
            resolve({ healthy: true });
          }
          db.close();
        }, 100);
      });
    });
  });
}

// Check disk usage
function checkDiskUsage() {
  try {
    const stats = fs.statSync(DB_PATH);
    const dbSize = stats.size;
    const dbSizeMB = (dbSize / 1024 / 1024).toFixed(2);
    
    log(`Database size: ${dbSizeMB} MB`, 'INFO');
    
    // Check backup directory size
    const backupDir = path.join(__dirname, '../backups');
    if (fs.existsSync(backupDir)) {
      const backupFiles = fs.readdirSync(backupDir);
      let totalBackupSize = 0;
      
      backupFiles.forEach(file => {
        if (file.startsWith('backup-') && file.endsWith('.sqlite')) {
          const filePath = path.join(backupDir, file);
          const fileStats = fs.statSync(filePath);
          totalBackupSize += fileStats.size;
        }
      });
      
      const backupSizeMB = (totalBackupSize / 1024 / 1024).toFixed(2);
      log(`Total backup size: ${backupSizeMB} MB`, 'INFO');
    }
    
    return { healthy: true, dbSize: dbSizeMB };
  } catch (error) {
    log(`Disk usage check failed: ${error.message}`, 'ERROR');
    return { healthy: false, error: error.message };
  }
}

// Check backup health
async function checkBackupHealth() {
  try {
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      log('Backup directory not found', 'WARN');
      return { healthy: false, error: 'No backup directory' };
    }
    
    const files = fs.readdirSync(backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.sqlite'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          created: stats.mtime,
          size: stats.size
        };
      })
      .sort((a, b) => b.created.getTime() - a.created.getTime());
    
    if (backupFiles.length === 0) {
      log('No backup files found', 'WARN');
      return { healthy: false, error: 'No backup files available' };
    }
    
    const latestBackup = backupFiles[0];
    const backupAge = Date.now() - latestBackup.created.getTime();
    const backupAgeHours = Math.floor(backupAge / (1000 * 60 * 60));
    
    log(`Latest backup: ${latestBackup.name} (${backupAgeHours} hours old)`, 'INFO');
    
    // Check if backup is too old
    if (backupAge > ALERT_THRESHOLD.backupAge) {
      log(`Backup is too old: ${backupAgeHours} hours`, 'WARN');
      return { healthy: false, error: `Backup too old: ${backupAgeHours} hours` };
    }
    
    // Verify latest backup integrity
    const db = new sqlite3.Database(latestBackup.path);
    return new Promise((resolve) => {
      db.get('SELECT COUNT(*) as count FROM sqlite_master', (err, row) => {
        if (err) {
          log(`Backup integrity check failed: ${err.message}`, 'ERROR');
          resolve({ healthy: false, error: `Backup corrupted: ${err.message}` });
        } else {
          log(`Backup verified: ${row.count} tables found`, 'INFO');
          resolve({ 
            healthy: true, 
            backupCount: backupFiles.length,
            latestBackup: latestBackup.name,
            backupAge: backupAgeHours
          });
        }
        db.close();
      });
    });
    
  } catch (error) {
    log(`Backup health check failed: ${error.message}`, 'ERROR');
    return { healthy: false, error: error.message };
  }
}

// Check application health (basic connectivity test)
async function checkApplicationHealth() {
  try {
    // This would typically make an HTTP request to the application
    // For now, we'll just check if the main files exist
    const appFiles = [
      '../app.ts',
      '../bin/www.ts',
      '../database.sqlite'
    ];
    
    let missingFiles = [];
    appFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    });
    
    if (missingFiles.length > 0) {
      log(`Missing application files: ${missingFiles.join(', ')}`, 'ERROR');
      return { healthy: false, error: `Missing files: ${missingFiles.join(', ')}` };
    }
    
    log('Application files present', 'INFO');
    return { healthy: true };
    
  } catch (error) {
    log(`Application health check failed: ${error.message}`, 'ERROR');
    return { healthy: false, error: error.message };
  }
}

// Generate health report
async function generateHealthReport() {
  log('Starting health check...', 'INFO');
  
  const report = {
    timestamp: new Date().toISOString(),
    overall: 'healthy',
    checks: {},
    alerts: []
  };
  
  // Database health check
  const dbHealth = await checkDatabaseHealth();
  report.checks.database = dbHealth;
  if (!dbHealth.healthy) {
    report.overall = 'unhealthy';
    report.alerts.push(`Database: ${dbHealth.error}`);
  }
  
  // Disk usage check
  const diskHealth = checkDiskUsage();
  report.checks.disk = diskHealth;
  if (!diskHealth.healthy) {
    report.overall = 'unhealthy';
    report.alerts.push(`Disk: ${diskHealth.error}`);
  }
  
  // Backup health check
  const backupHealth = await checkBackupHealth();
  report.checks.backup = backupHealth;
  if (!backupHealth.healthy) {
    report.overall = 'unhealthy';
    report.alerts.push(`Backup: ${backupHealth.error}`);
  }
  
  // Application health check
  const appHealth = await checkApplicationHealth();
  report.checks.application = appHealth;
  if (!appHealth.healthy) {
    report.overall = 'unhealthy';
    report.alerts.push(`Application: ${appHealth.error}`);
  }
  
  // Log overall status
  if (report.overall === 'healthy') {
    log('All health checks passed', 'INFO');
  } else {
    log(`Health check failed: ${report.alerts.join(', ')}`, 'ERROR');
  }
  
  return report;
}

// Send alert (placeholder for actual alerting system)
function sendAlert(message, severity = 'WARNING') {
  log(`ALERT [${severity}]: ${message}`, 'ALERT');
  
  // In production, this would send to:
  // - Email notifications
  // - Slack/Discord webhooks
  // - SMS alerts
  // - Monitoring services (DataDog, New Relic, etc.)
  
  console.log(`🚨 ALERT: ${message}`);
}

// Main health check function
async function runHealthCheck() {
  try {
    const report = await generateHealthReport();
    
    // Send alerts for any issues
    if (report.alerts.length > 0) {
      report.alerts.forEach(alert => {
        sendAlert(alert, 'ERROR');
      });
    }
    
    // Auto-backup if backup is too old
    if (report.checks.backup && !report.checks.backup.healthy) {
      log('Creating emergency backup due to backup issues', 'WARN');
      try {
        await createBackup();
        log('Emergency backup created successfully', 'INFO');
      } catch (error) {
        log(`Emergency backup failed: ${error.message}`, 'ERROR');
        sendAlert('Emergency backup failed', 'CRITICAL');
      }
    }
    
    return report;
    
  } catch (error) {
    log(`Health check failed: ${error.message}`, 'ERROR');
    sendAlert(`Health check system error: ${error.message}`, 'CRITICAL');
    throw error;
  }
}

// Command line interface
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'check':
      const report = await runHealthCheck();
      console.log(JSON.stringify(report, null, 2));
      break;
      
    case 'monitor':
      console.log('Starting continuous monitoring...');
      setInterval(async () => {
        try {
          await runHealthCheck();
        } catch (error) {
          console.error('Monitoring error:', error);
        }
      }, 5 * 60 * 1000); // Check every 5 minutes
      break;
      
    default:
      console.log(`
Health Check Tool

Usage:
  node health-check.js check    - Run single health check
  node health-check.js monitor  - Start continuous monitoring

The health check verifies:
- Database integrity and connectivity
- Disk usage and space
- Backup availability and age
- Application file presence
- Overall system health
      `);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runHealthCheck,
  generateHealthReport,
  checkDatabaseHealth,
  checkBackupHealth,
  checkApplicationHealth
}; 