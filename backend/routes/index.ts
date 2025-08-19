import { Router, Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { openDb } from '../db';
import { BadRequestError, AppError } from '../errors';
import path from 'path';
import fs from 'fs';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.send('API is running');
});

router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve product images
router.get('/product_images/:filename', (req: Request, res: Response) => {
  const { filename } = req.params;
  const imagePath = path.join(__dirname, '../public/product_images', filename);
  
  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  
  // Set appropriate content type based on file extension
  const ext = path.extname(filename).toLowerCase();
  const contentType = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  }[ext] || 'application/octet-stream';
  
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  res.sendFile(imagePath);
});

router.post('/email-signup', expressAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  if (!email) {
    return next(new BadRequestError('Email is required'));
  }
  const db = await openDb();
  try {
    await db.run('INSERT INTO email_signups (email) VALUES (?)', email);
    res.status(201).json({ message: 'Signed up' });
  } catch (err: any) {
    if (err && err.code === 'SQLITE_CONSTRAINT') {
      return next(new BadRequestError('Email already signed up'));
    } else {
      return next(new AppError('Server error', 500));
    }
  } finally {
    await db.close();
  }
}));

export default router; 