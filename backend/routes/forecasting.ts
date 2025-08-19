import express from 'express';
import { openDb } from '../db';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../errors';

const router = express.Router();

// Generate inventory forecast for a product
router.post('/generate/:productId', requireAuth, async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { days = 30, algorithm = 'moving_average' } = req.body;

    const db = await openDb();

    // Get historical sales data from stock movements
    const historicalData = await db.all(`
      SELECT 
        DATE(createdAt) as date,
        ABS(quantity) as dailyDemand,
        COUNT(*) as orderCount
      FROM stock_movements 
      WHERE productId = ? 
        AND movementType = 'order_placed'
        AND createdAt >= date('now', '-${days} days')
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `, [productId]);

    if (historicalData.length < 7) {
      throw new AppError('Insufficient historical data for forecasting. Need at least 7 days of data.', 400);
    }

    let predictedDemand = 0;
    let confidenceLevel = 0;
    let forecastType = '';

    // Simple moving average algorithm
    if (algorithm === 'moving_average') {
      const recentDemand = historicalData.slice(-7).map(d => d.dailyDemand);
      predictedDemand = Math.round(recentDemand.reduce((a, b) => a + b, 0) / recentDemand.length);
      confidenceLevel = 0.75;
      forecastType = '7-day moving average';
    }
    // Linear trend algorithm
    else if (algorithm === 'linear_trend') {
      const n = historicalData.length;
      const xValues = Array.from({length: n}, (_, i) => i);
      const yValues = historicalData.map(d => d.dailyDemand);
      
      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumY = yValues.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((a, b, i) => a + (b * yValues[i]), 0);
      const sumXX = xValues.reduce((a, b) => a + (b * b), 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      predictedDemand = Math.round(intercept + slope * n);
      confidenceLevel = 0.65;
      forecastType = 'linear trend';
    }
    // Seasonal pattern (weekly)
    else if (algorithm === 'seasonal') {
      const dayOfWeek = new Date().getDay();
      const sameDayData = historicalData.filter(d => {
        const dataDay = new Date(d.date).getDay();
        return dataDay === dayOfWeek;
      });
      
      if (sameDayData.length > 0) {
        predictedDemand = Math.round(sameDayData.reduce((a, b) => a + b.dailyDemand, 0) / sameDayData.length);
        confidenceLevel = 0.70;
        forecastType = 'seasonal (weekly pattern)';
      } else {
        // Fallback to moving average
        const recentDemand = historicalData.slice(-7).map(d => d.dailyDemand);
        predictedDemand = Math.round(recentDemand.reduce((a, b) => a + b, 0) / recentDemand.length);
        confidenceLevel = 0.60;
        forecastType = 'seasonal (fallback to moving average)';
      }
    }

    // Ensure prediction is not negative
    predictedDemand = Math.max(0, predictedDemand);

    // Store the forecast
    const forecastDate = new Date().toISOString().split('T')[0];
    await db.run(`
      INSERT INTO inventory_forecasts (
        productId, forecastDate, predictedDemand, confidenceLevel, 
        forecastType, algorithm, historicalDataPoints
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [productId, forecastDate, predictedDemand, confidenceLevel, forecastType, algorithm, historicalData.length]);

    // Get product info
    const product = await db.get('SELECT name, stock FROM products WHERE id = ?', [productId]);

    res.json({
      success: true,
      forecast: {
        productId,
        productName: product.name,
        currentStock: product.stock,
        forecastDate,
        predictedDemand,
        confidenceLevel,
        forecastType,
        algorithm,
        historicalDataPoints: historicalData.length,
        recommendation: getRecommendation(product.stock, predictedDemand, confidenceLevel)
      }
    });

    await db.close();
  } catch (error) {
    next(error);
  }
});

// Get forecasting data for a product
router.get('/product/:productId', requireAuth, async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { limit = 10 } = req.query;

    const db = await openDb();

    // Get recent forecasts
    const forecasts = await db.all(`
      SELECT * FROM inventory_forecasts 
      WHERE productId = ? 
      ORDER BY createdAt DESC 
      LIMIT ?
    `, [productId, limit]);

    // Get historical data for chart
    const historicalData = await db.all(`
      SELECT 
        DATE(createdAt) as date,
        ABS(quantity) as dailyDemand,
        COUNT(*) as orderCount
      FROM stock_movements 
      WHERE productId = ? 
        AND movementType = 'order_placed'
        AND createdAt >= date('now', '-30 days')
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `, [productId]);

    // Get product info
    const product = await db.get('SELECT name, stock FROM products WHERE id = ?', [productId]);

    res.json({
      success: true,
      product: {
        id: productId,
        name: product.name,
        currentStock: product.stock
      },
      forecasts,
      historicalData
    });

    await db.close();
  } catch (error) {
    next(error);
  }
});

// Get all forecasting data (admin dashboard)
router.get('/dashboard', requireAuth, async (req, res, next) => {
  try {
    const db = await openDb();

    // Get latest forecasts for all products
    const latestForecasts = await db.all(`
      SELECT 
        f.*,
        p.name as productName,
        p.stock as currentStock
      FROM inventory_forecasts f
      JOIN products p ON f.productId = p.id
      WHERE f.createdAt = (
        SELECT MAX(createdAt) 
        FROM inventory_forecasts 
        WHERE productId = f.productId
      )
      ORDER BY f.createdAt DESC
    `);

    // Get summary statistics
    const summary = await db.get(`
      SELECT 
        COUNT(DISTINCT productId) as totalProducts,
        AVG(predictedDemand) as avgPredictedDemand,
        AVG(confidenceLevel) as avgConfidence
      FROM inventory_forecasts 
      WHERE createdAt >= date('now', '-7 days')
    `);

    res.json({
      success: true,
      latestForecasts,
      summary
    });

    await db.close();
  } catch (error) {
    next(error);
  }
});

// Helper function to generate recommendations
function getRecommendation(currentStock: number, predictedDemand: number, confidenceLevel: number): string {
  const daysUntilStockout = currentStock / predictedDemand;
  
  if (predictedDemand === 0) {
    return 'No demand predicted. Monitor sales trends.';
  }
  
  if (daysUntilStockout <= 7) {
    return `URGENT: Restock immediately. Stock will last ~${Math.round(daysUntilStockout)} days.`;
  } else if (daysUntilStockout <= 14) {
    return `Restock soon. Stock will last ~${Math.round(daysUntilStockout)} days.`;
  } else if (daysUntilStockout <= 30) {
    return `Monitor stock levels. Stock will last ~${Math.round(daysUntilStockout)} days.`;
  } else {
    return `Stock levels are healthy. Stock will last ~${Math.round(daysUntilStockout)} days.`;
  }
}

export default router; 