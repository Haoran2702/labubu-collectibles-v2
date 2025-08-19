"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LockClosedIcon } from '@heroicons/react/24/outline';
import PasswordStrengthMeter from "../../components/PasswordStrengthMeter";
import { apiCall } from '../../utils/api';

function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Password validation function
  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Password validation
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join('. '));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const res = await apiCall("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, token, newPassword }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md bg-white p-10 rounded-2xl border border-gray-100 flex flex-col items-center">
        <LockClosedIcon className="w-16 h-16 text-gray-300 mb-6" />
        <h1 className="text-3xl font-bold mb-2 text-center tracking-tight">Set a new password</h1>
        <p className="text-gray-500 text-center mb-8">Create a strong new password for your account.</p>
        {success ? (
          <div className="text-green-600 text-center font-medium py-8 text-lg">Your password has been reset. You can now <a href="/auth" className="underline underline-offset-2 text-green-700 hover:text-black">log in</a>.</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 w-full">
            <input
              type="password"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10 text-lg bg-gray-50"
              placeholder="Create a strong password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
            <PasswordStrengthMeter password={newPassword} />
            <input
              type="password"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10 text-lg bg-gray-50"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg font-semibold text-lg hover:bg-gray-900 transition"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset password"}
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

export default function ResetPasswordPageWrapper() {
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  );
} 