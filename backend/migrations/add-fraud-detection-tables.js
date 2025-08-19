const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  // Fraud detection logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS fraud_detection_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      email TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      risk_score INTEGER NOT NULL,
      factors TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      user_agent TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `, (err) => {
    if (err) {
      console.error('Failed to create fraud_detection_logs table:', err.message);
    } else {
      console.log('fraud_detection_logs table created or already exists.');
    }
  });

  // Data rights requests table
  db.run(`
    CREATE TABLE IF NOT EXISTS data_rights_requests (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      request_type TEXT NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      response_data TEXT
    );
  `, (err) => {
    if (err) {
      console.error('Failed to create data_rights_requests table:', err.message);
    } else {
      console.log('data_rights_requests table created or already exists.');
    }
  });

  // Marketing preferences table
  db.run(`
    CREATE TABLE IF NOT EXISTS marketing_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      marketing_emails INTEGER DEFAULT 0,
      analytics_tracking INTEGER DEFAULT 0,
      third_party_sharing INTEGER DEFAULT 0,
      data_retention TEXT DEFAULT '1year',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `, (err) => {
    if (err) {
      console.error('Failed to create marketing_preferences table:', err.message);
    } else {
      console.log('marketing_preferences table created or already exists.');
    }
  });

  // Add marketing_consent column to users table if it doesn't exist
  db.run(`
    ALTER TABLE users ADD COLUMN marketing_consent INTEGER DEFAULT 1;
  `, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name') || err.message.includes('already exists')) {
        console.log('Column marketing_consent already exists in users table.');
      } else {
        console.error('Failed to add marketing_consent column:', err.message);
      }
    } else {
      console.log('Column marketing_consent added to users table.');
    }
  });

  // Create indexes for better performance
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_fraud_detection_email ON fraud_detection_logs(email);
  `, (err) => {
    if (err) {
      console.error('Failed to create fraud detection index:', err.message);
    } else {
      console.log('Fraud detection index created or already exists.');
    }
  });

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_data_rights_email ON data_rights_requests(email);
  `, (err) => {
    if (err) {
      console.error('Failed to create data rights index:', err.message);
    } else {
      console.log('Data rights index created or already exists.');
    }
  });

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_marketing_preferences_email ON marketing_preferences(email);
  `, (err) => {
    if (err) {
      console.error('Failed to create marketing preferences index:', err.message);
    } else {
      console.log('Marketing preferences index created or already exists.');
    }
  });

  db.close();
}); 