"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/Toast";
import { apiCall } from '../../utils/api';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  collection: string;
  createdAt: string;
  updatedAt: string;
}

const API_URL = "/api/products";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updatingStock, setUpdatingStock] = useState<number | null>(null);
  const [showStockHistory, setShowStockHistory] = useState<number | null>(null);
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const router = useRouter();
  const { addToast } = useToast();

  function getToken() {
    return sessionStorage.getItem("admin_jwt") || "";
  }

  // Auth check
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    apiCall("/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.user || data.user.role !== "admin") {
          sessionStorage.removeItem("admin_jwt");
          router.replace("/admin/login");
        } else {
          setAuthChecked(true);
        }
      })
      .catch(() => {
        sessionStorage.removeItem("admin_jwt");
        router.replace("/admin/login");
      });
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authChecked) fetchProducts();
  }, [authChecked]);

  const updateStock = async (productId: number, operation: 'increase' | 'decrease', amount: number = 1) => {
    setUpdatingStock(productId);
    try {
      const res = await fetch(`${API_URL}/${productId}/stock`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ operation, stock: amount }),
      });
      
      if (!res.ok) throw new Error("Failed to update stock");
      
      const updatedProduct = await res.json();
      setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
      
      addToast({
        type: 'success',
        title: 'Stock Updated',
        message: `Stock ${operation}d by ${amount}`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message
      });
    } finally {
      setUpdatingStock(null);
    }
  };

  const handleEditProduct = async (editedProduct: Product) => {
    try {
      const res = await fetch(`${API_URL}/${editedProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: editedProduct.name,
          description: editedProduct.description,
          price: editedProduct.price,
          imageUrl: editedProduct.imageUrl,
          collection: editedProduct.collection
        }),
      });
      
      if (!res.ok) throw new Error("Failed to update product");
      
      const updatedProduct = await res.json();
      setProducts(prev => prev.map(p => p.id === editedProduct.id ? updatedProduct : p));
      setShowEditModal(false);
      setEditingProduct(null);
      
      addToast({
        type: 'success',
        title: 'Product Updated',
        message: 'Product information updated successfully'
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message
      });
    }
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return "bg-red-100 text-red-800";
    if (stock <= 3) return "bg-yellow-100 text-yellow-800";
    if (stock <= 10) return "bg-blue-100 text-blue-800";
    return "bg-green-100 text-green-800";
  };

  const getStockLabel = (stock: number) => {
    if (stock === 0) return "Out of Stock";
    if (stock <= 3) return `${stock} Left`;
    return `${stock} In Stock`;
  };

  const fetchStockMovements = async (productId: number) => {
    try {
      const res = await fetch(`${API_URL}/${productId}/stock-movements`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      
      if (!res.ok) throw new Error("Failed to fetch stock movements");
      
      const data = await res.json();
      setStockMovements(data.movements || []);
      setShowStockHistory(productId);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load stock movements'
      });
    }
  };

  // Group products by collection
  const collections = products.reduce((acc, product) => {
    const collection = product.collection || "Other";
    if (!acc[collection]) acc[collection] = [];
    acc[collection].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">Product Management</h1>
          <p className="text-xl text-gray-500 mb-8">Manage inventory and product information</p>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(collections).map(([collectionName, collectionProducts]) => (
              <div key={collectionName} className="space-y-6">
                <div className="text-center">
                  <span className="text-gray-400 text-sm font-medium uppercase tracking-widest">
                    {collectionName}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {collectionProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-gray-100 p-6 transition-all duration-200 hover:shadow-md hover:border-gray-200"
                    >
                      {/* Product Image */}
                      <div className="w-full h-32 mb-4 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-gray-400 text-sm">No Image</div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                        <p className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</p>
                      </div>

                      {/* Stock Status */}
                      <div className="mb-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStockColor(product.stock)}`}>
                          {getStockLabel(product.stock)}
                        </span>
                      </div>

                      {/* Stock Controls */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => updateStock(product.id, 'decrease')}
                            disabled={updatingStock === product.id || product.stock === 0}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-gray-600 font-bold transition-colors"
                          >
                            −
                          </button>
                          
                          <span className="text-lg font-semibold text-gray-900 min-w-[3rem] text-center">
                            {product.stock}
                          </span>
                          
                          <button
                            onClick={() => updateStock(product.id, 'increase')}
                            disabled={updatingStock === product.id}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-gray-600 font-bold transition-colors"
                          >
                            +
                          </button>
                        </div>

                        {/* Quick Stock Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStock(product.id, 'increase', 10)}
                            disabled={updatingStock === product.id}
                            className="flex-1 px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => updateStock(product.id, 'increase', 50)}
                            disabled={updatingStock === product.id}
                            className="flex-1 px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
                          >
                            +50
                          </button>
                        </div>

                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setShowEditModal(true);
                          }}
                          className="w-full py-2 px-4 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium"
                        >
                          Edit Product
                        </button>
                        
                        {/* Stock History Button */}
                        <button
                          onClick={() => fetchStockMovements(product.id)}
                          className="w-full py-2 px-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors text-sm font-medium"
                        >
                          Stock History
                        </button>
                        
                        {/* Forecast Button */}
                        <button
                          onClick={() => router.push(`/admin/forecasting?product=${product.id}`)}
                          className="w-full py-2 px-4 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-colors text-sm font-medium"
                        >
                          Generate Forecast
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Product Modal */}
        {showEditModal && editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Edit Product</h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProduct(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editingProduct) handleEditProduct(editingProduct);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={editingProduct.description || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
                    <input
                      type="text"
                      value={editingProduct.collection || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, collection: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={editingProduct.imageUrl || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingProduct(null);
                      }}
                      className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Stock History Modal */}
        {showStockHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Stock Movement History</h2>
                  <button
                    onClick={() => {
                      setShowStockHistory(null);
                      setStockMovements([]);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                {stockMovements.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No stock movements found for this product.</p>
                ) : (
                  <div className="space-y-4">
                    {stockMovements.map((movement: any) => (
                      <div key={movement.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              movement.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                            </span>
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {movement.movementType.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(movement.createdAt).toLocaleDateString()} {new Date(movement.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Reason:</span> {movement.reason}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Stock:</span> {movement.previousStock} → {movement.newStock}
                          {movement.userEmail && (
                            <span className="ml-4">
                              <span className="font-medium">By:</span> {movement.userEmail}
                            </span>
                          )}
                          {movement.orderId && (
                            <span className="ml-4">
                              <span className="font-medium">Order:</span> {movement.orderId}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 