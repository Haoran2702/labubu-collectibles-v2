const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run(
    `ALTER TABLE support_tickets ADD COLUMN orderId TEXT;`,
    (err) => {
      if (err && !err.message.includes('duplicate column name') && !err.message.includes('already exists')) {
        console.error('Failed to add orderId column:', err.message);
      } else {
        console.log('orderId column added or already exists.');
      }
    }
  );
  db.run(
    `ALTER TABLE support_tickets ADD COLUMN itemIds TEXT;`,
    (err) => {
      if (err && !err.message.includes('duplicate column name') && !err.message.includes('already exists')) {
        console.error('Failed to add itemIds column:', err.message);
      } else {
        console.log('itemIds column added or already exists.');
      }
    }
  );
  db.run(
    `ALTER TABLE support_tickets ADD COLUMN reason TEXT;`,
    (err) => {
      if (err && !err.message.includes('duplicate column name') && !err.message.includes('already exists')) {
        console.error('Failed to add reason column:', err.message);
      } else {
        console.log('reason column added or already exists.');
      }
      db.close();
    }
  );
}); 