import { Router } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { openDb } from '../db';
import { requireAuth } from '../middleware/auth';
import { BadRequestError, NotFoundError } from '../errors';
import cache from '../cache';
import { imageCache } from '../utils/imageCache';

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
  
  // Optimize images for each product
  const optimizedProducts = await Promise.all(
    products.map(async (product) => {
      if (product.imageUrl) {
        try {
          const cachedUrl = await imageCache.getCachedImage(product.imageUrl);
          if (cachedUrl) {
            product.imageUrl = cachedUrl;
          } else {
            // Cache the image for next time
            product.imageUrl = await imageCache.cacheImage(product.imageUrl);
          }
        } catch (error) {
          console.error('Failed to optimize image:', error);
          // Keep original URL if optimization fails
        }
      }
      return product;
    })
  );
  
  const response = {
    products: optimizedProducts,
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

// PUT /products/:id/stock - update product stock
router.put('/:id/stock', requireAuth, expressAsyncHandler(async (req, res, next) => {
  const { stock, operation } = req.body;
  
  if (operation && !['set', 'increase', 'decrease'].includes(operation)) {
    return next(new BadRequestError('Operation must be set, increase, or decrease'));
  }
  
  const db = await openDb();
  const existing = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
  if (!existing) {
    await db.close();
    return next(new NotFoundError('Product not found'));
  }
  
  let newStock;
  if (operation === 'increase') {
    newStock = existing.stock + (stock || 1);
  } else if (operation === 'decrease') {
    newStock = Math.max(0, existing.stock - (stock || 1));
  } else {
    // operation === 'set' or no operation specified
    newStock = stock;
  }
  
  if (newStock < 0) {
    await db.close();
    return next(new BadRequestError('Stock cannot be negative'));
  }
  
  await db.run(
    'UPDATE products SET stock = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    newStock,
    req.params.id
  );
  
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