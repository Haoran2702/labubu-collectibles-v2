"use client";

import { useParams, notFound } from "next/navigation";
import { useCart } from "../../contexts/CartContext";
import { useToast } from "../../components/Toast";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import Head from "next/head";
import StructuredData from "../../components/StructuredData";
import ProductReviews from "../../components/ProductReviews";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  image: string;
  stock: number;
  collection: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetails() {
  const params = useParams();
  const id = typeof params.id === "string" ? parseInt(params.id, 10) : Array.isArray(params.id) ? parseInt(params.id[0], 10) : 0;
  const { addItem, removeItem, updateQuantity, state } = useCart();
  const { addToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            return notFound();
          }
          throw new Error('Failed to fetch product');
        }
        const productData = await res.json();
        setProduct(productData);

        // Fetch related products from the same collection
        const allRes = await fetch('/api/products');
        const allData = await allRes.json();
        const allProducts = allData.products || allData;
        const related = allProducts.filter((p: Product) => 
          p.collection === productData.collection && p.id !== productData.id
        );
        setRelatedProducts(related);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!product) return notFound();

  // Get display name helper
  const getDisplayName = (prod: Product) => {
    if (prod.name === 'Box') {
      return `${prod.collection} - Blind Box`;
    }
    if (prod.name.toLowerCase().includes('(secret)')) {
      return prod.name.replace(/\s*\(secret\)/i, ' - Secret');
    }
    return prod.name;
  };

  // Cart count for badge and quantity
  const cartCount = state.items.find((item: any) => item.id === product.id)?.quantity || 0;

  // Stock status helpers
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
        label: `Only ${stock} left in stock`,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200", 
        canAddToCart: true
      };
    }
    if (stock <= 10) {
      return {
        label: `${stock} in stock`,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        canAddToCart: true
      };
    }
    return {
      label: "In stock",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      canAddToCart: true
    };
  };

  const stockStatus = getStockStatus(product.stock);
  const canAddToCart = stockStatus.canAddToCart && (product.stock > 3 || cartCount < product.stock);

  const handleAddToCart = async () => {
    if (!canAddToCart) {
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
          // Refresh product data
          const refreshRes = await fetch(`/api/products/${id}`);
          if (refreshRes.ok) {
            const refreshedProduct = await refreshRes.json();
            setProduct(refreshedProduct);
          }
          return;
        }
      } catch (error) {
        console.error('Stock check failed:', error);
      }
    }

    addItem({
      id: product.id,
      name: getDisplayName(product),
      price: product.price,
      image: product.imageUrl || product.image
    });

    addToast({
      type: 'success',
      title: 'Added to cart!',
      message: `${getDisplayName(product)} has been added to your cart.`
    });
  };

  const handleUpdateQuantity = (newQuantity: number) => {
    // Only restrict quantity updates for low stock items (≤3)
    if (product.stock <= 3 && newQuantity > product.stock) {
      addToast({
        type: 'error',
        title: 'Not enough stock',
        message: `Only ${product.stock} items available`
      });
      return;
    }
    updateQuantity(product.id, newQuantity);
  };

  // Product details
  const details = {
    size: "10cm / 4in",
    material: "Soft vinyl",
    finish: "Matte",
    color: product.description,
    series: product.collection,
    edition: product.name.toLowerCase().includes('secret') ? 'Secret' : 'Regular',
    availability: stockStatus.label,
    year: '2024',
    brand: 'The Monsters / Pop Mart',
    designer: 'Kasing Lung',
    certificate: product.name.toLowerCase().includes('box') ? 'No' : 'Yes',
    rarity: product.name.toLowerCase().includes('secret') ? 'Secret' : 'Regular',
  };

  const isSecret = product.name.toLowerCase().includes('secret');

  return (
    <>
      {product && (
        <Head>
          <title>{getDisplayName(product)} - Labubu Collectibles</title>
          <meta name="description" content={`${getDisplayName(product)} - ${product.description}. Price: $${product.price.toFixed(2)}. ${stockStatus.label}.`} />
          <meta name="keywords" content={`Labubu, ${product.name}, ${product.collection}, collectible, figure, toy`} />
          <meta name="author" content="Labubu Collectibles" />
          <meta name="robots" content="index, follow" />
          <meta property="og:title" content={`${getDisplayName(product)} - Labubu Collectibles`} />
          <meta property="og:description" content={`${getDisplayName(product)} - ${product.description}. Price: $${product.price.toFixed(2)}.`} />
          <meta property="og:image" content={product.imageUrl || product.image} />
          <meta property="og:url" content={`https://labubu.com/products/${product.id}`} />
          <meta property="og:type" content="product" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={`${getDisplayName(product)} - Labubu Collectibles`} />
          <meta name="twitter:description" content={`${getDisplayName(product)} - ${product.description}. Price: $${product.price.toFixed(2)}.`} />
          <meta name="twitter:image" content={product.imageUrl || product.image} />
          <meta property="product:price:amount" content={product.price.toString()} />
          <meta property="product:price:currency" content="USD" />
          <meta property="product:availability" content={stockStatus.canAddToCart ? "in stock" : "out of stock"} />
          <StructuredData type="product" data={product} />
        </Head>
      )}
      <div className="min-h-screen bg-white flex flex-col items-center py-16 px-4">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
          <Link href="/products" className="mb-8 text-gray-400 hover:text-black text-sm font-medium tracking-wide">← Back to Products</Link>
          
          <div className="relative w-full max-w-[360px] mb-8">
            <img
              src={product.imageUrl || product.image}
              alt={getDisplayName(product)}
              className={`w-full max-h-[360px] object-contain rounded-2xl bg-white transition-all duration-200 ${!stockStatus.canAddToCart ? 'opacity-50 grayscale' : ''}`}
              style={{ background: '#fff' }}
              onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-product.svg'; }}
            />
            {!stockStatus.canAddToCart && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold text-lg">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          <h1 className={`text-4xl font-bold mb-2 text-center tracking-tight font-sans ${isSecret ? 'bg-gradient-to-r from-[#C9B037] via-[#FFD700] to-[#C9B037] text-transparent bg-clip-text' : 'text-gray-900'}`}>
            {getDisplayName(product)}
          </h1>
          
          <div className="text-2xl font-bold text-gray-900 mb-4 text-center">${product.price.toFixed(2)}</div>
          
          {/* Stock Status */}
          <div className={`mb-6 px-4 py-2 rounded-full text-sm font-medium ${stockStatus.color} ${stockStatus.bgColor} border ${stockStatus.borderColor}`}>
            {stockStatus.label}
          </div>

          <div className="flex items-center gap-4 mb-10">
            {cartCount === 0 ? (
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className={`px-10 py-3 rounded-full font-semibold shadow-none text-lg tracking-wide focus:outline-none focus:ring-2 focus:ring-black/20 ${
                  canAddToCart 
                    ? 'bg-black hover:bg-gray-800 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCartIcon className="w-6 h-6 mr-2 inline" /> 
                {stockStatus.canAddToCart ? 'Add to Cart' : 'Out of Stock'}
              </button>
            ) : (
              <div className="flex items-center border-0 rounded-full px-3 py-2 bg-gray-100 gap-4">
                <button 
                  onClick={() => handleUpdateQuantity(Math.max(0, cartCount - 1))} 
                  className="text-xl px-2 py-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  -
                </button>
                <span className="mx-2 w-8 text-center font-semibold">{cartCount}</span>
                <button 
                  onClick={() => handleUpdateQuantity(cartCount + 1)} 
                  disabled={product.stock <= 3 && cartCount >= product.stock}
                  className="text-xl px-2 py-1 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            )}
          </div>

          <details className="w-full mb-10">
            <summary className="cursor-pointer text-gray-700 text-base font-medium mb-2">Product Details</summary>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mt-4">
              <div className="text-gray-500">Size</div><div className="text-gray-900 font-medium">{details.size}</div>
              <div className="text-gray-500">Material</div><div className="text-gray-900 font-medium">{details.material}</div>
              <div className="text-gray-500">Finish</div><div className="text-gray-900 font-medium">{details.finish}</div>
              <div className="text-gray-500">Color</div><div className="text-gray-900 font-medium">{details.color}</div>
              <div className="text-gray-500">Series</div><div className="text-gray-900 font-medium">{details.series}</div>
              <div className="text-gray-500">Edition</div><div className="text-gray-900 font-medium">{details.edition}</div>
              <div className="text-gray-500">Availability</div><div className={`font-medium ${stockStatus.color}`}>{details.availability}</div>
              <div className="text-gray-500">Release Year</div><div className="text-gray-900 font-medium">{details.year}</div>
              <div className="text-gray-500">Brand</div><div className="text-gray-900 font-medium">{details.brand}</div>
              <div className="text-gray-500">Designer</div><div className="text-gray-900 font-medium">{details.designer}</div>
              <div className="text-gray-500">Certificate</div><div className="text-gray-900 font-medium">{details.certificate}</div>
              <div className="text-gray-500">Rarity</div><div className="text-gray-900 font-medium">{details.rarity}</div>
            </div>
          </details>

          <div className="w-full mb-10">
            <div className="text-gray-700 text-base font-light italic text-center mb-4">{product.description}</div>
          </div>

          {relatedProducts.length > 0 && (
            <div className="w-full">
              <div className="font-semibold mb-4 text-gray-900 text-center">From the same series</div>
              <div className="flex flex-wrap gap-4 justify-center">
                {relatedProducts.map((related) => (
                  <Link key={related.id} href={`/products/${related.id}`} className="flex flex-col items-center w-16">
                    <img 
                      src={related.imageUrl || related.image} 
                      alt={getDisplayName(related)} 
                      className="w-12 h-12 object-contain rounded bg-white mb-1" 
                    />
                    <span className="text-xs text-gray-500 text-center line-clamp-2">{related.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Product Reviews */}
          <ProductReviews productId={product.id} productName={getDisplayName(product)} />
        </div>
      </div>
    </>
  );
} 