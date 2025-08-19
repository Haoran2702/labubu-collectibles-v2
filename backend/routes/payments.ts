import { Router, Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';
import Stripe from 'stripe';
import { openDb } from '../db';
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, AppError } from '../errors';
import { body, validationResult } from 'express-validator';
import { getOrderConfirmationTemplate, getRefundProcessedTemplate, sendEmail } from '../utils/emailTemplates';
import { 
  sanitizePaymentInput, 
  paymentRateLimit, 
  validateInput, 
  validatePaymentData,
  securityLogger 
} from '../middleware/security';
import fraudDetectionService from '../services/fraudDetection';

// Helper function to add status history
async function addStatusHistory(db: any, orderId: string, status: string, reason: string, updatedBy: string, processType: string = 'order') {
  await db.run(`
    INSERT INTO order_status_history (orderId, status, reason, updatedBy, processType)
    VALUES (?, ?, ?, ?, ?)
  `, [orderId, status, reason, updatedBy, processType]);
}

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
  paymentRateLimit,
  securityLogger,
  sanitizePaymentInput,
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

      // Fraud detection check
      const transactionData = {
        userId: req.user!.userId,
        email: req.user!.email,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        amount: orderData.total,
        currency: 'usd',
        paymentMethod: 'stripe',
        shippingAddress: orderData.shippingInfo,
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date().toISOString()
      };

      const fraudRisk = await fraudDetectionService.detectFraud(transactionData);
      
      // Block high-risk transactions
      if (fraudRisk.recommendation === 'block') {
        return next(new BadRequestError('Transaction blocked due to security concerns'));
      }

      // Review medium-risk transactions (could be enhanced with manual review)
      if (fraudRisk.recommendation === 'review') {
        console.log('High-risk transaction detected:', fraudRisk);
        // In production, you might want to flag for manual review
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
      
            // Decrease stock for each item and track movements
      for (const item of orderData.items) {
        const previousStock = await db.get('SELECT stock FROM products WHERE id = ?', item.id);
        if (previousStock) {
          const newStock = Math.max(0, previousStock.stock - item.quantity);
          await db.run(`
            UPDATE products 
            SET stock = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [newStock, item.id]);
          
          // Track stock movement
          await db.run(`
            INSERT INTO stock_movements (productId, quantity, movementType, reason, orderId, userId, previousStock, newStock)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [item.id, -item.quantity, 'order_placed', 'Order confirmed', orderData.id, req.user!.userId, previousStock.stock, newStock]);
          
          // Check for low stock alerts
          if (newStock <= 5) {
            const product = await db.get('SELECT name FROM products WHERE id = ?', item.id);
            const admins = await db.all('SELECT email, firstName FROM users WHERE role = ?', ['admin']);
            
            for (const admin of admins) {
              try {
                const html = `
                  <h2>Low Stock Alert</h2>
                  <p>Product: <strong>${product.name}</strong></p>
                  <p>Current Stock: <strong>${newStock}</strong></p>
                  <p>This product is running low on stock after order ${orderData.id}.</p>
                  <p>Please check the admin panel to update inventory.</p>
                `;
                
                await sendEmail(admin.email, 'Low Stock Alert - Labubu Collectibles', html);
              } catch (error) {
                console.error(`Failed to send low stock alert to ${admin.email}:`, error);
              }
            }
          }
        }
      }
      
      // Get user details for email
      const user = await db.get('SELECT firstName, email FROM users WHERE id = ?', [req.user!.userId]);
      await db.close();
      
      // Send order confirmation email
      try {
        const orderDetails = {
          id: orderData.id,
          total: orderData.total,
          shippingInfo: orderData.shippingInfo,
          orderDate: orderData.orderDate,
          status: 'confirmed',
          items: orderData.items
        };
        const html = getOrderConfirmationTemplate(orderData.id, orderDetails, user.firstName);
        await sendEmail(user.email, 'Order Confirmation - Labubu Collectibles', html);
      } catch (error) {
        console.error('Failed to send order confirmation email:', error);
        // Don't fail order creation if email fails
      }
      
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
    console.log('Refund request:', { paymentIntentId, amount, reason, userId: req.user!.userId, role: req.user!.role });
    
    if (!paymentIntentId) {
      return next(new BadRequestError('Payment intent ID is required'));
    }
    
    // Check if user is admin or owns the order
    const db = await openDb();
    
    // First, let's find the order by payment intent ID
    const order = await db.get(
      'SELECT * FROM orders WHERE payment_intent_id = ?',
      [paymentIntentId]
    );
    
    console.log('Found order:', order);
    
    if (!order) {
      await db.close();
      return next(new NotFoundError('Order not found'));
    }
    
    // Check if user has permission to refund this order
    if (order.userId !== req.user!.userId && req.user!.role !== 'admin') {
      await db.close();
      return next(new ForbiddenError('Not authorized to refund this order'));
    }
    // Prevent double refund
    if (order.status === 'refunded' || order.payment_status === 'refunded') {
      await db.close();
      return next(new BadRequestError('Order already refunded'));
    }
    // Determine payment method (Stripe or PayPal)
    console.log('Payment intent ID format check:', paymentIntentId);
    if (paymentIntentId.startsWith('pi_')) {
      try {
        console.log('Processing Stripe refund for payment intent:', paymentIntentId);
        
        // Stripe refund
        // Map admin reasons to valid Stripe reasons
        let stripeReason: 'duplicate' | 'fraudulent' | 'requested_by_customer' = 'requested_by_customer'; // default
        if (reason) {
          const reasonLower = reason.toLowerCase();
          if (reasonLower.includes('fraud') || reasonLower.includes('fraudulent')) {
            stripeReason = 'fraudulent';
          } else if (reasonLower.includes('duplicate')) {
            stripeReason = 'duplicate';
          } else {
            // All other reasons (customer request, damaged, wrong item, etc.) map to requested_by_customer
            stripeReason = 'requested_by_customer';
          }
        }
        
        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount specified
          reason: stripeReason,
        });
        
        console.log('Stripe refund created:', refund.id);
        
        // Update order status to refunded
        await db.run(
          'UPDATE orders SET status = ?, payment_status = ?, updatedAt = CURRENT_TIMESTAMP WHERE payment_intent_id = ?',
          ['refunded', 'refunded', paymentIntentId]
        );
        
        // Add status history for the refund
        await addStatusHistory(db, order.id, 'refunded', reason || 'Refund processed', req.user!.email, 'return');
        
        // Get user details for refund email notification
        const user = await db.get('SELECT firstName, email FROM users WHERE id = ?', [order.userId]);
        
        await db.close();
        
        // Send refund notification email
        if (user) {
          try {
            const refundAmount = amount || order.total;
            const html = getRefundProcessedTemplate(order.id, refundAmount, user.firstName, reason);
            await sendEmail(user.email, 'Refund Processed - Labubu Collectibles', html);
          } catch (error) {
            console.error('Failed to send refund notification email:', error);
            // Don't fail refund if email fails
          }
        }
        
        res.json({
          success: true,
          refundId: refund.id,
          status: refund.status,
          orderStatus: 'refunded'
        });
      } catch (error: any) {
        console.error('Stripe refund error:', error);
        await db.close();
        if (error.code === 'charge_already_refunded') {
          res.status(400).json({ error: 'Order already refunded' });
        } else {
          res.status(500).json({ error: `Stripe refund failed: ${error.message}` });
        }
      }
    } else {
      // PayPal refund
      try {
        // Check if PayPal environment variables are set
        if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
          console.error('PayPal environment variables not set');
          await db.close();
          res.status(500).json({ error: 'PayPal configuration not found' });
          return;
        }
        
        const { client } = require('../paypal');
        const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
        
        console.log('Processing PayPal refund for order ID:', paymentIntentId);
        
        // Get the PayPal capture ID from the order's payment details
        const orderRequest = new checkoutNodeJssdk.orders.OrdersGetRequest(paymentIntentId);
        const orderResponse = await client().execute(orderRequest);
        
        console.log('PayPal order response:', orderResponse.result);
        
        const purchaseUnit = orderResponse.result.purchase_units && orderResponse.result.purchase_units[0];
        const capture = purchaseUnit && purchaseUnit.payments && purchaseUnit.payments.captures && purchaseUnit.payments.captures[0];
        
        if (!capture || !capture.id) {
          await db.close();
          console.log('No PayPal capture found for order:', paymentIntentId);
          res.status(400).json({ error: 'No PayPal capture found for this order' });
          return;
        }
        
        console.log('Found PayPal capture:', capture.id);
        
        const refundRequest = new checkoutNodeJssdk.payments.CapturesRefundRequest(capture.id);
        refundRequest.requestBody({
          amount: amount ? { value: amount.toFixed(2), currency_code: 'USD' } : undefined,
          note_to_payer: reason || 'requested_by_customer',
        });
        
        const refundResponse = await client().execute(refundRequest);
        
        console.log('PayPal refund response:', refundResponse.result);
        
        // Update order status to refunded
        await db.run(
          'UPDATE orders SET status = ?, payment_status = ?, updatedAt = CURRENT_TIMESTAMP WHERE payment_intent_id = ?',
          ['refunded', 'refunded', paymentIntentId]
        );
        
        // Add status history for the refund
        await addStatusHistory(db, order.id, 'refunded', reason || 'Refund processed', req.user!.email, 'return');
        
        // Get user details for refund email notification
        const user = await db.get('SELECT firstName, email FROM users WHERE id = ?', [order.userId]);
        
        await db.close();
        
        // Send refund notification email
        if (user) {
          try {
            const refundAmount = amount || order.total;
            const html = getRefundProcessedTemplate(order.id, refundAmount, user.firstName, reason);
            await sendEmail(user.email, 'Refund Processed - Labubu Collectibles', html);
          } catch (error) {
            console.error('Failed to send refund notification email:', error);
            // Don't fail refund if email fails
          }
        }
        
        res.json({
          success: true,
          refundId: refundResponse.result.id,
          status: refundResponse.result.status,
          orderStatus: 'refunded'
        });
      } catch (paypalError: any) {
        console.error('PayPal refund error:', paypalError);
        await db.close();
        res.status(500).json({ error: `PayPal refund failed: ${paypalError.message}` });
      }
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
    
    // Decrease stock for each item and track movements
    for (const item of orderData.items) {
      const previousStock = await db.get('SELECT stock FROM products WHERE id = ?', item.id);
      if (previousStock) {
        const newStock = Math.max(0, previousStock.stock - item.quantity);
        await db.run(`
          UPDATE products 
          SET stock = ?, updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [newStock, item.id]);
        
        // Track stock movement
        await db.run(`
          INSERT INTO stock_movements (productId, quantity, movementType, reason, orderId, userId, previousStock, newStock)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [item.id, -item.quantity, 'order_placed', 'PayPal order confirmed', orderData.id, req.user!.userId, previousStock.stock, newStock]);
      }
    }
    
    // Get user details for email
    const user = await db.get('SELECT firstName, email FROM users WHERE id = ?', [req.user!.userId]);
    await db.close();
    
    // Send order confirmation email
    try {
      const orderDetails = {
        id: orderData.id,
        total: orderData.total,
        shippingInfo: orderData.shippingInfo,
        orderDate: orderData.orderDate,
        status: 'confirmed',
        items: orderData.items
      };
      const html = getOrderConfirmationTemplate(orderData.id, orderDetails, user.firstName);
      await sendEmail(user.email, 'Order Confirmation - Labubu Collectibles', html);
    } catch (error) {
      console.error('Failed to send order confirmation email:', error);
      // Don't fail order creation if email fails
    }
    
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