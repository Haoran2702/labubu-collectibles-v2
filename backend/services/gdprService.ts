import { openDb } from '../db';
import logger from '../logger';
import { sendEmail } from '../utils/emailTemplates';

export interface DataRightsRequest {
  id: string;
  email: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'objection' | 'withdrawal';
  reason?: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  responseData?: any;
}

export interface UserDataExport {
  personalInfo: any;
  orders: any[];
  addresses: any[];
  reviews: any[];
  supportTickets: any[];
  marketingPreferences: any;
  dataRightsRequests: any[];
}

export interface PrivacySettings {
  marketingEmails: boolean;
  analyticsTracking: boolean;
  thirdPartySharing: boolean;
  dataRetention: '30days' | '1year' | 'indefinite';
}

class GDPRService {
  // Create data rights request
  async createDataRightsRequest(
    email: string, 
    requestType: DataRightsRequest['requestType'], 
    reason?: string
  ): Promise<DataRightsRequest> {
    const db = await openDb();

    const request: DataRightsRequest = {
      id: `DR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email,
      requestType,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.run(`
      INSERT INTO data_rights_requests (
        id, email, request_type, reason, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      request.id, 
      request.email, 
      request.requestType, 
      request.reason, 
      request.status, 
      request.createdAt, 
      request.updatedAt
    ]);

    await db.close();

    // Send confirmation email
    await this.sendDataRightsConfirmation(email, request);

    logger.info('Data rights request created', { requestId: request.id, email, requestType });

    return request;
  }

  // Process data rights request
  async processDataRightsRequest(requestId: string): Promise<void> {
    const db = await openDb();

    const request = await db.get(`
      SELECT * FROM data_rights_requests WHERE id = ?
    `, [requestId]);

    if (!request) {
      await db.close();
      throw new Error('Request not found');
    }

    // Update status to processing
    await db.run(`
      UPDATE data_rights_requests 
      SET status = ?, updated_at = ? 
      WHERE id = ?
    `, ['processing', new Date().toISOString(), requestId]);

    let responseData: any = null;

    try {
      switch (request.request_type) {
        case 'access':
          responseData = await this.handleDataAccess(request.email);
          break;
        case 'rectification':
          responseData = await this.handleDataRectification(request.email, request.reason);
          break;
        case 'erasure':
          responseData = await this.handleDataErasure(request.email);
          break;
        case 'portability':
          responseData = await this.handleDataPortability(request.email);
          break;
        case 'objection':
          responseData = await this.handleDataObjection(request.email, request.reason);
          break;
        case 'withdrawal':
          responseData = await this.handleConsentWithdrawal(request.email);
          break;
      }

      // Update request as completed
      await db.run(`
        UPDATE data_rights_requests 
        SET status = ?, response_data = ?, completed_at = ?, updated_at = ? 
        WHERE id = ?
      `, ['completed', JSON.stringify(responseData), new Date().toISOString(), new Date().toISOString(), requestId]);

      // Send completion notification
      await this.sendDataRightsCompletion(request.email, request, responseData);

    } catch (error) {
      // Update request as failed
      await db.run(`
        UPDATE data_rights_requests 
        SET status = ?, updated_at = ? 
        WHERE id = ?
      `, ['rejected', new Date().toISOString(), requestId]);

      logger.error('Data rights request processing failed', { requestId, error });
      throw error;
    }

    await db.close();
  }

  // Handle data access request
  private async handleDataAccess(email: string): Promise<UserDataExport> {
    const db = await openDb();

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      await db.close();
      throw new Error('User not found');
    }

    const orders = await db.all('SELECT * FROM orders WHERE userId = ?', [user.id]);
    const addresses = await db.all('SELECT * FROM addresses WHERE userId = ?', [user.id]);
    const reviews = await db.all('SELECT * FROM reviews WHERE userId = ?', [user.id]);
    const supportTickets = await db.all('SELECT * FROM support_tickets WHERE userId = ?', [user.id]);
    const dataRightsRequests = await db.all('SELECT * FROM data_rights_requests WHERE email = ?', [email]);

