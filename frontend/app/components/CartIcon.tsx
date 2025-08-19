"use client";

import { useCart } from "../contexts/CartContext";
import Link from "next/link";

export default function CartIcon() {
  const { state } = useCart();
  const itemCount = state.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Link href="/cart" className="relative group">
      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-blue-50 transition-all duration-200 group-hover:scale-105">
        <svg
          className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      </div>
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-lg animate-pulse">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
} 