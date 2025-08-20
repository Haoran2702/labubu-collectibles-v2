const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

async function addEmailVerificationColumns() {
  console.log('Adding email verification columns to users table...');
  
  db.serialize(() => {
    // Add emailVerificationToken column if it doesn't exist
    db.run(`
      ALTER TABLE users 
      ADD COLUMN emailVerificationToken TEXT
    `, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding emailVerificationToken column:', err.message);
      } else {
        console.log('✅ emailVerificationToken column added or already exists');
      }
    });

    // Add emailVerificationExpires column if it doesn't exist
    db.run(`
      ALTER TABLE users 
      ADD COLUMN emailVerificationExpires INTEGER
    `, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding emailVerificationExpires column:', err.message);
      } else {
        console.log('✅ emailVerificationExpires column added or already exists');
      }
    });
  });

  // Close database after a short delay to ensure operations complete
  setTimeout(() => {
    db.close();
    console.log('✅ Migration completed');
  }, 1000);
}

addEmailVerificationColumns();
