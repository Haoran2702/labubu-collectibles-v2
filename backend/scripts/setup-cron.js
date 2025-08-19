const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const BACKUP_SCRIPT = path.join(__dirname, 'backup.js');
const HEALTH_SCRIPT = path.join(__dirname, 'health-check.js');
const PROJECT_ROOT = path.join(__dirname, '..');

// Cron job templates
const CRON_JOBS = [
  {
    name: 'Daily Database Backup',
    schedule: '0 2 * * *', // 2:00 AM daily
    command: `cd ${PROJECT_ROOT} && node scripts/backup.js backup`,
    description: 'Creates daily database backup at 2:00 AM'
  },
  {
    name: 'Backup Cleanup',
    schedule: '0 3 * * *', // 3:00 AM daily
    command: `cd ${PROJECT_ROOT} && node scripts/backup.js cleanup`,
    description: 'Cleans up old backup files at 3:00 AM'
  },
  {
    name: 'Health Check',
    schedule: '*/15 * * * *', // Every 15 minutes
    command: `cd ${PROJECT_ROOT} && node scripts/health-check.js check`,
    description: 'Runs health check every 15 minutes'
  }
];

// Generate crontab entries
function generateCrontabEntries() {
  console.log('Generating crontab entries...\n');
  
  const entries = [];
  
  // Add header comment
  entries.push('# Labubu Collectibles - Automated Backups and Health Monitoring');
  entries.push('# Generated on: ' + new Date().toISOString());
  entries.push('');
  
  // Add each cron job
  CRON_JOBS.forEach(job => {
    entries.push(`# ${job.name}: ${job.description}`);
    entries.push(`${job.schedule} ${job.command}`);
    entries.push('');
  });
  
  return entries.join('\n');
}

// Check if crontab is available
function checkCrontabAvailability() {
  return new Promise((resolve) => {
    exec('which crontab', (error) => {
      if (error) {
        console.log('❌ crontab not available on this system');
        resolve(false);
      } else {
        console.log('✅ crontab is available');
        resolve(true);
      }
    });
  });
}

// Get current crontab
function getCurrentCrontab() {
  return new Promise((resolve, reject) => {
    exec('crontab -l', (error, stdout) => {
      if (error && error.code !== 1) { // code 1 means no crontab
        reject(error);
      } else {
        resolve(stdout || '');
      }
    });
  });
}

// Install crontab
function installCrontab(crontabContent) {
  return new Promise((resolve, reject) => {
    // Write to temporary file
    const tempFile = path.join(__dirname, 'temp-crontab');
    fs.writeFileSync(tempFile, crontabContent);
    
    exec(`crontab ${tempFile}`, (error) => {
      // Clean up temp file
      fs.unlinkSync(tempFile);
      
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

// Main setup function
async function setupCronJobs() {
  console.log('🚀 Setting up automated cron jobs for Labubu Collectibles\n');
  
  // Check if crontab is available
  const crontabAvailable = await checkCrontabAvailability();
  if (!crontabAvailable) {
    console.log('\n❌ Cannot set up cron jobs - crontab not available');
    console.log('Please install cron or use an alternative scheduling method');
    return;
  }
  
  try {
    // Get current crontab
    const currentCrontab = await getCurrentCrontab();
    
    // Check if our jobs are already installed
    if (currentCrontab.includes('Labubu Collectibles')) {
      console.log('⚠️  Cron jobs already appear to be installed');
      console.log('Current crontab:');
      console.log(currentCrontab);
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('\nDo you want to reinstall? (y/N): ', (answer) => {
        rl.close();
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          installNewCrontab(currentCrontab);
        } else {
          console.log('Setup cancelled');
        }
      });
    } else {
      installNewCrontab(currentCrontab);
    }
    
  } catch (error) {
    console.error('❌ Error setting up cron jobs:', error.message);
  }
}

// Install new crontab
async function installNewCrontab(currentCrontab) {
  try {
    // Generate new crontab content
    const newEntries = generateCrontabEntries();
    const fullCrontab = currentCrontab + '\n' + newEntries;
    
    // Install the new crontab
    await installCrontab(fullCrontab);
    
    console.log('✅ Cron jobs installed successfully!');
    console.log('\nInstalled jobs:');
    CRON_JOBS.forEach(job => {
      console.log(`  • ${job.name} (${job.schedule})`);
    });
    
    console.log('\n📋 To view current crontab: crontab -l');
    console.log('📋 To edit crontab: crontab -e');
    console.log('📋 To remove all crontab: crontab -r');
    
  } catch (error) {
    console.error('❌ Error installing crontab:', error.message);
  }
}

// Remove cron jobs
async function removeCronJobs() {
  try {
    const currentCrontab = await getCurrentCrontab();
    
    // Remove our entries
    const lines = currentCrontab.split('\n');
    const filteredLines = lines.filter(line => {
      return !line.includes('Labubu Collectibles') && 
             !line.includes('scripts/backup.js') && 
             !line.includes('scripts/health-check.js') &&
             !line.startsWith('# Generated on:');
    });
    
    const newCrontab = filteredLines.join('\n');
    await installCrontab(newCrontab);
    
    console.log('✅ Cron jobs removed successfully');
    
  } catch (error) {
    console.error('❌ Error removing cron jobs:', error.message);
  }
}

// Show current status
async function showStatus() {
  try {
    const currentCrontab = await getCurrentCrontab();
    
    if (currentCrontab.includes('Labubu Collectibles')) {
      console.log('✅ Cron jobs are installed');
      console.log('\nCurrent crontab:');
      console.log(currentCrontab);
    } else {
      console.log('❌ No cron jobs installed');
    }
    
  } catch (error) {
    console.error('❌ Error checking status:', error.message);
  }
}

// Command line interface
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'install':
      await setupCronJobs();
      break;
      
    case 'remove':
      await removeCronJobs();
      break;
      
    case 'status':
      await showStatus();
      break;
      
    case 'generate':
      console.log(generateCrontabEntries());
      break;
      
    default:
      console.log(`
Cron Job Setup Tool

Usage:
  node setup-cron.js install   - Install automated cron jobs
  node setup-cron.js remove    - Remove cron jobs
  node setup-cron.js status    - Show current status
  node setup-cron.js generate  - Generate crontab entries

This will set up:
- Daily database backup at 2:00 AM
- Backup cleanup at 3:00 AM  
- Health check every 15 minutes

Requirements:
- crontab must be available on the system
- Node.js scripts must be executable
      `);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  generateCrontabEntries,
  setupCronJobs,
  removeCronJobs
}; 