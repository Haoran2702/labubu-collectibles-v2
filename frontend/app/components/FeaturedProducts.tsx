"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "../contexts/CartContext";
import { useToast } from "./Toast";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";

interface Product {
  id: number;
  name: string;
  collection: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
}

export default function FeaturedProducts() {
  const { addItem, state } = useCart();
  const { addToast } = useToast();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        const products = data.products || data;
        
        // Separate secrets from other products (including out of stock)
        const secrets = products.filter((product: Product) => 
          product.name.toLowerCase().includes('(secret)')
        );
        const otherProducts = products.filter((product: Product) => 
          !product.name.toLowerCase().includes('(secret)')
        );
        
        // Shuffle arrays for randomness
        const shuffleArray = (array: Product[]) => {
          const shuffled = [...array];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        };
        
        const shuffledSecrets = shuffleArray(secrets);
        const shuffledOtherProducts = shuffleArray(otherProducts);
        
        // Select 3 products: prioritize secrets first, then fill with others
        let selectedProducts: Product[] = [];
        
        // Add up to 3 secrets (even if out of stock)
        selectedProducts.push(...shuffledSecrets.slice(0, 3));
        
        // If we don't have 3 secrets, fill with other products
        if (selectedProducts.length < 3) {
          const remainingSlots = 3 - selectedProducts.length;
          selectedProducts.push(...shuffledOtherProducts.slice(0, remainingSlots));
        }
        
        setFeatured(selectedProducts);
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Helper function to get display name for products
  const getDisplayName = (product: Product) => {
    if (product.name === 'Box') {
      return `${product.collection} - Blind Box`;
    }
    if (product.name.toLowerCase().includes('(secret)')) {
      // e.g. "Bul (Secret)" => "Bul - Secret"
      return product.name.replace(/\s*\(secret\)/i, ' - Secret');
    }
    return product.name;
  };

  // Helper to get cart count for a product
  const getCartCount = (productId: number) => {
    return state.items.filter((item: any) => item.id === productId).reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
  };

  // Stock status helper
  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return {
        label: "Out of Stock",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        canAddToCart: false
      };
    } else if (stock <= 3) {
      return {
        label: `Only ${stock} left`,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        canAddToCart: true
      };
    } else {
      return {
        label: null,
        color: "",
        bgColor: "",
        borderColor: "",
        canAddToCart: true
      };
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Labubu Collectibles</h2>
            <p className="text-xl text-gray-500">Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Labubu Collectibles</h2>
          <p className="text-xl text-gray-500">Explore our most popular Labubu toys and figures.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16 max-w-4xl mx-auto">
          {featured.map(product => {
            const stockStatus = getStockStatus(product.stock);
            return (
              <div key={product.id} className="flex flex-col items-center text-center bg-white rounded-2xl transition-transform duration-200 hover:scale-105 p-0 shadow-none min-h-[420px]">
                <div className="w-full flex-1 flex items-center justify-center mb-6 relative">
                  <img
                    src={product.imageUrl}
                    alt={getDisplayName(product)}
                    className={`w-full max-w-[240px] max-h-[240px] object-contain rounded-xl bg-white transition-all duration-200 ${!stockStatus.canAddToCart ? 'opacity-50 grayscale' : ''}`}
                    style={{ background: '#fff' }}
                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-product.svg'; }}
                  />
                  {/* Stock overlay for out of stock */}
                  {!stockStatus.canAddToCart && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm">
                        Out of Stock
                      </span>
                    </div>
                  )}
                  {/* Low stock banner at bottom of image */}
                  {stockStatus.label && product.stock > 0 && (
                    <div className="absolute bottom-0 left-0 right-0">
                      <div className={`px-3 py-1.5 text-xs font-medium ${stockStatus.color} ${stockStatus.bgColor} rounded-xl`}>
                        {stockStatus.label}
                      </div>
                    </div>
                  )}
                </div>
                <h3 className={`text-lg font-semibold mb-2 tracking-tight font-sans ${product.name.toLowerCase().includes('(secret)') ? 'bg-gradient-to-r from-[#C9B037] via-[#FFD700] to-[#C9B037] text-transparent bg-clip-text' : 'text-gray-900'}`}>
                  {getDisplayName(product)}
                </h3>
                <span className="text-2xl font-bold text-gray-900 mb-2">${product.price.toFixed(2)}</span>
                
                <div className="flex items-center gap-2 justify-center w-full">
                  <Link
                    href={`/products/${product.id}`}
                    className="px-5 py-2 rounded-full border border-gray-200 text-gray-700 font-medium bg-white hover:bg-gray-50 transition-colors duration-200 text-base"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => {
                      if (!stockStatus.canAddToCart) {
                        addToast({ 
                          type: 'error', 
                          title: 'Out of Stock', 
                          message: 'This item is currently out of stock.' 
                        });
                        return;
                      }
                      const displayName = getDisplayName(product);
                      addItem({ id: product.id, name: displayName, price: product.price, image: product.imageUrl });
                      addToast({ type: 'success', title: 'Added to cart!', message: `${displayName} has been added to your cart.` });
                    }}
                    disabled={!stockStatus.canAddToCart}
                    className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 ${
                      stockStatus.canAddToCart 
                        ? 'bg-black hover:bg-gray-800' 
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                    aria-label="Add to cart"
                  >
                    <ShoppingCartIcon className={`w-5 h-5 ${stockStatus.canAddToCart ? 'text-white' : 'text-gray-500'}`} />
                    {/* Cart Quantity Badge */}
                    {(() => {
                      const cartCount = getCartCount(product.id);
                      return cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[1.5rem] h-6 px-2 flex items-center justify-center rounded-full bg-white border border-gray-300 text-xs font-bold text-gray-800 shadow-sm">
                          {cartCount}
                        </span>
                      );
                    })()}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
} 