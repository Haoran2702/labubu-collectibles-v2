const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run(
    `ALTER TABLE orders ADD COLUMN notification_sent TEXT;`,
    (err) => {
      if (err) {
        if (err.message.includes('duplicate column name') || err.message.includes('already exists')) {
          console.log('Column notification_sent already exists.');
        } else {
          console.error('Migration failed:', err.message);
        }
      } else {
        console.log('Column notification_sent added to orders table.');
      }
      db.close();
    }
  );
}); 