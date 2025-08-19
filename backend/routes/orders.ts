import { Router, Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { openDb } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, AppError } from '../errors';
import { body, validationResult } from 'express-validator';
import { getOrderConfirmationTemplate, getOrderStatusUpdateTemplate, sendEmail } from '../utils/emailTemplates';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

// Order status enum
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  RETURNED = 'returned',
  RETURN_REQUESTED = 'return_requested'
}

// Order status transitions - streamlined workflow
const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED], // Keep for backward compatibility
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURN_REQUESTED], // Customers can request returns after delivery
  [OrderStatus.CANCELLED]: [OrderStatus.REFUNDED], // Cancelled orders can be refunded if they have payment
  [OrderStatus.REFUNDED]: [],
  [OrderStatus.RETURNED]: [OrderStatus.REFUNDED],
  [OrderStatus.RETURN_REQUESTED]: [OrderStatus.RETURNED, OrderStatus.CANCELLED]
};

const router = Router();

// Middleware to authenticate JWT token
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(new UnauthorizedError('Access token required'));
  }

  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return next(new ForbiddenError('Invalid token'));
  }
};

// Helper middleware to handle validation errors
function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new BadRequestError(errors.array().map(e => e.msg).join(', ')));
  }
  next();
}

// Helper function to validate status transition
function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  const current = currentStatus as OrderStatus;
  const next = newStatus as OrderStatus;
  return VALID_STATUS_TRANSITIONS[current]?.includes(next) || false;
}

// Helper function to add status history
async function addStatusHistory(db: any, orderId: string, status: string, reason: string, updatedBy: string, processType: string = 'order') {
  await db.run(`
    INSERT INTO order_status_history (orderId, status, reason, updatedBy, processType)
    VALUES (?, ?, ?, ?, ?)
  `, [orderId, status, reason, updatedBy, processType]);
}

// Helper function to send order notifications
async function sendOrderNotification(orderId: string, status: string, userEmail: string, customerName?: string, trackingNumber?: string) {
  try {
    const db = await openDb();
    
    // Get order details for email
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    const user = await db.get('SELECT firstName FROM users WHERE email = ?', [userEmail]);
    
    const customerNameForEmail = customerName || user?.firstName || userEmail.split('@')[0];
    
    // Send status update email
    const html = getOrderStatusUpdateTemplate(orderId, status, customerNameForEmail, trackingNumber);
    await sendEmail(userEmail, `Order ${orderId} Status Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`, html);
    
    // Update notification tracking
    const notifications = await db.get('SELECT notification_sent FROM orders WHERE id = ?', [orderId]);
    const sentNotifications = JSON.parse(notifications?.notification_sent || '[]');
    sentNotifications.push({
      status,
      sentAt: new Date().toISOString(),
      type: 'email'
    });
    
    await db.run('UPDATE orders SET notification_sent = ? WHERE id = ?', 
      [JSON.stringify(sentNotifications), orderId]);
    await db.close();
    
    console.log(`Order notification email sent: Order ${orderId} status changed to ${status} for ${userEmail}`);
  } catch (error) {
    console.error('Failed to send order notification email:', error);
    // Don't fail the order update if email fails
  }
}

