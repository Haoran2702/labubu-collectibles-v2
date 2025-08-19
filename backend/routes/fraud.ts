import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import { openDb } from '../db';
import { BadRequestError, UnauthorizedError, ForbiddenError } from '../errors';
import fraudDetectionService from '../services/fraudDetection';

// Extend Request interface to include user
interface AuthenticatedRequest extends express.Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

const router = express.Router();

// Get fraud detection statistics (admin only)
router.get('/stats', expressAsyncHandler(async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const user = req.user;
  
  if (!user || user.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }

  try {
    const stats = await fraudDetectionService.getFraudStats();
    res.json({ stats });
  } catch (error) {
    console.error('Failed to get fraud stats:', error);
    return next(new BadRequestError('Failed to get fraud statistics'));
  }
}));

// Get recent fraud detection logs (admin only)
router.get('/logs', expressAsyncHandler(async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const user = req.user;
  const { limit = 50, offset = 0 } = req.query;
  
  if (!user || user.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }

  try {
    const db = await openDb();
    
    const logs = await db.all(`
      SELECT * FROM fraud_detection_logs 
      ORDER BY timestamp DESC 
      LIMIT ? OFFSET ?
    `, [parseInt(limit as string), parseInt(offset as string)]);

    const total = await db.get(`
      SELECT COUNT(*) as count FROM fraud_detection_logs
    `);

    await db.close();

    res.json({ 
      logs: logs.map(log => ({
        ...log,
        factors: JSON.parse(log.factors || '[]')
      })),
      pagination: {
        total: total.count,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error) {
    console.error('Failed to get fraud logs:', error);
    return next(new BadRequestError('Failed to get fraud logs'));
  }
}));

// Get fraud detection logs for specific email (admin only)
router.get('/logs/:email', expressAsyncHandler(async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const user = req.user;
  const { email } = req.params;
  
  if (!user || user.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }

  try {
    const db = await openDb();
    
    const logs = await db.all(`
      SELECT * FROM fraud_detection_logs 
      WHERE email = ?
      ORDER BY timestamp DESC
    `, [email]);

    await db.close();

    res.json({ 
      logs: logs.map(log => ({
        ...log,
        factors: JSON.parse(log.factors || '[]')
      }))
    });
  } catch (error) {
    console.error('Failed to get fraud logs for email:', error);
    return next(new BadRequestError('Failed to get fraud logs'));
  }
}));

// Manual fraud check (admin only)
router.post('/check', expressAsyncHandler(async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const user = req.user;
  const { transactionData } = req.body;
  
  if (!user || user.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }

  if (!transactionData) {
    return next(new BadRequestError('Transaction data is required'));
  }

  try {
    const fraudRisk = await fraudDetectionService.detectFraud(transactionData);
    res.json({ fraudRisk });
  } catch (error) {
    console.error('Failed to perform fraud check:', error);
    return next(new BadRequestError('Failed to perform fraud check'));
  }
}));

export default router; 