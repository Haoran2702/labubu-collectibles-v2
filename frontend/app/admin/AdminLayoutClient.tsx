"use client";
import { usePathname, useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";

function AdminLogoHeader() {
  const router = useRouter();
  const pathname = usePathname();
  function handleLogoClick(e: React.MouseEvent) {
    e.preventDefault();
    sessionStorage.removeItem("admin_jwt");
    router.push("/");
  }
  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 flex items-center h-16">
        <Link href="/" className="flex items-center space-x-2" onClick={handleLogoClick}>
          <svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <rect width="64" height="64" rx="12" fill="#FFD369"/>
            <text x="20" y="50" style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 44, fontWeight: 'bold', fill: '#222831' }}>L</text>
          </svg>
          <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>Labubu Collectibles</span>
        </Link>
      </div>
    </header>
  );
}

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  if (pathname === "/admin/login") {
    return <main className="flex-1">{children}</main>;
  }
  return (
    <div className="min-h-screen flex flex-col">
      {isAdminRoute ? <AdminLogoHeader /> : <Header />}
      <main className="flex-1">{children}</main>
      {!isAdminRoute && <Footer />}
    </div>
  );
} 