"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiCall } from '../../utils/api';

interface Ticket {
  id: string;
  subject: string;
  email: string;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" }
];

const STATUS_COLORS = {
  open: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800"
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line
  }, [status, search]);

  async function fetchTickets() {
    setLoading(true);
    setError("");
    try {
      const token = sessionStorage.getItem("admin_jwt");
      const params = new URLSearchParams();
      if (status !== "all") params.append("status", status);
      if (search) params.append("search", search);
      const res = await apiCall(`/api/support?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load tickets");
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">Support Tickets</h1>
          <p className="text-xl text-gray-500 mb-8">Manage customer inquiries and general support requests.</p>
          <p className="text-sm text-gray-400 mb-8">Note: Order issues (returns, cancellations) are handled in Order Management.</p>
          
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatus(option.value)}
                  className={`px-5 py-2 rounded-full border text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-black/10 ${
                    status === option.value 
                      ? 'border-black text-black bg-gray-50' 
                      : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 w-80 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black text-sm"
                placeholder="Search by email or subject..."
              />
            </div>
          </div>
        </header>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400 text-lg">Loading tickets...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-red-500 text-lg">{error}</div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400 text-lg">No tickets found.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/admin/support/${ticket.id}`}
                className="group block"
              >
                <div className="bg-white rounded-2xl border border-gray-100 p-6 transition-all duration-200 hover:shadow-md hover:border-gray-200 hover:scale-[1.02] min-h-[200px] flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {ticket.subject}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">{ticket.email}</p>
                    </div>
                  </div>

                  {/* Status and Type */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[ticket.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {ticket.type}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="mt-auto pt-4 border-t border-gray-50">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Updated</span>
                      <span>{formatDate(ticket.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 