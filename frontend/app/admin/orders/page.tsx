"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/Toast";
import { apiCall } from '../../utils/api';

interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
}

interface OrderStatusHistory {
  status: string;
  reason: string;
  updatedBy: string;
  createdAt: string;
}

interface Order {
  id: string;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  total: number;
  shippingInfo: any;
  orderDate: string;
  status: string;
  payment_status: string;
  payment_intent_id: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  cancellationReason?: string;
  modificationHistory: any[];
  notificationSent: any[];
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
}

interface SortState {
  sortBy: string;
  sortOrder: string;
}

const AdminOrdersPage = () => {
  const [authChecked, setAuthChecked] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    reason: '',
    trackingNumber: '',
    estimatedDelivery: ''
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showRefundConfirmation, setShowRefundConfirmation] = useState(false);

  // Get valid next statuses based on current status
  const getValidNextStatuses = (currentStatus: string) => {
    switch (currentStatus) {
      case 'confirmed': return ['shipped', 'cancelled'];
      case 'shipped': return ['delivered', 'cancelled'];
      case 'delivered': return ['return_requested']; // Customer would request, but admin can set it
      case 'cancelled': return ['refunded']; // Cancelled orders can be refunded if they have payment
      case 'return_requested': return ['returned', 'cancelled']; // Admin processes the request
      case 'returned': return ['refunded']; // Once returned, can be refunded
      case 'refunded': return []; // Final state
      default: return [];
    }
  };

  // Get primary action (excluding cancellation)
  const getPrimaryAction = (currentStatus: string) => {
    switch (currentStatus) {
      case 'confirmed': return { status: 'shipped', label: 'Mark as Shipped' };
      case 'shipped': return { status: 'delivered', label: 'Mark as Delivered' };
      case 'delivered': return null; // Customers must initiate returns
      case 'return_requested': return { status: 'returned', label: 'Mark as Returned' };
      case 'returned': return { status: 'refunded', label: 'Process Refund' };
      case 'cancelled': return { status: 'refunded', label: 'Process Refund' }; // Cancelled orders can be refunded
      case 'refunded': return null; // Final state
      default: return null;
    }
  };

  // Check if cancellation is possible
  const canCancel = (currentStatus: string) => {
    return ['confirmed', 'shipped', 'return_requested'].includes(currentStatus);
  };

  // Helper function to get display name for products
  const getDisplayName = (product: {name: string, collection: string}) => {
    if (product.name.includes('(Secret)')) {
      return product.name; // Already formatted like "Bul (Secret)"
    } else if (product.name === 'Box') {
      return `${product.collection} - Blind Box`;
    }
    return `${product.collection} - ${product.name}`;
  };
  const [sortOptions, setSortOptions] = useState<SortState>({
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [products, setProducts] = useState<{[key: number]: {name: string, imageUrl: string, collection: string}}>({});
  const router = useRouter();
  const { addToast } = useToast();

  function getToken() {
    return sessionStorage.getItem("admin_jwt") || "";
  }

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    apiCall("/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.user || data.user.role !== "admin") {
          sessionStorage.removeItem("admin_jwt");
          router.replace("/admin/login");
        } else {
          setToken(token);
          setAuthChecked(true);
        }
      })
      .catch(() => {
        sessionStorage.removeItem("admin_jwt");
        router.replace("/admin/login");
      });
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('sortBy', sortOptions.sortBy);
        queryParams.append('sortOrder', sortOptions.sortOrder);
        
        const res = await fetch(`/api/admin/orders?${queryParams.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          // Handle both {products: [...]} and [...] formats
          const productList = data.products || data;
          
          if (Array.isArray(productList)) {
            const productMap: {[key: number]: {name: string, imageUrl: string, collection: string}} = {};
            productList.forEach((product: any) => {
              productMap[product.id] = {
                name: product.name,
                imageUrl: product.imageUrl || product.image,
                collection: product.collection
              };
            });
            setProducts(productMap);
          } else {
            console.error('Products API did not return an array:', productList);
          }
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      }
    };

    if (authChecked && token) {
      fetchOrders();
      fetchProducts();
    }
  }, [authChecked, token, sortOptions]);

  const handleSortChange = (key: keyof SortState, value: string) => {
    setSortOptions(prev => ({ ...prev, [key]: value }));
  };

  // Check if invoice can be downloaded (any paid order)
  const canDownloadInvoice = (order: Order) => {
    return ['confirmed', 'processing', 'shipped', 'delivered', 'return_requested', 'returned', 'refunded'].includes(order.status);
  };

  // Check if shipping label can be downloaded (only shipped orders)
  const canDownloadShippingLabel = (order: Order) => {
    return ['shipped', 'delivered'].includes(order.status);
  };

  const downloadInvoice = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/invoice`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addToast({
        type: 'success',
        title: 'Invoice Downloaded',
        message: 'Invoice has been downloaded successfully'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Download Failed',
        message: 'Failed to download invoice'
      });
    }
  };

  const downloadShippingLabel = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/shipping-label`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download shipping label');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shipping-label-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addToast({
        type: 'success',
        title: 'Shipping Label Downloaded',
        message: 'Shipping label has been downloaded successfully'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Download Failed',
        message: 'Failed to download shipping label'
      });
    }
  };

  const handleQuickStatusUpdate = async (order: Order, newStatus: string, actionLabel: string) => {
    // Validate refund requirements
    if (newStatus === 'refunded') {
      if (!order.payment_intent_id) {
        addToast({
          type: 'error',
          title: 'Refund Error',
          message: 'Cannot process refund: No payment information found for this order'
        });
        return;
      }
    }

    setUpdatingStatus(true);
    try {
      // If processing a refund, call the refund API first
      if (newStatus === 'refunded' && order.payment_intent_id) {
        const refundRes = await fetch(`/api/admin/orders/refund`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentIntentId: order.payment_intent_id,
            reason: `Order ${actionLabel.toLowerCase()} by admin`
          }),
        });

        if (!refundRes.ok) {
          const refundError = await refundRes.json();
          throw new Error(refundError.error || 'Failed to process refund');
        }

        const refundData = await refundRes.json();
        addToast({
          type: 'success',
          title: 'Refund Processed',
          message: `Refund processed successfully. Refund ID: ${refundData.refundId}`
        });
        
        // Update order in state since refund endpoint already updated the status
        setOrders(prev => prev.map(o => 
          o.id === order.id 
            ? { ...o, status: 'refunded', payment_status: 'refunded' }
            : o
        ));
        return; // Skip the separate status update since refund already handled it
      }

      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          reason: `Order ${actionLabel.toLowerCase()} by admin`,
          trackingNumber: '',
          estimatedDelivery: ''
        }),
      });

      if (res.ok) {
        addToast({
          type: 'success',
          title: 'Status Updated',
          message: `Order ${actionLabel.toLowerCase()} successfully`
        });
        
        // Update order in state
        setOrders(prev => prev.map(o => 
          o.id === order.id 
            ? { ...o, status: newStatus }
            : o
        ));
      } else {
        const errorData = await res.json();
        addToast({
          type: 'error',
          title: 'Update Failed',
          message: errorData.error || 'Failed to update order status'
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'An error occurred while updating the order'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !statusUpdate.status) return;

    // Validate refund requirements
    if (statusUpdate.status === 'refunded') {
      if (!selectedOrder.payment_intent_id) {
        addToast({
          type: 'error',
          title: 'Refund Error',
          message: 'Cannot process refund: No payment information found for this order'
        });
        return;
      }
      
      // Show confirmation for refunds
      setShowRefundConfirmation(true);
      return;
    }

    await processStatusUpdate();
  };

  const processStatusUpdate = async () => {
    if (!selectedOrder) return;
    
    setUpdatingStatus(true);
    try {
      // If processing a refund, call the refund API first
      if (statusUpdate.status === 'refunded' && selectedOrder.payment_intent_id) {
        const refundRes = await fetch(`/api/admin/orders/refund`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentIntentId: selectedOrder.payment_intent_id,
            reason: statusUpdate.reason || 'Refund processed by admin'
          }),
        });

        if (!refundRes.ok) {
          const refundError = await refundRes.json();
          throw new Error(refundError.error || 'Failed to process refund');
        }

        const refundData = await refundRes.json();
        addToast({
          type: 'success',
          title: 'Refund Processed',
          message: `Refund processed successfully. Refund ID: ${refundData.refundId}`
        });
        
        // Update order in state since refund endpoint already updated the status
        setOrders(prev => prev.map(order => 
          order.id === selectedOrder.id 
            ? { ...order, status: 'refunded', payment_status: 'refunded' }
            : order
        ));
        
        setShowStatusModal(false);
        setStatusUpdate({ status: '', reason: '', trackingNumber: '', estimatedDelivery: '' });
        return; // Skip the separate status update since refund already handled it
      }

      // Update order status (only for non-refund operations)
      const res = await apiCall(`/api/orders/${selectedOrder.id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(statusUpdate),
      });

      if (res.ok) {
        addToast({
          type: 'success',
          title: 'Status Updated',
          message: 'Order status has been updated successfully'
        });
        
        // Update order in state
        setOrders(prev => prev.map(order => 
          order.id === selectedOrder.id 
            ? { ...order, status: statusUpdate.status, trackingNumber: statusUpdate.trackingNumber, estimatedDelivery: statusUpdate.estimatedDelivery }
            : order
        ));
        
        setShowStatusModal(false);
        setStatusUpdate({ status: '', reason: '', trackingNumber: '', estimatedDelivery: '' });
      } else {
        const errorData = await res.json();
        addToast({
          type: 'error',
          title: 'Update Failed',
          message: errorData.error || 'Failed to update order status'
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'An error occurred while updating the order'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-indigo-100 text-indigo-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'return_requested': return 'bg-yellow-100 text-yellow-800';
      case 'returned': return 'bg-orange-100 text-orange-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return '✅';
      case 'shipped': return '🚚';
      case 'delivered': return '✓';
      case 'cancelled': return '❌';
      case 'return_requested': return '🔄';
      case 'returned': return '📦';
      case 'refunded': return '💰';
      default: return '📋';
    }
  };

  // Group orders by status
  const groupedOrders = orders.reduce((acc, order) => {
    if (!acc[order.status]) {
      acc[order.status] = [];
    }
    acc[order.status].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  // Action-oriented categories for admin workflow
  const actionCategories = [
    { key: 'to_be_shipped', label: 'To Be Shipped', statuses: ['confirmed'] },
    { key: 'return_requests', label: 'Return Requests', statuses: ['return_requested'] },
    { key: 'to_be_refunded', label: 'To Be Refunded', statuses: ['returned'] }
  ];

  const archiveStatuses = ['shipped', 'delivered', 'cancelled', 'refunded'];

  // Group orders by action categories
  const actionGroupedOrders = actionCategories.reduce((acc, category) => {
    acc[category.key] = orders.filter(order => category.statuses.includes(order.status));
    return acc;
  }, {} as Record<string, Order[]>);

  // Group archive orders by status
  const archiveGroupedOrders = archiveStatuses.reduce((acc, status) => {
    acc[status] = orders.filter(order => order.status === status);
    return acc;
  }, {} as Record<string, Order[]>);

  // Filter orders based on selected category
  const displayedOrders = selectedStatus === 'all' 
    ? orders 
    : selectedStatus === 'archive'
      ? archiveStatuses.flatMap(status => archiveGroupedOrders[status] || [])
      : actionGroupedOrders[selectedStatus] || archiveGroupedOrders[selectedStatus] || [];

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-light text-gray-900 mb-4 tracking-tight text-center">Order Management</h1>
          <p className="text-xl text-gray-500 text-center mb-8">Manage all customer orders from the admin dashboard</p>
          
          {/* Action-Oriented Navigation Bar */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="flex space-x-0 overflow-x-auto">
              <button
                onClick={() => setSelectedStatus('all')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${
                  selectedStatus === 'all' 
                    ? 'border-black text-black' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Orders ({orders.length})
              </button>
              
              {/* Action Categories */}
              {actionCategories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => setSelectedStatus(category.key)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${
                    selectedStatus === category.key 
                      ? 'border-red-500 text-red-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {category.label} ({actionGroupedOrders[category.key]?.length || 0})
                </button>
              ))}
              
              {/* Archive */}
              <button
                onClick={() => setSelectedStatus('archive')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${
                  selectedStatus === 'archive' 
                    ? 'border-black text-black' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Archive ({archiveStatuses.reduce((sum, status) => sum + (archiveGroupedOrders[status]?.length || 0), 0)})
              </button>
            </nav>
          </div>

          {/* Sort Controls */}
          <div className="flex flex-wrap justify-center gap-3">
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

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-red-500 text-lg">{error}</div>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No orders found</h2>
            <p className="text-gray-500">
              {selectedStatus === 'all' 
                ? 'No orders have been placed yet' 
                : `No orders with status "${selectedStatus}"`
              }
            </p>
          </div>
        ) : selectedStatus === 'archive' ? (
          /* Archive with subsections */
          <div className="space-y-8">
            {archiveStatuses.map((status) => {
              const statusOrders = archiveGroupedOrders[status] || [];
              if (statusOrders.length === 0) return null;
              
              return (
                <div key={status} className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                    {status.charAt(0).toUpperCase() + status.slice(1)} ({statusOrders.length})
                  </h3>
                  <div className="space-y-4">
                    {statusOrders.map((order) => (
                      <div key={order.id} className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-sm transition-shadow overflow-hidden">
                        {/* Status Banner */}
                        <div className={`w-full px-6 py-2 text-center text-xs font-semibold uppercase tracking-wide ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </div>
                        
                        <div className="p-6">
                          <div className="mb-2">
                            <span className="text-xs text-gray-400 font-mono">#{order.id}</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {order.firstName} {order.lastName}
                              </h3>
                              <p className="text-sm text-gray-600">{order.email}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(order.orderDate).toLocaleDateString()}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Total: ${order.total.toFixed(2)}</p>
                              <p className="text-sm text-gray-600">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                            </div>
                            
                            <div className="flex justify-end items-center gap-2">
                              {canDownloadInvoice(order) && (
                                <button
                                  onClick={() => downloadInvoice(order.id)}
                                  className="py-3 px-2 rounded-xl border border-gray-300 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50 hover:text-gray-800 transition-colors"
                                  title="Download Invoice"
                                >
                                  Invoice
                                </button>
                              )}
                              {canDownloadShippingLabel(order) && (
                                <button
                                  onClick={() => downloadShippingLabel(order.id)}
                                  className="py-3 px-2 rounded-xl border border-gray-300 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50 hover:text-gray-800 transition-colors"
                                  title="Download Shipping Label"
                                >
                                  Label
                                </button>
                              )}
                              <button
                                onClick={() => { setSelectedOrder(order); setShowOrderDetails(true); }}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Regular categories display */
          <div className="space-y-6">
            {displayedOrders.map((order) => (
               <div key={order.id} className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-sm transition-shadow overflow-hidden">
                 {/* Status Banner */}
                 <div className={`w-full px-6 py-2 text-center text-xs font-semibold uppercase tracking-wide ${getStatusColor(order.status)}`}>
                   {order.status.replace('_', ' ')}
                 </div>
                 
                 <div className="p-6">
                   <div className="mb-2">
                     <span className="text-xs text-gray-400 font-mono">#{order.id}</span>
                   </div>
                   
                   {/* Order Header */}
                   <div className="mb-4">
                     <h3 className="text-lg font-semibold text-gray-900">{order.firstName} {order.lastName}</h3>
                     <p className="text-sm text-gray-500">{order.email}</p>
                     <p className="text-sm text-gray-400">
                       {new Date(order.orderDate).toLocaleDateString()} • ${order.total.toFixed(2)}
                     </p>
                   </div>

                  {/* Order Items Preview */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                  </div>

                                                        {/* Action Buttons */}
                   <div className="flex gap-3">
                     {(() => {
                       const primaryAction = getPrimaryAction(order.status);
                       const showCancel = canCancel(order.status);
                       
                       return (
                         <>
                           {/* Download Buttons */}
                           {canDownloadInvoice(order) && (
                             <button
                               onClick={() => downloadInvoice(order.id)}
                               className="py-3 px-2 rounded-xl border border-gray-300 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50 hover:text-gray-800 transition-colors"
                               title="Download Invoice"
                             >
                               Invoice
                             </button>
                           )}
                           {canDownloadShippingLabel(order) && (
                             <button
                               onClick={() => downloadShippingLabel(order.id)}
                               className="py-3 px-2 rounded-xl border border-gray-300 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50 hover:text-gray-800 transition-colors"
                               title="Download Shipping Label"
                             >
                               Label
                             </button>
                           )}
                           
                           <button
                             onClick={() => { setSelectedOrder(order); setShowOrderDetails(true); }}
                             className="py-3 h-full rounded-xl border border-gray-300 bg-white text-gray-800 text-xs font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors"
                             style={{ flexBasis: primaryAction && showCancel ? '33%' : showCancel ? '50%' : '50%' }}
                           >
                             View Details
                           </button>
                           
                           {primaryAction ? (
                             <button
                               onClick={() => {
                                 setSelectedOrder(order);
                                 setStatusUpdate({
                                   status: primaryAction.status,
                                   reason: '',
                                   trackingNumber: order.trackingNumber || '',
                                   estimatedDelivery: order.estimatedDelivery || ''
                                 });
                                 setShowStatusModal(true);
                               }}
                               disabled={updatingStatus}
                               className="py-3 h-full rounded-xl border border-gray-300 bg-white text-gray-800 text-xs font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50"
                               style={{ flexBasis: showCancel ? '50%' : '50%' }}
                             >
                               {primaryAction.label}
                             </button>
                           ) : (
                             <span
                               className="py-3 h-full rounded-xl bg-gray-50 text-gray-400 text-xs font-semibold border border-gray-200 text-center cursor-not-allowed"
                               style={{ flexBasis: '50%' }}
                             >
                               Final Status
                             </span>
                           )}
                           
                           {showCancel && (
                             <button
                               onClick={() => {
                                 setSelectedOrder(order);
                                 setStatusUpdate({
                                   status: 'cancelled',
                                   reason: '',
                                   trackingNumber: '',
                                   estimatedDelivery: ''
                                 });
                                 setShowStatusModal(true);
                               }}
                               className="py-3 h-full rounded-xl border border-red-400 bg-white text-red-600 text-xs font-semibold hover:bg-red-50 hover:border-red-500 transition-colors text-center"
                               style={{ flexBasis: primaryAction ? '17%' : '50%' }}
                               title="Cancel Order"
                             >
                               ✕
                             </button>
                           )}
                         </>
                       );
                     })()}
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <h2 className="text-3xl font-light text-gray-900">Order Details</h2>
                  <button
                    onClick={() => setShowOrderDetails(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Order Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Order Information</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Order ID:</span>
                        <span className="font-mono text-gray-900">#{selectedOrder.id}</span>
                      </div>
                                             <div className="flex justify-between">
                         <span className="text-gray-500">Status:</span>
                         <div className={`inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-sm ${getStatusColor(selectedOrder.status)}`}>
                           {selectedOrder.status.replace('_', ' ')}
                         </div>
                       </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total:</span>
                        <span className="font-semibold">${selectedOrder.total.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created:</span>
                        <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                      </div>
                      {selectedOrder.trackingNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tracking:</span>
                          <span className="font-mono">{selectedOrder.trackingNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Name:</span>
                        <span>{selectedOrder.firstName} {selectedOrder.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span>{selectedOrder.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">User ID:</span>
                        <span>#{selectedOrder.userId}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Information */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="font-medium">{selectedOrder.shippingInfo.name}</p>
                    <p className="text-gray-600">{selectedOrder.shippingInfo.address}</p>
                    <p className="text-gray-600">
                      {selectedOrder.shippingInfo.city}, {selectedOrder.shippingInfo.state} {selectedOrder.shippingInfo.zip}
                    </p>
                    <p className="text-gray-600">{selectedOrder.shippingInfo.country}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item, index) => {
                      const product = products[item.productId];
                      return (
                        <div key={index} className="flex items-center gap-4 py-3 border-b border-gray-100">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-white flex-shrink-0">
                            {product?.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                No Image
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {product ? getDisplayName(product) : `Product #${item.productId}`}
                            </p>
                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-gray-900">${item.price.toFixed(2)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Download Actions */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Documents</h3>
                  <div className="flex gap-3">
                    {canDownloadInvoice(selectedOrder) && (
                      <button
                        onClick={() => downloadInvoice(selectedOrder.id)}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        Download Invoice
                      </button>
                    )}
                    {canDownloadShippingLabel(selectedOrder) && (
                      <button
                        onClick={() => downloadShippingLabel(selectedOrder.id)}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        Download Shipping Label
                      </button>
                    )}
                  </div>
                </div>

                {/* Status History */}
                {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Status History</h3>
                    <div className="space-y-3">
                      {selectedOrder.statusHistory.map((entry, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-xl">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{entry.status}</p>
                              <p className="text-sm text-gray-500">{entry.reason}</p>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              <p>{new Date(entry.createdAt).toLocaleString()}</p>
                              <p>by {entry.updatedBy}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

                          {/* Status Update Modal */}
         {showStatusModal && selectedOrder && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
             <div className="bg-white rounded-xl max-w-md w-full">
               <div className="p-8">
                 <div className="text-center mb-8">
                   <h2 className="text-2xl font-light text-gray-900 mb-2">
                     {statusUpdate.status === 'cancelled' ? 'Cancel Order' : 
                      statusUpdate.status === 'shipped' ? 'Mark as Shipped' :
                      statusUpdate.status === 'delivered' ? 'Mark as Delivered' :
                      statusUpdate.status === 'returned' ? 'Mark as Returned' :
                      statusUpdate.status === 'refunded' ? 'Process Refund' :
                      'Update Order Status'}
                   </h2>
                   <p className="text-sm text-gray-500">
                     Order #{selectedOrder.id}
                   </p>
                 </div>
                 
                 <div className="space-y-6">
                   {/* Reason Field - Always shown */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       {statusUpdate.status === 'cancelled' ? 'Cancellation Reason' : 
                        statusUpdate.status === 'shipped' ? 'Shipping Notes' :
                        statusUpdate.status === 'delivered' ? 'Delivery Notes' :
                        statusUpdate.status === 'returned' ? 'Return Notes' :
                        statusUpdate.status === 'refunded' ? 'Refund Notes' :
                        'Notes'}
                     </label>
                     <textarea
                       value={statusUpdate.reason}
                       onChange={(e) => setStatusUpdate(prev => ({ ...prev, reason: e.target.value }))}
                       className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                       rows={3}
                       placeholder={
                         statusUpdate.status === 'cancelled' ? 'Why is this order being cancelled?' :
                         statusUpdate.status === 'shipped' ? 'Any shipping notes or instructions...' :
                         statusUpdate.status === 'delivered' ? 'Delivery confirmation details...' :
                         statusUpdate.status === 'returned' ? 'Return processing notes...' :
                         statusUpdate.status === 'refunded' ? 'Refund processing details...' :
                         'Optional notes...'
                       }
                     />
                   </div>

                   {/* Tracking Number - Only for shipped status */}
                   {statusUpdate.status === 'shipped' && (
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Tracking Number</label>
                       <input
                         type="text"
                         value={statusUpdate.trackingNumber}
                         onChange={(e) => setStatusUpdate(prev => ({ ...prev, trackingNumber: e.target.value }))}
                         className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                         placeholder="Enter tracking number..."
                       />
                     </div>
                   )}

                   {/* Estimated Delivery - Only for shipped status */}
                   {statusUpdate.status === 'shipped' && (
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery Date</label>
                       <input
                         type="date"
                         value={statusUpdate.estimatedDelivery}
                         onChange={(e) => setStatusUpdate(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                         className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                       />
                     </div>
                   )}
                 </div>

                 <div className="flex gap-3 mt-8">
                   <button
                     onClick={() => {
                       setShowStatusModal(false);
                       setStatusUpdate({ status: '', reason: '', trackingNumber: '', estimatedDelivery: '' });
                     }}
                     className="flex-1 py-2 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={handleStatusUpdate}
                     disabled={updatingStatus || !statusUpdate.status}
                     className="flex-1 py-2 px-4 rounded-xl border border-gray-300 bg-white text-gray-800 text-sm font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {updatingStatus ? 'Processing...' : 
                      statusUpdate.status === 'cancelled' ? 'Cancel Order' :
                      statusUpdate.status === 'shipped' ? 'Mark as Shipped' :
                      statusUpdate.status === 'delivered' ? 'Mark as Delivered' :
                      statusUpdate.status === 'returned' ? 'Mark as Returned' :
                      statusUpdate.status === 'refunded' ? 'Process Refund' :
                      'Update Status'}
                   </button>
                 </div>
               </div>
             </div>
           </div>
         )}

        {/* Refund Confirmation Modal */}
        {showRefundConfirmation && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-light text-gray-900 mb-2">
                    Confirm Refund
                  </h2>
                  <p className="text-sm text-gray-500">
                    Order #{selectedOrder.id} - ${selectedOrder.total.toFixed(2)}
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      <strong>Warning:</strong> This action will process a refund for ${selectedOrder.total.toFixed(2)}. 
                      The money will be returned to the customer's original payment method.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refund Reason
                    </label>
                    <select
                      value={statusUpdate.reason}
                      onChange={(e) => setStatusUpdate(prev => ({ ...prev, reason: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors"
                    >
                      <option value="">Select a reason...</option>
                      <option value="Customer requested refund">Customer requested refund</option>
                      <option value="Item damaged or defective">Item damaged or defective</option>
                      <option value="Wrong item received">Wrong item received</option>
                      <option value="Order cancelled">Order cancelled</option>
                      <option value="Fraudulent transaction">Fraudulent transaction</option>
                      <option value="Duplicate charge">Duplicate charge</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => {
                      setShowRefundConfirmation(false);
                      setStatusUpdate({ status: '', reason: '', trackingNumber: '', estimatedDelivery: '' });
                    }}
                    className="flex-1 py-2 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!statusUpdate.reason.trim()) {
                        addToast({
                          type: 'error',
                          title: 'Refund Error',
                          message: 'Please select a refund reason'
                        });
                        return;
                      }
                      setShowRefundConfirmation(false);
                      await processStatusUpdate();
                    }}
                    disabled={updatingStatus}
                    className="flex-1 py-2 px-4 rounded-xl border border-red-300 bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingStatus ? 'Processing...' : 'Confirm Refund'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage; 