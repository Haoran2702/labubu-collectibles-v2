import * as dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../.env' });
import express, { Application } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from './logger';
import morgan from 'morgan';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import indexRouter from './routes/index';
import usersRouter from './routes/users';
import productsRouter from './routes/products';
import ordersRouter from './routes/orders';
import authRouter from './routes/auth';
import paymentsRouter from './routes/payments';
import supportRouter from './routes/support';
import privacyRouter from './routes/privacy';
import forecastingRouter from './routes/forecasting';
import analyticsRouter from './routes/analytics';
import reviewsRouter from './routes/reviews';
import marketingRouter from './routes/marketing';

import currencyRouter from './routes/currency';
import fraudRouter from './routes/fraud';
import { AppError } from './errors';

const app: Application = express();

// Behind Railway/Cloudflare proxy
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL || 'https://labubu-collectibles.com']
  : ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
// Replace morgan logger with winston integration
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// Serve static assets from the source public directory (works in dist builds)
app.use(express.static(path.resolve(__dirname, '../public')));
app.use('/product_images', express.static(path.resolve(__dirname, '../public/product_images')));

// Apply rate limiting to all routes
app.use(limiter);

app.use(helmet());

app.use('/api', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/auth', authRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/support', supportRouter);
app.use('/api/privacy', privacyRouter);
app.use('/api/forecasting', forecastingRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/marketing', marketingRouter);

app.use('/api/currency', currencyRouter);
app.use('/api/fraud', fraudRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // If the error is an instance of AppError, use its status and message
  if (err instanceof AppError) {
    logger.error(err);
    res.status(err.statusCode).json({
      error: err.message,
      code: err.statusCode,
      ...(process.env.NODE_ENV === 'development' && err.stack ? { stack: err.stack } : {})
    });
    return;
  }
  // For other errors, log and return generic message
  logger.error(err.stack || err);
  res.status(500).json({
    error: 'Something went wrong!',
    code: 500,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && err.stack ? { stack: err.stack } : {})
  });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app; 