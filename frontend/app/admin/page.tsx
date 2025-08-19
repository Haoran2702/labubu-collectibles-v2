import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="min-h-[60vh] bg-white flex flex-col items-center justify-center py-16 px-4">
      <div className="max-w-4xl w-full mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">Admin Dashboard</h1>
        <p className="text-xl text-gray-500 mb-12">Welcome to the admin section. Use the navigation above to manage products and orders.</p>
        <div className="flex justify-center gap-6">
          <Link href="/admin/products" className="px-8 py-3 rounded-full bg-black text-white font-medium transition-colors hover:bg-gray-800">Products</Link>
          <Link href="/admin/orders" className="px-8 py-3 rounded-full bg-black text-white font-medium transition-colors hover:bg-gray-800">Orders</Link>
        </div>
      </div>
    </div>
  );
} 