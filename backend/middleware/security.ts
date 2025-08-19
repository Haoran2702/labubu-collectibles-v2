import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

// PCI DSS compliant input sanitization
export const sanitizePaymentInput = [
  body('amount')
    .isNumeric()
    .custom((value) => {
      const num = parseFloat(value);
      return num > 0 && num <= 999999.99; // Reasonable payment limit
    })
    .withMessage('Amount must be a valid number between 0.01 and 999,999.99'),
  body('currency')
    .optional()
    .isIn(['usd', 'eur', 'gbp', 'cad'])
    .withMessage('Currency must be one of: usd, eur, gbp, cad'),
  body('metadata')
    .optional()
    .isObject()
    .custom((value) => {
      // Ensure metadata doesn't contain sensitive data
      const sensitiveKeys = ['card', 'cvv', 'password', 'ssn', 'ssn_last_4'];
      return !sensitiveKeys.some(key => value.hasOwnProperty(key));
    })
    .withMessage('Metadata contains sensitive information'),
];

// Rate limiting for payment endpoints
export const paymentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 payment attempts per windowMs
  message: {
    error: 'Too many payment attempts, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return (req as AuthenticatedRequest).user?.userId?.toString() || req.ip || 'unknown';
  }
});

// General API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://www.paypal.com"],
      scriptSrc: ["'self'", "https://js.stripe.com", "https://www.paypal.com", "https://www.paypalobjects.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://www.paypal.com"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://api.paypal.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  frameguard: { action: 'deny' }
});

// Input validation middleware
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: (err as any).path || 'unknown',
        message: err.msg
      }))
    });
  }
  next();
};

// Logging middleware for security events
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.userId || 'anonymous'
    };
    
    // Log security-relevant events
    if (res.statusCode >= 400 || req.url.includes('/payments/')) {
      console.log('SECURITY_EVENT:', JSON.stringify(logData));
    }
  });
  
  next();
};

// CORS configuration for PCI compliance
export const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3002',
      'https://yourdomain.com' // Replace with your domain
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

// Validate payment data structure
export const validatePaymentData = (req: Request, res: Response, next: NextFunction) => {
  const { amount, currency, metadata } = req.body;
  
  // Additional validation for payment data
  if (amount && (typeof amount !== 'number' || amount <= 0)) {
    return res.status(400).json({
      error: 'Invalid amount provided'
    });
  }
  
  if (currency && !['usd', 'eur', 'gbp', 'cad'].includes(currency)) {
    return res.status(400).json({
      error: 'Unsupported currency'
    });
  }
  
  // Check for suspicious patterns
  if (metadata && typeof metadata === 'object') {
    const suspiciousPatterns = [
      /script/i,
      /javascript/i,
      /on\w+\s*=/i,
      /<[^>]*>/i
    ];
    
    const metadataStr = JSON.stringify(metadata);
    if (suspiciousPatterns.some(pattern => pattern.test(metadataStr))) {
      return res.status(400).json({
        error: 'Suspicious data detected'
      });
    }
  }
  
  next();
}; 