import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { openDb } from '../db';

interface CachedImage {
  id: string;
  originalUrl: string;
  cachedPath: string;
  width?: number;
  height?: number;
  createdAt: string;
  lastAccessed: string;
}

class ImageCache {
  private cacheDir: string;
  private db: any;

  constructor() {
    this.cacheDir = path.join(process.cwd(), 'public', 'cached_images');
    this.ensureCacheDir();
  }

  private ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private async initDb() {
    if (!this.db) {
      this.db = await openDb();
      // Create cache table if it doesn't exist
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS image_cache (
          id TEXT PRIMARY KEY,
          originalUrl TEXT NOT NULL,
          cachedPath TEXT NOT NULL,
          width INTEGER,
          height INTEGER,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          lastAccessed TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
  }

  private generateCacheKey(url: string, width?: number, height?: number): string {
    const data = `${url}_${width || 'original'}_${height || 'original'}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  private getCachedFilePath(cacheKey: string): string {
    return path.join(this.cacheDir, `${cacheKey}.jpg`);
  }

  private getOriginalImagePath(imageUrl: string): string {
    // Handle different image paths
    if (imageUrl.startsWith('/product_images/')) {
      // Frontend images
      return path.join(process.cwd(), '..', 'frontend', 'public', imageUrl.replace(/^\//, ''));
    } else if (imageUrl.startsWith('/')) {
      // Backend images
      return path.join(process.cwd(), 'public', imageUrl.replace(/^\//, ''));
    } else {
      // External URLs (not supported for now)
      throw new Error('External URLs not supported for caching');
    }
  }

  async getCachedImage(originalUrl: string, width?: number, height?: number): Promise<string | null> {
    await this.initDb();
    
    const cacheKey = this.generateCacheKey(originalUrl, width, height);
    const cachedPath = this.getCachedFilePath(cacheKey);
    
    // Check if cached file exists
    if (fs.existsSync(cachedPath)) {
      // Update last accessed time
      await this.db.run(
        'UPDATE image_cache SET lastAccessed = ? WHERE id = ?',
        [new Date().toISOString(), cacheKey]
      );
      
      return `/cached_images/${cacheKey}.jpg`;
    }
    
    return null;
  }

  async cacheImage(originalUrl: string, width?: number, height?: number): Promise<string> {
    await this.initDb();
    
    const cacheKey = this.generateCacheKey(originalUrl, width, height);
    const cachedPath = this.getCachedFilePath(cacheKey);
    
    // Check if already cached
    const existing = await this.db.get('SELECT * FROM image_cache WHERE id = ?', [cacheKey]);
    if (existing) {
      return `/cached_images/${cacheKey}.jpg`;
    }
    
    try {
      // Get the correct original image path
      const originalPath = this.getOriginalImagePath(originalUrl);
      
      if (fs.existsSync(originalPath)) {
        // Copy file to cache
        fs.copyFileSync(originalPath, cachedPath);
        
        // Get image dimensions (basic implementation)
        const dimensions = await this.getImageDimensions(cachedPath);
        
        // Save to database
        await this.db.run(
          'INSERT INTO image_cache (id, originalUrl, cachedPath, width, height) VALUES (?, ?, ?, ?, ?)',
          [cacheKey, originalUrl, cachedPath, dimensions.width, dimensions.height]
        );
        
        return `/cached_images/${cacheKey}.jpg`;
      } else {
        throw new Error(`Original image not found: ${originalPath}`);
      }
    } catch (error) {
      console.error('Failed to cache image:', error);
      // Return original URL if caching fails
      return originalUrl;
    }
  }

  private async getImageDimensions(filePath: string): Promise<{ width: number; height: number }> {
    // Basic implementation - in production you'd use a proper image library
    return { width: 300, height: 300 };
  }

  async cleanupOldCache(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    await this.initDb();
    
    const cutoffDate = new Date(Date.now() - maxAge).toISOString();
    
    // Get old cache entries
    const oldEntries = await this.db.all(
      'SELECT * FROM image_cache WHERE lastAccessed < ?',
      [cutoffDate]
    );
    
    for (const entry of oldEntries) {
      try {
        // Delete file
        if (fs.existsSync(entry.cachedPath)) {
          fs.unlinkSync(entry.cachedPath);
        }
        
        // Delete from database
        await this.db.run('DELETE FROM image_cache WHERE id = ?', [entry.id]);
        
        console.log(`Cleaned up cached image: ${entry.id}`);
      } catch (error) {
        console.error(`Failed to cleanup cached image ${entry.id}:`, error);
      }
    }
  }

  async getCacheStats(): Promise<{
    totalCached: number;
    totalSize: number;
    oldestEntry: string | null;
    newestEntry: string | null;
  }> {
    await this.initDb();
    
    const stats = await this.db.get('SELECT COUNT(*) as count FROM image_cache');
    const oldest = await this.db.get('SELECT createdAt FROM image_cache ORDER BY createdAt ASC LIMIT 1');
    const newest = await this.db.get('SELECT createdAt FROM image_cache ORDER BY createdAt DESC LIMIT 1');
    
    let totalSize = 0;
    const files = await this.db.all('SELECT cachedPath FROM image_cache');
    for (const file of files) {
      if (fs.existsSync(file.cachedPath)) {
        const stats = fs.statSync(file.cachedPath);
        totalSize += stats.size;
      }
    }
    
    return {
      totalCached: stats.count,
      totalSize,
      oldestEntry: oldest?.createdAt || null,
      newestEntry: newest?.createdAt || null,
    };
  }
}

export const imageCache = new ImageCache();

// Middleware to serve cached images
export function serveCachedImage(req: any, res: any, next: any) {
  const imagePath = req.path;
  
  if (imagePath.startsWith('/cached_images/')) {
    const fullPath = path.join(process.cwd(), 'public', imagePath);
    
    if (fs.existsSync(fullPath)) {
      // Set cache headers
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
      res.setHeader('Expires', new Date(Date.now() + 31536000 * 1000).toUTCString());
      
      // Serve the file
      res.sendFile(fullPath);
      return;
    }
  }
  
  next();
} 