// Create a new order (requires authentication)
router.post(
  '/',
  authenticateToken,
  [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('total').isNumeric().withMessage('Total must be a number'),
    body('shippingInfo').isObject().withMessage('Shipping info is required'),
    body('orderDate').notEmpty().withMessage('Order date is required'),
    handleValidationErrors
  ],
  expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { items, total, shippingInfo, orderDate } = req.body;
    const userId = req.user!.userId;
    
    // Generate a unique order ID
    const orderId = uuidv4();
    
    const db = await openDb();
    
    // Insert order into database with user ID
    await db.run(`
      INSERT INTO orders (id, userId, total, shipping_info, order_date, status, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [orderId, userId, total, JSON.stringify(shippingInfo), orderDate, OrderStatus.PENDING]);
    
    // Insert order items
    for (const item of items) {
      await db.run(`
        INSERT INTO order_items (orderId, productId, quantity, price)
        VALUES (?, ?, ?, ?)
      `, [orderId, item.id, item.quantity, item.price]);
    }
    
    // Add initial status history
    await addStatusHistory(db, orderId, OrderStatus.PENDING, 'Order created', req.user!.email);
    
    // Get user details for email
    const user = await db.get('SELECT firstName, email FROM users WHERE id = ?', [userId]);
    await db.close();
    
    // Send order confirmation email
    try {
      const orderDetails = {
        id: orderId,
        total,
        shippingInfo,
        orderDate,
        status: OrderStatus.PENDING,
        items
      };
      const html = getOrderConfirmationTemplate(orderId, orderDetails, user.firstName);
      await sendEmail(user.email, 'Order Confirmation - Labubu Collectibles', html);
    } catch (error) {
      console.error('Failed to send order confirmation email:', error);
      // Don't fail order creation if email fails
    }
    
    // Send initial notification
    await sendOrderNotification(orderId, OrderStatus.PENDING, req.user!.email);
    
    res.status(201).json({
      id: orderId,
      userId,
      total,
      shippingInfo,
      orderDate,
      status: OrderStatus.PENDING,
      items
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'test') {
      const err = error as any;
      res.status(500).json({ error: 'Order creation failed', code: 500, message: err.message, stack: err.stack });
      return;
    }
    return next(new AppError('Order creation failed', 500));
  }
}));

// Get order by ID (requires authentication)
router.get('/:id', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  
  const db = await openDb();
  
  // Get order details (only if user owns the order or is admin)
  const order = await db.get('SELECT * FROM orders WHERE id = ? AND (userId = ? OR ? = "admin")', [id, userId, req.user!.role]);
  
  if (!order) {
    await db.close();
    return next(new NotFoundError('Order not found'));
  }
  
  // Get order items with product info
  const items = await db.all(`
    SELECT oi.productId, oi.quantity, oi.price, p.name, p.imageUrl, p.collection
    FROM order_items oi
    LEFT JOIN products p ON oi.productId = p.id
    WHERE oi.orderId = ?
  `, [id]);
  
  // Get status history
  const statusHistory = await db.all('SELECT * FROM order_status_history WHERE orderId = ? ORDER BY createdAt DESC', [id]);
  const orderHistory = statusHistory.filter((entry: any) => entry.processType === 'order' || !entry.processType);
  const returnHistory = statusHistory.filter((entry: any) => entry.processType === 'return');
  
  await db.close();
  
  const orderData = {
    id: order.id,
    userId: order.userId,
    total: order.total,
    shippingInfo: JSON.parse(order.shipping_info),
    orderDate: order.order_date,
    status: order.status,
    trackingNumber: order.tracking_number,
    estimatedDelivery: order.estimated_delivery,
    actualDelivery: order.actual_delivery,
    cancellationReason: order.cancellation_reason,
    modificationHistory: JSON.parse(order.modification_history || '[]'),
    notificationSent: JSON.parse(order.notification_sent || '[]'),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: items.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
      image: item.imageUrl,
      collection: item.collection
    })),
    statusHistory: orderHistory.map((entry: any) => ({
      status: entry.status,
      reason: entry.reason,
      updatedBy: entry.updatedBy,
      createdAt: entry.createdAt
    })),
    returnHistory: returnHistory.map((entry: any) => ({
      status: entry.status,
      reason: entry.reason,
      updatedBy: entry.updatedBy,
      createdAt: entry.createdAt
    }))
  };
  
  res.json(orderData);
}));

// Get all orders for the authenticated user with filtering
router.get('/', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { status, dateFrom, dateTo, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
  
  const db = await openDb();
  
  // Build WHERE clause for filtering
  let whereClause = 'WHERE userId = ?';
  const params: any[] = [userId];
  
  if (status && status !== 'all') {
    whereClause += ' AND status = ?';
    params.push(status);
  }
  
  if (dateFrom) {
    whereClause += ' AND createdAt >= ?';
    params.push(dateFrom);
  }
  
  if (dateTo) {
    whereClause += ' AND createdAt <= ?';
    params.push(dateTo);
  }
  
  // Validate sort parameters
  const validSortFields = ['createdAt', 'total', 'status', 'orderDate'];
  const validSortOrders = ['ASC', 'DESC'];
  const finalSortBy = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
  const finalSortOrder = validSortOrders.includes(sortOrder as string) ? sortOrder : 'DESC';
  
  // Get orders for the user with filtering
  const orders = await db.all(`
    SELECT * FROM orders 
    ${whereClause} 
    ORDER BY ${finalSortBy} ${finalSortOrder}
  `, params);
  
  const ordersWithItems = await Promise.all(
    orders.map(async (order: any) => {
      const items = await db.all('SELECT * FROM order_items WHERE orderId = ?', [order.id]);
      return {
        id: order.id,
        userId: order.userId,
        total: order.total,
        shippingInfo: JSON.parse(order.shipping_info),
        orderDate: order.order_date,
        status: order.status,
        trackingNumber: order.tracking_number,
        estimatedDelivery: order.estimated_delivery,
        actualDelivery: order.actual_delivery,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      };
    })
  );
  
  // Apply search filter if provided
  let filteredOrders = ordersWithItems;
  if (search) {
    const searchLower = (search as string).toLowerCase();
    filteredOrders = ordersWithItems.filter((order: any) => {
      return (
        order.id.toLowerCase().includes(searchLower) ||
        order.status.toLowerCase().includes(searchLower) ||
        order.shippingInfo.name.toLowerCase().includes(searchLower) ||
        order.shippingInfo.address.toLowerCase().includes(searchLower) ||
        order.total.toString().includes(searchLower)
      );
    });
  }
  
  await db.close();
  res.json(filteredOrders);
}));

// Update order status (admin only)
router.patch('/:id/status', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { status, reason, trackingNumber, estimatedDelivery } = req.body;
  
  // Check if user is admin
  if (req.user!.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }
  
  const db = await openDb();
  
  // Get current order status
  const order = await db.get('SELECT status, userId FROM orders WHERE id = ?', [id]);
  if (!order) {
    await db.close();
    return next(new NotFoundError('Order not found'));
  }
  
  // Validate status transition
  if (!isValidStatusTransition(order.status, status)) {
    await db.close();
    return next(new BadRequestError('Invalid status transition'));
  }
  
  // Update order status
  const updateFields = ['status = ?', 'updatedAt = CURRENT_TIMESTAMP'];
  const updateValues = [status];
  
  if (trackingNumber) {
    updateFields.push('tracking_number = ?');
    updateValues.push(trackingNumber);
  }
  
  if (estimatedDelivery) {
    updateFields.push('estimated_delivery = ?');
    updateValues.push(estimatedDelivery);
  }
  
  if (status === OrderStatus.DELIVERED) {
    updateFields.push('actual_delivery = CURRENT_TIMESTAMP');
  }
  
  if (status === OrderStatus.CANCELLED && reason) {
    updateFields.push('cancellation_reason = ?');
    updateValues.push(reason);
  }
  
  updateValues.push(id);
  
  await db.run(`UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
  
  // Add status history - determine if this is part of return process
  const processType = ([OrderStatus.RETURN_REQUESTED, OrderStatus.RETURNED, OrderStatus.REFUNDED].includes(status as OrderStatus)) ? 'return' : 'order';
  await addStatusHistory(db, id, status, reason || 'Status updated by admin', req.user!.email, processType);
  
  // Get user email for notification before closing db
  const user = await db.get('SELECT email FROM users WHERE id = ?', [order.userId]);
  
  await db.close();
  
  // Send notification
  if (user) {
    await sendOrderNotification(id, status, user.email);
  }
  
  res.json({ 
    message: 'Order status updated successfully',
    newStatus: status,
    trackingNumber,
    estimatedDelivery
  });
}));

