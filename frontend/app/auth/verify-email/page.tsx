"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';

function VerifyEmailContent() {
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [cooldownTimer, setCooldownTimer] = useState(0);
  const hasVerified = useRef(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyEmail, resendVerification } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');

    if (!emailParam || !tokenParam) {
      setVerificationStatus('error');
      setMessage('Invalid verification link. Please check your email for the correct link.');
      setLoading(false);
      return;
    }

    setEmail(emailParam);

    const verify = async () => {
      // Prevent double execution in React StrictMode
      if (hasVerified.current) {
        return;
      }
      hasVerified.current = true;

      try {
        console.log('Starting email verification...');
        const result = await verifyEmail(emailParam, tokenParam);
        
        if (result.success) {
          console.log('Verification successful');
          setVerificationStatus('success');
          setMessage(result.message || 'Email verified successfully!');
          addToast({
            type: 'success',
            title: 'Email Verified!',
            message: 'You can now log in to your account.'
          });
        } else {
          console.log('Verification failed:', result.error);
          setVerificationStatus('error');
          setMessage(result.error || 'Email verification failed.');
        }
      } catch (error) {
        console.log('Verification error:', error);
        setVerificationStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [searchParams, verifyEmail, router, addToast]);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Email Verification</h1>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          {loading && (
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="text-gray-600">Verifying your email...</p>
            </div>
          )}

                     {!loading && verificationStatus === 'success' && (
             <div className="flex flex-col items-center space-y-6">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                 <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
               </div>
               <div className="text-center space-y-3">
                 <h2 className="text-xl font-semibold text-gray-900">Email Verified!</h2>
                 <p className="text-gray-600">{message}</p>
                 <p className="text-sm text-gray-500">You're all set! You can now log in to your account and start exploring Labubu Collectibles.</p>
               </div>
               
               <button
                 onClick={() => router.push('/auth')}
                 className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
               >
                 Continue to Login
               </button>
             </div>
           )}

          {!loading && verificationStatus === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Verification Failed</h2>
              <p className="text-gray-600">{message}</p>
              
                             {email && (
                 <div className="space-y-4 w-full">
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
} 