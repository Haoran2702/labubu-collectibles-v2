"use client";

import { useState, useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import countries from "../utils/countries";
import StripePayment from "../components/StripePayment";
import { useToast } from "../components/Toast";
import PayPalSection from "../components/PayPalSection";
import { apiCall } from '../utils/api';

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

interface Address {
  id: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: number;
}

export default function CheckoutWithPaymentPage() {
  const { state, clearCart, updateQuantity } = useCart();
  const { user, updateProfile, getAddresses, addAddress } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (user === null) {
      // User is not authenticated, redirect to login
      addToast({
        type: 'info',
        title: 'Login Required',
        message: 'Please log in to proceed with checkout.'
      });
      router.push('/auth');
    }
  }, [user, router, addToast]);

  // Show loading while checking authentication
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Don't render checkout if user is not authenticated
  if (!user) {
    return null;
  }
  

  
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockIssues, setStockIssues] = useState<any[]>([]);
  const [reservationExpiry, setReservationExpiry] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [cartHash, setCartHash] = useState<string>('');

  // Restore checkout state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Small delay to ensure component is fully mounted
      setTimeout(() => {
        const saved = localStorage.getItem('checkout_reservation');
        
        if (saved) {
          try {
            const data = JSON.parse(saved);
            const expiry = new Date(data.expiresAt);
            
            // Only restore if reservation hasn't expired and cart hasn't changed
            // Wait for cart to be loaded before checking hash
            if (expiry > new Date() && state.items.length > 0) {
              const currentCartHash = generateCartHash(state.items);
              if (data.cartHash === currentCartHash) {
                setReservationExpiry(expiry);
                setShowPayment(true);
                setCartHash(currentCartHash);
                
                // Restore shipping info if available
                if (data.shippingInfo) {
                  setShippingInfo(data.shippingInfo);
                }
              } else {
                // Cart has changed, clean up reservation
                localStorage.removeItem('checkout_reservation');
              }
            } else if (expiry <= new Date()) {
              // Clean up expired reservation
              localStorage.removeItem('checkout_reservation');
            }
          } catch (error) {
            console.error('Error restoring checkout state:', error);
            localStorage.removeItem('checkout_reservation');
          }
        }
      }, 100); // 100ms delay
    }
  }, [state.items]); // Add state.items as dependency

  // Autofill profile data when user loads
  useEffect(() => {
    if (user) {
      setShippingInfo((prev) => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  // Monitor cart changes and reset reservation if cart changes
  useEffect(() => {
    // Only monitor changes if we have items in cart and a reservation
    if (state.items.length === 0 || !reservationExpiry) {
      setCartHash(generateCartHash(state.items));
      return;
    }

    const newCartHash = generateCartHash(state.items);
    
    // If cart hash changed and we have an active reservation, reset it
    if (cartHash && cartHash !== newCartHash && reservationExpiry) {
      console.log('Cart changed, resetting reservation');
      resetReservation();
      addToast({
        type: 'warning',
        title: 'Cart Updated',
        message: 'Your cart has changed. Please proceed to payment again to reserve stock.'
      });
    }
    
    setCartHash(newCartHash);
  }, [state.items, cartHash, reservationExpiry, addToast]);

  // Save shipping info to localStorage when it changes (if we have a reservation)
  useEffect(() => {
    if (typeof window !== 'undefined' && reservationExpiry) {
      const saved = localStorage.getItem('checkout_reservation');
      if (saved) {
        const data = JSON.parse(saved);
        data.shippingInfo = shippingInfo;
        localStorage.setItem('checkout_reservation', JSON.stringify(data));
      }
    }
  }, [shippingInfo, reservationExpiry]);

  // Fetch addresses on mount
  useEffect(() => {
    if (user) {
      getAddresses().then(addrs => setAddresses(addrs));
    }
  }, [user]);

  // Cleanup stock reservation when component unmounts or page is unloaded
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Release stock reservation when user leaves the page
      if (reservationExpiry) {
        // We could implement a more sophisticated cleanup here
        // For now, the reservation will expire naturally after 15 minutes
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [reservationExpiry]);

  // Countdown timer for stock reservation
  useEffect(() => {
    if (!reservationExpiry) return;

    // Calculate initial time immediately
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = reservationExpiry.getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeLeft('Expired');
        setReservationExpiry(null);
        setShowPayment(false);
        // Clear expired reservation from localStorage
        localStorage.removeItem('checkout_reservation');
        // Optionally show a message that reservation expired
        addToast({
          type: 'error',
          title: 'Reservation Expired',
          message: 'Your stock reservation has expired. Please refresh the page to continue.'
        });
        return null;
      }

      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      const newTimeLeft = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      setTimeLeft(newTimeLeft);
      return difference;
    };

    // Set initial time immediately
    const initialDifference = calculateTimeLeft();
    if (initialDifference === null) return; // Already expired

    // Then start the interval for updates
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [reservationExpiry, addToast]);



  // When selecting an address, prefill the form
  useEffect(() => {
    if (selectedAddressId && addresses.length) {
      const addr = addresses.find(a => a.id === selectedAddressId);
      if (addr) {
        const [first, ...rest] = (addr.name || '').split(' ');
        setShippingInfo({
          firstName: first || user?.firstName || '',
          lastName: rest.join(' ') || user?.lastName || '',
          email: user?.email || '',
          phone: addr.phone || '',
          address: addr.address || '',
          city: addr.city || '',
          state: addr.state || '',
          zipCode: addr.zip || '',
          country: addr.country || 'United States',
        });
      }
    }
  }, [selectedAddressId, addresses, user]);

  // Validation helpers
  const validate = () => {
    const errs: { [key: string]: string } = {};
    const trimmedPhone = shippingInfo.phone.trim();
    
    if (!shippingInfo.firstName) errs.firstName = "First name is required";
    if (!shippingInfo.lastName) errs.lastName = "Last name is required";
    if (!shippingInfo.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(shippingInfo.email)) errs.email = "Valid email required";
    if (!trimmedPhone || !/^\+?[0-9\s-]+$/.test(trimmedPhone)) errs.phone = "Valid phone required";
    if (!shippingInfo.address) errs.address = "Address is required";
    if (!shippingInfo.city) errs.city = "City is required";
    if (shippingInfo.country === 'United States' && !shippingInfo.zipCode) errs.zipCode = "ZIP code required";
    if (!shippingInfo.country) errs.country = "Country required";
    
    // State/Province required only for certain countries
    const needsState = ["United States", "Canada", "Australia", "India", "Brazil", "Mexico"];
    if (needsState.includes(shippingInfo.country) && !shippingInfo.state) errs.state = "State/Province required";
    
    return errs;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Generate session ID for stock reservation
  const generateSessionId = () => {
    return `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Generate cart hash to detect changes
  const generateCartHash = (items: any[]) => {
    return items.map(item => `${item.id}:${item.quantity}`).join('|');
  };

  // Reset reservation when cart changes
  const resetReservation = () => {
    setReservationExpiry(null);
    setTimeLeft('');
    setShowPayment(false);
    localStorage.removeItem('checkout_reservation');
  };

  // Stock validation and reservation function
  const validateAndReserveStock = async () => {
    try {
      const sessionId = generateSessionId();
      
      
      // First check stock availability
      const checkResponse = await fetch('/api/products/check-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: state.items.map(item => ({
            productId: item.id,
            quantity: item.quantity
          }))
        })
      });

      if (!checkResponse.ok) {
        throw new Error(`HTTP error! status: ${checkResponse.status}`);
      }

      const stockCheck = await checkResponse.json();
      
      if (!stockCheck.allAvailable) {
        const issues = stockCheck.stockChecks
          .filter((check: any) => !check.available)
          .map((check: any) => {
            const cartItem = state.items.find(item => item.id === check.productId);
            return {
              ...check,
              name: cartItem?.name || 'Unknown Product',
              price: cartItem?.price || 0,
              requestedQuantity: cartItem?.quantity || 0
            };
          });
        
        setStockIssues(issues);
        return { success: false, sessionId: null };
      }
      
      // Reserve stock for 15 minutes
      const reservePayload = {
        items: state.items.map(item => ({
          productId: item.id,
          quantity: item.quantity
        })),
        sessionId
      };
      
      const reserveResponse = await fetch('/api/products/reserve-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservePayload)
      });

      if (!reserveResponse.ok) {
        const errorData = await reserveResponse.json();
        addToast({
          type: 'error',
          title: 'Stock Reservation Failed',
          message: errorData.error || 'Unable to reserve stock. Please try again.'
        });
        return { success: false, sessionId: null };
      }
      
      const reserveData = await reserveResponse.json();
      
      // Set the reservation expiry time for the countdown timer
      const expiryDate = new Date(reserveData.expiresAt);
      setReservationExpiry(expiryDate);
      
      // Save reservation to localStorage for persistence across page reloads
      const reservationData = {
        sessionId,
        expiresAt: reserveData.expiresAt,
        cartHash: generateCartHash(state.items),
        items: state.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        shippingInfo: {
          firstName: shippingInfo.firstName,
          lastName: shippingInfo.lastName,
          email: shippingInfo.email,
          phone: shippingInfo.phone,
          address: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.zipCode,
          country: shippingInfo.country
        }
      };
      try {
        localStorage.setItem('checkout_reservation', JSON.stringify(reservationData));
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
      
      return { success: true, sessionId };
    } catch (error) {
      console.error('Stock validation and reservation failed:', error);
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Unable to validate stock availability. Please try again.'
      });
      return { success: false, sessionId: null };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setErrors({});

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setLoading(false);
      return;
    }

    // Validate and reserve stock before proceeding to payment
    const stockResult = await validateAndReserveStock();
    if (!stockResult.success) {
      setShowStockModal(true);
      setLoading(false);
      return;
    }

    // If user selected a saved address, use its data for the order
    if (user && selectedAddressId) {
      const addr = addresses.find(a => a.id === selectedAddressId);
      if (addr) {
        const [first, ...rest] = (addr.name || '').split(' ');
        setShippingInfo({
          firstName: first || user.firstName || '',
          lastName: rest.join(' ') || user.lastName || '',
          email: user.email || '',
          phone: addr.phone || '',
          address: addr.address || '',
          city: addr.city || '',
          state: addr.state || '',
          zipCode: addr.zip || '',
          country: addr.country || 'United States',
        });
      }
    }

    // If user is adding a new address and wants to save it
    if (user && selectedAddressId === null && saveNewAddress) {
      await addAddress({
        name: shippingInfo.firstName,
        phone: shippingInfo.phone,
        address: shippingInfo.address,
        city: shippingInfo.city,
        state: shippingInfo.state,
        zip: shippingInfo.zipCode,
        country: shippingInfo.country,
        label: 'Saved',
      });
      // Refresh address list
      const addrs = await getAddresses();
      setAddresses(addrs);
      setSaveNewAddress(false);
    }

    // Show payment form
    setShowPayment(true);
    setLoading(false);
  };

  const handleStockModalConfirm = async () => {
    setLoading(true);
    
    // Update cart with available quantities
    stockIssues.forEach(issue => {
      if (issue.currentStock > 0) {
        updateQuantity(issue.productId, issue.currentStock);
      } else {
        updateQuantity(issue.productId, 0); // Remove from cart
      }
    });
    
    setShowStockModal(false);
    setStockIssues([]);
    
    addToast({
      type: 'success',
      title: 'Cart Updated',
      message: 'Your cart has been updated with available quantities.'
    });
    
    // Continue directly to payment since we've already validated the stock
    setShowPayment(true);
    setLoading(false);
  };

  const handleStockModalCancel = () => {
    setShowStockModal(false);
    setStockIssues([]);
    setLoading(false);
  };

  // Build orderData for payment (for Stripe and PayPal initial intent)
  let orderShipping = { ...shippingInfo };
  if (user && selectedAddressId) {
    const addr = addresses.find(a => a.id === selectedAddressId);
    if (addr) {
      orderShipping = {
        firstName: addr.name || user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: addr.phone || '',
        address: addr.address || '',
        city: addr.city || '',
        state: addr.state || '',
        zipCode: addr.zip || '',
        country: addr.country || 'United States',
      };
    }
  }
  const orderData = {
    id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    items: state.items,
    total: state.total,
    shippingInfo: orderShipping,
    orderDate: new Date().toISOString(),
  };

  // Handle payment success
  const handlePaymentSuccess = async (paymentIntentId: string, orderData: any) => {
    setLoading(true);
    try {
      // Confirm payment and create order
      const token = localStorage.getItem('authToken');
      const response = await apiCall('/api/payments/confirm-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentIntentId,
          orderData,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Save shipping info to profile if logged in
        if (user) {
          await updateProfile(
            shippingInfo.firstName,
            shippingInfo.lastName,
            shippingInfo.email
          );
        }
        
        // Clear the reservation timer since order is successful
        setReservationExpiry(null);
        setTimeLeft('');
        setShowPayment(false);
        // Clear reservation from localStorage after a short delay (for testing)
        setTimeout(() => {
          localStorage.removeItem('checkout_reservation');
        }, 2000); // 2 second delay
        
        addToast({
          type: 'success',
          title: 'Order Placed Successfully!',
          message: 'Your order has been confirmed and payment processed.',
        });
        clearCart();
        router.push(`/order-confirmation/${result.orderId}`);
      } else {
        throw new Error('Failed to confirm payment');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      addToast({
        type: 'error',
        title: 'Order Error',
        message: 'There was an error processing your order. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle PayPal payment success
  const handlePayPalSuccess = async (details: any) => {
    setLoading(true);
    try {
      // Add PayPal order ID to orderData for backend
      const orderDataWithPayPal = {
        ...orderData,
        paypalOrderId: details?.details?.id || details?.details?.orderID || undefined,
      };
      const token = localStorage.getItem('authToken');
      const response = await apiCall('/api/payments/paypal-capture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderID: details?.details?.id || details?.details?.orderID,
          orderData: orderDataWithPayPal,
        }),
      });
      if (response.ok) {
        const result = await response.json();
        if (user) {
          await updateProfile(
            shippingInfo.firstName,
            shippingInfo.lastName,
            shippingInfo.email
          );
        }
        
        // Clear the reservation timer since order is successful
        setReservationExpiry(null);
        setTimeLeft('');
        setShowPayment(false);
        // Clear reservation from localStorage after a short delay (for testing)
        setTimeout(() => {
          localStorage.removeItem('checkout_reservation');
        }, 2000); // 2 second delay
        
        addToast({
          type: 'success',
          title: 'Order Placed Successfully!',
          message: 'Your order has been confirmed and payment processed.',
        });
        clearCart();
        router.push(`/order-confirmation/${result.orderId}`);
      } else {
        throw new Error('Failed to confirm PayPal payment');
      }
    } catch (error) {
      console.error('Error confirming PayPal payment:', error);
      addToast({
        type: 'error',
        title: 'Order Error',
        message: 'There was an error processing your PayPal order. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    setShowPayment(false);
    
    // Clear the reservation timer since payment failed
    setReservationExpiry(null);
    setTimeLeft('');
    setShowPayment(false);
    // Clear reservation from localStorage
    localStorage.removeItem('checkout_reservation');
    
    addToast({
      type: 'error',
      title: 'Payment Failed',
      message: error,
    });
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Checkout</h1>
            <p className="text-gray-600 mb-8">Your cart is empty</p>
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
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
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">Checkout</h1>
          <p className="text-xl text-gray-500 mb-8">Enter your shipping details and complete your order.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Address, Shipping, Payment (2/3 width on desktop) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Saved Addresses */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Saved Addresses</h2>
              <div className="space-y-4 mb-4">
                {addresses.map(addr => (
                  <div key={addr.id} className={`border p-4 rounded-lg shadow-sm flex flex-col gap-1 ${selectedAddressId === addr.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{addr.name}</span>
                      {addr.isDefault === 1 && <span className="text-xs text-blue-500 ml-2">Default</span>}
                    </div>
                    <div className="text-sm text-gray-700">{addr.address}, {addr.city}, {addr.state} {addr.zip}, {addr.country}</div>
                    <div className="text-sm text-gray-500">{addr.phone}</div>
                    <button
                      type="button"
                      className={`mt-2 px-3 py-1 rounded text-sm ${selectedAddressId === addr.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}`}
                      onClick={(e) => { 
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedAddressId(addr.id); 
                        setSaveNewAddress(false); 
                      }}
                    >
                      {selectedAddressId === addr.id ? 'Selected' : 'Select'}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Shipping Form & Payment */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6" onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                  e.preventDefault();
                }
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      value={shippingInfo.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.firstName && <div className="text-red-500 text-xs mt-1">{errors.firstName}</div>}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      value={shippingInfo.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.lastName && <div className="text-red-500 text-xs mt-1">{errors.lastName}</div>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={shippingInfo.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      value={shippingInfo.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.phone && <div className="text-red-500 text-xs mt-1">{errors.phone}</div>}
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    required
                    value={shippingInfo.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.address && <div className="text-red-500 text-xs mt-1">{errors.address}</div>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      required
                      value={shippingInfo.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.city && <div className="text-red-500 text-xs mt-1">{errors.city}</div>}
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State/Province
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={shippingInfo.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.state && <div className="text-red-500 text-xs mt-1">{errors.state}</div>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shippingInfo.country === 'United States' && (
                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        required
                        value={shippingInfo.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.zipCode && <div className="text-red-500 text-xs mt-1">{errors.zipCode}</div>}
                    </div>
                  )}
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <select
                      id="country"
                      name="country"
                      required
                      value={shippingInfo.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {countries.map((c: string) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {errors.country && <div className="text-red-500 text-xs mt-1">{errors.country}</div>}
                  </div>
                </div>

                {selectedAddressId === null && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="saveNewAddress"
                      checked={saveNewAddress}
                      onChange={e => setSaveNewAddress(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="saveNewAddress" className="text-sm text-gray-700">Save this address for future use</label>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Validating...' : 'Continue to Payment'}
                  </button>
                </div>
              </form>

              {/* Stock Reservation Timer - Always visible when reservation exists */}
              {reservationExpiry && timeLeft && (
                <div className={`mt-6 p-4 border-2 rounded-lg transition-all duration-300 ${
                  timeLeft === 'Expired' 
                    ? 'bg-red-50 border-red-300 animate-pulse' 
                    : timeLeft.includes(':') && parseInt(timeLeft.split(':')[0]) < 5
                    ? 'bg-red-50 border-red-400 animate-pulse' 
                    : timeLeft.includes(':') && parseInt(timeLeft.split(':')[0]) < 10
                    ? 'bg-orange-50 border-orange-400 animate-pulse'
                    : 'bg-blue-50 border-blue-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full animate-pulse ${
                        timeLeft === 'Expired' 
                          ? 'bg-red-500' 
                          : timeLeft.includes(':') && parseInt(timeLeft.split(':')[0]) < 5
                          ? 'bg-red-500' 
                          : timeLeft.includes(':') && parseInt(timeLeft.split(':')[0]) < 10
                          ? 'bg-orange-500'
                          : 'bg-blue-500'
                      }`}></div>
                      <div>
                        <span className={`text-sm font-semibold ${
                          timeLeft === 'Expired' 
                            ? 'text-red-900' 
                            : timeLeft.includes(':') && parseInt(timeLeft.split(':')[0]) < 5
                            ? 'text-red-900' 
                            : timeLeft.includes(':') && parseInt(timeLeft.split(':')[0]) < 10
                            ? 'text-orange-900'
                            : 'text-blue-900'
                        }`}>
                          {timeLeft === 'Expired' 
                            ? '⏰ RESERVATION EXPIRED!' 
                            : timeLeft.includes(':') && parseInt(timeLeft.split(':')[0]) < 5
                            ? '🚨 URGENT: Complete your order now!'
                            : timeLeft.includes(':') && parseInt(timeLeft.split(':')[0]) < 10
                            ? '⚠️ Time is running out!'
                            : '⏱️ Your items are reserved for:'
                          }
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-black tracking-wider ${
                        timeLeft === 'Expired' 
                          ? 'text-red-600' 
                          : timeLeft.includes(':') && parseInt(timeLeft.split(':')[0]) < 5
                          ? 'text-red-600 animate-pulse' 
                          : timeLeft.includes(':') && parseInt(timeLeft.split(':')[0]) < 10
                          ? 'text-orange-600'
                          : 'text-blue-600'
                      }`}>
                        {timeLeft}
                      </div>
                      <div className={`text-xs font-medium ${
                        timeLeft === 'Expired' 
                          ? 'text-red-700' 
                          : timeLeft.includes(':') && parseInt(timeLeft.split(':')[0]) < 5
                          ? 'text-red-700' 
                          : timeLeft.includes(':') && parseInt(timeLeft.split(':')[0]) < 10
                          ? 'text-orange-700'
                          : 'text-blue-700'
                      }`}>
                        {timeLeft === 'Expired' 
                          ? 'Reservation lost - refresh to continue'
                          : timeLeft.includes(':') && parseInt(timeLeft.split(':')[0]) < 5
                          ? 'Complete payment immediately!'
                          : timeLeft.includes(':') && parseInt(timeLeft.split(':')[0]) < 10
                          ? 'Hurry up - time is running out!'
                          : 'Complete your order before time expires'
                        }
                      </div>
                    </div>
                  </div>
                  
                  {/* Show refresh button when expired */}
                  {timeLeft === 'Expired' && (
                    <div className="mt-4 pt-4 border-t border-red-200">
                      <div className="text-center">
                        <p className="text-sm text-red-700 mb-3">
                          Your stock reservation has expired. Items may no longer be available.
                        </p>
                        <button
                          type="button"
                          onClick={() => window.location.reload()}
                          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                          🔄 Refresh Page & Check Availability
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Section */}
              {showPayment && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
                  {typeof orderData.total !== 'number' || isNaN(orderData.total) || orderData.total <= 0 ? (
                    <div className="text-red-600 font-semibold mb-4">
                      Order total is invalid. Please check your cart before proceeding to payment.
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 flex gap-4">
                        <button
                          type="button"
                          className={`px-4 py-2 rounded-lg border transition-colors ${paymentMethod === 'stripe' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPaymentMethod('stripe');
                          }}
                        >
                          Pay with Card (Stripe)
                        </button>
                        <button
                          type="button"
                          className={`px-4 py-2 rounded-lg border transition-colors ${paymentMethod === 'paypal' ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-white text-gray-700 border-gray-300 hover:bg-yellow-100'}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPaymentMethod('paypal');
                          }}
                        >
                          Pay with PayPal
                        </button>
                      </div>
                      {paymentMethod === 'stripe' && user && (
                        <StripePayment
                          amount={state.total}
                          orderData={orderData}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                        />
                      )}
                      {paymentMethod === 'paypal' && user && (
                        <PayPalSection
                          amount={state.total}
                          orderData={orderData}
                          onSuccess={handlePayPalSuccess}
                          onError={handlePaymentError}
                        />
                      )}
                      {!user && (
                        <div className="text-center py-8">
                          <p className="text-gray-600 mb-4">Please log in to complete your payment.</p>
                          <Link
                            href="/auth"
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                          >
                            Log In
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Right: Order Summary (1/3 width on desktop) */}
          <div className="bg-white shadow-sm rounded-lg p-6 h-fit">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
            <div className="space-y-4">
              {state.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span>${state.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Issues Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-lg w-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Stock Availability Update</h3>
            <p className="text-gray-600 mb-4">
              Some items in your cart have limited availability. We can update your cart with the available quantities:
            </p>
            
            <div className="space-y-3 mb-6">
              {stockIssues.map((issue, index) => (
                <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="font-medium text-gray-900">{issue.name}</p>
                  <p className="text-sm text-gray-700 mt-1">
                    You wanted: <span className="font-semibold">{issue.requestedQuantity}</span>, 
                    Available: <span className="font-semibold">{issue.currentStock}</span>
                  </p>
                  {issue.currentStock > 0 ? (
                    <p className="text-xs text-orange-700 mt-1">
                      We'll update your cart to {issue.currentStock} item{issue.currentStock !== 1 ? 's' : ''}
                    </p>
                  ) : (
                    <p className="text-xs text-red-600 mt-1">
                      This item is out of stock and will be removed from your cart
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={handleStockModalCancel}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Go Back to Cart
              </button>
              <button
                type="button"
                onClick={handleStockModalConfirm}
                className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Continue with Available Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 