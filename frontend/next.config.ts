import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Development optimizations to prevent build issues
  experimental: {
    // Improve build stability
    optimizePackageImports: ['@heroicons/react'],
  },
  
  // Webpack configuration for better development experience
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Improve hot reloading stability
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    return [
      {
        source: '/api/orders/:path*',
        destination: `${apiUrl}/api/orders/:path*`,
      },
      {
        source: '/api/products/:path*',
        destination: `${apiUrl}/api/products/:path*`,
      },
      {
        source: '/api/auth/:path*',
        destination: `${apiUrl}/api/auth/:path*`,
      },
      {
        source: '/api/payments/:path*',
        destination: `${apiUrl}/api/payments/:path*`,
      },
      {
        source: '/api/support/:path*',
        destination: `${apiUrl}/api/support/:path*`,
      },
      {
        source: '/api/forecasting/:path*',
        destination: `${apiUrl}/api/forecasting/:path*`,
      },
      {
        source: '/api/privacy/:path*',
        destination: `${apiUrl}/api/privacy/:path*`,
      },
      {
        source: '/api/users/:path*',
        destination: `${apiUrl}/api/users/:path*`,
      },
      {
        source: '/api/currency/:path*',
        destination: `${apiUrl}/api/currency/:path*`,
      },
      {
        source: '/api/reviews/:path*',
        destination: `${apiUrl}/api/reviews/:path*`,
      },
      {
        source: '/api/analytics/:path*',
        destination: `${apiUrl}/api/analytics/:path*`,
      },
      {
        source: '/api/marketing/:path*',
        destination: `${apiUrl}/api/marketing/:path*`,
      },
    ];
  },
};

export default nextConfig;
