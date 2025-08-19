"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';

function RegistrationSuccessContent() {
  const [email, setEmail] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [cooldownTimer, setCooldownTimer] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { resendVerification } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // If no email parameter, redirect to auth page
      router.push('/auth');
    }
  }, [searchParams, router]);

  const handleResendVerification = async () => {
    if (!email || cooldownTimer > 0) return;
    
    setResendingVerification(true);
    try {
      const result = await resendVerification(email);
      if (result.success) {
        addToast({
          type: 'success',
          title: 'Verification email sent',
          message: result.message || 'Please check your email for the new verification link.'
        });
        // Start cooldown timer (60 seconds)
        setCooldownTimer(60);
      } else {
        addToast({
          type: 'error',
          title: 'Failed to send verification email',
          message: result.error || 'Please try again later.'
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setResendingVerification(false);
    }
  };

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownTimer > 0) {
      const timer = setTimeout(() => {
        setCooldownTimer(cooldownTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTimer]);

  if (!email) {
    return null; // Will redirect in useEffect
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Registration Successful!</h1>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <div className="flex flex-col items-center space-y-6">
            {/* Success icon */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Welcome to Labubu Collectibles!</h2>
              <p className="text-gray-600">
                Your account has been created successfully. To complete your registration and start shopping, 
                please verify your email address.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-900">Check your email</p>
                    <p className="text-sm text-blue-700">
                      We've sent a verification link to <strong>{email}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 space-y-2">
                <p>• Click the verification link in your email</p>
                <p>• The link will expire in 24 hours</p>
                <p>• Check your spam folder if you don't see the email</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 w-full">
              <button
                onClick={handleResendVerification}
                disabled={resendingVerification || cooldownTimer > 0}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendingVerification 
                  ? 'Sending...' 
                  : cooldownTimer > 0 
                    ? `Resend in ${cooldownTimer}s` 
                    : 'Resend Verification Email'
                }
              </button>
              
              <button
                onClick={() => router.push('/auth')}
                className="w-full border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegistrationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <RegistrationSuccessContent />
    </Suspense>
  );
} 