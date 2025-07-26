import fs from 'fs';
import path from 'path';
import { imageCache } from './imageCache';

interface ImageSize {
  width: number;
  height: number;
  suffix: string;
}

const IMAGE_SIZES: ImageSize[] = [
  { width: 48, height: 48, suffix: 'thumb' },
  { width: 120, height: 120, suffix: 'small' },
  { width: 240, height: 240, suffix: 'medium' },
  { width: 360, height: 360, suffix: 'large' },
  { width: 480, height: 480, suffix: 'xlarge' }
];

export class ImageOptimizer {
  static async optimizeImage(originalUrl: string): Promise<{
    original: string;
    optimized: string;
    sizes: { [key: string]: string };
  }> {
    const result = {
      original: originalUrl,
      optimized: originalUrl,
      sizes: {} as { [key: string]: string }
    };

    try {
      // Cache original image
      result.optimized = await imageCache.cacheImage(originalUrl);

      // Generate different sizes
      for (const size of IMAGE_SIZES) {
        try {
          const sizedUrl = await imageCache.cacheImage(originalUrl, size.width, size.height);
          result.sizes[size.suffix] = sizedUrl;
        } catch (error) {
          console.error(`Failed to generate ${size.suffix} size for ${originalUrl}:`, error);
          // Use original if size generation fails
          result.sizes[size.suffix] = result.optimized;
        }
      }
    } catch (error) {
      console.error('Failed to optimize image:', error);
      // Return original if optimization fails
    }

    return result;
  }

  static async getOptimizedUrl(originalUrl: string, size?: string): Promise<string> {
    try {
      if (!size) {
        return await imageCache.getCachedImage(originalUrl) || originalUrl;
      }

      const sizeConfig = IMAGE_SIZES.find(s => s.suffix === size);
      if (!sizeConfig) {
        return await imageCache.getCachedImage(originalUrl) || originalUrl;
      }

      const cachedUrl = await imageCache.getCachedImage(originalUrl, sizeConfig.width, sizeConfig.height);
      return cachedUrl || originalUrl;
    } catch (error) {
      console.error('Failed to get optimized URL:', error);
      return originalUrl;
    }
  }

  static async preloadAllSizes(originalUrl: string): Promise<void> {
    try {
      // Preload all sizes
      await Promise.all([
        imageCache.cacheImage(originalUrl),
        ...IMAGE_SIZES.map(size => 
          imageCache.cacheImage(originalUrl, size.width, size.height)
        )
      ]);
    } catch (error) {
      console.error('Failed to preload all sizes:', error);
    }
  }

  static getAvailableSizes(): string[] {
    return IMAGE_SIZES.map(s => s.suffix);
  }

  static getSizeConfig(size: string): ImageSize | undefined {
    return IMAGE_SIZES.find(s => s.suffix === size);
  }
} 