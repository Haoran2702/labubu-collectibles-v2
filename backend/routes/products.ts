import { Router } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { openDb } from '../db';
import { requireAuth } from '../middleware/auth';
import { BadRequestError, NotFoundError, AppError } from '../errors';
import cache from '../cache';
import { sendEmail } from '../utils/emailTemplates';

const router = Router();

// GET /products - list all products with search and filtering
router.get('/', expressAsyncHandler(async (req, res) => {
  // Only cache if no search/filter params
  const isCacheable = !req.query.search && !req.query.minPrice && !req.query.maxPrice && !req.query.limit && !req.query.offset && !req.query.sortBy && !req.query.sortOrder;
  if (isCacheable) {
    const cached = cache.get('products_all');
    if (cached) {
      res.json(cached);
      return;
    }
  }
  const { search, minPrice, maxPrice, limit, offset, sortBy, sortOrder } = req.query;
  
  let query = 'SELECT * FROM products WHERE 1=1';
  const params: any[] = [];
  
  // Search functionality
  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }
  
  // Price filtering
  if (minPrice) {
    query += ' AND price >= ?';
    params.push(parseFloat(minPrice as string));
  }
  
  if (maxPrice) {
    query += ' AND price <= ?';
    params.push(parseFloat(maxPrice as string));
  }
  
  // Sorting
  if (sortBy && ['name', 'price', 'createdAt', 'stock'].includes(sortBy as string)) {
    query += ` ORDER BY ${sortBy}`;
    if (sortOrder && ['ASC', 'DESC'].includes((sortOrder as string).toUpperCase())) {
      query += ` ${(sortOrder as string).toUpperCase()}`;
    } else {
      query += ' ASC';
    }
  } else {
    query += ' ORDER BY createdAt DESC';
  }
  
  // Pagination
  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit as string));
  }
  
  if (offset) {
    query += ' OFFSET ?';
    params.push(parseInt(offset as string));
  }
  
  const db = await openDb();
  const products = await db.all(query, ...params);
  
  // Get total count for pagination
  let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
  const countParams: any[] = [];
  
  if (search) {
    countQuery += ' AND (name LIKE ? OR description LIKE ?)';
    const searchTerm = `%${search}%`;
    countParams.push(searchTerm, searchTerm);
  }
  
  if (minPrice) {
    countQuery += ' AND price >= ?';
    countParams.push(parseFloat(minPrice as string));
  }
  
  if (maxPrice) {
    countQuery += ' AND price <= ?';
    countParams.push(parseFloat(maxPrice as string));
  }
  
  const countResult = await db.get(countQuery, ...countParams);
  await db.close();
  
  const response = {
    products,
    pagination: {
      total: countResult.total,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : 0
    }
  };
  if (isCacheable) {
    cache.set('products_all', response);
  }
  res.json(response);
}));

// GET /products/:id - get a single product
router.get('/:id', expressAsyncHandler(async (req, res, next) => {
  const db = await openDb();
  const product = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
  await db.close();
  if (product) {
    res.json(product);
  } else {
    return next(new NotFoundError('Product not found'));
  }
}));

// POST /products - create a new product
router.post('/', requireAuth, expressAsyncHandler(async (req, res, next) => {
  const { name, description, price, imageUrl, stock = 0, collection } = req.body;
  if (!name || !price) {
    return next(new BadRequestError('Name and price are required'));
  }
  const db = await openDb();
  const result = await db.run(
    'INSERT INTO products (name, description, price, imageUrl, stock, collection) VALUES (?, ?, ?, ?, ?, ?)',
    name, description, price, imageUrl, stock, collection
  );
  const product = await db.get('SELECT * FROM products WHERE id = ?', result.lastID);
  await db.close();
  
  // Clear cache
  cache.del('products_all');
  
  res.status(201).json(product);
}));

// PUT /products/:id - update a product
router.put('/:id', requireAuth, expressAsyncHandler(async (req, res, next) => {
  const { name, description, price, imageUrl, collection } = req.body;
  const db = await openDb();
  const existing = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
  if (!existing) {
    await db.close();
    return next(new NotFoundError('Product not found'));
  }
  await db.run(
    'UPDATE products SET name = ?, description = ?, price = ?, imageUrl = ?, collection = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    name ?? existing.name,
    description ?? existing.description,
    price ?? existing.price,
    imageUrl ?? existing.imageUrl,
    collection ?? existing.collection,
    req.params.id
  );
  const updated = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
  await db.close();
  
  // Clear cache
  cache.del('products_all');
  
  res.json(updated);
}));

