"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiCall } from '../../utils/api';

interface OrderItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  collection?: string;
}

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  shippingInfo: ShippingInfo;
  orderDate: string;
  status: string;
}

export default function OrderConfirmation() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to get display name for products
  const getDisplayName = (item: OrderItem) => {
    if (item.name === 'Box' && item.collection) {
      return `${item.collection} - Blind Box`;
    }
    if (item.name.toLowerCase().includes('(secret)')) {
      // e.g. "Bul (Secret)" => "Bul - Secret"
      return item.name.replace(/\s*\(secret\)/i, ' - Secret');
    }
    return item.name;
  };

  // Use useParams hook to get the id param
  const params = useParams();
  const orderId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

  useEffect(() => {
    async function fetchOrder() {
      try {
        // Get JWT token from localStorage
        const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        const response = await apiCall(`/api/orders/${orderId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (response.ok) {
          const orderData = await response.json();
          setOrder(orderData);
        } else {
          console.error('Order not found');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    }
    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-gray-500 text-center">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">Order Not Found</h1>
            <p className="text-xl text-gray-500 mb-12">The order you're looking for doesn't exist.</p>
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-50 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">Order Confirmed!</h1>
          <p className="text-xl text-gray-500">Thank you for your purchase. Your order has been successfully placed.</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-12">
          {/* Order Header */}
          <div className="bg-gray-50 px-8 py-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <span className="block text-lg font-semibold text-gray-900">#{order.id}</span>
                <p className="text-sm text-gray-500">Placed on {formatDate(order.orderDate)}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-800">
                  {order.status}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-8">
            {/* Order Items */}
            <div>
              <h3 className="text-lg font-semibold mb-6">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-xl">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-product.svg'; }}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{getDisplayName(item)}</h4>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            {/* Shipping Information */}
            <div>
              <h3 className="text-lg font-semibold mb-6">Shipping Information</h3>
              <div className="bg-gray-50 p-6 rounded-xl">
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{order.shippingInfo.firstName} {order.shippingInfo.lastName}</p>
                  <p>{order.shippingInfo.address}</p>
                  <p>{order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.zipCode}</p>
                  <p>{order.shippingInfo.country}</p>
                  <p className="pt-2 border-t border-gray-100"><span className="font-medium">Email:</span> {order.shippingInfo.email}</p>
                  <p><span className="font-medium">Phone:</span> {order.shippingInfo.phone}</p>
                </div>
              </div>
              <div className="mt-8 p-6 bg-blue-50 rounded-xl">
                <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• You'll receive an email confirmation shortly</li>
                  <li>• We'll notify you when your order ships</li>
                  <li>• Estimated delivery: 5-7 business days</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center">
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