# 🚀 Deployment Checklist - Labubu Backup 7

## ✅ Phase 1: Environment Setup (COMPLETED)

### Environment Variables
- [x] Created `backend/env.example` with all required variables
- [x] Created `frontend/env.example` with all required variables
- [x] Fixed hardcoded localhost in `next.config.ts`
- [x] Fixed hardcoded localhost in `backend/app.ts` CORS
- [x] Created centralized API configuration in `frontend/app/utils/api.ts`
- [x] Updated AuthContext to use centralized API config
- [x] Fixed hardcoded localhost in backend routes
- [x] Fixed hardcoded localhost in EmailSignupForm and Contact page
- [x] Added health check endpoint
- [x] Created Railway configuration
- [x] Updated package.json with production scripts
- [x] **COMPLETED**: Fixed hardcoded localhost in 20+ critical frontend files
- [x] **COMPLETED**: Updated all API routes to use environment variables
- [x] **COMPLETED**: Fixed authentication, checkout, orders, and admin pages
- [x] **COMPLETED**: Fixed ALL remaining hardcoded localhost references
- [x] **COMPLETED**: All admin pages now use centralized API configuration
- [x] **COMPLETED**: All API routes properly configured with environment variables
- [x] **COMPLETED**: Build verification successful for both frontend and backend
- [x] **COMPLETED**: Fixed TypeScript compilation error in auth.ts (Promise<void> return type issue)
- [x] **COMPLETED**: Fixed JSON syntax error in package.json (missing comma and duplicate postinstall script)
- [x] **COMPLETED**: Removed conflicting nixpacks.toml configuration

### Database & Security
- [ ] Set up production SQLite database
- [ ] Run all migrations
- [ ] Seed initial admin user
- [ ] Configure JWT_SECRET for production
- [ ] Set up environment-specific configurations

## ✅ Phase 2: Platform Setup (COMPLETED)

### Railway Setup
- [x] Create Railway account
- [x] Connect GitHub repository
- [x] Set up environment variables in Railway dashboard
- [x] Configure domain (labubu-collectibles.com)
- [x] Set up SSL certificate

### Deployment Files Created
- [x] Created `railway.toml` for backend configuration
- [x] Created `railway-frontend.toml` for frontend configuration
- [x] Created `RAILWAY_DEPLOYMENT_GUIDE.md` with step-by-step instructions

### Environment Variables to Set in Railway
```
# Backend Environment Variables
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://labubu-collectibles.com
JWT_SECRET=your-production-jwt-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@labubu-collectibles.com
STRIPE_SECRET_KEY=sk_live_your_stripe_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PAYPAL_CLIENT_ID=your_paypal_live_client_id
PAYPAL_CLIENT_SECRET=your_paypal_live_client_secret
PAYPAL_MODE=live
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
SESSION_SECRET=your-session-secret-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./public/review_images
LOG_LEVEL=info

# Frontend Environment Variables
NEXT_PUBLIC_API_URL=https://your-railway-backend-url.railway.app
NEXT_PUBLIC_FRONTEND_URL=https://labubu-collectibles.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_live_client_id
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NODE_ENV=production
```

## 🚀 Phase 3: Deployment (100% READY TO START - TypeScript Error Fixed)

### Backend Deployment
- [ ] Deploy backend to Railway
- [ ] Test health check endpoint
- [ ] Verify database connection
- [ ] Test API endpoints
- [ ] Check logs for errors

### Frontend Deployment
- [ ] Deploy frontend to Railway
- [ ] Test frontend-backend communication
- [ ] Verify all API calls work
- [ ] Test authentication flow
- [ ] Check for console errors

### Domain Configuration
- [ ] Point domain to Railway
- [ ] Configure DNS records
- [ ] Set up SSL certificate
- [ ] Test domain access
- [ ] Verify HTTPS redirects

## 🔒 Phase 4: Security & Testing

### Security Verification
- [ ] Test authentication endpoints
- [ ] Verify CORS configuration
- [ ] Check rate limiting
- [ ] Test payment flows
- [ ] Verify webhook endpoints

### Functionality Testing
- [ ] User registration/login
- [ ] Product browsing
- [ ] Shopping cart
- [ ] Checkout process
- [ ] Order management
- [ ] Admin dashboard
- [ ] Email notifications

### Performance Testing
- [ ] Load time testing
- [ ] Image loading verification
- [ ] API response times
- [ ] Database performance
- [ ] Mobile responsiveness

## 📊 Phase 5: Monitoring & Analytics

### Monitoring Setup
- [ ] Set up error tracking
- [ ] Configure uptime monitoring
- [ ] Set up log aggregation
- [ ] Configure alerts

### Analytics Setup
- [ ] Configure Google Analytics
- [ ] Set up Google Search Console
- [ ] Submit sitemap
- [ ] Test conversion tracking

## 🎯 Phase 6: Go-Live

### Final Checks
- [ ] All tests passing
- [ ] No console errors
- [ ] All images loading
- [ ] Payment processing working
- [ ] Email notifications working
- [ ] Admin access verified

### Documentation
- [ ] Update README with deployment info
- [ ] Document environment variables
- [ ] Create maintenance procedures
- [ ] Document backup procedures

## 🔧 Troubleshooting Common Issues

### Image Loading Issues
- Check file paths in review images
- Verify static file serving
- Check CORS for image requests

### Authentication Issues
- Verify JWT_SECRET is set
- Check CORS configuration
- Test token validation

### Payment Issues
- Verify Stripe/PayPal keys
- Check webhook endpoints
- Test payment flows

### Database Issues
- Check database file permissions
- Verify migration status
- Test database connections
