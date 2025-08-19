"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "../contexts/CartContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useToast } from "../components/Toast";
import ProductSearch from "../components/ProductSearch";
import CurrencySelector from "../components/CurrencySelector";
import LoadingSpinner from "../components/LoadingSpinner";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import Head from "next/head";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  image: string;
  stock: number;
  collection: string;
  series: string;
}

export default function Products() {
  const { addItem, state } = useCart();
  const { currency, formatPrice, convertPrice } = useCurrency();
  const { addToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const res = await fetch("/api/products");
      const data = await res.json();
      // If backend returns { products: [...] }
      setProducts(data.products || data);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  // Group products by collection/series if available
  const collections: Record<string, Product[]> = {};
  products.forEach((product) => {
    const collection = product.collection || product.series || "All";
    if (!collections[collection]) collections[collection] = [];
    collections[collection].push(product);
  });
  const collectionNames = Object.keys(collections);

  // Sort each collection: Box first, then Secret, then rest
  Object.keys(collections).forEach((col) => {
    collections[col] = collections[col].slice().sort((a, b) => {
      // Box first
      if (a.name === 'Box' && b.name !== 'Box') return -1;
      if (b.name === 'Box' && a.name !== 'Box') return 1;
      // Secret second
      const aSecret = a.name && a.name.toLowerCase().includes('(secret)');
      const bSecret = b.name && b.name.toLowerCase().includes('(secret)');
      if (aSecret && !bSecret) return -1;
      if (bSecret && !aSecret) return 1;
      // Otherwise, keep original order
      return 0;
    });
  });

  // Helper to get display name for Box and Secret
  const getDisplayName = (product: Product, collection: string) => {
    if (product.name === 'Box') {
      return `${collection} - Blind Box`;
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

  // Helper to get stock status and styling
  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return {
        label: "Out of Stock",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        canAddToCart: false
      };
    }
    if (stock <= 3) {
      return {
        label: `Last ${stock} remaining`,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        canAddToCart: true
      };
    }
    return {
      label: null,
      color: "",
      bgColor: "",
      borderColor: "",
      canAddToCart: true
    };
  };

  // Check if we can add more of this product to cart
  const canAddToCart = (product: Product) => {
    const cartCount = getCartCount(product.id);
    const stockStatus = getStockStatus(product.stock);
    
    // Only restrict cart additions for out of stock items or low stock items (≤3)
    if (!stockStatus.canAddToCart) return false; // Out of stock
    if (product.stock <= 3 && cartCount >= product.stock) return false; // Low stock limit
    
    // For items with good stock (>3), allow unlimited cart additions
    return true;
  };

  const handleAddToCart = async (product: Product, collection: string) => {
    if (!canAddToCart(product)) {
      if (product.stock === 0) {
        addToast({
          type: 'error',
          title: 'Cannot add to cart',
          message: 'This item is out of stock'
        });
      } else if (product.stock <= 3) {
        addToast({
          type: 'error',
          title: 'Cannot add to cart',
          message: `Only ${product.stock} remaining`
        });
      }
      return;
    }

    // For low stock items (≤3), check current stock availability
    if (product.stock <= 3) {
      try {
        const res = await fetch('/api/products/check-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{ productId: product.id, quantity: 1 }]
          })
        });
        
        const stockCheck = await res.json();
        if (!stockCheck.allAvailable) {
          addToast({
            type: 'error',
            title: 'Item unavailable',
            message: 'This item is no longer available'
          });
          // Refresh products to get updated stock
          const refreshRes = await fetch("/api/products");
          const refreshData = await refreshRes.json();
          setProducts(refreshData.products || refreshData);
          return;
        }
      } catch (error) {
        console.error('Stock check failed:', error);
      }
    }

    addItem({
      id: product.id,
      name: getDisplayName(product, collection),
      price: product.price,
      image: product.imageUrl || product.image
    });
    
    addToast({
      type: 'success',
      title: 'Added to cart!',
      message: `${getDisplayName(product, collection)} has been added to your cart.`
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading products..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Labubu Collections - Shop All Figures & Collectibles</title>
        <meta name="description" content="Discover and collect all Labubu figures and collectibles. Shop blind boxes, exclusive releases, and more." />
        <meta name="keywords" content="Labubu, Labubu figures, Labubu collectibles, blind boxes, collectible toys, Labubu merchandise" />
        <meta name="author" content="Labubu Collections" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Labubu Collections - Shop All Figures & Collectibles" />
        <meta property="og:description" content="Discover and collect all Labubu figures and collectibles. Shop blind boxes, exclusive releases, and more." />
        <meta property="og:image" content="/placeholder-product.svg" />
        <meta property="og:url" content="https://labubu.com/products" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Labubu Collections - Shop All Figures & Collectibles" />
        <meta name="twitter:description" content="Discover and collect all Labubu figures and collectibles. Shop blind boxes, exclusive releases, and more." />
        <meta name="twitter:image" content="/placeholder-product.svg" />
      </Head>
      <div className="max-w-6xl mx-auto px-4 py-16">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">Labubu Collections</h1>
          <p className="text-xl text-gray-500 mb-8">Explore all Labubu figures and collectibles.</p>
          
          {/* Currency Selector */}
          <div className="flex justify-center mb-6">
            <div className="w-64">
              <CurrencySelector showLabel={true} compact={false} />
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 mb-2">
            {collectionNames.map((col) => (
              <button
                key={col}
                onClick={() => setSelectedCollection(col === selectedCollection ? null : col)}
                className={`px-5 py-1 rounded-full border text-base font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black/10 ${selectedCollection === col ? 'border-black text-black bg-gray-50' : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'}`}
              >
                {col}
              </button>
            ))}
          </div>
        </header>
        {collectionNames.filter(col => !selectedCollection || col === selectedCollection).map((col, idx) => (
          <div key={col} className="mb-20">
            {collectionNames.length > 1 && (
              <div className={`flex items-center ${idx === 0 ? 'mb-8' : 'my-12'}`}>
                <span className="mx-auto text-gray-400 text-sm font-medium uppercase tracking-widest">{col}</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-16">
              {collections[col].map((product) => {
                const cartCount = getCartCount(product.id);
                const isSecret = product.name && product.name.toLowerCase().includes('(secret)');
                const stockStatus = getStockStatus(product.stock);
                const canAdd = canAddToCart(product);
                
                return (
                  <div
                    key={product.id}
                    className="flex flex-col items-center text-center bg-white rounded-2xl transition-transform duration-200 hover:scale-105 p-0 shadow-none min-h-[420px]"
                  >
                    <div className="w-full flex-1 flex items-center justify-center mb-6 relative">
                      <img 
                        src={product.imageUrl || product.image} 
                        alt={getDisplayName(product, col)}
                        className={`w-full max-w-[240px] max-h-[240px] object-contain rounded-xl bg-white transition-all duration-200 ${!stockStatus.canAddToCart ? 'opacity-50 grayscale' : ''}`}
                        style={{ background: '#fff' }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/placeholder-product.svg';
                        }}
                      />
                      {/* Stock overlay for out of stock */}
                      {!stockStatus.canAddToCart && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className={`text-lg font-semibold mb-2 tracking-tight font-sans ${isSecret ? 'bg-gradient-to-r from-[#C9B037] via-[#FFD700] to-[#C9B037] text-transparent bg-clip-text' : 'text-gray-900'}`}>
                      {getDisplayName(product, col)}
                    </h3>
                    
                    <span className="text-2xl font-bold text-gray-900 mb-2">{formatPrice(product.price)}</span>
                    
                    {/* Stock warning */}
                    {stockStatus.label && (
                      <div className={`mb-3 px-3 py-1 rounded-full text-xs font-medium ${stockStatus.color} ${stockStatus.bgColor} border ${stockStatus.borderColor}`}>
                        {stockStatus.label}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 justify-center w-full">
                      <Link
                        href={`/products/${product.id}`}
                        className="px-5 py-2 rounded-full border border-gray-200 text-gray-700 font-medium bg-white hover:bg-gray-50 transition-colors duration-200 text-base"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => handleAddToCart(product, col)}
                        disabled={!canAdd}
                        className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black/20 ${
                          canAdd 
                            ? 'bg-black hover:bg-gray-800' 
                            : 'bg-gray-300 cursor-not-allowed'
                        }`}
                        aria-label="Add to cart"
                      >
                        <ShoppingCartIcon className={`w-5 h-5 ${canAdd ? 'text-white' : 'text-gray-500'}`} />
                        {cartCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[1.5rem] h-6 px-2 flex items-center justify-center rounded-full bg-white border border-gray-300 text-xs font-bold text-gray-800 shadow-sm">
                            {cartCount}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 