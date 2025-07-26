const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS order_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT,
      updatedBy TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
    );`,
    (err) => {
      if (err) {
        console.error('Migration failed:', err.message);
      } else {
        console.log('Table order_status_history created or already exists.');
      }
      db.close();
    }
  );
}); 