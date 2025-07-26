const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    userId INTEGER,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    type TEXT NOT NULL DEFAULT 'support',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
  );`, (err) => {
    if (err) {
      console.error('Failed to create support_tickets table:', err.message);
    } else {
      console.log('support_tickets table created or already exists.');
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticketId TEXT NOT NULL,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticketId) REFERENCES support_tickets(id) ON DELETE CASCADE
  );`, (err) => {
    if (err) {
      console.error('Failed to create support_ticket_messages table:', err.message);
    } else {
      console.log('support_ticket_messages table created or already exists.');
    }
    db.close();
  });
}); 