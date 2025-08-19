import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import { openDb } from '../db';

// Email configuration (you'll need to set these up)
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Email templates
const emailTemplates = {
  welcome: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
        .button { background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Labubu Collectibles!</h1>
        </div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>Welcome to our community of collectors! We're excited to have you join us.</p>
          <p>Discover our amazing collection of Labubu figures and start building your collection today.</p>
          <a href="{{shopUrl}}" class="button">Shop Now</a>
        </div>
        <div class="footer">
          <p>© 2024 Labubu Collectibles. All rights reserved.</p>
          <p><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `,
  
  promotional: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
        .button { background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>{{subject}}</h1>
        </div>
        <div class="content">
          <p>Hi {{name}},</p>
          {{content}}
          <a href="{{shopUrl}}" class="button">Shop Now</a>
        </div>
        <div class="footer">
          <p>© 2024 Labubu Collectibles. All rights reserved.</p>
          <p><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `,
  
  abandoned_cart: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
        .button { background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Complete Your Purchase</h1>
        </div>
        <div class="content">
          <p>Hi {{name}},</p>
          <p>You left some amazing items in your cart! Don't let them get away.</p>
          <p>Complete your purchase now and add these beautiful Labubu figures to your collection.</p>
          <a href="{{cartUrl}}" class="button">Complete Purchase</a>
        </div>
        <div class="footer">
          <p>© 2024 Labubu Collectibles. All rights reserved.</p>
          <p><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `
};

export interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  campaignId?: string;
}

export interface EmailTracking {
  emailId: string;
  campaignId?: string;
  recipient: string;
  sentAt: Date;
  openedAt?: Date;
  clickedAt?: Date;
  unsubscribedAt?: Date;
}

class EmailService {
  // Send email with tracking
  async sendEmail(emailData: EmailData): Promise<string> {
    try {
      const db = await openDb();
      
      // Get template
      const template = emailTemplates[emailData.template as keyof typeof emailTemplates] || emailData.template;
      const compiledTemplate = handlebars.compile(template);
      const html = compiledTemplate(emailData.data);
      
      // Send email
      const mailOptions = {
        from: emailConfig.auth.user,
        to: emailData.to,
        subject: emailData.subject,
        html: html,
        headers: {
          'X-Campaign-ID': emailData.campaignId || '',
          'X-Email-ID': `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      };
      
      const info = await transporter.sendMail(mailOptions);
      
      // Track email
      const emailId = mailOptions.headers['X-Email-ID'] as string;
      await db.run(`
        INSERT INTO email_tracking (id, campaignId, recipient, sentAt, messageId)
        VALUES (?, ?, ?, ?, ?)
      `, [emailId, emailData.campaignId || null, emailData.to, new Date().toISOString(), info.messageId]);
      
      await db.close();
      
      console.log(`Email sent: ${emailId} to ${emailData.to}`);
      return emailId;
      
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }
  
  // Send campaign to multiple recipients
  async sendCampaign(campaignId: string, recipients: string[]): Promise<{ sent: number; failed: number }> {
    const db = await openDb();
    
    try {
      // Get campaign details
      const campaign = await db.get('SELECT * FROM email_campaigns WHERE id = ?', [campaignId]);
      if (!campaign) {
        throw new Error('Campaign not found');
      }
      
      let sent = 0;
      let failed = 0;
      
      // Send to each recipient
      for (const recipient of recipients) {
        try {
          // Get user data for personalization
          const user = await db.get('SELECT * FROM users WHERE email = ?', [recipient]);
          
          const emailData: EmailData = {
            to: recipient,
            subject: campaign.subject,
            template: 'promotional',
            data: {
              name: user?.name || 'there',
              content: campaign.content,
              shopUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/products`,
              unsubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(recipient)}`
            },
            campaignId: campaignId
          };
          
          await this.sendEmail(emailData);
          sent++;
          
          // Update campaign sent count
          await db.run('UPDATE email_campaigns SET sentCount = sentCount + 1 WHERE id = ?', [campaignId]);
          
        } catch (error) {
          console.error(`Failed to send to ${recipient}:`, error);
          failed++;
        }
      }
      
      // Update campaign status
      await db.run('UPDATE email_campaigns SET status = ?, sentAt = ? WHERE id = ?', 
        ['completed', new Date().toISOString(), campaignId]);
      
      await db.close();
      return { sent, failed };
      
    } catch (error) {
      await db.close();
      throw error;
    }
  }
  
  // Track email open
  async trackOpen(emailId: string): Promise<void> {
    const db = await openDb();
    try {
      await db.run('UPDATE email_tracking SET openedAt = ? WHERE id = ?', [new Date().toISOString(), emailId]);
      await db.close();
    } catch (error) {
      await db.close();
      throw error;
    }
  }
  
  // Track email click
  async trackClick(emailId: string): Promise<void> {
    const db = await openDb();
    try {
      await db.run('UPDATE email_tracking SET clickedAt = ? WHERE id = ?', [new Date().toISOString(), emailId]);
      await db.close();
    } catch (error) {
      await db.close();
      throw error;
    }
  }
  
  // Get campaign analytics
  async getCampaignAnalytics(campaignId: string): Promise<{
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  }> {
    const db = await openDb();
    try {
      const result = await db.get(`
        SELECT 
          COUNT(*) as sent,
          COUNT(openedAt) as opened,
          COUNT(clickedAt) as clicked
        FROM email_tracking 
        WHERE campaignId = ?
      `, [campaignId]);
      
      const sent = result.sent || 0;
      const opened = result.opened || 0;
      const clicked = result.clicked || 0;
      
      await db.close();
      
      return {
        sent,
        opened,
        clicked,
        openRate: sent > 0 ? opened / sent : 0,
        clickRate: sent > 0 ? clicked / sent : 0
      };
      
    } catch (error) {
      await db.close();
      throw error;
    }
  }
  
  // Get recipients for campaign
  async getCampaignRecipients(targetAudience: string): Promise<string[]> {
    const db = await openDb();
    try {
      let query = 'SELECT DISTINCT email FROM users WHERE email IS NOT NULL';
      
      switch (targetAudience) {
        case 'new':
          query += ' AND createdAt >= datetime("now", "-30 days")';
          break;
        case 'returning':
          query += ' AND id IN (SELECT DISTINCT userId FROM orders GROUP BY userId HAVING COUNT(*) > 1)';
          break;
        case 'inactive':
          query += ' AND id NOT IN (SELECT DISTINCT userId FROM orders WHERE createdAt >= datetime("now", "-90 days"))';
          break;
        // 'all' uses the base query
      }
      
      const result = await db.all(query);
      await db.close();
      
      return result.map(row => row.email);
      
    } catch (error) {
      await db.close();
      throw error;
    }
  }
}

export const emailService = new EmailService(); 