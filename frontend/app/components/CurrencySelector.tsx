"use client";

import { useState, useRef, useEffect } from 'react';
import { useCurrency, CurrencyCode, CurrencyInfo } from '../contexts/CurrencyContext';

interface CurrencySelectorProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
  isDropdown?: boolean;
}

export default function CurrencySelector({ className = '', showLabel = true, compact = false, isDropdown = false }: CurrencySelectorProps) {
  const { currency: currentCurrency, setCurrency, supportedCurrencies, currencyInfo } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownMode, setIsDropdownMode] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if we're in dropdown mode (used in header)
  useEffect(() => {
    const parentElement = dropdownRef.current?.parentElement;
    if (parentElement && parentElement.classList.contains('relative')) {
      setIsDropdownMode(true);
    }
    // Also check if we're being used in a dropdown context by looking for specific classes
    if (parentElement && (parentElement.classList.contains('absolute') || parentElement.classList.contains('fixed'))) {
      setIsDropdownMode(true);
    }
  }, []);

  // Filter currencies based on search term
  const filteredCurrencies = supportedCurrencies.filter(currency =>
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCurrencySelect = (selectedCurrency: CurrencyCode) => {
    setCurrency(selectedCurrency);
    setIsOpen(false);
    setSearchTerm('');
    
    // If in dropdown mode, close the parent dropdown (header)
    if (isDropdownMode) {
      // Find and close the parent currency menu
      const event = new CustomEvent('currencySelected');
      window.dispatchEvent(event);
    }
  };

  const popularCurrencies: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'BRL', 'MXN', 'KRW', 'SGD', 'HKD'];

  // If in dropdown mode, just render the currency list
  if (isDropdownMode || isDropdown) {
    console.log('Rendering dropdown mode with new layout');
    return (
      <div className={className} ref={dropdownRef}>
        {/* Popular currencies section */}
        <div className="mb-4">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
            Popular Currencies
          </div>
          <div className="grid grid-cols-2 gap-1 p-2">
            {popularCurrencies.map((currencyCode) => {
              const currency = supportedCurrencies.find(c => c.code === currencyCode);
              if (!currency) return null;
              
              return (
                <button
                  key={currencyCode}
                  onClick={() => handleCurrencySelect(currencyCode)}
                  className={`flex items-center p-2 rounded-md text-left hover:bg-gray-50 transition-colors ${
                    currency.code === currentCurrency ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  <span className="text-lg mr-2">{currency.symbol}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{currency.code}</div>
                    <div className="text-xs text-gray-500 truncate">{currency.name}</div>
                  </div>
                  {currency.code === currentCurrency && (
                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search section */}
        <div className="border-t border-gray-100 pt-3">
          <div className="px-3 mb-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Search All Currencies
            </label>
          </div>
          <div className="px-3 mb-3">
            <input
              type="text"
              placeholder="Type currency name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
            />
          </div>
          
          {/* Search results */}
          {searchTerm && (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {filteredCurrencies.length > 0 ? (
                filteredCurrencies.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => handleCurrencySelect(currency.code)}
                    className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                      currency.code === currentCurrency ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    <span className="text-lg mr-3">{currency.symbol}</span>
                    <div className="flex-1">
                      <div className="font-medium">{currency.code}</div>
                      <div className="text-sm text-gray-500">{currency.name}</div>
                      <div className="text-xs text-gray-400">{currency.country}</div>
                    </div>
                    {currency.code === currentCurrency && (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-gray-500 text-sm">
                  No currencies found matching "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular dropdown mode
  console.log('Rendering regular dropdown mode with new layout');
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Currency
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-colors ${
          compact ? 'text-sm' : 'text-base'
        }`}
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">{currencyInfo.symbol}</span>
          <span className="font-medium">{currencyInfo.code}</span>
          {!compact && (
            <span className="text-gray-500 text-sm">({currencyInfo.name})</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[70vh] overflow-hidden">
          {/* Popular currencies section */}
          <div className="mb-4">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
              Popular Currencies
            </div>
            <div className="grid grid-cols-2 gap-1 p-2">
              {popularCurrencies.map((currencyCode) => {
                const currency = supportedCurrencies.find(c => c.code === currencyCode);
                if (!currency) return null;
                
                return (
                  <button
                    key={currencyCode}
                    onClick={() => handleCurrencySelect(currencyCode)}
                    className={`flex items-center p-2 rounded-md text-left hover:bg-gray-50 transition-colors ${
                      currency.code === currentCurrency ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    <span className="text-lg mr-2">{currency.symbol}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{currency.code}</div>
                      <div className="text-xs text-gray-500 truncate">{currency.name}</div>
                    </div>
                    {currency.code === currentCurrency && (
                      <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search section */}
          <div className="border-t border-gray-100 pt-3">
            <div className="px-3 mb-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Search All Currencies
              </label>
            </div>
            <div className="px-3 mb-3">
              <input
                type="text"
                placeholder="Type currency name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
              />
            </div>
            
            {/* Search results */}
            {searchTerm && (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {filteredCurrencies.length > 0 ? (
                  filteredCurrencies.map((currency) => (
                    <button
                      key={currency.code}
                      onClick={() => handleCurrencySelect(currency.code)}
                      className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                        currency.code === currentCurrency ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      <span className="text-lg mr-3">{currency.symbol}</span>
                      <div className="flex-1">
                        <div className="font-medium">{currency.code}</div>
                        <div className="text-sm text-gray-500">{currency.name}</div>
                        <div className="text-xs text-gray-400">{currency.country}</div>
                      </div>
                      {currency.code === currentCurrency && (
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                    No currencies found matching "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 