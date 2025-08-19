import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import expressAsyncHandler from 'express-async-handler';
import { openDb } from '../db';
import crypto from 'crypto';
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, AppError } from '../errors';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { 
  getEmailVerificationTemplate, 
  getPasswordResetTemplate, 
  getWelcomeEmailTemplate,
  getPasswordChangedTemplate,
  getOrderConfirmationTemplate,
  getOrderStatusUpdateTemplate,
  sendEmail 
} from '../utils/emailTemplates';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to authenticate JWT token
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(new UnauthorizedError('Access token required'));
  }

  try {
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

// Custom rate limit error handler
function rateLimitErrorHandler(req: Request, res: Response) {
  res.status(429).json({ error: 'Too many requests, please try again later.', code: 429 });
}

// Per-route rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  handler: rateLimitErrorHandler
});
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 requests per hour
  handler: rateLimitErrorHandler
});

// Register new user
router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/\d/).withMessage('Password must contain at least one number')
      .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('Password must contain at least one special character'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    handleValidationErrors
  ],
  expressAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, firstName, lastName } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return next(new BadRequestError('All fields are required'));
    }

    // Enhanced password validation
    if (password.length < 8) {
      return next(new BadRequestError('Password must be at least 8 characters'));
    }
    if (!/[a-z]/.test(password)) {
      return next(new BadRequestError('Password must contain at least one lowercase letter'));
    }
    if (!/[A-Z]/.test(password)) {
      return next(new BadRequestError('Password must contain at least one uppercase letter'));
    }
    if (!/\d/.test(password)) {
      return next(new BadRequestError('Password must contain at least one number'));
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return next(new BadRequestError('Password must contain at least one special character'));
    }

    const db = await openDb();

    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      await db.close();
      return next(new BadRequestError('User already exists'));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    console.log('DEBUG: Generated verification token:', verificationToken.substring(0, 10) + '...');
    console.log('DEBUG: Token expires at:', new Date(verificationExpires));

    // Create user with email verification fields
    const result = await db.run(
      'INSERT INTO users (email, password, firstName, lastName, role, emailVerified, emailVerificationToken, emailVerificationExpires, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, firstName, lastName, 'customer', 0, verificationToken, verificationExpires, new Date().toISOString()]
    );

    console.log('DEBUG: User created with ID:', result.lastID);

    await db.close();

    // Send verification email
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
      const html = getEmailVerificationTemplate(email, verificationUrl);
      await sendEmail(email, 'Welcome to Labubu Collectibles - Verify Your Email', html);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail registration if email fails, just log it
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      requiresEmailVerification: true
    });
  })
);

// Login user
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
  ],
  expressAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return next(new BadRequestError('Email and password are required'));
    }

    const db = await openDb();

    // Find user
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      await db.close();
      return next(new UnauthorizedError('Invalid credentials'));
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      await db.close();
      return next(new UnauthorizedError('Invalid credentials'));
    }

    // Check if email is verified
    if (!user.emailVerified) {
      await db.close();
      return next(new UnauthorizedError('Please verify your email address before logging in. Check your inbox for a verification link.'));
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30m' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    await db.close();

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  })
);

// Verify email address
router.post('/verify-email', expressAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email, token } = req.body;

  console.log('DEBUG: Verification request for:', email, 'with token:', token?.substring(0, 10) + '...');

  if (!email || !token) {
    return next(new BadRequestError('Email and verification token are required'));
  }

  const db = await openDb();

  // Find user with verification token
  const user = await db.get('SELECT * FROM users WHERE email = ? AND emailVerificationToken = ?', [email, token]);
  if (!user) {
    console.log('DEBUG: No user found with email and token combination');
    await db.close();
    return next(new BadRequestError('Invalid or expired verification token'));
  }

  console.log('DEBUG: User found, checking expiration...');

  // Check if token has expired
  if (Date.now() > user.emailVerificationExpires) {
    await db.close();
    return next(new BadRequestError('Verification token has expired. Please request a new one.'));
  }

  // Mark email as verified and clear token
  await db.run(
    'UPDATE users SET emailVerified = 1, emailVerificationToken = NULL, emailVerificationExpires = NULL WHERE id = ?',
    [user.id]
  );

  await db.close();

  console.log('DEBUG: Email verification successful for user:', user.id);

  // Send welcome email
  try {
    const html = getWelcomeEmailTemplate(user.firstName);
    await sendEmail(email, 'Welcome to Labubu Collectibles!', html);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't fail verification if welcome email fails
  }

  res.json({
    message: 'Email verified successfully! You can now log in to your account.'
  });
}));

