module.exports = {
  up: async (db) => {
    await db.run('ALTER TABLE products ADD COLUMN supplierId INTEGER');
  },
  down: async (db) => {
    // SQLite does not support DROP COLUMN directly; manual migration needed if rollback is required
  }
}; 