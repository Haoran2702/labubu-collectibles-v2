const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  // Create reviews table
  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    productId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT NOT NULL,
    comment TEXT NOT NULL,
    helpful INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(productId, userId)
  );`, (err) => {
    if (err) {
      console.error('Failed to create reviews table:', err.message);
    } else {
      console.log('reviews table created or already exists.');
    }
  });

  // Create review_helpful table for tracking helpful votes
  db.run(`CREATE TABLE IF NOT EXISTS review_helpful (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reviewId TEXT NOT NULL,
    userId INTEGER NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewId) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(reviewId, userId)
  );`, (err) => {
    if (err) {
      console.error('Failed to create review_helpful table:', err.message);
    } else {
      console.log('review_helpful table created or already exists.');
    }
    db.close();
  });
}); 