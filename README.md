# DropshipHub - Modern Dropshipping Platform

A full-stack dropshipping platform built with Next.js, TypeScript, Tailwind CSS, and Node.js/Express.

## 🚀 Features

### Frontend
- **Modern UI/UX**: Clean, responsive design with Tailwind CSS
- **Product Catalog**: Browse, search, and filter products
- **Shopping Cart**: Add/remove items with real-time updates
- **Checkout Flow**: Complete order process with shipping information
- **User Authentication**: Secure admin login system
- **Toast Notifications**: Real-time feedback for user actions
- **Responsive Design**: Mobile-first approach
- **Component Library**: Reusable UI components

### Backend
- **RESTful API**: Complete CRUD operations for all entities
- **Authentication**: JWT-based authentication system
- **Database**: SQLite with TypeScript ORM
- **Search & Filtering**: Advanced product search with multiple criteria
- **Rate Limiting**: API protection against abuse
- **Error Handling**: Comprehensive error management
- **CORS Support**: Cross-origin resource sharing

### Database Schema
- **Products**: Product catalog with categories and suppliers
- **Suppliers**: Supplier information and management
- **Orders**: Order tracking and management
- **Users**: Admin user management
- **Categories**: Product categorization system

## 🛠️ Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Context**: State management
- **React Hooks**: Modern React patterns

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **TypeScript**: Type-safe development
- **SQLite**: Lightweight database
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing
- **CORS**: Cross-origin support
- **Rate Limiting**: API protection

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npm run build
npm start
```

The backend will run on `http://localhost:3001`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:3000` (or next available port)

## 🗄️ Database Setup

The database is automatically initialized when you first run the backend. The schema includes:

- Users table for admin authentication
- Products table for the product catalog
- Suppliers table for supplier information
- Orders table for order management
- Categories table for product organization
- Email signups table for newsletter subscriptions

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
JWT_SECRET=your-secret-key-here
NODE_ENV=development
PORT=3001
```

### CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000`
- `http://localhost:3002`
- `http://localhost:3003`

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/register` - Admin registration

### Products
- `GET /api/products` - List products (with search/filtering)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Suppliers
- `GET /api/suppliers` - List suppliers
- `GET /api/suppliers/:id` - Get single supplier
- `POST /api/suppliers` - Create supplier (admin only)
- `PUT /api/suppliers/:id` - Update supplier (admin only)
- `DELETE /api/suppliers/:id` - Delete supplier (admin only)

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status

### Categories
- `GET /api/categories` - List categories
- `GET /api/categories/:id` - Get single category
- `GET /api/categories/:id/products` - Get products in category
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)

## 🎨 UI Components

The project includes a comprehensive component library:

- **Header**: Navigation with cart icon and mobile menu
- **Footer**: Site footer with links and social media
- **Hero**: Landing page hero section
- **ProductCard**: Product display component
- **Button**: Reusable button component
- **Modal**: Modal dialog component
- **Toast**: Notification system
- **Loading**: Loading spinner component
- **Badge**: Status indicator component
- **Card**: Container component

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Input validation
- SQL injection prevention

## 📊 Performance Features

- Image optimization
- Lazy loading
- Code splitting
- Caching strategies
- Database indexing
- API response optimization

## 🚀 Deployment

### Backend Deployment
1. Build the TypeScript code: `npm run build`
2. Set environment variables
3. Deploy to your preferred hosting service

### Frontend Deployment
1. Build the Next.js app: `npm run build`
2. Deploy to Vercel, Netlify, or your preferred hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

Built with ❤️ using modern web technologies 