import { openDb } from '../db';
import logger from '../logger';

export interface FraudRisk {
  score: number; // 0-100, higher = more risky
  factors: string[];
  recommendation: 'allow' | 'review' | 'block';
}

export interface TransactionData {
  userId?: number;
  email: string;
  ipAddress: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  shippingAddress: any;
  billingAddress?: any;
  userAgent: string;
  timestamp: string;
}

export interface UserBehavior {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  daysSinceFirstOrder: number;
  daysSinceLastOrder: number;
  failedPayments: number;
  refunds: number;
  chargebacks: number;
}

class FraudDetectionService {
  private riskThresholds = {
    low: 30,
    medium: 60,
    high: 80
  };

  // Main fraud detection method
  async detectFraud(transactionData: TransactionData): Promise<FraudRisk> {
    const factors: string[] = [];
    let totalScore = 0;

    // 1. Velocity checks
    const velocityScore = await this.checkVelocity(transactionData);
    totalScore += velocityScore.score;
    factors.push(...velocityScore.factors);

    // 2. Behavioral analysis
    const behaviorScore = await this.analyzeBehavior(transactionData);
    totalScore += behaviorScore.score;
    factors.push(...behaviorScore.factors);

    // 3. Geographic analysis
    const geoScore = await this.analyzeGeographic(transactionData);
    totalScore += geoScore.score;
    factors.push(...geoScore.factors);

    // 4. Payment pattern analysis
    const paymentScore = await this.analyzePaymentPatterns(transactionData);
    totalScore += paymentScore.score;
    factors.push(...paymentScore.factors);

    // 5. Device fingerprinting
    const deviceScore = await this.analyzeDevice(transactionData);
    totalScore += deviceScore.score;
    factors.push(...deviceScore.factors);

    // Determine recommendation
    let recommendation: 'allow' | 'review' | 'block' = 'allow';
    if (totalScore >= this.riskThresholds.high) {
      recommendation = 'block';
    } else if (totalScore >= this.riskThresholds.medium) {
      recommendation = 'review';
    }

    // Log fraud detection event
    await this.logFraudDetection(transactionData, totalScore, factors, recommendation);

    return {
      score: Math.min(100, totalScore),
      factors,
      recommendation
    };
  }

  // Check for velocity-based fraud (multiple transactions in short time)
  private async checkVelocity(transactionData: TransactionData): Promise<{ score: number; factors: string[] }> {
    const factors: string[] = [];
    let score = 0;

    const db = await openDb();

    // Check recent orders from same IP
    const recentOrdersFromIP = await db.get(`
      SELECT COUNT(*) as count, SUM(total) as total
      FROM orders o
      JOIN users u ON o.userId = u.id
      WHERE u.email = ? 
      AND o.createdAt >= datetime('now', '-1 hour')
    `, [transactionData.email]);

    if (recentOrdersFromIP.count > 3) {
      score += 25;
      factors.push('High order velocity from same IP');
    }

    if (recentOrdersFromIP.total > 1000) {
      score += 20;
      factors.push('High spending velocity');
    }

    // Check for rapid-fire orders
    const rapidOrders = await db.get(`
      SELECT COUNT(*) as count
      FROM orders o
      JOIN users u ON o.userId = u.id
      WHERE u.email = ? 
      AND o.createdAt >= datetime('now', '-10 minutes')
    `, [transactionData.email]);

    if (rapidOrders.count > 2) {
      score += 30;
      factors.push('Rapid-fire ordering detected');
    }

    await db.close();
    return { score, factors };
  }

  // Analyze user behavior patterns
  private async analyzeBehavior(transactionData: TransactionData): Promise<{ score: number; factors: string[] }> {
    const factors: string[] = [];
    let score = 0;

    if (!transactionData.userId) {
      score += 15;
      factors.push('Guest checkout (higher risk)');
      return { score, factors };
    }

    const db = await openDb();
    const userBehavior = await this.getUserBehavior(transactionData.userId);

    // Check for unusual spending patterns
    if (userBehavior.totalOrders > 0) {
      const avgOrderValue = userBehavior.averageOrderValue;
      const currentOrderValue = transactionData.amount;

      if (currentOrderValue > avgOrderValue * 3) {
        score += 20;
        factors.push('Unusually high order value');
      }

      if (currentOrderValue < avgOrderValue * 0.3) {
        score += 10;
        factors.push('Unusually low order value');
      }
    }

    // Check for account age vs spending
    if (userBehavior.daysSinceFirstOrder < 1 && transactionData.amount > 100) {
      score += 25;
      factors.push('New account with high-value order');
    }

    // Check for failed payments history
    if (userBehavior.failedPayments > 2) {
      score += 20;
      factors.push('History of failed payments');
    }

    // Check for refund/chargeback history
    if (userBehavior.chargebacks > 0) {
      score += 30;
      factors.push('Previous chargebacks');
    }

    if (userBehavior.refunds > userBehavior.totalOrders * 0.5) {
      score += 15;
      factors.push('High refund rate');
    }

    await db.close();
    return { score, factors };
  }

