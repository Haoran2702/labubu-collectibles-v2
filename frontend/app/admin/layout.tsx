"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const adminNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/marketing", label: "Marketing" },
  { href: "/admin/forecasting", label: "Forecasting" },
  { href: "/admin/support", label: "Support" },
];

// Helper to decode JWT and get exp
function getTokenExpiration(token: string): number | null {
  try {
    // Check if token has the correct format
    if (!token || typeof token !== 'string' || !token.includes('.')) {
      console.log('DEBUG: Invalid token format');
      return null;
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('DEBUG: Token doesn\'t have 3 parts');
      return null;
    }
    
    // Decode the payload part
    const payload = JSON.parse(atob(parts[1]));
    console.log('DEBUG: JWT payload:', payload);
    
    // Check for exp field, but don't fail if it's missing
    if (payload.exp) {
      const expiration = payload.exp * 1000;
      console.log('DEBUG: Token expires at:', new Date(expiration));
      return expiration;
    } else {
      console.log('DEBUG: No exp field in JWT payload, assuming valid for 30 minutes');
      // If no exp field, assume token is valid for 30 minutes from now
      return Date.now() + (30 * 60 * 1000);
    }
  } catch (error) {
    console.warn('Failed to parse JWT token:', error);
    return null;
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);

  function getToken() {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("admin_jwt") || "";
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const checkAuth = async () => {
      try {
        const token = getToken();
        
        if (!token) {
          console.log('DEBUG: No token found, redirecting to login');
          router.replace("/admin/login");
          return;
        }
        
        // First check if token has basic JWT format
        const exp = getTokenExpiration(token);
        const now = Date.now();
        
        if (!exp || exp <= now) {
          console.log('DEBUG: Token expired or invalid, redirecting to login');
          sessionStorage.removeItem("admin_jwt");
          localStorage.removeItem("admin_jwt");
          router.replace("/admin/login");
          return;
        }
        
        // Additional check: verify token with backend
        try {
          const response = await fetch('/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            if (userData.user?.role === 'admin') {
              console.log('DEBUG: Admin authentication successful');
              setAuthChecked(true);
              return;
            } else {
              console.log('DEBUG: User is not admin');
            }
          } else {
            console.log('DEBUG: Profile API returned error:', response.status);
          }
        } catch (profileError) {
          console.log('DEBUG: Profile API call failed:', profileError);
        }
        
        // If we get here, authentication failed
        console.log('DEBUG: Authentication failed, redirecting to login');
        sessionStorage.removeItem("admin_jwt");
        localStorage.removeItem("admin_jwt");
        router.replace("/admin/login");
        
      } catch (error) {
        console.error('Error during admin auth check:', error);
        sessionStorage.removeItem("admin_jwt");
        localStorage.removeItem("admin_jwt");
        router.replace("/admin/login");
      }
    };
    
    checkAuth();
  }, [router]);

  // Allow /admin/login to render without token check or nav
  if (pathname.startsWith("/admin/login")) {
    return <main className="max-w-4xl mx-auto px-4">{children}</main>;
  }

  function logout() {
    sessionStorage.removeItem("admin_jwt");
    localStorage.removeItem("admin_jwt"); // Clean up localStorage too
    router.push("/admin/login");
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <nav className="w-full max-w-4xl mx-auto flex gap-6 mb-8 border-b pb-2 px-4 pt-6">
        {adminNav.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={
              "text-sm font-medium " +
              (pathname === link.href
                ? "underline underline-offset-4 text-black"
                : "text-gray-500 hover:text-black")
            }
          >
            {link.label}
          </Link>
        ))}
        <button onClick={logout} className="ml-auto text-sm underline">Logout</button>
      </nav>
      <main className="max-w-4xl mx-auto px-4">{children}</main>
    </div>
  );
} 