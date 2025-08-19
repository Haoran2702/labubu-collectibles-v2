import express, { Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { openDb } from '../db';
import logger from '../logger';
import { BadRequestError, UnauthorizedError, ForbiddenError } from '../errors';
import gdprService from '../services/gdprService';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

const router = express.Router();

interface DataRightsRequest {
  id: string;
  userId?: number;
  email: string;
  requestType: string;
  reason?: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  createdAt: string;
  updatedAt: string;
  response?: string;
}

// Create data rights request
router.post('/data-rights', expressAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, requestType, reason } = req.body;
  
  if (!email || !requestType) {
    return next(new BadRequestError('Email and request type are required'));
  }

  const validRequestTypes = ['access', 'rectification', 'erasure', 'portability', 'objection', 'withdrawal'];
  if (!validRequestTypes.includes(requestType)) {
    return next(new BadRequestError('Invalid request type'));
  }

  try {
    const request = await gdprService.createDataRightsRequest(email, requestType, reason);
    
    res.status(201).json({
      message: 'Data rights request submitted successfully',
      requestId: request.id
    });
  } catch (error) {
    logger.error('Failed to create data rights request', { error, email, requestType });
    return next(new BadRequestError('Failed to create data rights request'));
  }
}));

// Get data rights request status (for authenticated users)
router.get('/data-rights/:requestId', expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { requestId } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    return next(new UnauthorizedError('Authentication required'));
  }

  const db = await openDb();

  const request = await db.get(`
    SELECT * FROM data_rights_requests 
    WHERE id = ? AND (user_id = ? OR email = (SELECT email FROM users WHERE id = ?))
  `, [requestId, userId, userId]);

  if (!request) {
    return next(new BadRequestError('Request not found'));
  }

  res.json({ request });
}));

// Admin: Get all data rights requests
router.get('/admin/data-rights', expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  
  if (!user || user.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }

  const db = await openDb();

  const requests = await db.all(`
    SELECT * FROM data_rights_requests 
    ORDER BY created_at DESC
  `);

  res.json({ requests });
}));

// Admin: Update data rights request status
router.patch('/admin/data-rights/:requestId', expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { requestId } = req.params;
  const { status, response } = req.body;
  const user = req.user;
  
  if (!user || user.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }

  const validStatuses = ['pending', 'processing', 'completed', 'rejected'];
  if (!validStatuses.includes(status)) {
    return next(new BadRequestError('Invalid status'));
  }

  const db = await openDb();

  await db.run(`
    UPDATE data_rights_requests 
    SET status = ?, response = ?, updated_at = ?
    WHERE id = ?
  `, [status, response, new Date().toISOString(), requestId]);

  logger.info(`Data rights request ${requestId} updated to status: ${status}`);

  res.json({ message: 'Request updated successfully' });
}));

// Export user data (for data portability)
router.post('/export-data', expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;

  if (!userId) {
    return next(new UnauthorizedError('Authentication required'));
  }

  const db = await openDb();

  // Get user data
  const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
  const orders = await db.all('SELECT * FROM orders WHERE userId = ?', [userId]);
  const addresses = await db.all('SELECT * FROM addresses WHERE userId = ?', [userId]);

  const exportData = {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt
    },
    orders: orders.map((order: any) => ({
      id: order.id,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
      items: JSON.parse(order.items || '[]')
    })),
    addresses: addresses.map((addr: any) => ({
      id: addr.id,
      name: addr.name,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country
    })),
    exportedAt: new Date().toISOString()
  };

  // Create data rights request for this export
  await db.run(`
    INSERT INTO data_rights_requests (
      id, user_id, email, request_type, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    `EXPORT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    user.email,
    'portability',
    'completed',
    new Date().toISOString(),
    new Date().toISOString()
  ]);

  res.json({ 
    message: 'Data exported successfully',
    data: exportData
  });
}));

// Process data rights request (admin only)
router.post('/admin/data-rights/:requestId/process', expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  const { requestId } = req.params;
  
  if (!user || user.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }

  try {
    await gdprService.processDataRightsRequest(requestId);
    res.json({ message: 'Data rights request processed successfully' });
  } catch (error) {
    logger.error('Failed to process data rights request', { requestId, error });
    return next(new BadRequestError('Failed to process data rights request'));
  }
}));

// Get user privacy settings
router.get('/privacy-settings', expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  
  if (!user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  try {
    const settings = await gdprService.getUserPrivacySettings(user.email);
    res.json({ settings });
  } catch (error) {
    logger.error('Failed to get privacy settings', { email: user.email, error });
    return next(new BadRequestError('Failed to get privacy settings'));
  }
}));

// Update user privacy settings
router.put('/privacy-settings', expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  const { settings } = req.body;
  
  if (!user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  try {
    await gdprService.updateUserPrivacySettings(user.email, settings);
    res.json({ message: 'Privacy settings updated successfully' });
  } catch (error) {
    logger.error('Failed to update privacy settings', { email: user.email, error });
    return next(new BadRequestError('Failed to update privacy settings'));
  }
}));

// Get GDPR statistics (admin only)
router.get('/admin/gdpr-stats', expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  
  if (!user || user.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }

  try {
    const stats = await gdprService.getDataRightsStats();
    res.json({ stats });
  } catch (error) {
    logger.error('Failed to get GDPR stats', { error });
    return next(new BadRequestError('Failed to get GDPR statistics'));
  }
}));

export default router; 