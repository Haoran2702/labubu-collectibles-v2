const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('Creating data_rights_requests table...');
  
  db.run(`
    CREATE TABLE IF NOT EXISTS data_rights_requests (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      email TEXT NOT NULL,
      request_type TEXT NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      response TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating data_rights_requests table:', err);
    } else {
      console.log('data_rights_requests table created successfully');
    }
  });

  // Create index for faster queries
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_data_rights_email 
    ON data_rights_requests(email)
  `, (err) => {
    if (err) {
      console.error('Error creating index:', err);
    } else {
      console.log('Index created successfully');
    }
  });

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_data_rights_user_id 
    ON data_rights_requests(user_id)
  `, (err) => {
    if (err) {
      console.error('Error creating index:', err);
    } else {
      console.log('Index created successfully');
    }
  });

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_data_rights_status 
    ON data_rights_requests(status)
  `, (err) => {
    if (err) {
      console.error('Error creating index:', err);
    } else {
      console.log('Index created successfully');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err);
  } else {
    console.log('Database connection closed');
  }
}); 