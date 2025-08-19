"use client";

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'MERGE_CART'; payload: CartItem[] };

const initialState: CartState = {
  items: [],
  total: 0,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return {
          ...state,
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        };
      } else {
        const newItem = { ...action.payload, quantity: 1 };
        const updatedItems = [...state.items, newItem];
        return {
          ...state,
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        };
      }
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0);
      
      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      };
    }
    
    case 'CLEAR_CART':
      return initialState;
    
    case 'MERGE_CART': {
      const mergedItems = [...state.items];
      
      action.payload.forEach(guestItem => {
        const existingItem = mergedItems.find(item => item.id === guestItem.id);
        if (existingItem) {
          existingItem.quantity += guestItem.quantity;
        } else {
          mergedItems.push(guestItem);
        }
      });
      
      return {
        ...state,
        items: mergedItems,
        total: mergedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      };
    }
    
    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const user = auth?.user || null;
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [previousUser, setPreviousUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [mergeCompleted, setMergeCompleted] = useState(false);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    const cartKey = user ? 'userCart' : 'guestCart';
    localStorage.removeItem(cartKey);
  };

  // Reset merge flag when user changes
  useEffect(() => {
    setMergeCompleted(false);
  }, [user]);

  // Set initialized flag when auth is loaded
  useEffect(() => {
    if (auth !== undefined) {
      setInitialized(true);
    }
  }, [auth]);

  // Restore cart from localStorage only on mount
  useEffect(() => {
    // Wait for auth to be initialized before restoring cart
    if (!initialized) return;
    
    const cartKey = user ? 'userCart' : 'guestCart';
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        // For guests, check if cart is expired (8 hours)
        if (!user && parsed.timestamp) {
          const eightHours = 8 * 60 * 60 * 1000;
          if (Date.now() - parsed.timestamp > eightHours) {
            localStorage.removeItem(cartKey);
            return;
          }
        }
        if (parsed && Array.isArray(parsed.items)) {
          dispatch({ type: 'CLEAR_CART' });
          parsed.items.forEach((item: any) => {
            for (let i = 0; i < item.quantity; i++) {
              dispatch({ type: 'ADD_ITEM', payload: { id: item.id, name: item.name, price: item.price, image: item.image } });
            }
          });
        }
      } catch {}
    }
  }, [user, initialized]);

  // Handle cart merging when user logs in
  useEffect(() => {
    if (!initialized || mergeCompleted) return;
    // If user just logged in (was null, now has value)
    if (user && !previousUser) {
      // Get guest cart
      const guestCart = localStorage.getItem('guestCart');
      if (guestCart) {
        try {
          const parsed = JSON.parse(guestCart);
          if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
            // Merge guest cart with current user cart
            dispatch({ type: 'MERGE_CART', payload: parsed.items });
            // Clear guest cart after merging
            localStorage.removeItem('guestCart');
            setMergeCompleted(true);
          }
        } catch (error) {
          console.error('Error merging guest cart:', error);
        }
      }
    }
    // If user just logged out (was not null, now is null)
    if (!user && previousUser) {
      dispatch({ type: 'CLEAR_CART' });
    }
    setPreviousUser(user);
  }, [user, previousUser, initialized, mergeCompleted]);

  // Persist cart for all users with different expiration times
  useEffect(() => {
    if (!initialized) return;
    const cartKey = user ? 'userCart' : 'guestCart';
    const cartData = {
      ...state,
      timestamp: user ? undefined : Date.now()
    };
    localStorage.setItem(cartKey, JSON.stringify(cartData));
  }, [state, user, initialized]);

  return (
    <CartContext.Provider value={{ state, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 