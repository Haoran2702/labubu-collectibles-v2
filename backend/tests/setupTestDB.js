const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '../database.test.sqlite');
const migrationsDir = path.join(__dirname, '../migrations');

function getDB() {
  return new sqlite3.Database(dbPath);
}

function runMigration(db, file) {
  return new Promise((resolve, reject) => {
    const migration = require(path.join(migrationsDir, file));
    if (typeof migration === 'function') {
      migration(db, resolve, reject);
    } else {
      setTimeout(resolve, 500);
    }
  });
}

async function runMigrations(db) {
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.js'))
    .sort();
  for (const file of files) {
    await runMigration(db, file);
  }
}

async function seedTestData(db) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO products (id, name, description, price, imageUrl, createdAt) VALUES (1, 'Test Product', 'A product for testing', 10.0, '', datetime('now'))`,
      (err) => {
        if (err) {
          console.error('Failed to seed products:', err.message);
          reject(err);
        } else {
          console.log('Seeded test product.');
          resolve();
        }
      }
    );
  });
}

async function runMigrationsAndSeed() {
  const db = getDB();
  await runMigrations(db);
  await seedTestData(db);
  db.close();
}

runMigrationsAndSeed().then(() => {
  console.log('All migrations and seeding applied to test database.');
  process.exit(0);
}).catch(err => {
  console.error('Migration/seed error:', err);
  process.exit(1);
}); 