// Cancel order (customer or admin)
// Request return for an order (customer-initiated)
router.post('/:id/return-request', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { reason, items } = req.body;
  
  const db = await openDb();
  
  // Get order and verify ownership
  const order = await db.get('SELECT userId, status FROM orders WHERE id = ?', [id]);
  if (!order) {
    await db.close();
    return next(new NotFoundError('Order not found'));
  }
  
  // Check if user owns this order
  if (order.userId !== req.user!.userId) {
    await db.close();
    return next(new ForbiddenError('You can only request returns for your own orders'));
  }
  
  // Validate status transition
  if (!isValidStatusTransition(order.status, OrderStatus.RETURN_REQUESTED)) {
    await db.close();
    return next(new BadRequestError('Cannot request return for this order status'));
  }
  
  // Update order status to return_requested
  await db.run(`
    UPDATE orders 
    SET status = ?, updatedAt = CURRENT_TIMESTAMP 
    WHERE id = ?
  `, [OrderStatus.RETURN_REQUESTED, id]);
  
  // Add status history for return process
  await addStatusHistory(db, id, OrderStatus.RETURN_REQUESTED, reason || 'Customer requested return', req.user!.email, 'return');
  
  // Get user email for notification before closing db
  const user = await db.get('SELECT email FROM users WHERE id = ?', [order.userId]);
  
  await db.close();
  
  // Send notification
  if (user) {
    await sendOrderNotification(id, OrderStatus.RETURN_REQUESTED, user.email);
  }
  
  res.json({ 
    message: 'Return request submitted successfully',
    newStatus: OrderStatus.RETURN_REQUESTED
  });
}));

