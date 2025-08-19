import { Router } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';
import { convertCurrency, getSupportedCurrencies, isValidCurrency, CurrencyCode } from '../utils/currencyConverter';
import { AppError } from '../errors';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
    return;
  }
  next();
};

// GET /api/currency/supported - Get list of supported currencies
router.get('/supported', expressAsyncHandler(async (req, res) => {
  try {
    const currencies = getSupportedCurrencies();
    res.json({ currencies });
  } catch (error) {
    console.error('Error fetching supported currencies:', error);
    res.status(500).json({ error: 'Failed to fetch supported currencies' });
  }
}));

// POST /api/currency/convert - Convert amount between currencies
router.post('/convert', [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('fromCurrency').isString().custom((value) => {
    if (!isValidCurrency(value)) {
      throw new Error('Invalid fromCurrency');
    }
    return true;
  }).withMessage('Invalid fromCurrency'),
  body('toCurrency').isString().custom((value) => {
    if (!isValidCurrency(value)) {
      throw new Error('Invalid toCurrency');
    }
    return true;
  }).withMessage('Invalid toCurrency'),
  handleValidationErrors
], expressAsyncHandler(async (req, res, next) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;
    
    const result = await convertCurrency(
      parseFloat(amount),
      fromCurrency as CurrencyCode,
      toCurrency as CurrencyCode
    );
    
    res.json(result);
  } catch (error) {
    console.error('Currency conversion error:', error);
    return next(new AppError('Currency conversion failed', 500));
  }
}));

// POST /api/currency/convert-multiple - Convert multiple amounts at once
router.post('/convert-multiple', [
  body('amounts').isArray({ min: 1 }).withMessage('Amounts must be an array with at least one item'),
  body('amounts.*.amount').isNumeric().withMessage('Each amount must be a number'),
  body('amounts.*.currency').isString().custom((value) => {
    if (!isValidCurrency(value)) {
      throw new Error('Invalid currency in amounts array');
    }
    return true;
  }).withMessage('Invalid currency in amounts array'),
  body('toCurrency').isString().custom((value) => {
    if (!isValidCurrency(value)) {
      throw new Error('Invalid toCurrency');
    }
    return true;
  }).withMessage('Invalid toCurrency'),
  handleValidationErrors
], expressAsyncHandler(async (req, res, next) => {
  try {
    const { amounts, toCurrency } = req.body;
    
    const results = [];
    for (const item of amounts) {
      const result = await convertCurrency(
        parseFloat(item.amount),
        item.currency as CurrencyCode,
        toCurrency as CurrencyCode
      );
      results.push(result);
    }
    
    res.json({ results });
  } catch (error) {
    console.error('Multiple currency conversion error:', error);
    return next(new AppError('Multiple currency conversion failed', 500));
  }
}));

// GET /api/currency/rates - Get current exchange rates (for admin/debugging)
router.get('/rates/:baseCurrency?', expressAsyncHandler(async (req, res, next) => {
  try {
    const baseCurrency = req.params.baseCurrency || 'USD';
    
    if (!isValidCurrency(baseCurrency)) {
      return next(new AppError('Invalid base currency', 400));
    }
    
    // Import the fetchExchangeRates function dynamically to avoid circular imports
    const { convertCurrency } = await import('../utils/currencyConverter');
    
    // Get rates by converting 1 unit of base currency to all other currencies
    const currencies = getSupportedCurrencies();
    const rates: Record<string, number> = {};
    
    for (const currency of currencies) {
      if (currency.code !== baseCurrency) {
        const result = await convertCurrency(1, baseCurrency as CurrencyCode, currency.code as CurrencyCode);
        rates[currency.code] = result.exchangeRate;
      } else {
        rates[currency.code] = 1;
      }
    }
    
    res.json({
      baseCurrency,
      rates,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return next(new AppError('Failed to fetch exchange rates', 500));
  }
}));

export default router; 