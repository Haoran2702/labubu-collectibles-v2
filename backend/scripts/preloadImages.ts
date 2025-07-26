import { openDb } from '../db';
import { imageCache } from '../utils/imageCache';

async function preloadImages() {
  console.log('🖼️  Starting image preload...');
  
  const db = await openDb();
  
  try {
    // Get all products with images
    const products = await db.all('SELECT id, name, imageUrl FROM products WHERE imageUrl IS NOT NULL');
    
    console.log(`📦 Found ${products.length} products with images`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      try {
        console.log(`🔄 Caching image for ${product.name}...`);
        
        // Cache the image
        const cachedUrl = await imageCache.cacheImage(product.imageUrl);
        
        if (cachedUrl !== product.imageUrl) {
          console.log(`✅ Cached: ${product.name} -> ${cachedUrl}`);
          successCount++;
        } else {
          console.log(`⚠️  Failed to cache: ${product.name}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Error caching ${product.name}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n📊 Preload Summary:');
    console.log(`✅ Successfully cached: ${successCount} images`);
    console.log(`❌ Failed to cache: ${errorCount} images`);
    
    // Get cache stats
    const stats = await imageCache.getCacheStats();
    console.log(`📈 Cache Stats:`);
    console.log(`   Total cached: ${stats.totalCached}`);
    console.log(`   Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Oldest entry: ${stats.oldestEntry}`);
    console.log(`   Newest entry: ${stats.newestEntry}`);
    
  } catch (error) {
    console.error('❌ Preload failed:', error);
  } finally {
    await db.close();
  }
}

// Run preload if called directly
if (require.main === module) {
  preloadImages()
    .then(() => {
      console.log('🎉 Image preload completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Preload failed:', error);
      process.exit(1);
    });
}

export { preloadImages }; 