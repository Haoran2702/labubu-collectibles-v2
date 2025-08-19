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
      return null;
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode the payload part
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp ? payload.exp * 1000 : null;
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
    
    try {
      const token = getToken();
      const exp = token ? getTokenExpiration(token) : null;
      const now = Date.now();
      
      if (!token || !exp || exp <= now) {
        // Clean up any invalid tokens
        sessionStorage.removeItem("admin_jwt");
        localStorage.removeItem("admin_jwt"); // Clean up localStorage too
        router.replace("/admin/login");
      } else {
        setAuthChecked(true);
      }
    } catch (error) {
      console.error('Error during admin auth check:', error);
      // Clean up and redirect on any error
      sessionStorage.removeItem("admin_jwt");
      localStorage.removeItem("admin_jwt");
      router.replace("/admin/login");
    }
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