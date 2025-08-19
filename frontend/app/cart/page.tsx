"use client";

import { useCart } from "../contexts/CartContext";
import Link from "next/link";
import Image from "next/image";

export default function CartPage() {
  const { state, removeItem, updateQuantity } = useCart();

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">Your Cart</h1>
            <p className="text-xl text-gray-500 mb-12">Your cart is empty</p>
            <Link
              href="/products"
              className="inline-block px-8 py-3 rounded-full bg-black text-white font-medium transition-colors hover:bg-gray-800"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-12 tracking-tight text-center">Your Cart</h1>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {state.items.map((item) => (
              <div key={item.id} className="p-6 flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-gray-50">
                    <img
                      src={item.image || '/placeholder-product.svg'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-product.svg'; }}
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 truncate">{item.name}</h3>
                  <p className="text-lg font-semibold text-gray-500">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-gray-900 font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-red-400 hover:underline mt-2"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-8 bg-gray-50 border-t border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-medium text-gray-900">Total</span>
              <span className="text-2xl font-bold text-gray-900">${state.total.toFixed(2)}</span>
            </div>
            <div className="flex gap-4">
              <Link
                href="/products"
                className="flex-1 px-8 py-3 rounded-full border border-gray-200 text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors text-center"
              >
                Continue Shopping
              </Link>
              <Link
                href="/checkout"
                className="flex-1 px-8 py-3 rounded-full border border-transparent text-base font-medium text-white bg-black hover:bg-gray-800 transition-colors text-center"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 