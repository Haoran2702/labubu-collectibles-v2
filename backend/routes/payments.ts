import { Router, Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';
import Stripe from 'stripe';
import { openDb } from '../db';
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, AppError } from '../errors';
import { body, validationResult } from 'express-validator';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-06-30.basil',
});

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

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

// Create payment intent
router.post(
  '/create-payment-intent',
  authenticateToken,
  [
    body('amount').isNumeric().custom((v) => v > 0).withMessage('Valid amount is required'),
    body('currency').optional().isString(),
    handleValidationErrors
  ],
  expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { amount, currency = 'usd', metadata = {} } = req.body;
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: {
          userId: req.user!.userId.toString(),
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      return next(new AppError('Failed to create payment intent', 500));
    }
  })
);

// Confirm payment and create order
router.post(
  '/confirm-payment',
  authenticateToken,
  [
    body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
    body('orderData').notEmpty().withMessage('Order data is required'),
    handleValidationErrors
  ],
  expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { paymentIntentId, orderData } = req.body;
      // Validate order total
      if (orderData.total === undefined || orderData.total === null || isNaN(Number(orderData.total))) {
        return next(new BadRequestError('Order total is required and must be a valid number'));
      }
      // Retrieve payment intent to verify status
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return next(new BadRequestError('Payment not completed'));
      }

      // Create order in database
      const db = await openDb();
      
      // Insert order with payment information
      await db.run(`
        INSERT INTO orders (id, userId, total, shipping_info, order_date, status, payment_intent_id, payment_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderData.id,
        req.user!.userId,
        orderData.total,
        JSON.stringify(orderData.shippingInfo),
        orderData.orderDate,
        'confirmed',
        paymentIntentId,
        'succeeded'
      ]);
      
      // Insert order items
      for (const item of orderData.items) {
        await db.run(`
          INSERT INTO order_items (orderId, productId, quantity, price)
          VALUES (?, ?, ?, ?)
        `, [orderData.id, item.id, item.quantity, item.price]);
      }
      
      // Decrease stock for each item
      for (const item of orderData.items) {
        await db.run(`
          UPDATE products 
          SET stock = CASE 
            WHEN stock >= ? THEN stock - ? 
            ELSE 0 
          END,
          updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [item.quantity, item.quantity, item.id]);
      }
      
      await db.close();
      
      res.json({
        success: true,
        orderId: orderData.id,
        paymentStatus: 'succeeded'
      });
    } catch (error) {
      return next(new AppError('Failed to confirm payment', 500));
    }
  })
);

