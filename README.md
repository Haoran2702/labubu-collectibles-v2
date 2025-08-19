# Labubu Collectibles - Premium Collectibles E-commerce Platform

A modern, full-stack e-commerce platform specializing in Labubu collectibles and exclusive editions. Built with Next.js 15, TypeScript, Tailwind CSS, and Node.js/Express, featuring comprehensive admin tools, analytics, marketing automation, and a seamless shopping experience.

## 🎯 About Labubu Collectibles

Labubu Collectibles is a premium e-commerce platform designed for collectors and enthusiasts. The platform offers a curated selection of authentic Labubu collectibles, exclusive editions, and limited releases with a focus on user experience, security, and comprehensive business management tools.

## 🚀 Key Features

### 🛍️ Customer Experience
- **Premium Product Catalog**: Curated collection of Labubu collectibles with high-quality images
- **Advanced Search & Filtering**: Find products by category, price, availability, and more
- **Smart Shopping Cart**: Real-time cart updates with persistent storage
- **Seamless Checkout**: Multi-step checkout with address management and payment processing
- **Order Tracking**: Real-time order status updates and tracking
- **Product Reviews**: Customer reviews and ratings system
- **Wishlist**: Save favorite items for later
- **Multi-Currency Support**: International currency conversion
- **Responsive Design**: Optimized for all devices

### 🔐 Authentication & Security
- **Secure User Registration**: Email verification and password strength validation
- **JWT Authentication**: Secure token-based authentication
- **Password Recovery**: Email-based password reset system
- **Admin Access Control**: Role-based admin dashboard
- **Data Protection**: GDPR-compliant data handling

### 💳 Payment & Shipping
- **Stripe Integration**: Secure credit card processing
- **PayPal Support**: Alternative payment method
- **Multiple Shipping Options**: Flexible shipping rates and methods
- **Order Management**: Comprehensive order processing workflow
- **Invoice Generation**: Automated PDF invoice creation
- **Refund Processing**: Streamlined refund and cancellation system

### 📊 Admin Dashboard
- **Comprehensive Analytics**: Real-time sales, customer, and product analytics
- **Marketing Automation**: Email campaigns, discount codes, and automation rules
- **Inventory Management**: Stock tracking and low-stock alerts
- **Order Management**: Full order lifecycle management
- **Customer Support**: Integrated support ticket system
- **User Management**: Customer account administration
- **Product Management**: Complete product catalog management
- **Forecasting**: Sales forecasting and trend analysis

### 📈 Analytics & Reporting
- **Real-time Analytics**: Live dashboard with key metrics
- **Sales Performance**: Revenue tracking and growth analysis
- **Customer Insights**: Customer behavior and demographics
- **Product Performance**: Best-selling products and inventory analysis
- **Marketing ROI**: Campaign performance and conversion tracking
- **Export Capabilities**: Data export for external analysis

### 📧 Marketing & Automation
- **Email Campaigns**: Create and send targeted email campaigns
- **Discount Codes**: Generate and manage promotional codes
- **Automation Rules**: Welcome series, abandoned cart, and reorder reminders
- **Email Templates**: Customizable email templates with Handlebars
- **Audience Segmentation**: Target specific customer groups
- **Campaign Analytics**: Track open rates, click rates, and conversions

## 🛠️ Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router for optimal performance
- **TypeScript**: Type-safe development for better code quality
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **React Context**: Global state management
- **React Hooks**: Modern React patterns and lifecycle management
- **Framer Motion**: Smooth animations and transitions
- **React Query**: Server state management and caching

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Fast, unopinionated web framework
- **TypeScript**: Type-safe backend development
- **SQLite**: Lightweight, file-based database
- **JWT**: Secure authentication tokens
- **bcrypt**: Password hashing and security
- **Nodemailer**: Email sending capabilities
- **Handlebars**: Email template engine
- **node-cron**: Automated task scheduling
- **PDFKit**: PDF generation for invoices

### Database & Storage
- **SQLite**: Reliable, file-based database
- **Image Storage**: Local file system with caching
- **Session Storage**: Client-side session management
- **Cache Management**: Optimized data caching strategies

