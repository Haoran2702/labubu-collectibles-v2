#!/bin/bash

echo "🔄 Restarting development servers..."

# Kill any existing processes on ports 3000 and 3001
echo "📴 Stopping existing servers..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
lsof -ti :3001 | xargs kill -9 2>/dev/null || true
pkill -f 'next' || true
pkill -f 'node.*www.js' || true

# Wait a moment for processes to fully stop
sleep 2

# Clear Next.js cache
echo "🧹 Clearing Next.js cache..."
cd frontend
rm -rf .next
cd ..

# Build backend
echo "🔨 Building backend..."
cd backend
npm run build
cd ..

echo "✅ Ready to start servers!"
echo ""
echo "To start the servers, run these commands in separate terminals:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend && NODE_ENV=development node dist/bin/www.js"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend && npm run dev"
echo ""
echo "Or use the npm scripts:"
echo "  npm run dev:backend"
echo "  npm run dev:frontend" 