router.post('/:id/cancel', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  const db = await openDb();
  
  // Get order details
  const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) {
    await db.close();
    return next(new NotFoundError('Order not found'));
  }
  
  // Check permissions (user can cancel their own order, admin can cancel any)
  if (order.userId !== req.user!.userId && req.user!.role !== 'admin') {
    await db.close();
    return next(new ForbiddenError('Not authorized to cancel this order'));
  }
  
  // Check if order can be cancelled
  if (![OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING].includes(order.status as OrderStatus)) {
    await db.close();
    return next(new BadRequestError('Order cannot be cancelled in its current status'));
  }
  
  // Update order status
  await db.run(`
    UPDATE orders 
    SET status = ?, cancellation_reason = ?, updatedAt = CURRENT_TIMESTAMP 
    WHERE id = ?
  `, [OrderStatus.CANCELLED, reason || 'Cancelled by customer', id]);
  
  // Add status history
  await addStatusHistory(db, id, OrderStatus.CANCELLED, reason || 'Order cancelled', req.user!.email);
  
  // Get user email for notification before closing db
  const user = await db.get('SELECT email FROM users WHERE id = ?', [order.userId]);
  
  await db.close();
  
  // Send notification
  if (user) {
    await sendOrderNotification(id, OrderStatus.CANCELLED, user.email);
  }
  
  res.json({ message: 'Order cancelled successfully' });
}));

// Modify order (admin only)
router.patch('/:id/modify', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { items, total, shippingInfo, reason } = req.body;
  
  // Check if user is admin
  if (req.user!.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }
  
  const db = await openDb();
  
  // Get current order
  const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) {
    await db.close();
    return next(new NotFoundError('Order not found'));
  }
  
  // Check if order can be modified
  if ([OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(order.status as OrderStatus)) {
    await db.close();
    return next(new BadRequestError('Order cannot be modified in its current status'));
  }
  
  // Store modification history
  const modificationHistory = JSON.parse(order.modification_history || '[]');
  modificationHistory.push({
    timestamp: new Date().toISOString(),
    modifiedBy: req.user!.email,
    reason: reason || 'Order modified by admin',
    previousTotal: order.total,
    newTotal: total,
    previousItems: JSON.parse(order.shipping_info),
    newItems: shippingInfo
  });
  
  // Update order
  await db.run(`
    UPDATE orders 
    SET total = ?, shipping_info = ?, modification_history = ?, updatedAt = CURRENT_TIMESTAMP 
    WHERE id = ?
  `, [total, JSON.stringify(shippingInfo), JSON.stringify(modificationHistory), id]);
  
  // Update order items (delete existing and insert new)
  await db.run('DELETE FROM order_items WHERE orderId = ?', [id]);
  for (const item of items) {
    await db.run(`
      INSERT INTO order_items (orderId, productId, quantity, price)
      VALUES (?, ?, ?, ?)
    `, [id, item.id, item.quantity, item.price]);
  }
  
  await db.close();
  
  res.json({ message: 'Order modified successfully' });
}));

// Get order status history
router.get('/:id/history', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  
  const db = await openDb();
  
  // Check if user can access this order
  const order = await db.get('SELECT userId FROM orders WHERE id = ?', [id]);
  if (!order || (order.userId !== userId && req.user!.role !== 'admin')) {
    await db.close();
    return next(new NotFoundError('Order not found'));
  }
  
  // Get status history
  const history = await db.all('SELECT * FROM order_status_history WHERE orderId = ? ORDER BY createdAt DESC', [id]);
  
  await db.close();
  
  res.json(history);
}));

