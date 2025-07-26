const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  // Add processType column to order_status_history table
  db.run(
    `ALTER TABLE order_status_history ADD COLUMN processType TEXT DEFAULT 'order';`,
    (err) => {
      if (err) {
        console.error('Migration failed:', err.message);
      } else {
        console.log('Column processType added to order_status_history table.');
      }
      db.close();
    }
  );
}); 