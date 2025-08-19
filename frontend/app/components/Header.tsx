"use client";

import Link from "next/link";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useState, useRef, useEffect } from "react";
import CartIcon from "./CartIcon";
import CurrencySelector from "./CurrencySelector";
import { useToast } from "../components/Toast";
import { useRouter } from "next/navigation";

export default function Header() {
  const { state } = useCart();
  const { user, logout } = useAuth();
  const { currencyInfo } = useCurrency();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  const currencyMenuButtonRef = useRef<HTMLButtonElement>(null);
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isUserMenuOpen && !isCurrencyMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      // Close user menu
      if (
        isUserMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node) &&
        userMenuButtonRef.current &&
        !userMenuButtonRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
      
      // Close currency menu
      if (
        isCurrencyMenuOpen &&
        currencyMenuRef.current &&
        !currencyMenuRef.current.contains(event.target as Node) &&
        currencyMenuButtonRef.current &&
        !currencyMenuButtonRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen, isCurrencyMenuOpen]);

  // Listen for currency selection to close dropdown
  useEffect(() => {
    function handleCurrencySelected() {
      setIsCurrencyMenuOpen(false);
    }
    
    window.addEventListener('currencySelected', handleCurrencySelected);
    return () => window.removeEventListener('currencySelected', handleCurrencySelected);
  }, []);

  const cartItemCount = state.items.reduce((total: number, item: any) => total + item.quantity, 0);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    addToast({
      type: "info",
      title: "Logged out",
      message: "You have been logged out."
    });
    router.push("/auth");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              <rect width="64" height="64" rx="12" fill="#FFD369"/>
              <text x="20" y="50" style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 44, fontWeight: 'bold', fill: '#222831' }}>L</text>
            </svg>
            <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>Labubu Collectibles</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-gray-700 hover:text-blue-600 transition-colors">
              Products
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 transition-colors">
              Contact
            </Link>
          </nav>

          {/* Cart and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Currency Selector */}
            <div className="hidden sm:block relative">
              <button
                ref={currencyMenuButtonRef}
                onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-700 hover:text-blue-600 transition-colors border border-gray-200 rounded-lg hover:border-gray-300"
              >
                <span className="text-lg">{currencyInfo.symbol}</span>
                <span className="font-medium">{currencyInfo.code}</span>
                <svg className={`w-3 h-3 transition-transform ${isCurrencyMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Currency Dropdown */}
              {isCurrencyMenuOpen && (
                <div 
                  ref={currencyMenuRef} 
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[1000]"
                  style={{ 
                    maxHeight: '70vh', 
                    minHeight: '400px',
                    overflowY: 'auto'
                  }}
                >
                  <div className="px-3 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900">Select Currency</h3>
                  </div>
                  <CurrencySelector 
                    showLabel={false} 
                    compact={true}
                    className="p-2"
                    isDropdown={true}
                  />
                </div>
              )}
            </div>
            
            <CartIcon />
            
            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  ref={userMenuButtonRef}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {user.firstName}
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div ref={userMenuRef} className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[1000]">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
                  }
                }}
                className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/products" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link 
                href="/about" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              {!user && (
                <Link 
                  href="/auth" 
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (typeof window !== 'undefined') {
                      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
                    }
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
} 