// Resend verification email
router.post('/resend-verification', expressAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  if (!email) {
    return next(new BadRequestError('Email is required'));
  }

  const db = await openDb();

  // Find user
  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    await db.close();
    // For security, don't reveal if user exists
    res.json({ message: 'If that email is registered and unverified, a new verification link has been sent.' });
    return;
  }

  // Check if already verified
  if (user.emailVerified) {
    await db.close();
    res.json({ message: 'This email address is already verified.' });
    return;
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  // Update user with new token
  await db.run(
    'UPDATE users SET emailVerificationToken = ?, emailVerificationExpires = ? WHERE id = ?',
    [verificationToken, verificationExpires, user.id]
  );

  await db.close();

  // Send verification email
  try {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
    const html = getEmailVerificationTemplate(email, verificationUrl);
    await sendEmail(email, 'Labubu Collectibles - Verify Your Email', html);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return next(new AppError('Failed to send verification email. Please try again.', 500));
  }

  res.json({
    message: 'If that email is registered and unverified, a new verification link has been sent.'
  });
}));

// Get current user profile
router.get('/profile', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const db = await openDb();
  const user = await db.get(
    'SELECT id, email, firstName, lastName, role, createdAt FROM users WHERE id = ?',
    [req.user!.userId]
  );
  await db.close();

  if (!user) {
    return next(new NotFoundError('User not found'));
  }

  res.json({ user });
}));

// Update user profile
router.put('/profile', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { firstName, lastName, email } = req.body;

  // Validate input
  if (!firstName || !lastName || !email) {
    return next(new BadRequestError('All fields are required'));
  }

  const db = await openDb();

  // Check if email is already taken by another user
  const existingUser = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user!.userId]);
  if (existingUser) {
    await db.close();
    return next(new BadRequestError('Email already taken'));
  }

  // Update user
  await db.run(
    'UPDATE users SET firstName = ?, lastName = ?, email = ? WHERE id = ?',
    [firstName, lastName, email, req.user!.userId]
  );

  // Get updated user
  const user = await db.get(
    'SELECT id, email, firstName, lastName, role, createdAt FROM users WHERE id = ?',
    [req.user!.userId]
  );
  await db.close();

  res.json({
    message: 'Profile updated successfully',
    user
  });
}));

// Change password
router.put('/change-password', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new BadRequestError('Current and new password are required'));
  }

  // Enhanced password validation for password change
  if (newPassword.length < 8) {
    return next(new BadRequestError('New password must be at least 8 characters'));
  }
  if (!/[a-z]/.test(newPassword)) {
    return next(new BadRequestError('New password must contain at least one lowercase letter'));
  }
  if (!/[A-Z]/.test(newPassword)) {
    return next(new BadRequestError('New password must contain at least one uppercase letter'));
  }
  if (!/\d/.test(newPassword)) {
    return next(new BadRequestError('New password must contain at least one number'));
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
    return next(new BadRequestError('New password must contain at least one special character'));
  }

  const db = await openDb();

  // Get current user with password
  const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user!.userId]);
  if (!user) {
    await db.close();
    return next(new NotFoundError('User not found'));
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    await db.close();
    return next(new UnauthorizedError('Current password is incorrect'));
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, req.user!.userId]);
  
  // Get user details for email
  const userDetails = await db.get('SELECT firstName, email FROM users WHERE id = ?', [req.user!.userId]);
  await db.close();

  // Send password changed confirmation email
  try {
    const html = getPasswordChangedTemplate(userDetails.firstName);
    await sendEmail(userDetails.email, 'Password Changed - Labubu Collectibles', html);
  } catch (error) {
    console.error('Failed to send password changed email:', error);
    // Don't fail password change if email fails
  }

  res.json({ message: 'Password changed successfully' });
}));

// List all addresses for the authenticated user
router.get('/addresses', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const db = await openDb();
  const addresses = await db.all('SELECT * FROM addresses WHERE userId = ? ORDER BY isDefault DESC, createdAt DESC', [req.user!.userId]);
  await db.close();
  res.json({ addresses });
}));

