import nodemailer from 'nodemailer';

// Base email template with consistent styling
function getBaseEmailTemplate(content: string, title?: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title || 'Labubu Collectibles'}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f8f9fa;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .content {
          padding: 40px 30px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .button:hover {
          background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px 30px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .divider {
          border-top: 1px solid #e9ecef;
          margin: 20px 0;
        }
        .highlight {
          background-color: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Labubu Collectibles</div>
          <div>Premium Collectible Figures</div>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© 2024 Labubu Collectibles. All rights reserved.</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Email verification template
export function getEmailVerificationTemplate(email: string, verificationUrl: string) {
  const content = `
    <h2 style="color: #333; margin-bottom: 20px;">Welcome to Labubu Collectibles!</h2>
    <p>Thank you for creating an account with us. To complete your registration and start exploring our amazing collection of premium collectible figures, please verify your email address.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" class="button">Verify Email Address</a>
    </div>
    
    <div class="highlight">
      <p><strong>What's next?</strong></p>
      <ul>
        <li>Browse our exclusive collection of Labubu figures</li>
        <li>Get early access to limited editions</li>
        <li>Join our collector community</li>
        <li>Receive updates on new releases</li>
      </ul>
    </div>
    
    <p><strong>Important:</strong> This verification link will expire in 24 hours for your security.</p>
    <p>If you didn't create this account, please ignore this email.</p>
  `;
  
  return getBaseEmailTemplate(content, 'Verify Your Email - Labubu Collectibles');
}

// Password reset template
export function getPasswordResetTemplate(resetUrl: string) {
  const content = `
    <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
    <p>We received a request to reset your password for your Labubu Collectibles account. If you made this request, click the button below to create a new password.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    
    <div class="highlight">
      <p><strong>Security Notice:</strong></p>
      <ul>
        <li>This link will expire in 1 hour</li>
        <li>If you didn't request this reset, please ignore this email</li>
        <li>Your password will only be changed if you click the link above</li>
      </ul>
    </div>
    
    <p>If you're having trouble with the button above, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
  `;
  
  return getBaseEmailTemplate(content, 'Reset Your Password - Labubu Collectibles');
}

// Welcome email template (sent after verification)
export function getWelcomeEmailTemplate(firstName: string) {
  const content = `
    <h2 style="color: #333; margin-bottom: 20px;">Welcome to the Labubu Family, ${firstName}! 🎉</h2>
    <p>Your email has been verified and your account is now active. Welcome to the world of premium collectible figures!</p>
    
    <div class="highlight">
      <p><strong>What you can do now:</strong></p>
      <ul>
        <li>🛍️ Browse our exclusive collection</li>
        <li>🔔 Get notified about new releases</li>
        <li>💎 Access limited edition drops</li>
        <li>👥 Join our collector community</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products" class="button">Start Shopping</a>
    </div>
    
    <p>Thank you for choosing Labubu Collectibles. We're excited to have you as part of our community!</p>
  `;
  
  return getBaseEmailTemplate(content, 'Welcome to Labubu Collectibles');
}

// Order confirmation template
export function getOrderConfirmationTemplate(orderId: string, orderDetails: any, customerName: string) {
  const content = `
    <h2 style="color: #333; margin-bottom: 20px;">Order Confirmed! 🎉</h2>
    <p>Hi ${customerName},</p>
    <p>Thank you for your order! We're excited to prepare your Labubu collectibles for shipping.</p>
    
    <div class="highlight">
      <p><strong>Order Details:</strong></p>
      <p>Order ID: <strong>${orderId}</strong></p>
      <p>Total: <strong>$${orderDetails.total}</strong></p>
      <p>Status: <strong>Confirmed</strong></p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${orderId}" class="button">View Order Details</a>
    </div>
    
    <p><strong>What's next?</strong></p>
    <ul>
      <li>We'll process your order within 1-2 business days</li>
      <li>You'll receive a shipping confirmation with tracking</li>
      <li>Your collectibles will be carefully packaged for safe delivery</li>
    </ul>
  `;
  
  return getBaseEmailTemplate(content, 'Order Confirmed - Labubu Collectibles');
}

// Order status update template
export function getOrderStatusUpdateTemplate(orderId: string, status: string, customerName: string, trackingNumber?: string) {
  const statusEmojis: { [key: string]: string } = {
    'processing': '⚙️',
    'shipped': '📦',
    'delivered': '✅',
    'cancelled': '❌'
  };
  
  const content = `
    <h2 style="color: #333; margin-bottom: 20px;">Order Status Update ${statusEmojis[status] || '📋'}</h2>
    <p>Hi ${customerName},</p>
    <p>Your order status has been updated!</p>
    
    <div class="highlight">
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>New Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
      ${trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${orderId}" class="button">View Order Details</a>
    </div>
    
    <p>Thank you for choosing Labubu Collectibles!</p>
  `;
  
  return getBaseEmailTemplate(content, `Order ${status.charAt(0).toUpperCase() + status.slice(1)} - Labubu Collectibles`);
}

// Support ticket confirmation template
export function getSupportTicketTemplate(ticketId: string, subject: string, customerName: string) {
  const content = `
    <h2 style="color: #333; margin-bottom: 20px;">Support Ticket Created 📝</h2>
    <p>Hi ${customerName},</p>
    <p>We've received your support request and our team will get back to you as soon as possible.</p>
    
    <div class="highlight">
      <p><strong>Ticket Details:</strong></p>
      <p>Ticket ID: <strong>${ticketId}</strong></p>
      <p>Subject: <strong>${subject}</strong></p>
      <p>Status: <strong>Open</strong></p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/support/${ticketId}" class="button">View Ticket</a>
    </div>
    
    <p><strong>What to expect:</strong></p>
    <ul>
      <li>We typically respond within 24 hours</li>
      <li>You'll receive email updates on your ticket</li>
      <li>You can add more information to your ticket anytime</li>
    </ul>
    
    <p>Thank you for contacting Labubu Collectibles support!</p>
  `;
  
  return getBaseEmailTemplate(content, 'Support Ticket Created - Labubu Collectibles');
}

// Password changed confirmation template
export function getPasswordChangedTemplate(customerName: string) {
  const content = `
    <h2 style="color: #333; margin-bottom: 20px;">Password Successfully Changed 🔐</h2>
    <p>Hi ${customerName},</p>
    <p>Your Labubu Collectibles account password has been successfully changed.</p>
    
    <div class="highlight">
      <p><strong>Security Notice:</strong></p>
      <ul>
        <li>This change was made at: ${new Date().toLocaleString()}</li>
        <li>If you didn't make this change, please contact us immediately</li>
        <li>Your account security is our top priority</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth" class="button">Login to Your Account</a>
    </div>
    
    <p>Thank you for keeping your account secure!</p>
  `;
  
  return getBaseEmailTemplate(content, 'Password Changed - Labubu Collectibles');
}

// Newsletter template
export function getNewsletterTemplate(title: string, content: string, unsubscribeUrl: string) {
  const newsletterContent = `
    <h2 style="color: #333; margin-bottom: 20px;">${title}</h2>
    ${content}
    
    <div class="divider"></div>
    
    <p style="text-align: center; font-size: 12px; color: #666;">
      <a href="${unsubscribeUrl}" style="color: #667eea;">Unsubscribe from this newsletter</a>
    </p>
  `;
  
  return getBaseEmailTemplate(newsletterContent, title);
}

// Refund processed template
export function getRefundProcessedTemplate(orderId: string, refundAmount: number, customerName: string, refundReason?: string) {
  const content = `
    <h2 style="color: #333; margin-bottom: 20px;">Refund Processed 💰</h2>
    <p>Hi ${customerName},</p>
    <p>Your refund has been successfully processed and will be credited back to your original payment method.</p>
    
    <div class="highlight">
      <p><strong>Refund Details:</strong></p>
      <p>Order ID: <strong>${orderId}</strong></p>
      <p>Refund Amount: <strong>$${refundAmount.toFixed(2)}</strong></p>
      ${refundReason ? `<p>Reason: <strong>${refundReason}</strong></p>` : ''}
      <p>Status: <strong>Processed</strong></p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${orderId}" class="button">View Order Details</a>
    </div>
    
    <div class="highlight">
      <p><strong>Important Information:</strong></p>
      <ul>
        <li>Refunds typically appear in your account within 3-5 business days</li>
        <li>The refund will be credited to your original payment method</li>
        <li>If you don't see the refund after 5 days, please contact your bank</li>
        <li>You can track the refund status in your order history</li>
      </ul>
    </div>
    
    <p>Thank you for your patience, and we apologize for any inconvenience caused.</p>
    <p>If you have any questions about this refund, please don't hesitate to contact our support team.</p>
  `;
  
  return getBaseEmailTemplate(content, 'Refund Processed - Labubu Collectibles');
}

// Email sender utility
export async function sendEmail(to: string, subject: string, html: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    await transporter.sendMail({
      to,
      from: process.env.EMAIL_USER,
      subject,
      html
    });
    console.log(`Email sent successfully to: ${to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
} 