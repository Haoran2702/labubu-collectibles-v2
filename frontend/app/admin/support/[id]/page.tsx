"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiCall } from '../../../utils/api';

interface Ticket {
  id: string;
  subject: string;
  email: string;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  message: string;
}
interface Message {
  id: number;
  sender: string;
  message: string;
  createdAt: string;
}

const STATUS_OPTIONS = ["open", "closed"];

export default function AdminTicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!ticketId) return;
    fetchTicket();
    // eslint-disable-next-line
  }, [ticketId]);

  async function fetchTicket() {
    setLoading(true);
    setError("");
    try {
      const token = sessionStorage.getItem("admin_jwt");
      const res = await apiCall(`/api/support/${ticketId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Ticket not found or access denied");
      const data = await res.json();
      setTicket(data.ticket);
      setMessages(data.messages || []);
      setStatus(data.ticket.status);
      setChatMessages([
        { sender: 'user', message: data.ticket.message, createdAt: data.ticket.createdAt },
        ...(data.messages || [])
      ]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    setReplyLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = sessionStorage.getItem("admin_jwt");
      const res = await apiCall(`/api/support/${ticketId}/reply`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: reply }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send reply");
      }
      setSuccess("Reply sent!");
      setReply("");
      fetchTicket();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReplyLoading(false);
    }
  }

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setStatusLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = sessionStorage.getItem("admin_jwt");
      const res = await apiCall(`/api/support/${ticketId}/status`, {
        method: "PUT",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      setStatus(newStatus);
      setSuccess("Status updated!");
      fetchTicket();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStatusLoading(false);
    }
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto py-12 px-4 text-gray-500">Loading ticket...</div>;
  }
  if (error) {
    return <div className="max-w-2xl mx-auto py-12 px-4 text-red-500">{error}</div>;
  }
  if (!ticket) {
    return <div className="max-w-2xl mx-auto py-12 px-4 text-gray-500">Ticket not found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Link href="/admin/support" className="text-blue-600 hover:underline text-sm">&larr; Back to Tickets</Link>
      <h1 className="text-2xl font-bold mt-4 mb-2">{ticket.subject}</h1>
      <div className="mb-2 text-xs text-gray-500">From: <span className="font-semibold">{ticket.email}</span></div>
      <div className="mb-2 text-xs text-gray-500">Type: <span className="font-semibold">{ticket.type}</span></div>
      <div className="mb-2 text-xs text-gray-500">Created: {new Date(ticket.createdAt).toLocaleString()}</div>
      <div className="mb-6 text-xs text-gray-400">Last updated: {new Date(ticket.updatedAt).toLocaleString()}</div>
      <div className="flex items-center gap-4 mb-6">
        <label className="text-sm font-medium">Status:</label>
        <select
          value={status}
          onChange={handleStatusChange}
          className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-900 focus:outline-none"
          disabled={statusLoading}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
          ))}
        </select>
        {statusLoading && <span className="text-xs text-gray-500 ml-2">Updating...</span>}
      </div>
      <div className="bg-white border rounded-2xl p-4 mb-6 max-h-96 overflow-y-auto flex flex-col gap-2">
        {chatMessages.length === 0 ? (
          <div className="text-gray-500">No conversation yet.</div>
        ) : (
          chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={msg.sender === 'admin'
                ? 'self-end bg-purple-100 text-purple-900 rounded-lg px-3 py-2 text-sm max-w-[80%]'
                : 'self-start bg-gray-100 text-gray-900 rounded-lg px-3 py-2 text-sm max-w-[80%]'}
            >
              <div className="text-xs mb-1 opacity-60">
                {msg.sender === 'admin' ? 'Support' : 'Customer'} · {new Date(msg.createdAt).toLocaleString()}
              </div>
              {msg.message}
            </div>
          ))
        )}
      </div>
      {status !== "closed" && (
        <form onSubmit={handleReply} className="flex items-center gap-2 mt-4">
          <textarea
            placeholder="Type your reply..."
            value={reply}
            onChange={e => setReply(e.target.value)}
            className="flex-1 px-3 py-2 rounded-full border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 text-sm min-h-[40px]"
            required
            disabled={replyLoading}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-black text-white font-semibold text-sm tracking-wide hover:bg-gray-800 transition-colors"
            disabled={replyLoading || !reply.trim()}
          >
            {replyLoading ? "Sending..." : "Send"}
          </button>
        </form>
      )}
    </div>
  );
} 