// Handle Stripe webhooks
router.post('/webhook', expressAsyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret || '');
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).send(`Webhook Error: ${err}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // Update order status if needed
      if (paymentIntent.metadata.orderId) {
        const db = await openDb();
        await db.run(
          'UPDATE orders SET payment_status = ? WHERE payment_intent_id = ?',
          ['succeeded', paymentIntent.id]
        );
        await db.close();
      }
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      console.log('Payment failed:', failedPayment.id);
      
      // Update order status
      const db = await openDb();
      await db.run(
        'UPDATE orders SET payment_status = ?, status = ? WHERE payment_intent_id = ?',
        ['failed', 'cancelled', failedPayment.id]
      );
      await db.close();
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}));

// Get payment status for an order
router.get('/order/:orderId/status', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const userId = req.user!.userId;
    
    const db = await openDb();
    const order = await db.get(
      'SELECT payment_intent_id, payment_status, status FROM orders WHERE id = ? AND userId = ?',
      [orderId, userId]
    );
    await db.close();
    
    if (!order) {
      return next(new NotFoundError('Order not found'));
    }
    
    res.json({
      orderId,
      paymentStatus: order.payment_status,
      orderStatus: order.status,
      paymentIntentId: order.payment_intent_id
    });
  } catch (error) {
    return next(new AppError('Failed to check payment status', 500));
  }
}));

// Refund payment
router.post('/refund', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;
    if (!paymentIntentId) {
      return next(new BadRequestError('Payment intent ID is required'));
    }
    // Check if user is admin or owns the order
    const db = await openDb();
    const order = await db.get(
      'SELECT * FROM orders WHERE payment_intent_id = ? AND (userId = ? OR ? = "admin")',
      [paymentIntentId, req.user!.userId, req.user!.role]
    );
    if (!order) {
      await db.close();
      return next(new NotFoundError('Order not found'));
    }
    // Prevent double refund
    if (order.status === 'refunded' || order.payment_status === 'refunded') {
      await db.close();
      return next(new BadRequestError('Order already refunded'));
    }
    // Determine payment method (Stripe or PayPal)
    if (paymentIntentId.startsWith('pi_')) {
      try {
        // Stripe refund
        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount specified
          reason: reason || 'requested_by_customer',
        });
        await db.run(
          'UPDATE orders SET status = ?, payment_status = ? WHERE payment_intent_id = ?',
          ['refunded', 'refunded', paymentIntentId]
        );
        await db.close();
        res.json({
          success: true,
          refundId: refund.id,
          status: refund.status
        });
      } catch (error: any) {
        if (error.code === 'charge_already_refunded') {
          await db.close();
          res.status(400).json({ error: 'Order already refunded' });
        } else {
          await db.close();
          res.status(500).json({ error: 'Failed to process refund' });
        }
      }
    } else {
      // PayPal refund
      const { client } = require('../paypal');
      const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
      // Get the PayPal capture ID from the order's payment details (if stored), or use paymentIntentId as capture ID
      // For simplicity, assume paymentIntentId is the PayPal order ID, so fetch the capture ID
      const orderRequest = new checkoutNodeJssdk.orders.OrdersGetRequest(paymentIntentId);
      const orderResponse = await client().execute(orderRequest);
      const purchaseUnit = orderResponse.result.purchase_units && orderResponse.result.purchase_units[0];
      const capture = purchaseUnit && purchaseUnit.payments && purchaseUnit.payments.captures && purchaseUnit.payments.captures[0];
      if (!capture || !capture.id) {
        await db.close();
        res.status(400).json({ error: 'No PayPal capture found for this order' });
        return;
      }
      const refundRequest = new checkoutNodeJssdk.payments.CapturesRefundRequest(capture.id);
      refundRequest.requestBody({
        amount: amount ? { value: amount.toFixed(2), currency_code: 'USD' } : undefined,
        note_to_payer: reason || 'requested_by_customer',
      });
      const refundResponse = await client().execute(refundRequest);
      await db.run(
        'UPDATE orders SET status = ?, payment_status = ? WHERE payment_intent_id = ?',
        ['refunded', 'refunded', paymentIntentId]
      );
      await db.close();
      res.json({
        success: true,
        refundId: refundResponse.result.id,
        status: refundResponse.result.status
      });
    }
  } catch (error) {
    return next(new AppError('Failed to process refund', 500));
  }
}));

// PayPal order capture endpoint
router.post('/paypal-capture', authenticateToken, expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { orderID, orderData } = req.body;
  if (!orderID || !orderData) {
    res.status(400).json({ error: 'orderID and orderData are required' });
    return;
  }
  try {
    const { client } = require('../paypal');
    const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    const response = await client().execute(request);
    if (response.result.status !== 'COMPLETED') {
      res.status(400).json({ error: 'PayPal payment not completed' });
      return;
    }
    // Create order in database
    const db = await openDb();
    await db.run(`
      INSERT INTO orders (id, userId, total, shipping_info, order_date, status, payment_intent_id, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderData.id,
      req.user!.userId,
      orderData.total,
      JSON.stringify(orderData.shippingInfo),
      orderData.orderDate,
      'confirmed',
      orderID,
      'succeeded'
    ]);
    for (const item of orderData.items) {
      await db.run(`
        INSERT INTO order_items (orderId, productId, quantity, price)
        VALUES (?, ?, ?, ?)
      `, [orderData.id, item.id, item.quantity, item.price]);
    }
    
    // Decrease stock for each item
    for (const item of orderData.items) {
      await db.run(`
        UPDATE products 
        SET stock = CASE 
          WHEN stock >= ? THEN stock - ? 
          ELSE 0 
        END,
        updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [item.quantity, item.quantity, item.id]);
    }
    
    await db.close();
    res.json({
      success: true,
      orderId: orderData.id,
      paymentStatus: 'succeeded',
      paypalDetails: response.result
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}));

export default router; 