### Development Tools
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **TypeScript Compiler**: Type checking and compilation

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd IWR-labubu
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Backend environment
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build and start the application**
   ```bash
   # From project root
   npm run build
   npm start
   ```

### Development Mode

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:3000`

## 🗄️ Database Schema

The platform uses a comprehensive database schema including:

### Core Tables
- **Users**: Customer accounts and admin users
- **Products**: Product catalog with images and metadata
- **Categories**: Product categorization system
- **Suppliers**: Supplier information and management
- **Orders**: Complete order management system
- **Order Items**: Individual items within orders
- **Addresses**: Customer shipping and billing addresses

### Marketing & Analytics
- **Email Campaigns**: Marketing campaign management
- **Discount Codes**: Promotional code system
- **Automation Rules**: Marketing automation workflows
- **Email Templates**: Reusable email templates
- **Email Tracking**: Campaign performance tracking
- **Email Unsubscribes**: Compliance management

### Support & Reviews
- **Support Tickets**: Customer support system
- **Product Reviews**: Customer feedback and ratings
- **Review Images**: Visual review content

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Security
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=./database.sqlite

# Email Configuration (for marketing campaigns)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment Processing
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key

# PayPal Configuration
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Password recovery
- `POST /api/auth/reset-password` - Password reset
- `POST /api/auth/verify-email` - Email verification

### Products
- `GET /api/products` - List products with search/filtering
- `GET /api/products/:id` - Get single product details
- `GET /api/products/:id/reviews` - Get product reviews
- `POST /api/products/:id/reviews` - Add product review

### Orders
- `GET /api/orders` - List user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/cancel` - Cancel order

### Admin Endpoints
- `GET /api/admin/analytics` - Comprehensive analytics data
- `GET /api/admin/orders` - Admin order management
- `GET /api/admin/products` - Admin product management
- `GET /api/admin/users` - Admin user management
- `GET /api/admin/marketing` - Marketing campaign management
- `GET /api/admin/support` - Support ticket management

## 🎨 Design System

### Brand Identity
- **Primary Color**: Labubu Gold (#FFD369)
- **Secondary Color**: Dark Gray (#222831)
- **Typography**: Clean, modern sans-serif fonts
- **Logo**: Custom Labubu "L" logo with golden background

### UI Components
- **Header**: Navigation with cart, user menu, and currency selector
- **Footer**: Comprehensive site footer with links and branding
- **Product Cards**: Elegant product display with hover effects
- **Modal System**: Reusable modal components for forms and dialogs
- **Toast Notifications**: Real-time user feedback system
- **Loading States**: Smooth loading indicators and skeletons
- **Form Components**: Consistent form styling and validation

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt password encryption
- **Rate Limiting**: API protection against abuse
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Comprehensive data validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy headers
- **CSRF Protection**: Cross-site request forgery prevention

## 📊 Performance Features

- **Image Optimization**: Automatic image compression and optimization
- **Lazy Loading**: On-demand content loading
- **Code Splitting**: Automatic bundle optimization
- **Caching Strategies**: Multi-level caching system
- **Database Indexing**: Optimized query performance
- **CDN Ready**: Static asset optimization
- **SEO Optimization**: Meta tags, structured data, and sitemaps

## 🚀 Deployment

### Production Build

```bash
# Build both frontend and backend
npm run build

# Start production servers
npm start
```

### Deployment Options

**Vercel (Recommended for Frontend)**
```bash
cd frontend
vercel --prod
```

**Railway/Heroku (Backend)**
```bash
cd backend
# Deploy using your preferred platform
```

### Environment Setup
1. Set production environment variables
2. Configure database connections
3. Set up email services
4. Configure payment processors
5. Set up monitoring and logging

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **Documentation**: Check the inline code comments and API documentation
- **Issues**: Open an issue in the GitHub repository
- **Email**: Contact the development team directly

## 🎉 Acknowledgments

- Built with modern web technologies
- Inspired by the Labubu collectibles community
- Designed for collectors and enthusiasts
- Focused on user experience and performance

---

**Labubu Collectibles** - Where passion meets premium collectibles 🎨✨ 