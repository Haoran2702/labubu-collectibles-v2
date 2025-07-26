import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../database';
import { authenticateToken } from '../middleware/auth';
import { expressAsyncHandler } from '../utils/expressAsyncHandler';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

const router = express.Router();

// Register new user
router.post('/register', expressAsyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;

  // Validate input
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Check if user already exists
  const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const result = await db.run(
    'INSERT INTO users (email, password, firstName, lastName, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    [email, hashedPassword, firstName, lastName, 'customer', new Date().toISOString()]
  );

  const userId = result.lastID;

  // Generate JWT token
  const token = jwt.sign(
    { userId, email, role: 'customer' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );

  // Get user data (without password)
  const user = await db.get('SELECT id, email, firstName, lastName, role, createdAt FROM users WHERE id = ?', [userId]);

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user
  });
}));

// Login user
router.post('/login', expressAsyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Find user
  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    message: 'Login successful',
    token,
    user: userWithoutPassword
  });
}));

// Get current user profile
router.get('/profile', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await db.get(
    'SELECT id, email, firstName, lastName, role, createdAt, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country, shipping_phone FROM users WHERE id = ?',
    [req.user!.userId]
  );
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
}));

// Update user profile
router.put('/profile', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { firstName, lastName, email, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country, shipping_phone } = req.body;
  await db.run(
    'UPDATE users SET firstName = ?, lastName = ?, email = ?, shipping_address = ?, shipping_city = ?, shipping_state = ?, shipping_zip = ?, shipping_country = ?, shipping_phone = ? WHERE id = ?',
    [firstName, lastName, email, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country, shipping_phone, req.user!.userId]
  );
  const user = await db.get(
    'SELECT id, email, firstName, lastName, role, createdAt, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country, shipping_phone FROM users WHERE id = ?',
    [req.user!.userId]
  );
  res.json({ user });
}));

// Change password
router.put('/change-password', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  // Get current user with password
  const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user!.userId]);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, req.user!.userId]);

  res.json({ message: 'Password changed successfully' });
}));

// List all addresses for the authenticated user
router.get('/addresses', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const addresses = await db.all('SELECT * FROM addresses WHERE userId = ? ORDER BY isDefault DESC, createdAt DESC', [req.user!.userId]);
  res.json({ addresses });
}));

// List all orders for the authenticated user
router.get('/orders', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const orders = await db.all('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC', [req.user!.userId]);
  res.json({ orders });
}));

router.post('/addresses', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { label, name, address, city, state, zip, country, phone, isDefault } = req.body;
  if (isDefault) {
    await db.run('UPDATE addresses SET isDefault = 0 WHERE userId = ?', [req.user!.userId]);
  }
  const result = await db.run(
    'INSERT INTO addresses (userId, label, name, address, city, state, zip, country, phone, isDefault) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user!.userId, label, name, address, city, state, zip, country, phone, isDefault ? 1 : 0]
  );
  const newAddress = await db.get('SELECT * FROM addresses WHERE id = ?', [result.lastID]);
  res.status(201).json({ address: newAddress });
}));

router.put('/addresses/:id', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { label, name, address, city, state, zip, country, phone, isDefault } = req.body;
  const { id } = req.params;
  if (isDefault) {
    await db.run('UPDATE addresses SET isDefault = 0 WHERE userId = ?', [req.user!.userId]);
  }
  await db.run(
    'UPDATE addresses SET label = ?, name = ?, address = ?, city = ?, state = ?, zip = ?, country = ?, phone = ?, isDefault = ? WHERE id = ? AND userId = ?',
    [label, name, address, city, state, zip, country, phone, isDefault ? 1 : 0, id, req.user!.userId]
  );
  const updatedAddress = await db.get('SELECT * FROM addresses WHERE id = ?', [id]);
  res.json({ address: updatedAddress });
}));

router.delete('/addresses/:id', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  await db.run('DELETE FROM addresses WHERE id = ? AND userId = ?', [id, req.user!.userId]);
  res.status(204).end();
}));

router.post('/addresses/:id/default', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  await db.run('UPDATE addresses SET isDefault = 0 WHERE userId = ?', [req.user!.userId]);
  await db.run('UPDATE addresses SET isDefault = 1 WHERE id = ? AND userId = ?', [id, req.user!.userId]);
  res.status(200).json({ success: true });
}));

export default router; 