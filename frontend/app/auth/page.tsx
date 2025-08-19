"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import Link from 'next/link';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Store previous path if not already on /auth
  useEffect(() => {
    if (pathname !== '/auth') {
      sessionStorage.setItem('redirectAfterLogin', pathname);
    }
  }, [pathname]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (
        redirectPath &&
        redirectPath !== '/auth' &&
        redirectPath !== '/auth/reset-password'
      ) {
        router.push(redirectPath);
        sessionStorage.removeItem('redirectAfterLogin');
      } else {
        router.push('/');
      }
    }
  }, [user, loading, router]);
  if (user && !loading) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md w-full px-4 py-16 mx-auto">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <svg width="48" height="48" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              <rect width="64" height="64" rx="12" fill="#FFD369"/>
              <text x="20" y="50" style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 44, fontWeight: 'bold', fill: '#222831' }}>L</text>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Sign In to Labubu Collectibles</h1>
          <p className="text-gray-500 text-base">Access your account or register below.</p>
        </div>

        {/* Auth Forms */}
        <div className="bg-white rounded-xl border border-gray-100 p-8 mb-6">
          {isLogin ? (
            <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
} 