const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  // Add emailVerified field
  db.run(
    `ALTER TABLE users ADD COLUMN emailVerified INTEGER DEFAULT 0;`,
    (err) => {
      if (err) {
        if (err.message.includes('duplicate column name') || err.message.includes('already exists')) {
          console.log('Column emailVerified already exists.');
        } else {
          console.error('Failed to add emailVerified:', err.message);
        }
      } else {
        console.log('Column emailVerified added to users table.');
      }
    }
  );

  // Add emailVerificationToken field
  db.run(
    `ALTER TABLE users ADD COLUMN emailVerificationToken TEXT;`,
    (err) => {
      if (err) {
        if (err.message.includes('duplicate column name') || err.message.includes('already exists')) {
          console.log('Column emailVerificationToken already exists.');
        } else {
          console.error('Failed to add emailVerificationToken:', err.message);
        }
      } else {
        console.log('Column emailVerificationToken added to users table.');
      }
    }
  );

  // Add emailVerificationExpires field
  db.run(
    `ALTER TABLE users ADD COLUMN emailVerificationExpires INTEGER;`,
    (err) => {
      if (err) {
        if (err.message.includes('duplicate column name') || err.message.includes('already exists')) {
          console.log('Column emailVerificationExpires already exists.');
        } else {
          console.error('Failed to add emailVerificationExpires:', err.message);
        }
      } else {
        console.log('Column emailVerificationExpires added to users table.');
      }
    }
  );

  // Set existing users as verified (for backwards compatibility)
  db.run(
    `UPDATE users SET emailVerified = 1 WHERE emailVerified IS NULL;`,
    (err) => {
      if (err) {
        console.error('Failed to update existing users:', err.message);
      } else {
        console.log('Set existing users as email verified.');
      }
      db.close();
    }
  );
}); 