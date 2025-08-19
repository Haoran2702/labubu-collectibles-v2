"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '../../utils/api';

interface AnalyticsData {
  sales: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    revenueByMonth: Array<{ month: string; revenue: number }>;
    ordersByStatus: Array<{ status: string; count: number }>;
    revenueGrowth: number;
    orderGrowth: number;
  };
  customers: {
    totalCustomers: number;
    newCustomersThisMonth: number;
    repeatCustomers: number;
    customerGrowth: Array<{ month: string; count: number }>;
    customerLifetimeValue: number;
    retentionRate: number;
  };
  inventory: {
    totalProducts: number;
    lowStockItems: number;
    outOfStockItems: number;
    topSellingProducts: Array<{ name: string; sales: number; revenue: number }>;
    inventoryValue: number;
  };
  performance: {
    conversionRate: number;
    cartAbandonmentRate: number;
    averageSessionDuration: number;
    pageViews: Array<{ page: string; views: number }>;
    bounceRate: number;
  };
  realtime: {
    todayOrders: number;
    todayRevenue: number;
    todayCustomers: number;
    pendingOrders: number;
    activeUsers: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("30d");
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'products' | 'realtime'>('overview');
  const router = useRouter();

  useEffect(() => {
    fetchAnalytics();
    fetchRealtimeData(); // Fetch immediately
    const interval = setInterval(fetchRealtimeData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const token = sessionStorage.getItem("admin_jwt");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await apiCall(`/api/analytics?range=${timeRange}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }
      
      const analyticsData = await response.json();
      // Initialize realtime data if not present
      if (!analyticsData.realtime) {
        analyticsData.realtime = {
          todayOrders: 0,
          todayRevenue: 0,
          todayCustomers: 0,
          pendingOrders: 0,
          activeUsers: 0
        };
      }
      setData(analyticsData);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError("Request timed out. Please try again.");
      } else {
        setError(err.message || "Failed to load analytics data");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRealtimeData = async () => {
    try {
      const token = sessionStorage.getItem("admin_jwt");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for real-time
      
      const response = await apiCall('/api/analytics/realtime', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const realtimeData = await response.json();
        setData(prev => prev ? { ...prev, realtime: realtimeData } : null);
      }
    } catch (error) {
      console.error('Failed to fetch real-time data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? '↗' : '↘';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">Analytics Dashboard</h1>
          <p className="text-xl text-gray-500 mb-8">Comprehensive insights into your business performance</p>
          
          {/* Time Range Selector */}
          <div className="flex justify-center gap-2 mb-8">
            {[
              { value: "7d", label: "7 Days" },
              { value: "30d", label: "30 Days" },
              { value: "90d", label: "90 Days" },
              { value: "1y", label: "1 Year" }
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  timeRange === range.value
                    ? 'border-black text-black bg-gray-50'
                    : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'customers', label: 'Customers' },
                { id: 'products', label: 'Products' },
                { id: 'realtime', label: 'Real-time' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Overview Tab - Comprehensive Dashboard */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics - 5 columns for better fit */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <span className={`text-sm font-medium ${getGrowthColor(data.sales.revenueGrowth)}`}>
                    {getGrowthIcon(data.sales.revenueGrowth)} {Math.abs(data.sales.revenueGrowth).toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.sales.totalRevenue)}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <span className={`text-sm font-medium ${getGrowthColor(data.sales.orderGrowth)}`}>
                    {getGrowthIcon(data.sales.orderGrowth)} {Math.abs(data.sales.orderGrowth).toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(data.sales.totalOrders)}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <p className="text-sm font-medium text-gray-500 mb-2">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.sales.averageOrderValue)}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <p className="text-sm font-medium text-gray-500 mb-2">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(data.customers.totalCustomers)}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <p className="text-sm font-medium text-gray-500 mb-2">Pending Orders</p>
                <p className="text-2xl font-bold text-orange-600">{formatNumber(data.realtime?.pendingOrders || 0)}</p>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Conversion Rate</h4>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(data.performance.conversionRate)}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Cart Abandonment</h4>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(data.performance.cartAbandonmentRate)}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Customer Retention</h4>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(data.customers.retentionRate)}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Customer LTV</h4>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.customers.customerLifetimeValue)}</p>
              </div>
            </div>

            {/* Revenue Trend Chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Trend</h3>
              <div className="space-y-4">
                {data.sales.revenueByMonth.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.month}</span>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-black h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(item.revenue / Math.max(...data.sales.revenueByMonth.map(r => r.revenue))) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="font-semibold text-sm">{formatCurrency(item.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Selling Products */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Selling Products</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Product</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Units Sold</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.inventory.topSellingProducts.map((product, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium">{product.name}</td>
                        <td className="py-3 px-4 text-right">{formatNumber(product.sales)}</td>
                        <td className="py-3 px-4 text-right font-semibold">{formatCurrency(product.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-8">
            {/* Customer Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Customer Lifetime Value</h4>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.customers.customerLifetimeValue)}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">New Customers (This Month)</h4>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(data.customers.newCustomersThisMonth)}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Repeat Customers</h4>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(data.customers.repeatCustomers)}</p>
              </div>
            </div>

            {/* Customer Growth Chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Growth</h3>
              <div className="space-y-4">
                {data.customers.customerGrowth.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.month}</span>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-black h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(item.count / Math.max(...data.customers.customerGrowth.map(c => c.count))) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="font-semibold text-sm">{formatNumber(item.count)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-8">
            {/* Inventory Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Total Products</h4>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(data.inventory.totalProducts)}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Low Stock Items</h4>
                <p className="text-2xl font-bold text-orange-600">{formatNumber(data.inventory.lowStockItems)}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Out of Stock</h4>
                <p className="text-2xl font-bold text-red-600">{formatNumber(data.inventory.outOfStockItems)}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Inventory Value</h4>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.inventory.inventoryValue)}</p>
              </div>
            </div>

            {/* Order Status Distribution */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Status Distribution</h3>
              <div className="space-y-4">
                {data.sales.ordersByStatus.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{item.status.replace('_', ' ')}</span>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-black h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(item.count / Math.max(...data.sales.ordersByStatus.map(o => o.count))) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="font-semibold text-sm">{formatNumber(item.count)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Real-time Tab - Improved Layout */}
        {activeTab === 'realtime' && (
          <div className="space-y-8">
            {!data.realtime && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-gray-600">Loading real-time data...</p>
              </div>
            )}
            {/* Real-time Metrics - Better sized boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Today's Orders</h4>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(data.realtime?.todayOrders || 0)}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Today's Revenue</h4>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.realtime?.todayRevenue || 0)}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <h4 className="text-sm font-medium text-gray-500 mb-2">New Customers</h4>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(data.realtime?.todayCustomers || 0)}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Pending Orders</h4>
                <p className="text-3xl font-bold text-orange-600">{formatNumber(data.realtime?.pendingOrders || 0)}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Active Users</h4>
                <p className="text-3xl font-bold text-blue-600">{formatNumber(data.realtime?.activeUsers || 0)}</p>
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Live Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-600">New order received - $45.99</span>
                  <span className="text-gray-400 ml-auto">2 min ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-600">Customer registered - john@example.com</span>
                  <span className="text-gray-400 ml-auto">5 min ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-600">Low stock alert - Product XYZ</span>
                  <span className="text-gray-400 ml-auto">8 min ago</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 