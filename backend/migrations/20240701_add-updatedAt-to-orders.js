const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run(
    `ALTER TABLE orders ADD COLUMN updatedAt TEXT;`,
    (err) => {
      if (err) {
        if (err.message.includes('duplicate column name') || err.message.includes('already exists')) {
          console.log('Column updatedAt already exists.');
        } else {
          console.error('Migration failed:', err.message);
        }
      } else {
        console.log('Column updatedAt added to orders table.');
        db.run(
          `UPDATE orders SET updatedAt = CURRENT_TIMESTAMP WHERE updatedAt IS NULL;`,
          (err2) => {
            if (err2) {
              console.error('Failed to update existing updatedAt values:', err2.message);
            } else {
              console.log('Set updatedAt for existing orders.');
            }
            db.close();
          }
        );
        return;
      }
      db.close();
    }
  );
}); 