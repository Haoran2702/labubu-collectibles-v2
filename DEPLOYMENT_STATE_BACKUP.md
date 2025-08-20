# 🚀 Labubu Collectibles - Deployment State Backup
*Generated: August 20, 2025*

## 📋 **Current Status: FULLY DEPLOYED & OPERATIONAL**

### ✅ **What's Working:**
- **Website**: https://labubu-collectibles.com
- **Admin Panel**: https://labubu-collectibles.com/admin/login
- **Backend API**: https://labubu-collectibles-v2-production.up.railway.app
- **Frontend**: Railway deployment on port 8080
- **Database**: SQLite with all products seeded
- **Images**: All product images loading correctly
- **Authentication**: Admin login working

### 🔑 **Admin Credentials:**
- **Email**: `tancredi.m.buzzi@gmail.com`
- **Password**: `tupMyx-byfwef-cavwi3`
- **Role**: Admin (email verified)

### 🗄️ **Database State:**
- **Products**: 24 products across 3 collections
  - Have a Seat: 8 products
  - Big Into Energy: 6 products  
  - Exciting Macarons: 8 products
- **Users**: 1 admin user (created in seed-data.ts)
- **Images**: All product images in `backend/public/product_images/`

### 🔧 **Technical Stack:**
- **Frontend**: Next.js 15.3.5 (port 8080)
- **Backend**: Express.js + TypeScript (port 3001)
- **Database**: SQLite
- **Deployment**: Railway
- **Domain**: Cloudflare (labubu-collectibles.com)

### 📁 **Key Files Modified:**
- `backend/db.ts` - Added emailVerified column
- `backend/seed-data.ts` - Integrated admin user creation
- `backend/package.json` - Version 0.0.13, postinstall script
- `frontend/next.config.ts` - API rewrites for images
- `backend/app.ts` - CORS, static file serving
- `scripts/` - Log capture system

### 🚂 **Railway Configuration:**
- **Project**: Labubu-Collectibles
- **Repository**: https://github.com/Haoran2702/labubu-collectibles-v2
- **Services**: 
  - `labubu-backend` (port 3001)
  - `labubu-frontend` (port 8080)
- **Environment Variables**: Configured for production

### 🔍 **Log Capture System:**
- **Commands**: `npm run logs`, `npm run logs:detailed`
- **Files**: `scripts/quick-logs.sh`, `scripts/capture-logs.sh`
- **Railway CLI**: Installed and configured

## 🛠️ **Quick Commands:**

### Local Development:
```bash
# Start local servers
npm run dev:backend  # Backend on localhost:3001
cd frontend && npm run dev  # Frontend on localhost:3000

# Check health
curl http://localhost:3001/api/health
```

### Production Logs:
```bash
# Quick log capture
npm run logs

# Detailed logs
npm run logs:detailed
```

### Deployment:
```bash
# Commit and push changes
git add .
git commit -m "description"
git push

# Railway will auto-deploy (2-3 minutes)
```

## 🔄 **Development Workflow:**

### For Quick Changes:
1. **Use local development** for immediate feedback
2. **Test changes** on localhost:3000
3. **Commit and push** when satisfied
4. **Railway auto-deploys** in 2-3 minutes

### For Production Issues:
1. **Check logs**: `npm run logs`
2. **Debug locally** if needed
3. **Fix and redeploy**

## 🚨 **Troubleshooting:**

### If Local Development Fails:
```bash
# Kill existing processes
lsof -ti :3000 | xargs kill -9
lsof -ti :3001 | xargs kill -9

# Restart
npm run dev:backend
cd frontend && npm run dev
```

### If Railway Deployment Fails:
1. Check logs: `npm run logs`
2. Verify package.json version
3. Check for TypeScript errors
4. Ensure all dependencies are in package.json

### If Images Don't Load:
- Verify images exist in `backend/public/product_images/`
- Check `backend/app.ts` static file serving
- Verify `frontend/next.config.ts` rewrites

## 📞 **Emergency Contacts:**
- **Repository**: https://github.com/Haoran2702/labubu-collectibles-v2
- **Railway Dashboard**: https://railway.app/project/labubu-collectibles
- **Domain**: Cloudflare dashboard for labubu-collectibles.com

## 🎯 **Next Steps:**
1. Make changes locally for immediate feedback
2. Test thoroughly before pushing to production
3. Use log capture system for debugging
4. Keep this backup updated with major changes

---
*This backup represents the working state as of August 20, 2025. Update this file when making significant changes.*
