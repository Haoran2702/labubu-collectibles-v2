const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const sqlite3 = require('sqlite3').verbose();

// Configuration
const BACKUP_DIR = path.join(__dirname, '../backups');
const DB_PATH = path.join(__dirname, '../database.sqlite');
const MAX_BACKUPS = 30; // Keep last 30 backups
const BACKUP_RETENTION_DAYS = 30;

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate backup filename with timestamp
function generateBackupFilename() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `backup-${timestamp}.sqlite`;
}

// Create backup
async function createBackup() {
  const backupFilename = generateBackupFilename();
  const backupPath = path.join(BACKUP_DIR, backupFilename);
  
  console.log(`Creating backup: ${backupFilename}`);
  
  try {
    // Copy database file
    fs.copyFileSync(DB_PATH, backupPath);
    
    // Verify backup integrity
    const db = new sqlite3.Database(backupPath);
    await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM sqlite_master', (err, row) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Backup verified: ${row.count} tables found`);
          resolve();
        }
      });
    });
    db.close();
    
    console.log(`Backup created successfully: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('Backup failed:', error);
    // Clean up failed backup
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
    throw error;
  }
}

// Clean up old backups
function cleanupOldBackups() {
  console.log('Cleaning up old backups...');
  
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backupFiles = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.sqlite'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        stats: fs.statSync(path.join(BACKUP_DIR, file))
      }))
      .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());
    
    // Remove files older than retention period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - BACKUP_RETENTION_DAYS);
    
    let removedCount = 0;
    backupFiles.forEach(file => {
      if (file.stats.mtime < cutoffDate) {
        fs.unlinkSync(file.path);
        console.log(`Removed old backup: ${file.name}`);
        removedCount++;
      }
    });
    
    // Keep only MAX_BACKUPS most recent files
    if (backupFiles.length > MAX_BACKUPS) {
      const filesToRemove = backupFiles.slice(MAX_BACKUPS);
      filesToRemove.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`Removed excess backup: ${file.name}`);
        removedCount++;
      });
    }
    
    console.log(`Cleanup complete: removed ${removedCount} old backups`);
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

// List available backups
function listBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backupFiles = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.sqlite'))
      .map(file => {
        const stats = fs.statSync(path.join(BACKUP_DIR, file));
        return {
          name: file,
          size: stats.size,
          created: stats.mtime,
          path: path.join(BACKUP_DIR, file)
        };
      })
      .sort((a, b) => b.created.getTime() - a.created.getTime());
    
    console.log('\nAvailable backups:');
    backupFiles.forEach((file, index) => {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      console.log(`${index + 1}. ${file.name} (${sizeMB} MB) - ${file.created.toLocaleString()}`);
    });
    
    return backupFiles;
  } catch (error) {
    console.error('Failed to list backups:', error);
    return [];
  }
}

// Restore from backup
async function restoreFromBackup(backupPath) {
  console.log(`Restoring from backup: ${backupPath}`);
  
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }
  
  try {
    // Create a temporary backup of current database
    const tempBackup = path.join(BACKUP_DIR, `temp-restore-${Date.now()}.sqlite`);
    if (fs.existsSync(DB_PATH)) {
      fs.copyFileSync(DB_PATH, tempBackup);
      console.log('Created temporary backup of current database');
    }
    
    // Verify backup integrity before restore
    const db = new sqlite3.Database(backupPath);
    await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM sqlite_master', (err, row) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Backup verified: ${row.count} tables found`);
          resolve();
        }
      });
    });
    db.close();
    
    // Stop any running processes that might be using the database
    console.log('Stopping backend processes...');
    // Note: In production, you'd want to properly stop the application
    
    // Copy backup to main database location
    fs.copyFileSync(backupPath, DB_PATH);
    
    console.log('Database restored successfully');
    console.log('Please restart the backend application');
    
    // Clean up temp backup
    if (fs.existsSync(tempBackup)) {
      fs.unlinkSync(tempBackup);
    }
    
  } catch (error) {
    console.error('Restore failed:', error);
    
    // Attempt to restore from temp backup
    const tempBackup = path.join(BACKUP_DIR, `temp-restore-${Date.now()}.sqlite`);
    if (fs.existsSync(tempBackup)) {
      console.log('Attempting to restore from temporary backup...');
      fs.copyFileSync(tempBackup, DB_PATH);
      console.log('Temporary backup restored');
    }
    
    throw error;
  }
}

// Main function
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'backup':
      try {
        await createBackup();
        cleanupOldBackups();
        console.log('Backup process completed successfully');
      } catch (error) {
        console.error('Backup process failed:', error);
        process.exit(1);
      }
      break;
      
    case 'list':
      listBackups();
      break;
      
    case 'restore':
      const backupPath = process.argv[3];
      if (!backupPath) {
        console.error('Usage: node backup.js restore <backup-file>');
        process.exit(1);
      }
      try {
        await restoreFromBackup(backupPath);
      } catch (error) {
        console.error('Restore failed:', error);
        process.exit(1);
      }
      break;
      
    case 'cleanup':
      cleanupOldBackups();
      break;
      
    default:
      console.log(`
Database Backup Tool

Usage:
  node backup.js backup          - Create a new backup
  node backup.js list           - List available backups
  node backup.js restore <file> - Restore from backup file
  node backup.js cleanup        - Clean up old backups

Examples:
  node backup.js backup
  node backup.js list
  node backup.js restore backups/backup-2024-01-15T10-30-00.sqlite
  node backup.js cleanup
      `);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createBackup,
  cleanupOldBackups,
  listBackups,
  restoreFromBackup
}; 