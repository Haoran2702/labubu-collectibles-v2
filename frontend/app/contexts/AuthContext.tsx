"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiConfig, apiCall } from '../utils/api';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

interface Address {
  id: number;
  userId: number;
  label: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  isDefault: number;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; error?: string; message?: string; requiresEmailVerification?: boolean }>;
  logout: () => void;
  updateProfile: (
    firstName: string,
    lastName: string,
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  fetchProfile: () => Promise<void>;
  loading: boolean;
  getAddresses: () => Promise<Address[]>;
  addAddress: (address: Partial<Address>) => Promise<Address | null>;
  updateAddress: (id: number, address: Partial<Address>) => Promise<Address | null>;
  deleteAddress: (id: number) => Promise<boolean>;
  setDefaultAddress: (id: number) => Promise<boolean>;
  verifyEmail: (email: string, token: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode JWT and get exp
function getTokenExpiration(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setToken(savedToken);
      fetchUserProfile(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Auto logout effect
  useEffect(() => {
    if (!token) return;
    const exp = getTokenExpiration(token);
    if (!exp) return;
    const now = Date.now();
    if (exp <= now) {
      logout();
      return;
    }
    const timeout = setTimeout(() => {
      logout();
    }, exp - now);
    return () => clearTimeout(timeout);
  }, [token]);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await apiCall(apiConfig.endpoints.auth.profile, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('authToken');
        setToken(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('authToken');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Always clear any existing token before login
      localStorage.removeItem('authToken');
      const response = await apiCall(apiConfig.endpoints.auth.login, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('authToken', data.token);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const response = await apiCall(apiConfig.endpoints.auth.register, {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      const data = await response.json();

      if (response.ok) {
        return { 
          success: true, 
          message: data.message,
          requiresEmailVerification: data.requiresEmailVerification 
        };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const verifyEmail = async (email: string, token: string) => {
    try {
      const response = await apiCall(apiConfig.endpoints.auth.verifyEmail, {
        method: 'POST',
        body: JSON.stringify({ email, token }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const resendVerification = async (email: string) => {
    try {
      const response = await apiCall(apiConfig.endpoints.auth.resendVerification, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };

  const updateProfile = async (
    firstName: string,
    lastName: string,
    email: string
  ) => {
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await apiCall(apiConfig.endpoints.auth.profile, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await apiCall(apiConfig.endpoints.auth.changePassword, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      // ignore
    }
  };

  const API_BASE = apiConfig.endpoints.auth.profile.replace('/profile', '');

  const getAddresses = async () => {
    if (!token) return [];
    const res = await fetch(`${API_BASE}/addresses`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.addresses as Address[];
  };

  const addAddress = async (address: Partial<Address>) => {
    if (!token) return null;
    const res = await fetch(`${API_BASE}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(address),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.address as Address;
  };

  const updateAddress = async (id: number, address: Partial<Address>) => {
    if (!token) return null;
    const res = await fetch(`${API_BASE}/addresses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(address),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.address as Address;
  };

  const deleteAddress = async (id: number) => {
    if (!token) return false;
    const res = await fetch(`${API_BASE}/addresses/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  };

  const setDefaultAddress = async (id: number) => {
    if (!token) return false;
    const res = await fetch(`${API_BASE}/addresses/${id}/default`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    fetchProfile,
    loading,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    verifyEmail,
    resendVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 