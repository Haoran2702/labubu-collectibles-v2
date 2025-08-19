import express from 'express';
import { openDb } from '../db';
import { requireAuth } from '../middleware/auth';
import { BadRequestError, NotFoundError, ForbiddenError } from '../errors';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/review_images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'review-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Only image files are allowed'));
    }
  }
});

// Helper middleware to handle validation errors
function handleValidationErrors(req: express.Request, res: express.Response, next: express.NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new BadRequestError(errors.array().map(e => e.msg).join(', ')));
  }
  next();
}

// Get reviews for a product
router.get('/products/:productId', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const { productId } = req.params;
    const db = await openDb();

    const reviews = await db.all(`
      SELECT 
        r.id,
        r.productId,
        r.userId,
        u.firstName || 'Anonymous' as userName,
        r.rating,
        r.title,
        r.comment,
        r.images,
        r.createdAt,
        r.helpful,
        CASE WHEN EXISTS (
          SELECT 1 FROM order_items oi 
          JOIN orders o ON oi.orderId = o.id 
          WHERE oi.productId = r.productId 
          AND o.userId = r.userId 
          AND o.status != 'cancelled'
        ) THEN 1 ELSE 0 END as verified
      FROM reviews r
      LEFT JOIN users u ON r.userId = u.id
      WHERE r.productId = ?
      ORDER BY r.createdAt DESC
    `, [productId]);

    // Parse images JSON for each review
    const reviewsWithImages = reviews.map(review => ({
      ...review,
      images: review.images ? JSON.parse(review.images) : []
    }));

    await db.close();
    res.json({ reviews: reviewsWithImages });
  } catch (error) {
    next(error);
  }
});

// Create a new review
router.post('/products/:productId', 
  requireAuth,
  upload.array('images', 5),
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { productId } = req.params;
      const { rating, title, comment } = req.body;
      const userId = (req as any).user.userId;
      const files = req.files as Express.Multer.File[];

      // Validate input
      if (!rating || !title || !comment) {
        return next(new BadRequestError('Rating, title, and comment are required'));
      }

      const ratingNum = parseInt(rating);
      if (ratingNum < 1 || ratingNum > 5) {
        return next(new BadRequestError('Rating must be between 1 and 5'));
      }

      if (title.length < 1 || title.length > 100) {
        return next(new BadRequestError('Title must be between 1 and 100 characters'));
      }

      if (comment.length < 1 || comment.length > 1000) {
        return next(new BadRequestError('Comment must be between 1 and 1000 characters'));
      }

      const db = await openDb();

      // Check if product exists
      const product = await db.get('SELECT id FROM products WHERE id = ?', [productId]);
      if (!product) {
        await db.close();
        return next(new NotFoundError('Product not found'));
      }

      // Check if user has already reviewed this product
      const existingReview = await db.get(
        'SELECT id FROM reviews WHERE productId = ? AND userId = ?',
        [productId, userId]
      );

      if (existingReview) {
        await db.close();
        return next(new BadRequestError('You have already reviewed this product'));
      }

      // Save image paths
      const baseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3001}`;
      const imagePaths = files ? files.map(file => `${baseUrl}/review_images/${file.filename}`) : [];

      // Create the review
      const reviewId = `review_${uuidv4()}`;
      await db.run(`
        INSERT INTO reviews (id, productId, userId, rating, title, comment, images, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [reviewId, productId, userId, ratingNum, title, comment, JSON.stringify(imagePaths), new Date().toISOString()]);

      await db.close();
      res.status(201).json({ 
        message: 'Review created successfully',
        reviewId 
      });
    } catch (error) {
      next(error);
    }
  }
);

// Mark review as helpful
router.post('/:reviewId/helpful', requireAuth, async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = (req as any).user.userId;

    const db = await openDb();

    // Check if review exists
    const review = await db.get('SELECT id FROM reviews WHERE id = ?', [reviewId]);
    if (!review) {
      await db.close();
      return next(new NotFoundError('Review not found'));
    }

    // Check if user has already marked this review as helpful
    const existingHelpful = await db.get(
      'SELECT id FROM review_helpful WHERE reviewId = ? AND userId = ?',
      [reviewId, userId]
    );

    if (existingHelpful) {
      await db.close();
      return next(new BadRequestError('You have already marked this review as helpful'));
    }

    // Add helpful vote
    await db.run(`
      INSERT INTO review_helpful (reviewId, userId, createdAt)
      VALUES (?, ?, ?)
    `, [reviewId, userId, new Date().toISOString()]);

    // Update helpful count
    await db.run(`
      UPDATE reviews 
      SET helpful = (
        SELECT COUNT(*) FROM review_helpful WHERE reviewId = ?
      )
      WHERE id = ?
    `, [reviewId, reviewId]);

    await db.close();
    res.json({ message: 'Review marked as helpful' });
  } catch (error) {
    next(error);
  }
});

// Get review statistics for a product
router.get('/products/:productId/stats', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const db = await openDb();

    const stats = await db.get(`
      SELECT 
        COUNT(*) as totalReviews,
        AVG(rating) as averageRating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as fiveStar,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as fourStar,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as threeStar,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as twoStar,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as oneStar
      FROM reviews 
      WHERE productId = ?
    `, [productId]);

    await db.close();
    res.json({ stats });
  } catch (error) {
    next(error);
  }
});

export default router; 