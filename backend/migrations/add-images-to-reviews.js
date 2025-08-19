const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  // Add images column to reviews table
  db.run(`ALTER TABLE reviews ADD COLUMN images TEXT;`, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('images column already exists in reviews table.');
      } else {
        console.error('Failed to add images column to reviews table:', err.message);
      }
    } else {
      console.log('images column added to reviews table.');
    }
    db.close();
  });
}); 