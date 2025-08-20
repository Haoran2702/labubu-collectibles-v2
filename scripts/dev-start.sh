#!/bin/bash

# Quick Development Start Script
echo "🚀 Starting Labubu Collectibles Local Development..."

# Kill any existing processes
echo "🔄 Cleaning up existing processes..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
lsof -ti :3001 | xargs kill -9 2>/dev/null || true

# Start backend
echo "🔧 Starting backend on localhost:3001..."
npm run dev:backend &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend on localhost:3000..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

echo ""
echo "✅ Development servers started!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:3001"
echo "🏥 Health Check: http://localhost:3001/api/health"
echo ""
echo "💡 Press Ctrl+C to stop both servers"
echo ""

# Wait for user to stop
wait
