const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Create email_tracking table
  db.run(`
    CREATE TABLE IF NOT EXISTS email_tracking (
      id TEXT PRIMARY KEY,
      campaignId TEXT,
      recipient TEXT NOT NULL,
      sentAt TEXT NOT NULL,
      openedAt TEXT,
      clickedAt TEXT,
      unsubscribedAt TEXT,
      messageId TEXT,
      FOREIGN KEY (campaignId) REFERENCES email_campaigns (id)
    )
  `);

  // Create email_unsubscribes table
  db.run(`
    CREATE TABLE IF NOT EXISTS email_unsubscribes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      unsubscribedAt TEXT NOT NULL,
      reason TEXT
    )
  `);

  // Add tracking columns to email_campaigns if they don't exist
  db.run(`
    ALTER TABLE email_campaigns ADD COLUMN sentAt TEXT
  `, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding sentAt column:', err);
    }
  });

  db.run(`
    ALTER TABLE email_campaigns ADD COLUMN updatedAt TEXT
  `, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding updatedAt column:', err);
    }
  });

  console.log('Email tracking tables created successfully');
});

db.close(); 