// Admin: Get all orders for all users with filtering
router.get('/admin/all', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Only allow admin
  if (req.user?.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }
  
  const { 
    status, 
    dateFrom, 
    dateTo, 
    search, 
    customerEmail,
    sortBy = 'createdAt', 
    sortOrder = 'DESC',
    limit = '50',
    offset = '0'
  } = req.query;
  
  const db = await openDb();
  
  // Build WHERE clause for filtering
  let whereClause = '';
  const params: any[] = [];
  
  const conditions: string[] = [];
  
  if (status && status !== 'all') {
    conditions.push('o.status = ?');
    params.push(status);
  }
  
  if (dateFrom) {
    conditions.push('o.createdAt >= ?');
    params.push(dateFrom);
  }
  
  if (dateTo) {
    conditions.push('o.createdAt <= ?');
    params.push(dateTo);
  }
  
  if (customerEmail) {
    conditions.push('u.email LIKE ?');
    params.push(`%${customerEmail}%`);
  }
  
  if (conditions.length > 0) {
    whereClause = 'WHERE ' + conditions.join(' AND ');
  }
  
  // Validate sort parameters
  const validSortFields = ['createdAt', 'total', 'status', 'orderDate', 'email', 'firstName', 'lastName'];
  const validSortOrders = ['ASC', 'DESC'];
  const finalSortBy = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
  const finalSortOrder = validSortOrders.includes(sortOrder as string) ? sortOrder : 'DESC';
  
  // Get total count for pagination
  const countResult = await db.get(`
    SELECT COUNT(*) as total
    FROM orders o
    LEFT JOIN users u ON o.userId = u.id
    ${whereClause}
  `, params);
  
  const totalCount = countResult.total;
  
  // Get orders with pagination
  const limitNum = Math.min(parseInt(limit as string) || 50, 100); // Max 100 per page
  const offsetNum = parseInt(offset as string) || 0;
  
  const orders = await db.all(`
    SELECT o.*, u.email, u.firstName, u.lastName
    FROM orders o
    LEFT JOIN users u ON o.userId = u.id
    ${whereClause}
    ORDER BY o.${finalSortBy} ${finalSortOrder}
    LIMIT ? OFFSET ?
  `, [...params, limitNum, offsetNum]);
  
  // Attach items to each order and map field names
  const ordersWithItems = await Promise.all(
    orders.map(async (order: any) => {
      const items = await db.all('SELECT * FROM order_items WHERE orderId = ?', [order.id]);
      return {
        ...order,
        orderDate: order.order_date, // Map snake_case to camelCase
        shippingInfo: JSON.parse(order.shipping_info),
        modificationHistory: JSON.parse(order.modification_history || '[]'),
        notificationSent: JSON.parse(order.notification_sent || '[]'),
        items: items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      };
    })
  );
  
  // Apply search filter if provided
  let filteredOrders = ordersWithItems;
  if (search) {
    const searchLower = (search as string).toLowerCase();
    filteredOrders = ordersWithItems.filter((order: any) => {
      return (
        order.id.toLowerCase().includes(searchLower) ||
        order.status.toLowerCase().includes(searchLower) ||
        order.email.toLowerCase().includes(searchLower) ||
        order.firstName.toLowerCase().includes(searchLower) ||
        order.lastName.toLowerCase().includes(searchLower) ||
        order.shippingInfo.name.toLowerCase().includes(searchLower) ||
        order.shippingInfo.address.toLowerCase().includes(searchLower) ||
        order.total.toString().includes(searchLower)
      );
    });
  }
  
  await db.close();
  
  res.json({
    orders: filteredOrders,
    pagination: {
      total: totalCount,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < totalCount
    }
  });
}));

// Get order statistics (admin only)
router.get('/admin/stats', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }
  
  const db = await openDb();
  
  // Get status counts
  const statusStats = await db.all(`
    SELECT status, COUNT(*) as count, SUM(total) as total_value
    FROM orders 
    GROUP BY status
  `);
  
  // Get recent orders
  const recentOrders = await db.all(`
    SELECT COUNT(*) as count 
    FROM orders 
    WHERE createdAt >= datetime('now', '-7 days')
  `);
  
  // Get total revenue
  const totalRevenue = await db.get(`
    SELECT SUM(total) as total 
    FROM orders 
    WHERE status IN ('delivered', 'shipped', 'processing')
  `);
  
  await db.close();
  
  res.json({
    statusStats,
    recentOrders: recentOrders[0].count,
    totalRevenue: totalRevenue.total || 0
  });
}));

