const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const email = 'tancredi.m.buzzi@gmail.com';
const password = 'tupMyx-byfwef-cavwi3'; // original password
const firstName = 'Tancredi';
const lastName = 'Buzzi';
const role = 'admin';

const db = new sqlite3.Database('./database.sqlite');

async function promoteOrCreateAdmin() {
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error('DB error:', err.message);
      db.close();
      return;
    }
    if (user) {
      // User exists, update role to admin
      db.run('UPDATE users SET role = ? WHERE email = ?', [role, email], (err) => {
        if (err) {
          console.error('Failed to promote user:', err.message);
        } else {
          console.log('User promoted to admin.');
        }
        db.close();
      });
    } else {
      // User does not exist, create admin user
      const hashedPassword = await bcrypt.hash(password, 10);
      db.run(
        'INSERT INTO users (email, password, firstName, lastName, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [email, hashedPassword, firstName, lastName, role, new Date().toISOString()],
        (err) => {
          if (err) {
            console.error('Failed to create admin user:', err.message);
          } else {
            console.log('Admin user created.');
          }
          db.close();
        }
      );
    }
  });
}

promoteOrCreateAdmin(); 