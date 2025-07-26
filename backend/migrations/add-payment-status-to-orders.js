const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run(
    `ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending';`,
    (err) => {
      if (err) {
        if (err.message.includes('duplicate column name') || err.message.includes('already exists')) {
          console.log('Column payment_status already exists.');
        } else {
          console.error('Migration failed:', err.message);
        }
      } else {
        console.log('Column payment_status added to orders table.');
      }
      db.close();
    }
  );
}); 