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
  await db.close();
  console.log('Seeded ONLY Labubu products!');
}

seed(); 