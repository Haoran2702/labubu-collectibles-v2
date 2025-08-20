"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/Toast";
import { apiCall } from '../../utils/api';

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    try {
      const token = sessionStorage.getItem("admin_jwt");
      if (token) {
        // Basic validation - check if token looks like a JWT
        if (token.includes('.') && token.split('.').length === 3) {
          router.replace("/admin/products");
          return;
        } else {
          // Invalid token format, clean it up
          sessionStorage.removeItem("admin_jwt");
        }
      }
      setAuthChecked(true);
    } catch (error) {
      console.error('Error checking admin auth:', error);
      sessionStorage.removeItem("admin_jwt");
      setAuthChecked(true);
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiCall("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      
      // Check if user is admin
      if (data.user?.role !== 'admin') {
        throw new Error("Access denied. Admin privileges required.");
      }
      
      // Clean up any existing tokens
      localStorage.removeItem("admin_jwt");
      sessionStorage.removeItem("admin_jwt");
      sessionStorage.removeItem("admin_auth_verified");
      
      // Store the new token in sessionStorage
      sessionStorage.setItem("admin_jwt", data.token);
      
      // Show success toast
      addToast({
        type: 'success',
        title: 'Login Successful',
        message: `Welcome back, ${data.user.firstName}!`
      });
      
      router.push("/admin/products");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-gray-900 mb-4 tracking-tight">Admin Login</h1>
          <p className="text-gray-500 text-lg">Access the admin dashboard</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-black text-white font-medium text-lg hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm font-medium text-center">{error}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 text-sm">
            Admin access only. Authorized personnel required.
          </p>
        </div>
      </div>
    </div>
  );
} 