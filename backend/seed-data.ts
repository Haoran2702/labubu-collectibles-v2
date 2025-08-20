import { openDb, initDb } from './db';
import bcrypt from 'bcrypt';

const products = [
  // Have a Seat
  { name: 'Baba', collection: 'Have a Seat', price: 29.99, imageUrl: '/product_images/image_part_001.png' },
  { name: 'Dada', collection: 'Have a Seat', price: 29.99, imageUrl: '/product_images/image_part_002.png' },
  { name: 'Hehe', collection: 'Have a Seat', price: 29.99, imageUrl: '/product_images/image_part_003.png' },
  { name: 'Ququ', collection: 'Have a Seat', price: 29.99, imageUrl: '/product_images/image_part_004.png' },
  { name: 'Sisi', collection: 'Have a Seat', price: 29.99, imageUrl: '/product_images/image_part_005.png' },
  { name: 'Zizi', collection: 'Have a Seat', price: 29.99, imageUrl: '/product_images/image_part_006.png' },
  { name: 'Bul (Secret)', collection: 'Have a Seat', price: 39.99, imageUrl: '/product_images/Bul.png.jpg' },
  { name: 'Box', collection: 'Have a Seat', price: 19.99, imageUrl: '/product_images/20240708_103610_362376_________1200x1200.jpg' },
  // Big Into Energy
  { name: 'Love', collection: 'Big Into Energy', price: 27.99, imageUrl: '/product_images/big-into-energy/Love.jpg' },
  { name: 'Happiness', collection: 'Big Into Energy', price: 27.99, imageUrl: '/product_images/big-into-energy/Happiness.jpg' },
  { name: 'Loyalty', collection: 'Big Into Energy', price: 27.99, imageUrl: '/product_images/big-into-energy/Loyalty.jpg' },
  { name: 'Serenity', collection: 'Big Into Energy', price: 27.99, imageUrl: '/product_images/big-into-energy/Serenity.jpg' },
  { name: 'Hope', collection: 'Big Into Energy', price: 27.99, imageUrl: '/product_images/big-into-energy/Hope.jpg' },
  { name: 'Luck', collection: 'Big Into Energy', price: 27.99, imageUrl: '/product_images/big-into-energy/Luck.jpg' },
  { name: 'Id (Secret)', collection: 'Big Into Energy', price: 34.99, imageUrl: '/product_images/Id.webp.jpeg' },
  { name: 'Box', collection: 'Big Into Energy', price: 19.99, imageUrl: '/product_images/20250422_091852_899579____9_____1200x1200.jpg' },
  // Exciting Macarons
  { name: 'Soymilk', collection: 'Exciting Macarons', price: 24.99, imageUrl: '/product_images/image_macarons_001.png' },
  { name: 'Lychee Berry', collection: 'Exciting Macarons', price: 24.99, imageUrl: '/product_images/image_macarons_002.png' },
  { name: 'Green Grape', collection: 'Exciting Macarons', price: 24.99, imageUrl: '/product_images/image_macarons_003.png' },
  { name: 'Sea Salt Coconut', collection: 'Exciting Macarons', price: 24.99, imageUrl: '/product_images/image_macarons_004.png' },
  { name: 'Toffee', collection: 'Exciting Macarons', price: 24.99, imageUrl: '/product_images/image_macarons_005.png' },
  { name: 'Sesame Bean', collection: 'Exciting Macarons', price: 24.99, imageUrl: '/product_images/image_macarons_006.png' },
  { name: 'Chestnut Cocoa (Secret)', collection: 'Exciting Macarons', price: 34.99, imageUrl: '/product_images/Chestnut Cocoa-2.png' },
  { name: 'Box', collection: 'Exciting Macarons', price: 19.99, imageUrl: '/product_images/20231026_101601_612582__1200x1200.jpg' },
];

async function seed() {
  console.log('Initializing database...');
  await initDb();
  console.log('Database initialized, now seeding products...');
  const db = await openDb();
  
  // Seed products
  await db.run('DELETE FROM products');
  for (const product of products) {
    await db.run(
      'INSERT INTO products (name, price, imageUrl, collection) VALUES (?, ?, ?, ?)',
      product.name,
      product.price,
      product.imageUrl,
      product.collection
    );
  }
  
  // Create admin user
  const adminEmail = 'tancredi.m.buzzi@gmail.com';
  const adminPassword = 'tupMyx-byfwef-cavwi3';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  
  // Check if admin user exists
  const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [adminEmail]);
  
  if (existingUser) {
    // Update existing user to admin with verified email
    await db.run(
      'UPDATE users SET role = ?, emailVerified = ?, password = ? WHERE email = ?',
      ['admin', 1, hashedPassword, adminEmail]
    );
    console.log('Admin user updated successfully!');
  } else {
    // Create new admin user
    await db.run(
      'INSERT INTO users (email, password, firstName, lastName, role, emailVerified, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [adminEmail, hashedPassword, 'Tancredi', 'Buzzi', 'admin', 1, new Date().toISOString()]
    );
    console.log('Admin user created successfully!');
  }
  
  console.log('Products and admin user seeded successfully!');
  await db.close();
  console.log('Seeded Labubu products and admin user!');
}

seed(); 