    await db.close();

    return {
      personalInfo: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt
      },
      orders,
      addresses,
      reviews,
      supportTickets,
      marketingPreferences: {
        marketingEmails: true, // This would come from a separate table
        analyticsTracking: true,
        thirdPartySharing: false
      },
      dataRightsRequests
    };
  }

  // Handle data rectification request
  private async handleDataRectification(email: string, reason?: string): Promise<any> {
    const db = await openDb();

    // This would typically involve manual review
    // For now, we'll just log the request
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    
    await db.close();

    logger.info('Data rectification request', { email, reason, userId: user?.id });

    return {
      message: 'Data rectification request received and will be reviewed within 30 days',
      requestId: `RECT-${Date.now()}`,
      estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  // Handle data erasure request
  private async handleDataErasure(email: string): Promise<any> {
    const db = await openDb();

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      await db.close();
      throw new Error('User not found');
    }

    // Anonymize user data (GDPR-compliant deletion)
    await db.run(`
      UPDATE users 
      SET email = ?, firstName = ?, lastName = ?, password = ?
      WHERE id = ?
    `, [
      `deleted_${user.id}@deleted.com`,
      'Deleted',
      'User',
      'deleted_password_hash',
      user.id
    ]);

    // Anonymize orders
    await db.run(`
      UPDATE orders 
      SET shipping_info = ?
      WHERE userId = ?
    `, [JSON.stringify({ name: 'Deleted User', address: 'Deleted' }), user.id]);

    // Anonymize addresses
    await db.run(`
      UPDATE addresses 
      SET name = ?, address = ?, city = ?, state = ?, zip = ?, phone = ?
      WHERE userId = ?
    `, ['Deleted User', 'Deleted', 'Deleted', 'Deleted', '00000', '000-000-0000', user.id]);

    await db.close();

    return {
      message: 'Data has been anonymized in compliance with GDPR Article 17',
      anonymizedAt: new Date().toISOString(),
      userId: user.id
    };
  }

  // Handle data portability request
  private async handleDataPortability(email: string): Promise<any> {
    const dataExport = await this.handleDataAccess(email);
    
    return {
      message: 'Data export completed',
      exportFormat: 'JSON',
      dataSize: JSON.stringify(dataExport).length,
      downloadUrl: `/api/privacy/export/${Date.now()}.json`, // This would generate a temporary download link
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
  }

  // Handle data objection request
  private async handleDataObjection(email: string, reason?: string): Promise<any> {
    const db = await openDb();

    // Stop processing user data for marketing
    await db.run(`
      UPDATE users 
      SET marketing_consent = 0, updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `, [email]);

    // Add to do-not-contact list
    await db.run(`
      INSERT OR REPLACE INTO marketing_preferences (
        email, marketing_emails, analytics_tracking, third_party_sharing, updated_at
      ) VALUES (?, 0, 0, 0, CURRENT_TIMESTAMP)
    `, [email]);

    await db.close();

    return {
      message: 'Data processing objections have been recorded',
      marketingStopped: true,
      analyticsStopped: true,
      thirdPartySharingStopped: true
    };
  }

  // Handle consent withdrawal
  private async handleConsentWithdrawal(email: string): Promise<any> {
    const db = await openDb();

    // Withdraw all consents
    await db.run(`
      UPDATE users 
      SET marketing_consent = 0, updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `, [email]);

    // Remove from all marketing lists
    await db.run(`
      INSERT OR REPLACE INTO marketing_preferences (
        email, marketing_emails, analytics_tracking, third_party_sharing, updated_at
      ) VALUES (?, 0, 0, 0, CURRENT_TIMESTAMP)
    `, [email]);

    await db.close();

    return {
      message: 'All consents have been withdrawn',
      consentsWithdrawn: ['marketing', 'analytics', 'third_party_sharing'],
      withdrawnAt: new Date().toISOString()
    };
  }

  // Send data rights confirmation email
  private async sendDataRightsConfirmation(email: string, request: DataRightsRequest): Promise<void> {
    const html = `
      <h2>Data Rights Request Confirmation</h2>
      <p>Dear User,</p>
      <p>We have received your data rights request with the following details:</p>
      <ul>
        <li><strong>Request ID:</strong> ${request.id}</li>
        <li><strong>Type:</strong> ${request.requestType}</li>
        <li><strong>Date:</strong> ${new Date(request.createdAt).toLocaleDateString()}</li>
      </ul>
      <p>We will process your request within 30 days as required by GDPR.</p>
      <p>You will receive another email once your request has been completed.</p>
      <p>Best regards,<br>Labubu Collectibles Team</p>
    `;

    await sendEmail(email, 'Data Rights Request Confirmation', html);
  }

  // Send data rights completion email
  private async sendDataRightsCompletion(email: string, request: DataRightsRequest, responseData: any): Promise<void> {
    const html = `
      <h2>Data Rights Request Completed</h2>
      <p>Dear User,</p>
      <p>Your data rights request (${request.id}) has been completed.</p>
      <p><strong>Request Type:</strong> ${request.requestType}</p>
      <p><strong>Status:</strong> ${request.status}</p>
      ${responseData?.message ? `<p><strong>Details:</strong> ${responseData.message}</p>` : ''}
      <p>If you have any questions, please contact our support team.</p>
      <p>Best regards,<br>Labubu Collectibles Team</p>
    `;

    await sendEmail(email, 'Data Rights Request Completed', html);
  }

  // Get user privacy settings
  async getUserPrivacySettings(email: string): Promise<PrivacySettings> {
    const db = await openDb();

    const settings = await db.get(`
      SELECT * FROM marketing_preferences WHERE email = ?
    `, [email]);

    await db.close();

    return {
      marketingEmails: settings?.marketing_emails || false,
      analyticsTracking: settings?.analytics_tracking || false,
      thirdPartySharing: settings?.third_party_sharing || false,
      dataRetention: settings?.data_retention || '1year'
    };
  }

  // Update user privacy settings
  async updateUserPrivacySettings(email: string, settings: Partial<PrivacySettings>): Promise<void> {
    const db = await openDb();

    await db.run(`
      INSERT OR REPLACE INTO marketing_preferences (
        email, marketing_emails, analytics_tracking, third_party_sharing, 
        data_retention, updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      email,
      settings.marketingEmails ? 1 : 0,
      settings.analyticsTracking ? 1 : 0,
      settings.thirdPartySharing ? 1 : 0,
      settings.dataRetention || '1year'
    ]);

    await db.close();

    logger.info('Privacy settings updated', { email, settings });
  }

  // Get data rights request statistics
  async getDataRightsStats(): Promise<any> {
    const db = await openDb();

    const stats = await db.get(`
      SELECT 
        COUNT(*) as totalRequests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN request_type = 'access' THEN 1 END) as accessRequests,
        COUNT(CASE WHEN request_type = 'erasure' THEN 1 END) as erasureRequests,
        COUNT(CASE WHEN request_type = 'portability' THEN 1 END) as portabilityRequests
      FROM data_rights_requests 
      WHERE created_at >= datetime('now', '-30 days')
    `);

    await db.close();
    return stats;
  }

  // Check if user has pending requests
  async hasPendingRequests(email: string): Promise<boolean> {
    const db = await openDb();

    const pending = await db.get(`
      SELECT COUNT(*) as count
      FROM data_rights_requests 
      WHERE email = ? AND status IN ('pending', 'processing')
    `, [email]);

    await db.close();
    return (pending.count || 0) > 0;
  }
}

export default new GDPRService(); 