// Generate and download invoice (admin only)
router.get('/:id/invoice', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  
  // Check if user is admin
  if (req.user!.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }
  
  const db = await openDb();
  
  // Get order details with customer and items info
  const order = await db.get(`
    SELECT o.*, u.firstName, u.lastName, u.email 
    FROM orders o 
    LEFT JOIN users u ON o.userId = u.id 
    WHERE o.id = ?
  `, [id]);
  
  if (!order) {
    await db.close();
    return next(new NotFoundError('Order not found'));
  }
  
  // Get order items with product info
  const items = await db.all(`
    SELECT oi.productId, oi.quantity, oi.price, p.name, p.collection
    FROM order_items oi
    LEFT JOIN products p ON oi.productId = p.id
    WHERE oi.orderId = ?
  `, [id]);
  
  await db.close();
  
  // Prepare invoice data
  const shippingInfo = JSON.parse(order.shipping_info);
  const invoiceData = {
    orderId: order.id,
    orderDate: order.order_date,
    customerName: `${order.firstName} ${order.lastName}`,
    customerEmail: order.email,
    shippingAddress: {
      name: shippingInfo.name,
      address: shippingInfo.address,
      city: shippingInfo.city,
      state: shippingInfo.state,
      zip: shippingInfo.zip,
      country: shippingInfo.country
    },
    items: items.map((item: any) => ({
      name: item.name ? `${item.collection} - ${item.name}` : `Product #${item.productId}`,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price
    })),
    subtotal: order.total,
    tax: 0, // Calculate tax if needed
    shipping: 0, // Calculate shipping if needed
    total: order.total,
    paymentStatus: order.payment_status || 'pending',
    paymentMethod: order.payment_intent_id ? 'Credit Card' : 'PayPal'
  };
  
  try {
    const { generateInvoiceBuffer } = require('../utils/pdfGenerator');
    const pdfBuffer = await generateInvoiceBuffer(invoiceData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating invoice:', error);
    return next(new AppError('Failed to generate invoice', 500));
  }
}));

// Generate and download shipping label (admin only)
router.get('/:id/shipping-label', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  
  // Check if user is admin
  if (req.user!.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }
  
  const db = await openDb();
  
  // Get order details with customer info
  const order = await db.get(`
    SELECT o.*, u.firstName, u.lastName 
    FROM orders o 
    LEFT JOIN users u ON o.userId = u.id 
    WHERE o.id = ?
  `, [id]);
  
  if (!order) {
    await db.close();
    return next(new NotFoundError('Order not found'));
  }
  
  // Get order items with product info
  const items = await db.all(`
    SELECT oi.productId, oi.quantity, p.name, p.collection
    FROM order_items oi
    LEFT JOIN products p ON oi.productId = p.id
    WHERE oi.orderId = ?
  `, [id]);
  
  await db.close();
  
  // Prepare shipping label data
  const shippingInfo = JSON.parse(order.shipping_info);
  const shippingLabelData = {
    orderId: order.id,
    customerName: `${order.firstName} ${order.lastName}`,
    shippingAddress: {
      name: shippingInfo.name,
      address: shippingInfo.address,
      city: shippingInfo.city,
      state: shippingInfo.state,
      zip: shippingInfo.zip,
      country: shippingInfo.country
    },
    items: items.map((item: any) => ({
      name: item.name ? `${item.collection} - ${item.name}` : `Product #${item.productId}`,
      quantity: item.quantity
    })),
    trackingNumber: order.tracking_number,
    weight: 1.5, // Default weight, could be calculated from items
    dimensions: '8x6x4', // Default dimensions
    serviceLevel: 'Standard Shipping'
  };
  
  try {
    const { generateShippingLabelBuffer } = require('../utils/pdfGenerator');
    const pdfBuffer = await generateShippingLabelBuffer(shippingLabelData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="shipping-label-${order.id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating shipping label:', error);
    return next(new AppError('Failed to generate shipping label', 500));
  }
}));

export default router; 