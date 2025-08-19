import express from 'express';
import { openDb } from '../db';
import { requireAuth } from '../middleware/auth';
import { BadRequestError, NotFoundError, ForbiddenError } from '../errors';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { emailService } from '../services/emailService';

const router = express.Router();

// Helper middleware to handle validation errors
function handleValidationErrors(req: express.Request, res: express.Response, next: express.NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new BadRequestError(errors.array().map(e => e.msg).join(', ')));
  }
  next();
}

// Get all email campaigns
router.get('/campaigns', requireAuth, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const db = await openDb();
    const campaigns = await db.all(`
      SELECT 
        id,
        name,
        subject,
        status,
        targetAudience,
        createdAt,
        sentAt,
        openRate,
        clickRate
      FROM email_campaigns 
      ORDER BY createdAt DESC
    `);
    await db.close();
    res.json({ campaigns });
  } catch (error) {
    next(error);
  }
});

// Create new email campaign
router.post('/campaigns', 
  requireAuth,
  [
    body('name').isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('subject').isLength({ min: 1, max: 200 }).withMessage('Subject must be between 1 and 200 characters'),
    body('content').isLength({ min: 1 }).withMessage('Content is required'),
    body('targetAudience').isIn(['all', 'new', 'returning', 'inactive']).withMessage('Invalid target audience'),
    handleValidationErrors
  ],
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { name, subject, content, targetAudience, scheduledFor } = req.body;
      const db = await openDb();

      const campaignId = `campaign_${uuidv4()}`;
      const status = scheduledFor ? 'scheduled' : 'draft';
      
      await db.run(`
        INSERT INTO email_campaigns (id, name, subject, content, targetAudience, status, scheduledFor, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [campaignId, name, subject, content, targetAudience, status, scheduledFor || null, new Date().toISOString()]);

      await db.close();
      res.status(201).json({ 
        message: 'Campaign created successfully',
        campaignId 
      });
    } catch (error) {
      next(error);
    }
  }
);

// Send campaign
router.post('/campaigns/:id/send', requireAuth, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const { id } = req.params;
    const db = await openDb();

    // Get campaign details
    const campaign = await db.get('SELECT * FROM email_campaigns WHERE id = ?', [id]);
    if (!campaign) {
      await db.close();
      return next(new NotFoundError('Campaign not found'));
    }

    if (campaign.status === 'completed') {
      await db.close();
      return next(new BadRequestError('Campaign has already been sent'));
    }

    // Get recipients
    const recipients = await emailService.getCampaignRecipients(campaign.targetAudience);
    
    if (recipients.length === 0) {
      await db.close();
      return next(new BadRequestError('No recipients found for this target audience'));
    }

    await db.close();

    // Send campaign (this will update the database)
    const result = await emailService.sendCampaign(id, recipients);

    res.json({
      message: 'Campaign sent successfully',
      sent: result.sent,
      failed: result.failed,
      totalRecipients: recipients.length
    });

  } catch (error) {
    next(error);
  }
});

// Get campaign analytics
router.get('/campaigns/:id/analytics', requireAuth, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const { id } = req.params;
    
    const analytics = await emailService.getCampaignAnalytics(id);
    
    res.json({ analytics });
  } catch (error) {
    next(error);
  }
});

// Get all discount codes
router.get('/discounts', requireAuth, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const db = await openDb();
    const discounts = await db.all(`
      SELECT 
        id,
        code,
        type,
        value,
        minOrderAmount,
        maxUses,
        usedCount,
        validFrom,
        validUntil,
        status,
        createdAt
      FROM discount_codes 
      ORDER BY createdAt DESC
    `);
    await db.close();
    res.json({ discounts });
  } catch (error) {
    next(error);
  }
});

// Create new discount code
router.post('/discounts', 
  requireAuth,
  [
    body('code').isLength({ min: 3, max: 20 }).withMessage('Code must be between 3 and 20 characters'),
    body('type').isIn(['percentage', 'fixed']).withMessage('Type must be percentage or fixed'),
    body('value').isFloat({ min: 0 }).withMessage('Value must be a positive number'),
    body('maxUses').optional().isInt({ min: 1 }).withMessage('Max uses must be a positive integer'),
    handleValidationErrors
  ],
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { code, type, value, minOrderAmount, maxUses, validFrom, validUntil } = req.body;
      const db = await openDb();

      // Check if code already exists
      const existingCode = await db.get('SELECT id FROM discount_codes WHERE code = ?', [code]);
      if (existingCode) {
        await db.close();
        return next(new BadRequestError('Discount code already exists'));
      }

      const discountId = `discount_${uuidv4()}`;
      await db.run(`
        INSERT INTO discount_codes (id, code, type, value, minOrderAmount, maxUses, validFrom, validUntil, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
      `, [discountId, code, type, value, minOrderAmount || 0, maxUses || null, validFrom || null, validUntil || null, new Date().toISOString()]);

      await db.close();
      res.status(201).json({ 
        message: 'Discount code created successfully',
        discountId 
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get automation rules
router.get('/automation', requireAuth, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const db = await openDb();
    const rules = await db.all(`
      SELECT 
        id,
        name,
        type,
        trigger,
        action,
        status,
        triggeredCount,
        convertedCount,
        createdAt
      FROM automation_rules 
      ORDER BY createdAt DESC
    `);

    // Calculate conversion rates and format stats
    const rulesWithStats = rules.map((rule: any) => ({
      id: rule.id,
      name: rule.name,
      type: rule.type,
      trigger: rule.trigger,
      action: rule.action,
      status: rule.status,
      stats: {
        triggered: rule.triggeredCount || 0,
        converted: rule.convertedCount || 0,
        conversionRate: rule.triggeredCount > 0 ? (rule.convertedCount || 0) / rule.triggeredCount : 0
      },
      createdAt: rule.createdAt
    }));

    await db.close();
    res.json({ rules: rulesWithStats });
  } catch (error) {
    next(error);
  }
});

// Create automation rule
router.post('/automation', 
  requireAuth,
  [
    body('name').isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('type').isIn(['welcome', 'abandoned_cart', 'low_stock', 'birthday', 'reorder']).withMessage('Invalid automation type'),
    body('trigger').isLength({ min: 1 }).withMessage('Trigger is required'),
    body('action').isLength({ min: 1 }).withMessage('Action is required'),
    handleValidationErrors
  ],
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { name, type, trigger, action } = req.body;
      const db = await openDb();

      const ruleId = `rule_${uuidv4()}`;
      await db.run(`
        INSERT INTO automation_rules (id, name, type, trigger, action, status, createdAt)
        VALUES (?, ?, ?, ?, ?, 'active', ?)
      `, [ruleId, name, type, trigger, action, new Date().toISOString()]);

      await db.close();
      res.status(201).json({ 
        message: 'Automation rule created successfully',
        ruleId 
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update campaign
router.put('/campaigns/:id', 
  requireAuth,
  [
    body('name').isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('subject').isLength({ min: 1, max: 200 }).withMessage('Subject must be between 1 and 200 characters'),
    body('content').isLength({ min: 1 }).withMessage('Content is required'),
    body('targetAudience').isIn(['all', 'new', 'returning', 'inactive']).withMessage('Invalid target audience'),
    handleValidationErrors
  ],
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { id } = req.params;
      const { name, subject, content, targetAudience, scheduledFor } = req.body;
      const db = await openDb();

      await db.run(`
        UPDATE email_campaigns 
        SET name = ?, subject = ?, content = ?, targetAudience = ?, scheduledFor = ?, updatedAt = ?
        WHERE id = ?
      `, [name, subject, content, targetAudience, scheduledFor || null, new Date().toISOString(), id]);

      await db.close();
      res.json({ message: 'Campaign updated successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Update discount code
router.put('/discounts/:id', 
  requireAuth,
  [
    body('code').isLength({ min: 3, max: 20 }).withMessage('Code must be between 3 and 20 characters'),
    body('type').isIn(['percentage', 'fixed']).withMessage('Type must be percentage or fixed'),
    body('value').isFloat({ min: 0 }).withMessage('Value must be a positive number'),
    body('maxUses').optional().isInt({ min: 1 }).withMessage('Max uses must be a positive integer'),
    handleValidationErrors
  ],
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { id } = req.params;
      const { code, type, value, minOrderAmount, maxUses, validFrom, validUntil } = req.body;
      const db = await openDb();

      // Check if code already exists (excluding current discount)
      const existingCode = await db.get('SELECT id FROM discount_codes WHERE code = ? AND id != ?', [code, id]);
      if (existingCode) {
        await db.close();
        return next(new BadRequestError('Discount code already exists'));
      }

      await db.run(`
        UPDATE discount_codes 
        SET code = ?, type = ?, value = ?, minOrderAmount = ?, maxUses = ?, validFrom = ?, validUntil = ?, updatedAt = ?
        WHERE id = ?
      `, [code, type, value, minOrderAmount || 0, maxUses || null, validFrom || null, validUntil || null, new Date().toISOString(), id]);

      await db.close();
      res.json({ message: 'Discount code updated successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Delete discount code
router.delete('/discounts/:id', requireAuth, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const { id } = req.params;
    const db = await openDb();

    await db.run('DELETE FROM discount_codes WHERE id = ?', [id]);

    await db.close();
    res.json({ message: 'Discount code deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Update automation rule
router.put('/automation/:id', 
  requireAuth,
  [
    body('name').isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('type').isIn(['welcome', 'abandoned_cart', 'low_stock', 'birthday', 'reorder']).withMessage('Invalid automation type'),
    body('trigger').isLength({ min: 1 }).withMessage('Trigger is required'),
    body('action').isLength({ min: 1 }).withMessage('Action is required'),
    handleValidationErrors
  ],
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { id } = req.params;
      const { name, type, trigger, action } = req.body;
      const db = await openDb();

      await db.run(`
        UPDATE automation_rules 
        SET name = ?, type = ?, trigger = ?, action = ?, updatedAt = ?
        WHERE id = ?
      `, [name, type, trigger, action, new Date().toISOString(), id]);

      await db.close();
      res.json({ message: 'Automation rule updated successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Get email templates
router.get('/templates', requireAuth, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const db = await openDb();
    const templates = await db.all(`
      SELECT 
        id,
        name,
        subject,
        content,
        category,
        preview,
        createdAt,
        updatedAt
      FROM email_templates 
      ORDER BY createdAt DESC
    `);
    await db.close();
    res.json({ templates });
  } catch (error) {
    next(error);
  }
});

// Create email template
router.post('/templates', 
  requireAuth,
  [
    body('name').isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('subject').isLength({ min: 1, max: 200 }).withMessage('Subject must be between 1 and 200 characters'),
    body('content').isLength({ min: 1 }).withMessage('Content is required'),
    body('category').isIn(['welcome', 'promotional', 'transactional', 'abandoned_cart']).withMessage('Invalid category'),
    handleValidationErrors
  ],
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { name, subject, content, category } = req.body;
      const db = await openDb();

      const templateId = `template_${uuidv4()}`;
      const preview = content.substring(0, 100) + (content.length > 100 ? '...' : '');
      
      await db.run(`
        INSERT INTO email_templates (id, name, subject, content, category, preview, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [templateId, name, subject, content, category, preview, new Date().toISOString()]);

      await db.close();
      res.status(201).json({ 
        message: 'Email template created successfully',
        templateId 
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update email template
router.put('/templates/:id', 
  requireAuth,
  [
    body('name').isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
    body('subject').isLength({ min: 1, max: 200 }).withMessage('Subject must be between 1 and 200 characters'),
    body('content').isLength({ min: 1 }).withMessage('Content is required'),
    body('category').isIn(['welcome', 'promotional', 'transactional', 'abandoned_cart']).withMessage('Invalid category'),
    handleValidationErrors
  ],
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { id } = req.params;
      const { name, subject, content, category } = req.body;
      const db = await openDb();

      const preview = content.substring(0, 100) + (content.length > 100 ? '...' : '');
      
      await db.run(`
        UPDATE email_templates 
        SET name = ?, subject = ?, content = ?, category = ?, preview = ?, updatedAt = ?
        WHERE id = ?
      `, [name, subject, content, category, preview, new Date().toISOString(), id]);

      await db.close();
      res.json({ message: 'Email template updated successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router; 