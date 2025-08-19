"use client";
import { usePathname } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();
  const nav = [
    { href: "/admin/products", label: "Products" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/analytics", label: "Analytics" },
    { href: "/admin/marketing", label: "Marketing" },
    { href: "/admin/forecasting", label: "Forecasting" },
    { href: "/admin/security", label: "Security" },
  ];
  return (
    <nav className="w-full max-w-2xl flex gap-6 mb-8 border-b pb-2">
      {nav.map(link => (
        <a
          key={link.href}
          href={link.href}
          className={
            "text-sm font-medium " +
            (pathname === link.href
              ? "underline underline-offset-4 text-black dark:text-white"
              : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white")
          }
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
} 