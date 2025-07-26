import express, { Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { openDb } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth';
import { BadRequestError, NotFoundError, ForbiddenError } from '../errors';
import { body, validationResult } from 'express-validator';
import { getSupportTicketTemplate, sendEmail } from '../utils/emailTemplates';

const router = express.Router();

function getSupportTicketUrl(ticketId: string) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${frontendUrl}/support/${ticketId}`;
}

async function sendSupportEmail(to: string, subject: string, html: string) {
  await sendEmail(to, subject, html);
}

// Helper middleware to handle validation errors
function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new BadRequestError(errors.array().map(e => e.msg).join(', ')));
  }
  next();
}

// Create a new support ticket
router.post(
  '/',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('message').notEmpty().withMessage('Message is required'),
    handleValidationErrors
  ],
  expressAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { userId, email, subject, message, type = 'support', orderId, itemIds, reason } = req.body;
    if (!email || !subject || !message) {
      return next(new BadRequestError('Email, subject, and message are required.'));
    }
    const db = await openDb();
    const id = `ticket_${uuidv4()}`;
    await db.run(
      `INSERT INTO support_tickets (id, userId, email, subject, message, status, type, createdAt, updatedAt, orderId, itemIds, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId || null, email, subject, message, 'open', type, new Date().toISOString(), new Date().toISOString(), orderId || null, itemIds || null, reason || null]
    );
    await db.close();

    // Send confirmation email to customer
    try {
      const html = getSupportTicketTemplate(id, subject, email.split('@')[0]); // Use email prefix as name
      await sendEmail(email, 'Support Ticket Created - Labubu Collectibles', html);
    } catch (error) {
      console.error('Failed to send support ticket confirmation email:', error);
      // Don't fail ticket creation if email fails
    }

    res.status(201).json({ message: 'Support ticket created', ticketId: id });
  })
);

// List tickets (admin: all, user: own)
router.get('/', requireAuth, expressAsyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { status, search } = req.query;
  const db = await openDb();
  
  // Build base WHERE conditions
  let whereConditions = ['type NOT IN (?, ?)'];
  let params = ['return', 'cancellation'];
  
  // Add user restriction for non-admin users
  if (req.user.role !== 'admin') {
    whereConditions.push('(userId = ? OR email = ?)');
    params.push(req.user.userId, req.user.email);
  }
  
  // Add status filter
  if (status && status !== 'all') {
    whereConditions.push('status = ?');
    params.push(status);
  }
  
  // Build the query
  let query = `SELECT * FROM support_tickets WHERE ${whereConditions.join(' AND ')}`;
  
  // Add search filter (applied after query for simplicity)
  query += ' ORDER BY createdAt DESC';
  
  let tickets = await db.all(query, params);
  
  // Apply search filter if provided
  if (search) {
    const searchLower = search.toString().toLowerCase();
    tickets = tickets.filter((ticket: any) => 
      ticket.email.toLowerCase().includes(searchLower) ||
      ticket.subject.toLowerCase().includes(searchLower) ||
      ticket.message.toLowerCase().includes(searchLower)
    );
  }
  
  await db.close();
  res.json({ tickets });
}));

// Get ticket details and messages
router.get('/:id', requireAuth, expressAsyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const db = await openDb();
  const ticket = await db.get('SELECT * FROM support_tickets WHERE id = ?', [id]);
  if (!ticket) {
    await db.close();
    return next(new NotFoundError('Ticket not found'));
  }
  // Only admin or ticket owner can view
  if (req.user.role !== 'admin' && ticket.userId !== req.user.userId && ticket.email !== req.user.email) {
    await db.close();
    return next(new ForbiddenError('Forbidden'));
  }
  const messages = await db.all('SELECT * FROM support_ticket_messages WHERE ticketId = ? ORDER BY createdAt ASC', [id]);
  await db.close();
  res.json({ ticket, messages });
}));

// Add a reply/message to a ticket
router.post('/:id/reply', requireAuth, expressAsyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { message } = req.body;
  if (!message) {
    return next(new BadRequestError('Message is required.'));
  }
  const db = await openDb();
  const ticket = await db.get('SELECT * FROM support_tickets WHERE id = ?', [id]);
  if (!ticket) {
    await db.close();
    return next(new NotFoundError('Ticket not found'));
  }
  // Only admin or ticket owner can reply
  if (req.user.role !== 'admin' && ticket.userId !== req.user.userId && ticket.email !== req.user.email) {
    await db.close();
    return next(new ForbiddenError('Forbidden'));
  }
  await db.run(
    'INSERT INTO support_ticket_messages (ticketId, sender, message, createdAt) VALUES (?, ?, ?, ?)',
    [id, req.user.role === 'admin' ? 'admin' : 'user', message, new Date().toISOString()]
  );
  await db.run('UPDATE support_tickets SET updatedAt = ? WHERE id = ?', [new Date().toISOString(), id]);
  await db.close();

  // Send email notification if admin replied
  if (req.user.role === 'admin') {
    const ticketUrl = getSupportTicketUrl(id);
    await sendSupportEmail(
      ticket.email,
      `Labubu Collectibles Support Ticket Update: ${ticket.subject}`,
      `<p>Your support ticket has received a reply from our team:</p>
       <blockquote>${message}</blockquote>
       <p>You can view and reply to your ticket <a href="${ticketUrl}">here</a>.</p>
       <p>Best regards,<br/>Labubu Collectibles Support Team</p>`
    );
  }

  res.json({ message: 'Reply added' });
}));

// Update ticket status (admin only)
router.put('/:id/status', requireAuth, expressAsyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { status } = req.body;
  if (req.user.role !== 'admin') {
    return next(new ForbiddenError('Admin only'));
  }
  if (!status) {
    return next(new BadRequestError('Status is required.'));
  }
  const db = await openDb();
  const ticket = await db.get('SELECT * FROM support_tickets WHERE id = ?', [id]);
  if (!ticket) {
    await db.close();
    return next(new NotFoundError('Ticket not found'));
  }
  await db.run('UPDATE support_tickets SET status = ?, updatedAt = ? WHERE id = ?', [status, new Date().toISOString(), id]);
  await db.close();

  // Send email notification on status change
  const ticketUrl = getSupportTicketUrl(id);
  await sendSupportEmail(
    ticket.email,
    `Labubu Collectibles Support Ticket Status Updated: ${ticket.subject}`,
    `<p>The status of your support ticket has changed to <b>${status}</b>.</p>
     <p>You can view your ticket <a href="${ticketUrl}">here</a>.</p>
     <p>Best regards,<br/>Labubu Collectibles Support Team</p>`
  );

  res.json({ message: 'Status updated' });
}));

export default router; 