# 🚀 Railway Deployment Guide for Labubu Collectibles

## Prerequisites
- Railway account (railway.app)
- GitHub repository connected
- Domain name (labubu-collectibles.com)

## Step 1: Backend Deployment

### 1.1 Create Backend Service
1. Go to Railway Dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Set service name: `labubu-backend`
6. Set root directory: `backend`

### 1.2 Configure Backend Environment Variables
Add these environment variables in Railway dashboard:

```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://labubu-collectibles.com
JWT_SECRET=your-super-secure-jwt-secret-key-here
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
```

### 1.3 Deploy Backend
1. Railway will automatically build and deploy
2. Wait for deployment to complete
3. Note the generated URL (e.g., `https://labubu-backend-production-xxxx.up.railway.app`)

## Step 2: Frontend Deployment

### 2.1 Create Frontend Service
1. In the same Railway project
2. Click "New Service" → "GitHub Repo"
3. Choose the same repository
4. Set service name: `labubu-frontend`
5. Set root directory: `frontend`

### 2.2 Configure Frontend Environment Variables
Add these environment variables:

```env
NEXT_PUBLIC_API_URL=https://labubu-backend-production-xxxx.up.railway.app
NEXT_PUBLIC_FRONTEND_URL=https://labubu-collectibles.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_live_client_id
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NODE_ENV=production
```

### 2.3 Deploy Frontend
1. Railway will automatically build and deploy
2. Wait for deployment to complete
3. Note the generated URL (e.g., `https://labubu-frontend-production-xxxx.up.railway.app`)

## Step 3: Domain Configuration

### 3.1 Configure Custom Domain
1. Go to Railway project settings
2. Click "Domains"
3. Add custom domain: `labubu-collectibles.com`
4. Railway will provide DNS records to configure

### 3.2 Configure DNS (in Cloudflare)
Add these DNS records in Cloudflare:

```
Type: CNAME
Name: @
Target: cname.railway.app
Proxy: Enabled (Orange cloud)

Type: CNAME  
Name: www
Target: cname.railway.app
Proxy: Enabled (Orange cloud)
```

### 3.3 SSL Configuration
1. Railway automatically provisions SSL certificates
2. Wait for SSL to be active (usually 5-10 minutes)
3. Test HTTPS access

## Step 4: Testing & Verification

### 4.1 Health Check
- Backend: `https://labubu-backend-production-xxxx.up.railway.app/api/health`
- Frontend: `https://labubu-collectibles.com`

### 4.2 Functionality Testing
- [ ] Homepage loads
- [ ] Products page loads
- [ ] User registration/login
- [ ] Shopping cart
- [ ] Checkout process
- [ ] Admin dashboard
- [ ] Email notifications

### 4.3 API Testing
- [ ] All API endpoints respond
- [ ] CORS working correctly
- [ ] Authentication working
- [ ] Payment processing

## Step 5: Monitoring & Maintenance

### 5.1 Railway Monitoring
- Monitor deployment logs
- Check service health
- Set up alerts for downtime

### 5.2 Database Management
- Regular backups
- Monitor database size
- Performance optimization

### 5.3 Security
- Regular security updates
- Monitor for vulnerabilities
- Keep dependencies updated

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Railway
   - Verify all dependencies are in package.json
   - Ensure TypeScript compilation passes

2. **Environment Variables**
   - Verify all required variables are set
   - Check for typos in variable names
   - Ensure sensitive data is properly secured

3. **CORS Issues**
   - Verify FRONTEND_URL is set correctly
   - Check CORS configuration in backend
   - Test API calls from frontend

4. **Database Issues**
   - Check database connection
   - Verify migrations have run
   - Monitor database performance

### Support
- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Issues: Check GitHub repository

## Next Steps
1. Set up monitoring and alerts
2. Configure automated backups
3. Set up CI/CD pipeline
4. Implement performance monitoring
5. Plan for scaling