// Helper function to track stock movements
async function trackStockMovement(db: any, productId: number, quantity: number, movementType: string, reason: string, orderId?: string, userId?: number, previousStock?: number, newStock?: number) {
  // Use provided values or fetch from database
  if (previousStock === undefined || newStock === undefined) {
    const product = await db.get('SELECT stock FROM products WHERE id = ?', productId);
    if (!product) return;
    previousStock = product.stock;
    newStock = previousStock + quantity;
  }
  
  // Ensure we have valid values
  const finalPreviousStock = previousStock ?? 0;
  const finalNewStock = newStock ?? finalPreviousStock + quantity;
  
  await db.run(`
    INSERT INTO stock_movements (productId, quantity, movementType, reason, orderId, userId, previousStock, newStock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [productId, quantity, movementType, reason, orderId, userId, finalPreviousStock, finalNewStock]);
}

// Helper function to check and send low stock alerts
async function checkLowStockAlerts(db: any, productId: number, newStock: number) {
  const LOW_STOCK_THRESHOLD = 5; // Alert when stock goes below 5
  
  if (newStock <= LOW_STOCK_THRESHOLD) {
    const product = await db.get('SELECT name, stock FROM products WHERE id = ?', productId);
    if (product) {
      // Get admin users to notify
      const admins = await db.all('SELECT email, firstName FROM users WHERE role = ?', ['admin']);
      
      for (const admin of admins) {
        try {
          const html = `
            <h2>Low Stock Alert</h2>
            <p>Product: <strong>${product.name}</strong></p>
            <p>Current Stock: <strong>${product.stock}</strong></p>
            <p>This product is running low on stock and may need to be restocked soon.</p>
            <p>Please check the admin panel to update inventory.</p>
          `;
          
          await sendEmail(admin.email, 'Low Stock Alert - Labubu Collectibles', html);
          console.log(`Low stock alert sent to ${admin.email} for product ${product.name}`);
        } catch (error) {
          console.error(`Failed to send low stock alert to ${admin.email}:`, error);
        }
      }
    }
  }
}

// PUT /products/:id/stock - update product stock
router.put('/:id/stock', requireAuth, expressAsyncHandler(async (req, res, next) => {
  const { stock, operation, reason = 'Manual stock update' } = req.body;
  
  if (operation && !['set', 'increase', 'decrease'].includes(operation)) {
    return next(new BadRequestError('Operation must be set, increase, or decrease'));
  }
  
  const db = await openDb();
  const existing = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
  if (!existing) {
    await db.close();
    return next(new NotFoundError('Product not found'));
  }
  
  const previousStock = existing.stock;
  let newStock;
  let quantityChange = 0;
  
  if (operation === 'increase') {
    quantityChange = stock || 1;
    newStock = previousStock + quantityChange;
  } else if (operation === 'decrease') {
    const decreaseAmount = stock || 1;
    quantityChange = -decreaseAmount;
    newStock = Math.max(0, previousStock - decreaseAmount);
  } else {
    // operation === 'set' or no operation specified
    newStock = stock;
    quantityChange = newStock - previousStock;
  }
  
  if (newStock < 0) {
    await db.close();
    return next(new BadRequestError('Stock cannot be negative'));
  }
  
  // Update the product stock
  await db.run(
    'UPDATE products SET stock = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    newStock,
    req.params.id
  );
  
  // Track the stock movement with correct values
  await trackStockMovement(db, existing.id, quantityChange, 'manual_update', reason, undefined, (req as any).user?.id, previousStock, newStock);
  
  // Check for low stock alerts
  await checkLowStockAlerts(db, existing.id, newStock);
  
  const updated = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
  await db.close();
  
  // Clear cache
  cache.del('products_all');
  
  res.json(updated);
}));

// Check stock availability for multiple products
router.post('/check-stock', expressAsyncHandler(async (req, res, next) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return next(new BadRequestError('Items array is required'));
  }
  
  const db = await openDb();
  const stockChecks = await Promise.all(
    items.map(async (item: any) => {
      const product = await db.get('SELECT id, name, stock FROM products WHERE id = ?', item.productId);
      if (!product) {
        return { productId: item.productId, available: false, reason: 'Product not found' };
      }
      
      const requestedQuantity = item.quantity || 1;
      if (product.stock < requestedQuantity) {
        return { 
          productId: item.productId, 
          available: false, 
          reason: 'Insufficient stock',
          currentStock: product.stock,
          requestedQuantity
        };
      }
      
      return { 
        productId: item.productId, 
        available: true, 
        currentStock: product.stock,
        requestedQuantity
      };
    })
  );
  
  await db.close();
  
  res.json({ 
    allAvailable: stockChecks.every(check => check.available),
    stockChecks 
  });
}));

// Reserve stock for checkout (prevents race conditions)
router.post('/reserve-stock', expressAsyncHandler(async (req, res, next) => {
  const { items, sessionId } = req.body;
  
  if (!Array.isArray(items) || !sessionId) {
    return next(new BadRequestError('Items array and sessionId are required'));
  }
  
  const db = await openDb();
  const reservationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  
  try {
    // Check if all items are available
    for (const item of items) {
      const product = await db.get('SELECT id, name, stock FROM products WHERE id = ?', item.productId);
      
      if (!product) {
        await db.close();
        res.status(400).json({ 
          error: 'Product not found',
          productId: item.productId 
        });
        return;
      }
      
      const requestedQuantity = item.quantity || 1;
      if (product.stock < requestedQuantity) {
        await db.close();
        res.status(400).json({ 
          error: 'Insufficient stock',
          productId: item.productId,
          currentStock: product.stock,
          requestedQuantity
        });
        return;
      }
    }
    
    // Create reservations for all items
    for (const item of items) {
      await db.run(`
        INSERT INTO stock_reservations (productId, quantity, sessionId, expiresAt)
        VALUES (?, ?, ?, ?)
      `, [item.productId, item.quantity || 1, sessionId, reservationExpiry.toISOString()]);
    }
    
    await db.close();
    res.json({ 
      success: true, 
      message: 'Stock reserved successfully',
      expiresAt: reservationExpiry.toISOString()
    });
  } catch (error) {
    await db.close();
    return next(new AppError('Failed to reserve stock', 500));
  }
}));

// Release stock reservation
router.post('/release-stock', expressAsyncHandler(async (req, res, next) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return next(new BadRequestError('SessionId is required'));
  }
  
  const db = await openDb();
  
  try {
    await db.run('DELETE FROM stock_reservations WHERE sessionId = ?', [sessionId]);
    await db.close();
    res.json({ success: true, message: 'Stock reservation released' });
  } catch (error) {
    await db.close();
    return next(new AppError('Failed to release stock reservation', 500));
  }
}));

// Get stock movements for a product
router.get('/:id/stock-movements', requireAuth, expressAsyncHandler(async (req, res, next) => {
  const db = await openDb();
  
  try {
    const movements = await db.all(`
      SELECT sm.*, p.name as productName, u.email as userEmail
      FROM stock_movements sm
      LEFT JOIN products p ON sm.productId = p.id
      LEFT JOIN users u ON sm.userId = u.id
      WHERE sm.productId = ?
      ORDER BY sm.createdAt DESC
      LIMIT 50
    `, [req.params.id]);
    
    await db.close();
    res.json({ movements });
  } catch (error) {
    await db.close();
    return next(new AppError('Failed to get stock movements', 500));
  }
}));

// Cleanup expired stock reservations (run periodically)
router.post('/cleanup-reservations', requireAuth, expressAsyncHandler(async (req, res, next) => {
  const db = await openDb();
  
  try {
    const result = await db.run('DELETE FROM stock_reservations WHERE expiresAt < ?', [new Date().toISOString()]);
    await db.close();
    res.json({ 
      success: true, 
      message: `Cleaned up ${result.changes} expired reservations` 
    });
  } catch (error) {
    await db.close();
    return next(new AppError('Failed to cleanup reservations', 500));
  }
}));

// DELETE /products/:id - delete a product
router.delete('/:id', requireAuth, expressAsyncHandler(async (req, res, next) => {
  const db = await openDb();
  const existing = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
  if (!existing) {
    await db.close();
    return next(new NotFoundError('Product not found'));
  }
  await db.run('DELETE FROM products WHERE id = ?', req.params.id);
  await db.close();
  
  // Clear cache
  cache.del('products_all');
  
  res.status(204).end();
}));

export default router; 