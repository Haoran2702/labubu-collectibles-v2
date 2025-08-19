"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/Toast';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  registrationDate: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  totalAddresses: number;
  recentOrders: number;
  recentSpent: number;
  averageOrderValue: number;
  statusDistribution: Array<{ status: string; count: number }>;
}

interface SortState {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function UsersPage() {
  const { addToast } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [sortOptions, setSortOptions] = useState<SortState>({
    sortBy: 'registrationDate',
    sortOrder: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Check admin authentication
  useEffect(() => {
    const adminToken = sessionStorage.getItem('admin_jwt');
    if (!adminToken) {
      router.push('/admin/login');
      return;
    }
    
    // Fetch users if we have a valid token
    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const token = sessionStorage.getItem('admin_jwt');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to fetch users'
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch users'
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSortChange = (key: keyof SortState, value: string) => {
    setSortOptions(prev => ({ ...prev, [key]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'confirmed': return 'bg-indigo-100 text-indigo-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and sort users
  const filteredAndSortedUsers = users
    .filter(user => 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortOptions.sortBy) {
        case 'registrationDate':
          aValue = new Date(a.registrationDate).getTime();
          bValue = new Date(b.registrationDate).getTime();
          break;
        case 'totalOrders':
          aValue = a.totalOrders;
          bValue = b.totalOrders;
          break;
        case 'totalSpent':
          aValue = a.totalSpent;
          bValue = b.totalSpent;
          break;
        case 'lastOrderDate':
          aValue = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
          bValue = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
          break;
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        default:
          aValue = new Date(a.registrationDate).getTime();
          bValue = new Date(b.registrationDate).getTime();
      }

      if (sortOptions.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">Users</h1>
          <p className="text-xl text-gray-500 mb-8">Monitor user activity and gather insights</p>
        </header>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">{users.length}</div>
            <div className="text-sm text-gray-500">Total Users</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {users.filter(u => u.totalOrders > 0).length}
            </div>
            <div className="text-sm text-gray-500">Active Customers</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              ${users.reduce((sum, u) => sum + u.totalSpent, 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Total Revenue</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {users.reduce((sum, u) => sum + u.totalOrders, 0)}
            </div>
            <div className="text-sm text-gray-500">Total Orders</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black/10 bg-white"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex gap-2">
            <select
              value={sortOptions.sortBy}
              onChange={(e) => handleSortChange('sortBy', e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black/10 bg-white"
            >
              <option value="registrationDate">Registration Date</option>
              <option value="name">Name</option>
              <option value="totalOrders">Total Orders</option>
              <option value="totalSpent">Total Spent</option>
              <option value="lastOrderDate">Last Order</option>
            </select>
            <select
              value={sortOptions.sortOrder}
              onChange={(e) => handleSortChange('sortOrder', e.target.value as 'asc' | 'desc')}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black/10 bg-white"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredAndSortedUsers.map((user) => (
            <div key={user.id} className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-sm transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-600">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Registered: {new Date(user.registrationDate).toLocaleDateString()}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{user.totalOrders}</div>
                    <div className="text-xs text-gray-500">Orders</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">${user.totalSpent.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">Total Spent</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{user.recentOrders}</div>
                    <div className="text-xs text-gray-500">Recent (30d)</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{user.totalAddresses}</div>
                    <div className="text-xs text-gray-500">Addresses</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowUserDetails(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* Status Distribution */}
              {user.statusDistribution.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500 mb-2">Order Status Distribution:</div>
                  <div className="flex flex-wrap gap-2">
                    {user.statusDistribution.map((status) => (
                      <span
                        key={status.status}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status.status)}`}
                      >
                        {status.status}: {status.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredAndSortedUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No users found</h2>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">User Details</h2>
                <button
                  onClick={() => {
                    setShowUserDetails(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Info */}
                <div>
                  <h3 className="font-semibold mb-3">User Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Name:</span>
                      <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Email:</span>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Role:</span>
                      <p className="font-medium capitalize">{selectedUser.role}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Registered:</span>
                      <p className="font-medium">{new Date(selectedUser.registrationDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div>
                  <h3 className="font-semibold mb-3">Activity Statistics</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Total Orders:</span>
                      <p className="font-medium">{selectedUser.totalOrders}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Total Spent:</span>
                      <p className="font-medium">${selectedUser.totalSpent.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Average Order Value:</span>
                      <p className="font-medium">${selectedUser.averageOrderValue.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Recent Orders (30d):</span>
                      <p className="font-medium">{selectedUser.recentOrders}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Recent Spent (30d):</span>
                      <p className="font-medium">${selectedUser.recentSpent.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Last Order:</span>
                      <p className="font-medium">
                        {selectedUser.lastOrderDate 
                          ? new Date(selectedUser.lastOrderDate).toLocaleDateString()
                          : 'No orders yet'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Distribution */}
              {selectedUser.statusDistribution.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="font-semibold mb-3">Order Status Distribution</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.statusDistribution.map((status) => (
                      <span
                        key={status.status}
                        className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(status.status)}`}
                      >
                        {status.status}: {status.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 