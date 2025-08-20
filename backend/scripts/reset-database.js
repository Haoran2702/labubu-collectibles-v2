const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./database.sqlite');

async function resetDatabase() {
  console.log('⚠️  WARNING: This will DELETE ALL DATA and reset the database!');
  console.log('This script should only be run manually when you want to start fresh.');
  
  db.serialize(() => {
    // Delete all data from tables
    db.run('DELETE FROM users', (err) => {
      if (err) {
        console.error('Error deleting users:', err.message);
      } else {
        console.log('✅ All users deleted');
      }
    });
    
    db.run('DELETE FROM products', (err) => {
      if (err) {
        console.error('Error deleting products:', err.message);
      } else {
        console.log('✅ All products deleted');
      }
    });
    
    db.run('DELETE FROM orders', (err) => {
      if (err) {
        console.error('Error deleting orders:', err.message);
      } else {
        console.log('✅ All orders deleted');
      }
    });
    
    db.run('DELETE FROM order_items', (err) => {
      if (err) {
        console.error('Error deleting order items:', err.message);
      } else {
        console.log('✅ All order items deleted');
      }
    });
    
    db.run('DELETE FROM addresses', (err) => {
      if (err) {
        console.error('Error deleting addresses:', err.message);
      } else {
        console.log('✅ All addresses deleted');
      }
    });
    
    db.run('DELETE FROM email_signups', (err) => {
      if (err) {
        console.error('Error deleting email signups:', err.message);
      } else {
        console.log('✅ All email signups deleted');
      }
    });
    
    // Close database after operations
    setTimeout(() => {
      db.close();
      console.log('✅ Database reset complete!');
      console.log('💡 Now run: npm run seed');
    }, 1000);
  });
}

resetDatabase();
