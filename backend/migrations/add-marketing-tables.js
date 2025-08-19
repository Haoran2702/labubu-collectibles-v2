const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  // Create email_campaigns table
  db.run(`CREATE TABLE IF NOT EXISTS email_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    targetAudience TEXT NOT NULL DEFAULT 'all',
    status TEXT NOT NULL DEFAULT 'draft',
    sentCount INTEGER DEFAULT 0,
    openRate REAL DEFAULT 0,
    clickRate REAL DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    sentAt TEXT,
    scheduledFor TEXT
  );`, (err) => {
    if (err) {
      console.error('Failed to create email_campaigns table:', err.message);
    } else {
      console.log('email_campaigns table created or already exists.');
    }
  });

  // Create discount_codes table
  db.run(`CREATE TABLE IF NOT EXISTS discount_codes (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value REAL NOT NULL,
    minOrderAmount REAL DEFAULT 0,
    maxUses INTEGER,
    usedCount INTEGER DEFAULT 0,
    validFrom TEXT,
    validUntil TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );`, (err) => {
    if (err) {
      console.error('Failed to create discount_codes table:', err.message);
    } else {
      console.log('discount_codes table created or already exists.');
    }
  });

  // Create automation_rules table
  db.run(`CREATE TABLE IF NOT EXISTS automation_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('welcome', 'abandoned_cart', 'low_stock', 'birthday', 'reorder')),
    trigger TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    triggeredCount INTEGER DEFAULT 0,
    convertedCount INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );`, (err) => {
    if (err) {
      console.error('Failed to create automation_rules table:', err.message);
    } else {
      console.log('automation_rules table created or already exists.');
    }
  });

  // Create email_templates table
  db.run(`CREATE TABLE IF NOT EXISTS email_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('welcome', 'promotional', 'transactional', 'abandoned_cart')),
    preview TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  );`, (err) => {
    if (err) {
      console.error('Failed to create email_templates table:', err.message);
    } else {
      console.log('email_templates table created or already exists.');
    }
  });

  // Insert some default automation rules
  db.run(`INSERT OR IGNORE INTO automation_rules (id, name, type, trigger, action, status) VALUES 
    ('rule_welcome', 'Welcome Series', 'welcome', 'new_customer_registration', 'send_welcome_email', 'active'),
    ('rule_abandoned_cart', 'Abandoned Cart Recovery', 'abandoned_cart', 'cart_abandoned_24h', 'send_abandoned_cart_email', 'active'),
    ('rule_low_stock', 'Low Stock Alerts', 'low_stock', 'product_stock_below_threshold', 'send_low_stock_notification', 'active'),
    ('rule_birthday', 'Birthday Offers', 'birthday', 'customer_birthday', 'send_birthday_discount', 'inactive')
  `, (err) => {
    if (err) {
      console.error('Failed to insert default automation rules:', err.message);
    } else {
      console.log('Default automation rules inserted or already exist.');
    }
  });

  // Insert some default email templates
  db.run(`INSERT OR IGNORE INTO email_templates (id, name, subject, content, category, preview) VALUES 
    ('template_welcome', 'Welcome Email', 'Welcome to Labubu Collectibles!', 'Welcome to our community of collectors...', 'welcome', 'Welcome to our community of collectors...'),
    ('template_abandoned_cart', 'Abandoned Cart Recovery', 'Complete your purchase', 'You left some amazing items in your cart...', 'abandoned_cart', 'You left some amazing items in your cart...'),
    ('template_promotional', 'New Product Launch', 'New Labubu figures available!', 'Discover our latest collection...', 'promotional', 'Discover our latest collection...')
  `, (err) => {
    if (err) {
      console.error('Failed to insert default email templates:', err.message);
    } else {
      console.log('Default email templates inserted or already exist.');
    }
    db.close();
  });
}); 