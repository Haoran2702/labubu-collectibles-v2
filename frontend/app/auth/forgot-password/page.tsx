"use client";
import { useState } from "react";
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { apiCall } from '../../utils/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await apiCall("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md bg-white p-10 rounded-2xl border border-gray-100 flex flex-col items-center">
        <EnvelopeIcon className="w-16 h-16 text-gray-300 mb-6" />
        <h1 className="text-3xl font-bold mb-2 text-center tracking-tight">Reset your password</h1>
        <p className="text-gray-500 text-center mb-8">Enter your email and we'll send you a link to reset your password.</p>
        {submitted ? (
          <div className="text-green-600 text-center font-medium py-8">If that email is registered, a reset link has been sent.</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 w-full">
            <input
              type="email"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10 text-lg bg-gray-50"
              placeholder="Your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg font-semibold text-lg hover:bg-gray-900 transition"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
        <div className="mt-8 text-center w-full">
          <a href="/auth" className="text-gray-400 hover:text-black text-sm underline underline-offset-2">Back to login</a>
        </div>
      </div>
    </div>
  );
} 