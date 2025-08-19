import { openDb } from './db';

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
  { name: 'Love', collection: 'Big Into Energy', price: 27.99, imageUrl: '/product_images/image_macarons_001.png' },
  { name: 'Happiness', collection: 'Big Into Energy', price: 27.99, imageUrl: '/product_images/image_macarons_002.png' },
  { name: 'Loyalty', collection: 'Big Into Energy', price: 27.99, imageUrl: '/product_images/image_macarons_003.png' },
  { name: 'Serenity', collection: 'Big Into Energy', price: 27.99, imageUrl: '/product_images/image_macarons_004.png' },
  { name: 'Hope', collection: 'Big Into Energy', price: 27.99, imageUrl: '/product_images/image_macarons_005.png' },
  { name: 'Luck', collection: 'Big Into Energy', price: 27.99, imageUrl: '/product_images/image_macarons_006.png' },
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
  const db = await openDb();
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
  
  // Seed marketing data
  console.log('Seeding marketing data...');

  // Add sample campaigns
  await db.run(`
    INSERT OR IGNORE INTO email_campaigns (id, name, subject, content, targetAudience, status, sentCount, openRate, clickRate, createdAt) VALUES 
    ('campaign_1', 'Welcome Series', 'Welcome to Labubu Collectibles!', 'Welcome to our community of collectors...', 'new', 'completed', 1250, 0.45, 0.12, '2024-01-15'),
    ('campaign_2', 'New Product Launch', 'New Labubu figures available!', 'Discover our latest collection...', 'all', 'active', 850, 0.38, 0.08, '2024-01-20'),
    ('campaign_3', 'Abandoned Cart Recovery', 'Complete your purchase', 'You left some amazing items in your cart...', 'inactive', 'draft', 0, 0, 0, '2024-01-25')
  `);

  // Add sample discount codes
  await db.run(`
    INSERT OR IGNORE INTO discount_codes (id, code, type, value, minOrderAmount, maxUses, usedCount, validFrom, validUntil, status) VALUES 
    ('discount_1', 'WELCOME10', 'percentage', 10, 25, 100, 45, '2024-01-01', '2024-12-31', 'active'),
    ('discount_2', 'SAVE5', 'fixed', 5, 50, 200, 78, '2024-01-01', '2024-06-30', 'active'),
    ('discount_3', 'FLASH20', 'percentage', 20, 100, 50, 50, '2024-01-01', '2024-02-01', 'expired')
  `);

  // Update automation rules with sample stats
  await db.run(`
    UPDATE automation_rules SET triggeredCount = 1234, convertedCount = 156 WHERE id = 'rule_welcome'
  `);
  await db.run(`
    UPDATE automation_rules SET triggeredCount = 567, convertedCount = 89 WHERE id = 'rule_abandoned_cart'
  `);
  await db.run(`
    UPDATE automation_rules SET triggeredCount = 234, convertedCount = 45 WHERE id = 'rule_low_stock'
  `);

  console.log('Marketing data seeded successfully');
  await db.close();
  console.log('Seeded ONLY Labubu products!');
}

seed(); 