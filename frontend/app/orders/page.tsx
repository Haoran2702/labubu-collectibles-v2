"use client";
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useToast } from '../components/Toast';
import { useRouter } from 'next/navigation';
import Modal from '../components/Modal';
import { apiCall } from '../utils/api';

interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  userId: number;
  total: number;
  shippingInfo: any;
  orderDate: string;
  status: string;
  items: OrderItem[];
  trackingNumber?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  cancellationReason?: string;
  statusHistory?: any[];
  returnHistory?: any[];
  modificationHistory?: any[];
  createdAt: string;
  updatedAt?: string;
}

interface SortState {
  sortBy: string;
  sortOrder: string;
}

interface SupportTicket {
  id: string;
  orderId: string;
  type: string;
  status: string;
}

export default function OrdersPage() {
  const { user, token, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortedOrders, setSortedOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [sortOptions, setSortOptions] = useState<SortState>({
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  });

  const REQUEST_TYPES = [
    { value: 'return', label: 'Return' },
    { value: 'refund', label: 'Refund' },
  ];
  const REASONS = [
    'Wrong item received',
    'Item damaged/defective',
    'Changed mind',
    'Better price elsewhere',
    'Order delayed',
    'Other',
  ];

  // Define contextual reasons at the top of the component (after REASONS)
  const CANCELLATION_REASONS: string[] = [
    'Changed mind',
    'Better price elsewhere',
    'Order delayed',
    'Other',
  ];
  const RETURN_REFUND_REASONS: string[] = [
    'Wrong item received',
    'Item damaged/defective',
    'Other',
  ];

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState('return');
  const [requestReason, setRequestReason] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestItems, setRequestItems] = useState<{[productId: number]: number}>({});
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState('');
  const [requestError, setRequestError] = useState('');
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [products, setProducts] = useState<{[key: number]: {name: string, image: string, collection: string}}>({});

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) return;
    
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchOrders();
    fetchProducts();
  }, [user, router, authLoading]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      const productList = data.products || data;
      const productMap: {[key: number]: {name: string, image: string, collection: string}} = {};
      productList.forEach((product: any) => {
        productMap[product.id] = {
          name: product.name,
          image: product.imageUrl || product.image,
          collection: product.collection
        };
      });
      setProducts(productMap);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to fetch orders'
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch orders'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const res = await apiCall(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const orderDetails = await res.json();
        setSelectedOrder(orderDetails);
        setShowOrderDetails(true);
      } else {
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load order details'
        });
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load order details'
      });
    }
  };

  // Helper function to get display name for products
  const getDisplayName = (product: {name: string}, collection?: string) => {
    if (product.name === 'Box' && collection) {
      return `${collection} - Blind Box`;
    }
    if (product.name.toLowerCase().includes('(secret)')) {
      // e.g. "Bul (Secret)" => "Bul - Secret"
      return product.name.replace(/\s*\(secret\)/i, ' - Secret');
    }
    return product.name;
  };

  async function fetchSupportTickets() {
    if (!user) return;
    try {
      const token = localStorage.getItem('authToken');
      const res = await apiCall('/api/support', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setSupportTickets(data.tickets || []);
      }
    } catch {}
  }

  useEffect(() => {
    fetchSupportTickets();
    // eslint-disable-next-line
  }, [orders]);

  async function handleCancelOrder(order: Order) {
    if (!cancelReason.trim()) {
      addToast({ 
        type: 'error', 
        title: 'Error', 
        message: 'Please provide a reason for cancellation' 
      });
      return;
    }

    setCancellingOrder(order.id);
    try {
      const token = localStorage.getItem('authToken');
      const response = await apiCall(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: cancelReason }),
      });
      
      if (response.ok) {
        addToast({ 
          type: 'success', 
          title: 'Order Cancelled', 
          message: 'Your order has been cancelled successfully.' 
        });
        
        // Update order status in UI
        setOrders(prev => prev.map(o => 
          o.id === order.id 
            ? { ...o, status: 'cancelled', cancellationReason: cancelReason }
            : o
        ));
        setCancelReason('');
        setShowOrderDetails(false);
      } else {
        const errorData = await response.json();
        addToast({ 
          type: 'error', 
          title: 'Cancellation Failed', 
          message: errorData.error || 'Could not cancel order.' 
        });
      }
    } catch (err) {
      addToast({ 
        type: 'error', 
        title: 'Error', 
        message: 'An error occurred while cancelling your order.' 
      });
    } finally {
      setCancellingOrder(null);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'confirmed': return 'bg-indigo-100 text-indigo-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      case 'returned': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'delivered': return '✓';
      case 'shipped': return '🚚';
      case 'processing': return '⚙️';
      case 'confirmed': return '✅';
      case 'pending': return '⏳';
      case 'cancelled': return '❌';
      case 'refunded': return '💰';
      case 'returned': return '📦';
      default: return '📋';
    }
  }

  function canCancelOrder(order: Order) {
    const status = order.status?.toLowerCase().trim();
    return ['pending', 'confirmed', 'processing'].includes(status);
  }

  function handleSortChange(key: keyof SortState, value: string) {
    setSortOptions(prev => ({ ...prev, [key]: value }));
  }

  // Sort orders when sortOptions or orders change
  useEffect(() => {
    if (orders.length === 0) {
      setSortedOrders([]);
      return;
    }

    const sorted = [...orders].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortOptions.sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      if (sortOptions.sortOrder === 'ASC') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setSortedOrders(sorted);
  }, [orders, sortOptions]);

  function canRequestReturn(order: Order) {
    // Only allow return for delivered orders within 30 days
    if (order.status === 'delivered') {
      const deliveredDate = order.actualDelivery ? new Date(order.actualDelivery) : null;
      if (!deliveredDate) return false;
      const now = new Date();
      const diffDays = (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    }
    
    // Return true for return_requested status to show the status indicator
    if (order.status === 'return_requested') {
      return true;
    }
    
    return false;
  }

  function hasReturnRequested(order: Order) {
    return order.status === 'return_requested';
  }

  function hasReturned(order: Order) {
    return order.status === 'returned';
  }

  function hasRefunded(order: Order) {
    return order.status === 'refunded';
  }

  function getStatusBannerStyle(status: string) {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'shipped':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'delivered':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'return_requested':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'returned':
        return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'refunded':
        return 'bg-gray-50 text-gray-700 border border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  }

  function getStatusExplanation(status: string) {
    switch (status) {
      case 'confirmed':
        return 'Your order has been confirmed and is being prepared for shipment. You will receive a tracking number once your order ships.';
             case 'shipped':
         return 'Your products are being delivered! You can track your package using the tracking information provided. After you receive them, you\'ll be able to return them and apply for a refund if needed.';
      case 'delivered':
        return 'Your order has been successfully delivered! If you have any issues with your items, you can request a return within 30 days.';
      case 'cancelled':
        return 'This order has been cancelled. If you were charged, your refund will be processed within 3-5 business days.';
      case 'return_requested':
        return 'Your return request has been submitted and is being reviewed by our team. You will receive further instructions via email.';
      case 'returned':
        return 'Your products have been returned and are being processed. After they are received and inspected, you will receive a refund.';
      case 'refunded':
        return 'Your refund has been processed and should appear in your original payment method within 3-5 business days.';
      default:
        return 'Your order is being processed. Please check back for updates or contact support if you have any questions.';
    }
  }
  function canRequestRefund(order: Order) {
    // Allow refund if delivered within 14 days
    if (order.status !== 'delivered') return false;
    const deliveredDate = order.actualDelivery ? new Date(order.actualDelivery) : null;
    if (!deliveredDate) return false;
    const now = new Date();
    const diffDays = (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 14;
  }
  function canRequestCancellation(order: Order) {
    // Allow cancellation if not shipped yet (pending, confirmed, processing, paid)
    return ['pending', 'confirmed', 'processing', 'paid'].includes(order.status);
  }

  function hasPendingRequest(order: Order, type: string) {
    return supportTickets.some(
      t => t.orderId === order.id && t.type === type && t.status !== 'closed'
    );
  }

  function openRequestModal(type: string) {
    setRequestType(type);
    setRequestReason('');
    setRequestMessage('');
    setRequestItems(
      selectedOrder?.items.reduce((acc, item) => {
        acc[item.productId] = item.quantity;
        return acc;
      }, {} as {[productId: number]: number}) || {}
    );
    setRequestSuccess('');
    setRequestError('');
    setShowRequestModal(true);
  }

  async function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRequestLoading(true);
    setRequestSuccess('');
    setRequestError('');
    try {
      const token = localStorage.getItem('authToken');
      
      if (requestType === 'return') {
        // Handle return request - update order status directly
        const itemIds = Object.entries(requestItems)
          .filter(([_, qty]) => qty > 0)
          .map(([productId, qty]) => ({ productId: Number(productId), quantity: qty }));
        
        const res = await apiCall(`/api/orders/${selectedOrder?.id}/return-request`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            reason: requestReason,
            items: itemIds,
            message: requestMessage
          }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to submit return request');
        }
        
        // Update local order status
        setOrders(prev => prev.map(order => 
          order.id === selectedOrder?.id 
            ? { ...order, status: 'return_requested' }
            : order
        ));
        
        setRequestSuccess('Return request submitted! The order status has been updated.');
        addToast({ type: 'success', title: 'Return Requested', message: 'Your return request has been submitted and the order status updated.' });
      } else if (requestType === 'cancellation') {
        // Handle cancellation request - update order status directly
        const res = await apiCall(`/api/orders/${selectedOrder?.id}/cancel`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            reason: requestReason || requestMessage
          }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to cancel order');
        }
        
        // Update local order status
        setOrders(prev => prev.map(order => 
          order.id === selectedOrder?.id 
            ? { ...order, status: 'cancelled' }
            : order
        ));
        
        setRequestSuccess('Order has been cancelled successfully.');
        addToast({ type: 'success', title: 'Order Cancelled', message: 'Your order has been cancelled.' });
      } else {
        // Handle refund requests - create support ticket (requires manual admin processing)
        const itemIds = Object.entries(requestItems)
          .filter(([_, qty]) => qty > 0)
          .map(([productId, qty]) => ({ productId: Number(productId), quantity: qty }));
        
        const res = await apiCall('/api/support', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            type: requestType,
            orderId: selectedOrder?.id,
            itemIds: JSON.stringify(itemIds),
            reason: requestReason,
            message: requestMessage,
            email: user?.email,
            userId: user?.id,
            subject: `${requestType.charAt(0).toUpperCase() + requestType.slice(1)} request for order ${selectedOrder?.id}`,
          }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to submit request');
        }
        
        setRequestSuccess('Your request has been submitted! Our team will review it and get back to you.');
        addToast({ type: 'success', title: 'Request Submitted', message: 'Your request has been submitted.' });
        await fetchSupportTickets(); // Refetch tickets after submitting
      }
      
      setShowRequestModal(false);
    } catch (err: any) {
      setRequestError(err.message);
      addToast({ type: 'error', title: 'Request Failed', message: err.message });
    } finally {
      setRequestLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">My Orders</h1>
          <p className="text-gray-600 mb-4">Please log in to view your orders.</p>
          <button 
            onClick={() => router.push('/auth')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-6">My Orders</h1>
        
        {/* Sort Controls */}
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          <div className="flex gap-2">
            {['createdAt', 'total', 'status'].map((sortBy) => {
              const labels = { createdAt: 'Date', total: 'Amount', status: 'Status' };
              return (
                <button
                  key={sortBy}
                  onClick={() => handleSortChange('sortBy', sortBy)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black/10 ${
                    sortOptions.sortBy === sortBy 
                      ? 'border-black text-black bg-gray-50' 
                      : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
                  }`}
                >
                  {labels[sortBy as keyof typeof labels]}
                </button>
              );
            })}
          </div>
          
          <div className="flex gap-2">
            {[
              { value: 'DESC', label: 'Newest' },
              { value: 'ASC', label: 'Oldest' }
            ].map((order) => (
              <button
                key={order.value}
                onClick={() => handleSortChange('sortOrder', order.value)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black/10 ${
                  sortOptions.sortOrder === order.value 
                    ? 'border-black text-black bg-gray-50' 
                    : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
                }`}
              >
                {order.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {loading || authLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : sortedOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No orders found</h2>
          <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
          <button 
            onClick={() => router.push('/products')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedOrders.map((order) => {
            console.log('order:', order.status, 'canCancel:', canCancelOrder(order), 'hasPending:', hasPendingRequest(order, 'cancellation'));
            return (
              <div key={order.id} className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-sm transition-shadow">
                <div className="p-6">
                  <div className="mb-2">
                    <span className="text-xs text-gray-400 font-mono">#{order.id}</span>
                  </div>
                  {/* Order Items */}
                  <div className="flex flex-col gap-3 mt-2">
                    {order.items.map((item, idx) => {
                      const productId = item.productId ?? (item as any).id;
                      const prod = products[productId] || {};
                      return (
                        <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 mb-1">
                          <img
                            src={prod.image || '/placeholder-product.svg'}
                            alt={prod.name || `Product #${productId}`}
                            className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-900 text-sm font-medium truncate">{prod.name ? getDisplayName(prod, prod.collection) : `Product #${productId}`}</div>
                            <div className="text-gray-500 text-xs mt-1">x{item.quantity}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-900 font-semibold text-sm">${(item.price * item.quantity).toFixed(2)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Timeline - show return process for return orders, otherwise show normal order flow */}
                  <div className="mt-6 mb-2">
                    <div className="flex justify-between items-center w-full max-w-3xl mx-auto">
                      {(hasReturnRequested(order) || hasReturned(order) || hasRefunded(order)) ? (
                        // Return process timeline
                        ['return_requested', 'returned', 'refunded'].map((step, idx, arr) => {
                          const stepIndex = arr.indexOf(step);
                          const currentIndex = arr.indexOf(order.status) === -1 ? 0 : arr.indexOf(order.status);
                          const isCompleted = stepIndex < currentIndex;
                          const isCurrent = stepIndex === currentIndex;
                          return (
                            <div key={step} className="flex flex-col items-center flex-1 relative">
                              {/* Circle */}
                              <div className={`w-4 h-4 rounded-full border-2 z-10 transition-all
                                ${isCompleted ? 'bg-orange-600 border-orange-600' : isCurrent ? 'bg-orange-100 border-orange-600' : 'bg-gray-100 border-gray-300'}`}></div>
                              {/* Label */}
                              <span className={`mt-2 text-xs font-medium text-center ${isCompleted || isCurrent ? 'text-orange-700' : 'text-gray-400'}`}>
                                {step.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              {/* Connector line (except last step) */}
                              {idx < arr.length - 1 && (
                                <div className={`absolute top-2 left-1/2 w-full h-0.5 ${stepIndex < currentIndex ? 'bg-orange-600' : 'bg-gray-200'}`} style={{ right: '-50%', left: '50%', zIndex: 0 }}></div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        // Normal order timeline
                        ['pending', 'confirmed', 'shipped', 'delivered'].map((step, idx, arr) => {
                          const stepIndex = arr.indexOf(step);
                          const currentIndex = arr.indexOf(order.status) === -1 ? 1 : arr.indexOf(order.status);
                          const isCompleted = stepIndex < currentIndex;
                          const isCurrent = stepIndex === currentIndex;
                          return (
                            <div key={step} className="flex flex-col items-center flex-1 relative">
                              {/* Circle */}
                              <div className={`w-4 h-4 rounded-full border-2 z-10 transition-all
                                ${isCompleted ? 'bg-blue-600 border-blue-600' : isCurrent ? 'bg-blue-100 border-blue-600' : 'bg-gray-100 border-gray-300'}`}></div>
                              {/* Label */}
                              <span className={`mt-2 text-xs font-medium text-center ${isCompleted || isCurrent ? 'text-blue-700' : 'text-gray-400'}`}>{step.charAt(0).toUpperCase() + step.slice(1)}</span>
                              {/* Connector line (except last step) */}
                              {idx < arr.length - 1 && (
                                <div className={`absolute top-2 left-1/2 w-full h-0.5 ${stepIndex < currentIndex ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ right: '-50%', left: '50%', zIndex: 0 }}></div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  {/* End Timeline */}
                  <div className="flex justify-between items-end mt-6">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                      {order.trackingNumber && (
                        <div className="text-xs text-blue-600 mt-1">
                          <a 
                            href={`https://www.dhl.com/en/express/tracking.html?AWB=${order.trackingNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-800 transition-colors"
                          >
                            Tracking: {order.trackingNumber}
                          </a>
                        </div>
                      )}
                      {order.estimatedDelivery && (
                        <div className="text-xs text-gray-600 mt-1">Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">${order.total.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <div className="flex flex-row gap-2 mt-6 items-stretch">
                    <button
                      onClick={() => { fetchOrderDetails(order.id); }}
                      className={`py-3 h-full rounded-xl border border-gray-300 bg-white text-gray-800 text-xs font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors ${(
                        canCancelOrder(order) && !hasPendingRequest(order, 'cancellation')) ||
                        (canRequestReturn(order) && !hasReturnRequested(order) && !hasPendingRequest(order, 'return')) ||
                        (canCancelOrder(order) && hasPendingRequest(order, 'cancellation')) ||
                        hasReturnRequested(order) ||
                        hasReturned(order) ||
                        hasRefunded(order) ||
                        (canRequestReturn(order) && !hasReturnRequested(order) && hasPendingRequest(order, 'return')) ||
                        order.status === 'cancelled'
                        ? 'flex-1' : 'w-full'}`}
                      style={{ flexBasis: ((
                        canCancelOrder(order) && !hasPendingRequest(order, 'cancellation')) ||
                        (canRequestReturn(order) && !hasReturnRequested(order) && !hasPendingRequest(order, 'return')) ||
                        (canCancelOrder(order) && hasPendingRequest(order, 'cancellation')) ||
                        hasReturnRequested(order) ||
                        hasReturned(order) ||
                        hasRefunded(order) ||
                        (canRequestReturn(order) && !hasReturnRequested(order) && hasPendingRequest(order, 'return'))
                        ) ? '75%' : order.status === 'cancelled' ? '50%' : '100%' }}
                    >
                      View Details
                    </button>
                    {((canCancelOrder(order) && !hasPendingRequest(order, 'cancellation')) ||
                      (canRequestReturn(order) && !hasReturnRequested(order) && !hasPendingRequest(order, 'return')) ||
                      (canCancelOrder(order) && hasPendingRequest(order, 'cancellation')) ||
                      hasReturnRequested(order) ||
                      hasReturned(order) ||
                      hasRefunded(order) ||
                      (canRequestReturn(order) && !hasReturnRequested(order) && hasPendingRequest(order, 'return')) ||
                      order.status === 'cancelled'
                    ) && (
                      <div className={`flex flex-col gap-2 flex-1 h-full ${order.status === 'cancelled' ? '' : ''}`} style={{ flexBasis: order.status === 'cancelled' ? '50%' : '25%' }}>
                        {canCancelOrder(order) && !hasPendingRequest(order, 'cancellation') && (
                          <button
                            onClick={() => { setSelectedOrder(order); setShowCancelModal(true); }}
                            className="w-full py-3 h-full rounded-xl border border-red-400 bg-white text-red-600 text-xs font-semibold hover:bg-red-50 hover:border-red-500 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        {canRequestReturn(order) && !hasReturnRequested(order) && !hasPendingRequest(order, 'return') && (
                          <button
                            onClick={() => { setSelectedOrder(order); openRequestModal('return'); }}
                            className="w-full py-3 h-full rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                          >
                            Return
                          </button>
                        )}
                        {canCancelOrder(order) && hasPendingRequest(order, 'cancellation') && (
                          <span className="w-full py-3 h-full rounded-xl bg-yellow-50 text-yellow-700 text-xs font-semibold border border-yellow-200 text-center">Cancellation requested</span>
                        )}
                        {hasReturnRequested(order) && (
                          <span className="w-full py-3 h-full rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 text-center">Return requested</span>
                        )}
                        {hasReturned(order) && (
                          <span className="w-full py-3 h-full rounded-xl bg-orange-50 text-orange-700 text-xs font-semibold border border-orange-200 text-center">Returned</span>
                        )}
                        {hasRefunded(order) && (
                          <span className="w-full py-3 h-full rounded-xl bg-gray-50 text-gray-700 text-xs font-semibold border border-gray-200 text-center">Refunded</span>
                        )}
                        {canRequestReturn(order) && !hasReturnRequested(order) && hasPendingRequest(order, 'return') && (
                          <span className="w-full py-3 h-full rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 text-center">Return requested</span>
                        )}
                        {order.status === 'cancelled' && (
                          <span className="w-full py-3 h-full rounded-xl bg-red-50 text-red-600 text-xs font-semibold border border-red-200 text-center cursor-not-allowed">Order Cancelled</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Order Details</h2>
                <button
                  onClick={() => {
                    setShowOrderDetails(false);
                    setSelectedOrder(null);
                    setCancelReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Order Status Timeline */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Order Status</h3>
                
                {/* Status Banner */}
                <div className={`w-full py-3 px-4 rounded-lg mb-4 text-center text-sm font-semibold ${getStatusBannerStyle(selectedOrder.status)}`}>
                  {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1).replace('_', ' ')}
                </div>
                
                {/* Status Explanation */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{getStatusExplanation(selectedOrder.status)}</p>
                </div>
                
                {/* Order Fulfillment Timeline */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Order Fulfillment</h4>
                  <div className="space-y-3">
                    {selectedOrder.statusHistory?.map((entry, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(entry.status).replace('text-', 'bg-').replace('bg-', 'bg-')}`}></div>
                        <div className="flex-1">
                          <p className="font-medium">{entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(entry.createdAt).toLocaleString()} - {entry.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Return Process Timeline */}
                {selectedOrder.returnHistory && selectedOrder.returnHistory.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Return Process</h4>
                    <div className="space-y-3">
                      {selectedOrder.returnHistory.map((entry, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(entry.status).replace('text-', 'bg-').replace('bg-', 'bg-')}`}></div>
                          <div className="flex-1">
                            <p className="font-medium">{entry.status.charAt(0).toUpperCase() + entry.status.slice(1).replace('_', ' ')}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(entry.createdAt).toLocaleString()} - {entry.reason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => {
                    const productId = item.productId ?? (item as any).id;
                    const prod = products[productId] || {};
                    return (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <div>
                          <p className="font-medium">{prod.name ? getDisplayName(prod, prod.collection) : `Product #${productId}`}</p>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-medium">${item.price.toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shipping Information */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Shipping Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{selectedOrder.shippingInfo.name}</p>
                  <p className="text-gray-600">{selectedOrder.shippingInfo.address}</p>
                  <p className="text-gray-600">
                    {selectedOrder.shippingInfo.city}, {selectedOrder.shippingInfo.state} {selectedOrder.shippingInfo.zip}
                  </p>
                  <p className="text-gray-600">{selectedOrder.shippingInfo.country}</p>
                  <p className="text-gray-600 mt-2">Email: {user?.email}</p>
                </div>
              </div>



              {/* Modification History */}
              {selectedOrder.modificationHistory && selectedOrder.modificationHistory.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-3">Modification History</h3>
                  <div className="space-y-2">
                    {selectedOrder.modificationHistory.map((mod: any, index: number) => (
                      <div key={index} className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-sm font-medium">{mod.reason}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(mod.timestamp).toLocaleString()} by {mod.updatedBy}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Request Modal */}
      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)}>
        <form onSubmit={handleRequestSubmit} className="flex flex-col gap-4 p-4">
          <h2 className="text-xl font-semibold mb-2">{requestType.charAt(0).toUpperCase() + requestType.slice(1)} Request</h2>
          {requestType === 'return' && selectedOrder && (
            <div>
              <label className="block text-sm font-medium mb-4">Select items to return</label>
              <div className="space-y-4">
                {selectedOrder.items.map(item => {
                  const product = products[item.productId];
                  const currentQuantity = requestItems[item.productId] || 0;
                  return (
                    <div key={item.productId} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {product ? getDisplayName(product, product.collection) : `Product #${item.productId}`}
                        </p>
                        <p className="text-sm text-gray-500">Available: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setRequestItems(prev => ({ 
                            ...prev, 
                            [item.productId]: Math.max(0, (prev[item.productId] || 0) - 1)
                          }))}
                          disabled={currentQuantity <= 0}
                          className="w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-600 text-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="w-12 text-center font-semibold text-gray-900">{currentQuantity}</span>
                        <button
                          type="button"
                          onClick={() => setRequestItems(prev => ({ 
                            ...prev, 
                            [item.productId]: Math.min(item.quantity, (prev[item.productId] || 0) + 1)
                          }))}
                          disabled={currentQuantity >= item.quantity}
                          className="w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-600 text-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <label className="block text-sm font-medium mb-1">Reason (optional)</label>
          <select
            value={requestReason}
            onChange={e => setRequestReason(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
          >
            <option value="">Select a reason</option>
            {(requestType === 'cancellation' ? CANCELLATION_REASONS : RETURN_REFUND_REASONS).map((r: string) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <label className="block text-sm font-medium mb-2">Message (optional)</label>
          <textarea
            value={requestMessage}
            onChange={e => setRequestMessage(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors min-h-[80px]"
            placeholder="Add any details..."
          />
          <button
            type="submit"
            className="py-3 px-6 rounded-xl border border-gray-300 bg-white text-gray-800 text-sm font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            disabled={requestLoading}
          >
            {requestLoading ? 'Submitting...' : 'Submit Request'}
          </button>
          {requestError && <p className="text-red-500 text-sm mt-2">{requestError}</p>}
          {requestSuccess && <p className="text-green-600 text-sm mt-2">{requestSuccess}</p>}
        </form>
      </Modal>

      {/* Cancel Order Modal */}
      <Modal isOpen={showCancelModal} onClose={() => {setShowCancelModal(false); setCancelReason(''); setSelectedOrder(null);}}>
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Cancel Order</h2>
            <p className="text-sm text-gray-500">Are you sure you want to cancel this order?</p>
          </div>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 font-mono mb-1">#{selectedOrder.id}</p>
                <p className="text-lg font-semibold text-gray-900">${selectedOrder.total.toFixed(2)}</p>
                <p className="text-xs text-gray-500 capitalize mt-1">{selectedOrder.status}</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Reason for cancellation</h3>
                <div className="space-y-2">
                  {CANCELLATION_REASONS.map((reason) => (
                    <label key={reason} className="flex items-center gap-2 cursor-pointer p-2 rounded border border-gray-100 hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="cancel-reason"
                        value={reason}
                        checked={cancelReason === reason}
                        onChange={() => setCancelReason(reason)}
                        className="w-3 h-3 text-red-500 border-gray-300 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-700">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                    setSelectedOrder(null);
                  }}
                  className="flex-1 py-2 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Keep Order
                </button>
                <button
                  onClick={() => {
                    if (selectedOrder) {
                      handleCancelOrder(selectedOrder);
                      setShowCancelModal(false);
                    }
                  }}
                  disabled={cancellingOrder === selectedOrder?.id || !cancelReason}
                  className="flex-1 py-2 px-4 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancellingOrder === selectedOrder?.id ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
} 