// Add a new address
router.post('/addresses', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { label, name, address, city, state, zip, country, phone, isDefault } = req.body;
  const db = await openDb();
  if (isDefault) {
    await db.run('UPDATE addresses SET isDefault = 0 WHERE userId = ?', [req.user!.userId]);
  }
  const result = await db.run(
    'INSERT INTO addresses (userId, label, name, address, city, state, zip, country, phone, isDefault) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user!.userId, label, name, address, city, state, zip, country, phone, isDefault ? 1 : 0]
  );
  const newAddress = await db.get('SELECT * FROM addresses WHERE id = ?', [result.lastID]);
  await db.close();
  res.status(201).json({ address: newAddress });
}));

// Update an address
router.put('/addresses/:id', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { label, name, address, city, state, zip, country, phone, isDefault } = req.body;
  const { id } = req.params;
  const db = await openDb();
  if (isDefault) {
    await db.run('UPDATE addresses SET isDefault = 0 WHERE userId = ?', [req.user!.userId]);
  }
  await db.run(
    'UPDATE addresses SET label = ?, name = ?, address = ?, city = ?, state = ?, zip = ?, country = ?, phone = ?, isDefault = ? WHERE id = ? AND userId = ?',
    [label, name, address, city, state, zip, country, phone, isDefault ? 1 : 0, id, req.user!.userId]
  );
  const updatedAddress = await db.get('SELECT * FROM addresses WHERE id = ?', [id]);
  await db.close();
  res.json({ address: updatedAddress });
}));

// Delete an address
router.delete('/addresses/:id', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const db = await openDb();
  await db.run('DELETE FROM addresses WHERE id = ? AND userId = ?', [id, req.user!.userId]);
  await db.close();
  res.status(204).end();
}));

// Set an address as default
router.post('/addresses/:id/default', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const db = await openDb();
  await db.run('UPDATE addresses SET isDefault = 0 WHERE userId = ?', [req.user!.userId]);
  await db.run('UPDATE addresses SET isDefault = 1 WHERE id = ? AND userId = ?', [id, req.user!.userId]);
  await db.close();
  res.status(200).json({ success: true });
}));

// Get user orders
router.get('/orders', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const db = await openDb();
  const orders = await db.all(`
    SELECT o.*, 
           GROUP_CONCAT(oi.productId || ':' || oi.quantity || ':' || oi.price) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.orderId
    WHERE o.userId = ?
    GROUP BY o.id
    ORDER BY o.createdAt DESC
  `, [req.user!.userId]);

  // Parse items string back to array
  const ordersWithItems = orders.map(order => ({
    ...order,
    items: order.items ? order.items.split(',').map((item: string) => {
      const [productId, quantity, price] = item.split(':');
      return { productId: parseInt(productId), quantity: parseInt(quantity), price: parseFloat(price) };
    }) : []
  }));

  await db.close();
  res.json({ orders: ordersWithItems });
}));

// Request password reset
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    handleValidationErrors
  ],
  expressAsyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    return next(new BadRequestError('Email is required'));
  }
  const db = await openDb();
  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    await db.close();
    // For security, do not reveal if user exists
    res.json({ message: 'If that email is registered, a reset link has been sent.' });
    return;
  }
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 1000 * 60 * 60; // 1 hour
  await db.run('UPDATE users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE id = ?', [token, expires, user.id]);
  await db.close();

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  const html = getPasswordResetTemplate(resetUrl);
  await sendEmail(email, 'Password Reset Request - Labubu Collectibles', html);
  res.json({ message: 'If that email is registered, a reset link has been sent.' });
}));

// Reset password
router.post('/reset-password', expressAsyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    return next(new BadRequestError('All fields are required'));
  }
  // Enhanced password validation for password reset
  if (newPassword.length < 8) {
    return next(new BadRequestError('Password must be at least 8 characters'));
  }
  if (!/[a-z]/.test(newPassword)) {
    return next(new BadRequestError('Password must contain at least one lowercase letter'));
  }
  if (!/[A-Z]/.test(newPassword)) {
    return next(new BadRequestError('Password must contain at least one uppercase letter'));
  }
  if (!/\d/.test(newPassword)) {
    return next(new BadRequestError('Password must contain at least one number'));
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
    return next(new BadRequestError('Password must contain at least one special character'));
  }
  const db = await openDb();
  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
    await db.close();
    return next(new BadRequestError('Invalid or expired token'));
  }
  if (user.resetPasswordToken !== token || Date.now() > user.resetPasswordExpires) {
    await db.close();
    return next(new BadRequestError('Invalid or expired token'));
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.run('UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE id = ?', [hashedPassword, user.id]);
  await db.close();
  res.json({ message: 'Password has been reset successfully.' });
}));



export default router; 