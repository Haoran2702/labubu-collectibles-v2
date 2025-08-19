const PDFDocument = require('pdfkit');

export interface InvoiceData {
  orderId: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  paymentStatus: string;
  paymentMethod: string;
}

export interface ShippingLabelData {
  orderId: string;
  customerName: string;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  items: Array<{
    name: string;
    quantity: number;
  }>;
  trackingNumber?: string;
  weight?: number;
  dimensions?: string;
  serviceLevel: string;
}

export function generateInvoicePDF(data: InvoiceData): any {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: `Invoice - Order ${data.orderId}`,
      Author: 'Labubu Collectibles',
      Subject: 'Invoice',
      Keywords: 'invoice, order, labubu',
      Creator: 'Labubu Collectibles',
      Producer: 'PDFKit'
    }
  });

  // Header
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .text('Labubu Collectibles', { align: 'center' });
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('Premium Collectible Figures', { align: 'center' });
  
  doc.moveDown(0.5);
  doc.fontSize(10)
     .text('123 Collectible Lane', { align: 'center' });
  doc.text('San Francisco, CA 94102', { align: 'center' });
  doc.text('support@labubu-collectibles.com', { align: 'center' });
  doc.text('www.labubu-collectibles.com', { align: 'center' });

  doc.moveDown(2);

  // Invoice Details
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .text('INVOICE');
  
  doc.moveDown(0.5);
  doc.fontSize(10)
     .font('Helvetica')
     .text(`Invoice Number: ${data.orderId}`);
  doc.text(`Date: ${new Date(data.orderDate).toLocaleDateString()}`);
  doc.text(`Payment Status: ${data.paymentStatus.toUpperCase()}`);
  doc.text(`Payment Method: ${data.paymentMethod}`);

  doc.moveDown(1);

  // Customer Information
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('Bill To:');
  
  doc.fontSize(10)
     .font('Helvetica')
     .text(data.customerName);
  doc.text(data.shippingAddress.name);
  doc.text(data.shippingAddress.address);
  doc.text(`${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}`);
  doc.text(data.shippingAddress.country);
  doc.text(data.customerEmail);

  doc.moveDown(2);

  // Items Table
  const tableTop = doc.y;
  const itemCodeX = 50;
  const descriptionX = 150;
  const quantityX = 350;
  const priceX = 420;
  const totalX = 500;

  // Table Headers
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text('Item', itemCodeX, tableTop)
     .text('Description', descriptionX, tableTop)
     .text('Qty', quantityX, tableTop)
     .text('Price', priceX, tableTop)
     .text('Total', totalX, tableTop);

  doc.moveDown(0.5);
  doc.lineCap('butt')
     .moveTo(50, doc.y)
     .lineTo(550, doc.y)
     .stroke();

  // Table Items
  let currentY = doc.y + 10;
  data.items.forEach((item, index) => {
    if (currentY > 650) {
      doc.addPage();
      currentY = 50;
    }

    doc.fontSize(9)
       .font('Helvetica')
       .text(`#${index + 1}`, itemCodeX, currentY)
       .text(item.name, descriptionX, currentY)
       .text(item.quantity.toString(), quantityX, currentY)
       .text(`$${item.price.toFixed(2)}`, priceX, currentY)
       .text(`$${item.total.toFixed(2)}`, totalX, currentY);

    currentY += 20;
  });

  doc.moveDown(1);

  // Totals
  const totalsY = doc.y;
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text('Subtotal:', 400, totalsY)
     .text(`$${data.subtotal.toFixed(2)}`, 500, totalsY);

  doc.fontSize(10)
     .font('Helvetica')
     .text('Tax:', 400, totalsY + 20)
     .text(`$${data.tax.toFixed(2)}`, 500, totalsY + 20);

  doc.text('Shipping:', 400, totalsY + 40)
     .text(`$${data.shipping.toFixed(2)}`, 500, totalsY + 40);

  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('Total:', 400, totalsY + 70)
     .text(`$${data.total.toFixed(2)}`, 500, totalsY + 70);

  doc.moveDown(3);

  // Footer - positioned after totals
  const footerY = totalsY + 120;
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text('Thank you for your purchase!', 50, footerY);
  
  doc.fontSize(9)
     .font('Helvetica')
     .text('For questions about this invoice, please contact support@labubu-collectibles.com', 50, footerY + 20);

  doc.end();
  return doc;
}

export function generateShippingLabelPDF(data: ShippingLabelData): any {
  const doc = new PDFDocument({
    size: [400, 300], // Shipping label size
    margin: 20,
    info: {
      Title: `Shipping Label - Order ${data.orderId}`,
      Author: 'Labubu Collectibles',
      Subject: 'Shipping Label',
      Keywords: 'shipping, label, labubu',
      Creator: 'Labubu Collectibles',
      Producer: 'PDFKit'
    }
  });

  // Header
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('Labubu Collectibles', { align: 'center' });
  
  doc.fontSize(10)
     .font('Helvetica')
     .text('Premium Collectible Figures', { align: 'center' });

  doc.moveDown(1);

  // Order Information
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text(`Order: ${data.orderId}`);
  
  if (data.trackingNumber) {
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Tracking: ${data.trackingNumber}`);
  }

  doc.fontSize(10)
     .font('Helvetica')
     .text(`Service: ${data.serviceLevel}`);

  if (data.weight) {
    doc.text(`Weight: ${data.weight} lbs`);
  }

  if (data.dimensions) {
    doc.text(`Dimensions: ${data.dimensions}`);
  }

  doc.moveDown(1);

  // Shipping Address
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('SHIP TO:');
  
  doc.fontSize(10)
     .font('Helvetica')
     .text(data.shippingAddress.name)
     .text(data.shippingAddress.address)
     .text(`${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}`)
     .text(data.shippingAddress.country);

  doc.moveDown(1);

  // Items
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text('Items:');
  
  data.items.forEach((item, index) => {
    doc.fontSize(9)
       .font('Helvetica')
       .text(`${item.quantity}x ${item.name}`);
  });

  doc.moveDown(1);

  // Barcode placeholder (you can integrate a barcode library here)
  doc.fontSize(8)
     .font('Helvetica')
     .text('Barcode: |||| |||| |||| ||||', { align: 'center' });

  doc.end();
  return doc;
}

export function generateInvoiceBuffer(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = generateInvoicePDF(data);
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

export function generateShippingLabelBuffer(data: ShippingLabelData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = generateShippingLabelPDF(data);
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
} 