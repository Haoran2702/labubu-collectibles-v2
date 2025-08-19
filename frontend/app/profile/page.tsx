"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { apiCall } from '../utils/api';
import { useRouter } from 'next/navigation';
import countries from '../utils/countries';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
}

interface Address {
  id: number;
  label: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  isDefault: number;
}

export default function ProfilePage() {
  const { user, updateProfile, changePassword, fetchProfile, loading, getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'addresses'>('profile');
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressForm, setAddressForm] = useState<Partial<Address>>({ country: 'United States' });
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  // Initialize profile form when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // Fetch user orders
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // Fetch addresses on mount or when user changes
  useEffect(() => {
    if (user) fetchAddresses();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await apiCall('/api/auth/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchAddresses = async () => {
    setAddressLoading(true);
    const addrs = await getAddresses();
    setAddresses(addrs.map(a => ({ ...a, isDefault: Number(a.isDefault) })));
    setAddressLoading(false);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(true);
    const result = await updateProfile(
      profileForm.firstName,
      profileForm.lastName,
      profileForm.email
    );
    if (result.success) {
      await fetchProfile();
      addToast({ type: 'success', title: 'Profile updated', message: 'Your profile has been updated.' });
    } else {
      addToast({ type: 'error', title: 'Update failed', message: result.error || 'Could not update profile.' });
    }
    setIsEditing(false);
  };

  // Password validation function
  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Password validation
    const passwordValidation = validatePassword(passwordForm.newPassword);
    if (!passwordValidation.isValid) {
      addToast({
        type: 'error',
        title: 'Password requirements not met',
        message: passwordValidation.errors.join('. ')
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast({
        type: 'error',
        title: 'Passwords do not match',
        message: 'Please make sure your new passwords match.'
      });
      return;
    }

    setIsChangingPassword(true);

    const result = await changePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    );

    if (result.success) {
      addToast({
        type: 'success',
        title: 'Password Changed',
        message: 'Your password has been changed successfully.'
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } else {
      addToast({
        type: 'error',
        title: 'Password Change Failed',
        message: result.error || 'Failed to change password.'
      });
    }

    setIsChangingPassword(false);
  };

  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressLoading(true);
    const formToSend = { ...addressForm, isDefault: addressForm.isDefault ? 1 : 0 };
    if (editingAddressId) {
      await updateAddress(editingAddressId, formToSend);
      setEditingAddressId(null);
    } else {
      await addAddress(formToSend);
    }
    setShowAddressForm(false);
    setAddressForm({ country: 'United States' });
    await fetchAddresses();
    setAddressLoading(false);
  };

  const handleEditAddress = (addr: Address) => {
    setAddressForm(addr);
    setEditingAddressId(addr.id);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id: number) => {
    setAddressLoading(true);
    await deleteAddress(id);
    await fetchAddresses();
    setAddressLoading(false);
  };

  const handleSetDefault = async (id: number) => {
    setAddressLoading(true);
    await setDefaultAddress(id);
    await fetchAddresses();
    setAddressLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">My Account</h1>
          <p className="text-xl text-gray-500 mb-8">Manage your profile, password, and addresses</p>
        </header>

        {/* Tabs */}
        <div>
          <nav className="flex justify-center gap-8 mb-10 border-b border-gray-100">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3 px-1 text-base font-medium transition-colors border-b-2 ${activeTab === 'profile' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-3 px-1 text-base font-medium transition-colors border-b-2 ${activeTab === 'password' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
            >
              Password
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`py-3 px-1 text-base font-medium transition-colors border-b-2 ${activeTab === 'addresses' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
            >
              Addresses
            </button>
          </nav>

          <div className="pt-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Profile Information</h2>
                <form onSubmit={handleProfileSubmit} className="space-y-8 max-w-2xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input type="text" id="firstName" value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} required className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black/10 bg-white" />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input type="text" id="lastName" value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} required className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black/10 bg-white" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input type="email" id="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} required className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black/10 bg-white" />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={isEditing} className="px-8 py-2 rounded-full bg-black text-white font-medium transition-colors hover:bg-gray-800 disabled:opacity-50">{isEditing ? 'Updating...' : 'Update Profile'}</button>
                  </div>
                </form>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Change Password</h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-8 max-w-md mx-auto">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <input type="password" id="currentPassword" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black/10 bg-white" />
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input type="password" id="newPassword" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required minLength={8} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black/10 bg-white" placeholder="Create a strong password" />
                    <PasswordStrengthMeter password={passwordForm.newPassword} />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <input type="password" id="confirmPassword" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black/10 bg-white" />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={isChangingPassword} className="px-8 py-2 rounded-full bg-black text-white font-medium transition-colors hover:bg-gray-800 disabled:opacity-50">{isChangingPassword ? 'Changing...' : 'Change Password'}</button>
                  </div>
                </form>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Saved Addresses</h2>
                {addressLoading ? (
                  <div className="flex items-center gap-2 text-gray-500 justify-center"><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></span> Loading addresses...</div>
                ) : (
                  <>
                    {addresses.length === 0 && <div className="text-gray-400 mb-4 text-center">No saved addresses.</div>}
                    <ul className="space-y-4 mb-4">
                      {addresses.map(addr => (
                        <li key={addr.id} className={`border border-gray-100 p-4 rounded-xl flex flex-col gap-1 bg-white` + (addr.isDefault === 1 ? ' ring-2 ring-black/10' : '')}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{addr.label || 'Address'}</span>
                            {addr.isDefault === 1 ? <span className="text-xs text-black ml-2">Default</span> : (
                              <button className="text-xs text-gray-500 hover:underline ml-2" onClick={() => handleSetDefault(addr.id)}>Set as default</button>
                            )}
                          </div>
                          <div className="text-sm text-gray-700">{addr.name}</div>
                          <div className="text-sm text-gray-700">{addr.address}, {addr.city}, {addr.state} {addr.zip}, {addr.country}</div>
                          <div className="text-sm text-gray-400">{addr.phone}</div>
                          <div className="flex gap-2 mt-2">
                            <button className="text-xs text-gray-500 hover:underline" onClick={() => handleEditAddress(addr)}>Edit</button>
                            <button className="text-xs text-red-400 hover:underline" onClick={() => handleDeleteAddress(addr.id)}>Delete</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-center">
                      <button className="px-6 py-2 rounded-full bg-black text-white font-medium transition-colors hover:bg-gray-800" onClick={() => { setShowAddressForm(true); setEditingAddressId(null); setAddressForm({ country: 'United States' }); }}>Add New Address</button>
                    </div>
                  </>
                )}
                {showAddressForm && (
                  <form className="mt-8 bg-gray-50 rounded-xl p-8 space-y-6 max-w-2xl mx-auto" onSubmit={handleAddressSubmit} style={{ minWidth: 320 }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Label (e.g. Home, Work)</label>
                        <input name="label" placeholder="Label" value={addressForm.label || ''} onChange={handleAddressFormChange} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black/10 bg-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input name="name" placeholder="Full Name" value={addressForm.name || ''} onChange={handleAddressFormChange} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black/10 bg-white" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <input name="address" placeholder="Address" value={addressForm.address || ''} onChange={handleAddressFormChange} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black/10 bg-white" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input name="city" placeholder="City" value={addressForm.city || ''} onChange={handleAddressFormChange} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black/10 bg-white" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                        <input name="state" placeholder="State/Province" value={addressForm.state || ''} onChange={handleAddressFormChange} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black/10 bg-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ZIP</label>
                        <input name="zip" placeholder="ZIP" value={addressForm.zip || ''} onChange={handleAddressFormChange} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black/10 bg-white" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                        <select name="country" value={addressForm.country || 'United States'} onChange={handleAddressFormChange} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black/10 bg-white">
                          {countries.map((c: string) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input name="phone" placeholder="Phone" value={addressForm.phone || ''} onChange={handleAddressFormChange} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black/10 bg-white" required />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 justify-end">
                      <button type="submit" className="px-8 py-2 rounded-full bg-black text-white font-medium transition-colors hover:bg-gray-800">{editingAddressId ? 'Update' : 'Save'} Address</button>
                      <button type="button" className="px-8 py-2 rounded-full bg-gray-100 text-gray-700 font-medium transition-colors hover:bg-gray-200" onClick={() => { setShowAddressForm(false); setEditingAddressId(null); setAddressForm({ country: 'United States' }); }}>Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 