  // Analyze geographic patterns
  private async analyzeGeographic(transactionData: TransactionData): Promise<{ score: number; factors: string[] }> {
    const factors: string[] = [];
    let score = 0;

    // Check for high-risk countries (simplified)
    const highRiskCountries = ['NG', 'BR', 'RU', 'CN', 'IN'];
    const shippingCountry = transactionData.shippingAddress?.country;
    
    if (shippingCountry && highRiskCountries.includes(shippingCountry)) {
      score += 15;
      factors.push('High-risk shipping country');
    }

    // Check for billing/shipping mismatch
    if (transactionData.billingAddress && transactionData.shippingAddress) {
      if (transactionData.billingAddress.country !== transactionData.shippingAddress.country) {
        score += 20;
        factors.push('Billing/shipping country mismatch');
      }
    }

    // Check for unusual shipping distances
    const userBehavior = transactionData.userId ? await this.getUserBehavior(transactionData.userId) : null;
    if (userBehavior && userBehavior.totalOrders > 0) {
      // This would require geolocation data - simplified for now
      score += 5;
    }

    return { score, factors };
  }

  // Analyze payment patterns
  private async analyzePaymentPatterns(transactionData: TransactionData): Promise<{ score: number; factors: string[] }> {
    const factors: string[] = [];
    let score = 0;

    // Check for suspicious payment methods
    if (transactionData.paymentMethod === 'prepaid_card') {
      score += 10;
      factors.push('Prepaid card used');
    }

    // Check for unusual amounts
    if (transactionData.amount === 0 || transactionData.amount > 10000) {
      score += 25;
      factors.push('Suspicious transaction amount');
    }

    // Check for round numbers (often test transactions)
    if (transactionData.amount % 100 === 0 && transactionData.amount > 0) {
      score += 5;
      factors.push('Round number transaction');
    }

    return { score, factors };
  }

  // Analyze device fingerprinting
  private async analyzeDevice(transactionData: TransactionData): Promise<{ score: number; factors: string[] }> {
    const factors: string[] = [];
    let score = 0;

    // Check for suspicious user agents
    const suspiciousUserAgents = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /headless/i
    ];

    if (suspiciousUserAgents.some(pattern => pattern.test(transactionData.userAgent))) {
      score += 30;
      factors.push('Suspicious user agent');
    }

    // Check for missing user agent
    if (!transactionData.userAgent || transactionData.userAgent.length < 10) {
      score += 15;
      factors.push('Missing or invalid user agent');
    }

    return { score, factors };
  }

  // Get user behavior data
  private async getUserBehavior(userId: number): Promise<UserBehavior> {
    const db = await openDb();

    const userData = await db.get(`
      SELECT 
        COUNT(*) as totalOrders,
        SUM(total) as totalSpent,
        AVG(total) as averageOrderValue,
        MIN(createdAt) as firstOrder,
        MAX(createdAt) as lastOrder
      FROM orders 
      WHERE userId = ? AND status != 'cancelled'
    `, [userId]);

    const failedPayments = await db.get(`
      SELECT COUNT(*) as count
      FROM orders 
      WHERE userId = ? AND payment_status = 'failed'
    `, [userId]);

    const refunds = await db.get(`
      SELECT COUNT(*) as count
      FROM orders 
      WHERE userId = ? AND status = 'refunded'
    `, [userId]);

    const chargebacks = await db.get(`
      SELECT COUNT(*) as count
      FROM orders 
      WHERE userId = ? AND status = 'chargeback'
    `, [userId]);

    await db.close();

    const firstOrder = userData.firstOrder ? new Date(userData.firstOrder) : new Date();
    const lastOrder = userData.lastOrder ? new Date(userData.lastOrder) : new Date();
    const now = new Date();

    return {
      totalOrders: userData.totalOrders || 0,
      totalSpent: userData.totalSpent || 0,
      averageOrderValue: userData.averageOrderValue || 0,
      daysSinceFirstOrder: Math.floor((now.getTime() - firstOrder.getTime()) / (1000 * 60 * 60 * 24)),
      daysSinceLastOrder: Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24)),
      failedPayments: failedPayments.count || 0,
      refunds: refunds.count || 0,
      chargebacks: chargebacks.count || 0
    };
  }

  // Log fraud detection event
  private async logFraudDetection(
    transactionData: TransactionData, 
    score: number, 
    factors: string[], 
    recommendation: string
  ): Promise<void> {
    const db = await openDb();

    await db.run(`
      INSERT INTO fraud_detection_logs (
        timestamp, email, ip_address, amount, currency, 
        risk_score, factors, recommendation, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      new Date().toISOString(),
      transactionData.email,
      transactionData.ipAddress,
      transactionData.amount,
      transactionData.currency,
      score,
      JSON.stringify(factors),
      recommendation,
      transactionData.userAgent
    ]);

    await db.close();

    logger.info('Fraud detection completed', {
      email: transactionData.email,
      score,
      factors,
      recommendation
    });
  }

  // Get fraud detection statistics
  async getFraudStats(): Promise<any> {
    const db = await openDb();

    const stats = await db.get(`
      SELECT 
        COUNT(*) as totalChecks,
        AVG(risk_score) as averageScore,
        COUNT(CASE WHEN recommendation = 'block' THEN 1 END) as blocked,
        COUNT(CASE WHEN recommendation = 'review' THEN 1 END) as reviewed,
        COUNT(CASE WHEN recommendation = 'allow' THEN 1 END) as allowed
      FROM fraud_detection_logs 
      WHERE timestamp >= datetime('now', '-24 hours')
    `);

    await db.close();
    return stats;
  }
}

export default new FraudDetectionService(); 