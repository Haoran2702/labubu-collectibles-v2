"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiCall } from '../utils/api';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function ContactPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : "",
    email: user?.email || "",
    message: ""
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);
  const [openChatTicket, setOpenChatTicket] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [notifiedTicketIds, setNotifiedTicketIds] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const notifiedTicketIdsRef = useRef<string[]>([]);

  // Sync form with user info
  useEffect(() => {
    setForm(f => ({
      ...f,
      name: user ? `${user.firstName} ${user.lastName}` : "",
      email: user?.email || ""
    }));
  }, [user]);

  // Store last seen message timestamp per ticket in localStorage
  function getLastSeen(ticketId: string) {
    return localStorage.getItem(`ticket_last_seen_${ticketId}`);
  }
  function setLastSeen(ticketId: string, timestamp: string) {
    localStorage.setItem(`ticket_last_seen_${ticketId}`, timestamp);
  }

  // Mark admin replies as read when chat is opened
  useEffect(() => {
    if (openChatTicket && chatMessages.length > 0) {
      const last = chatMessages[chatMessages.length - 1];
      setLastSeen(openChatTicket.id, last.createdAt);
      notifiedTicketIdsRef.current = notifiedTicketIdsRef.current.filter(id => id !== openChatTicket.id);
    }
    // eslint-disable-next-line
  }, [openChatTicket, chatMessages]);

  // Calculate notifiedTicketIds based on localStorage and latest replies
  function calculateNotifiedTicketIds(tickets: any[]) {
    const updated: string[] = [];
    tickets.forEach(ticket => {
      const lastMsg = (ticket.replies && ticket.replies.length > 0)
        ? ticket.replies[ticket.replies.length - 1]
        : null;
      if (lastMsg && lastMsg.sender === 'admin') {
        const lastSeen = getLastSeen(ticket.id);
        if (!lastSeen || new Date(lastMsg.createdAt) > new Date(lastSeen)) {
          updated.push(ticket.id);
        }
      }
    });
    notifiedTicketIdsRef.current = updated;
    setNotifiedTicketIds(updated);
  }

  // Only recalculate badge from localStorage and latest replies when tickets change
  useEffect(() => {
    calculateNotifiedTicketIds(tickets);
    // eslint-disable-next-line
  }, [tickets]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      // Actually POST the ticket to backend
      const body = {
        subject: `Contact form from ${form.name}`,
        message: form.message,
        email: form.email,
        userId: user?.id,
        type: "support"
      };
      const res = await apiCall("/api/support", {
        method: "POST",
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("Failed to submit ticket");
      setSuccess("Thank you for contacting us! We'll get back to you soon.");
      setForm(f => ({ ...f, message: "" }));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTickets() {
    setTicketsLoading(true);
    setTickets([]);
    try {
      const token = localStorage.getItem("authToken");
      const res = await apiCall("/api/support", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load tickets");
      const data = await res.json();
      // Only show tickets for this user
      let filtered = data.tickets || [];
      if (user) {
        filtered = filtered.filter((t: any) => t.userId === user.id || t.email === user.email);
      }
      // Fetch messages for each ticket to get latest replies
      const ticketsWithReplies = await Promise.all(filtered.map(async (ticket: any) => {
        try {
          const resMsg = await apiCall(`/api/support/${ticket.id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!resMsg.ok) return ticket;
          const dataMsg = await resMsg.json();
          return { ...ticket, replies: dataMsg.messages || [] };
        } catch {
          return ticket;
        }
      }));
      setTickets(ticketsWithReplies);
      calculateNotifiedTicketIds(ticketsWithReplies);
    } catch {
      setTickets([]);
      notifiedTicketIdsRef.current = [];
      setNotifiedTicketIds([]);
    } finally {
      setTicketsLoading(false);
    }
  }

  // On mount, recalculate badge if tickets are already loaded (e.g. after reload)
  useEffect(() => {
    if (tickets.length > 0) {
      calculateNotifiedTicketIds(tickets);
    }
    // eslint-disable-next-line
  }, [tickets]);

  // Fetch tickets on mount to ensure badge is correct after reload
  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line
  }, []);

  function handleShowTickets() {
    setShowTickets(true);
    fetchTickets();
  }

  async function openChat(ticket: any) {
    setOpenChatTicket(ticket);
    setShowTickets(false); // Close tickets modal when opening chat
    setChatMessages([]);
    // Mark as read immediately
    if (ticket.id) {
      const lastMsg = (ticket.replies && ticket.replies.length > 0)
        ? ticket.replies[ticket.replies.length - 1]
        : null;
      if (lastMsg) setLastSeen(ticket.id, lastMsg.createdAt);
      // Recalculate badge
      calculateNotifiedTicketIds(tickets.map(t => t.id === ticket.id ? { ...t, replies: ticket.replies } : t));
    }
    try {
      const token = localStorage.getItem("authToken");
      const res = await apiCall(`/api/support/${ticket.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch ticket");
      const data = await res.json();
      setChatMessages([
        { sender: 'user', message: data.ticket.message, createdAt: data.ticket.createdAt },
        ...(data.messages || [])
      ]);
    } catch {}
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyMessage.trim() || !openChatTicket) return;
    setSendingReply(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await apiCall(`/api/support/${openChatTicket.id}/reply`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: replyMessage })
      });
      if (!res.ok) throw new Error("Failed to send reply");
      // Refetch chat messages and tickets
      openChat(openChatTicket);
      fetchTickets();
      setReplyMessage("");
    } catch {}
    setSendingReply(false);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-8 tracking-tight">Contact Us</h1>
        <p className="text-xl text-gray-500 mb-10">Have a question or want to reach out? Fill out the form below and we’ll get back to you.</p>
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <input
            type="text"
            placeholder="Your Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 text-base"
            required
            disabled={!!user}
          />
          <input
            type="email"
            placeholder="Your Email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 text-base"
            required
            disabled={!!user}
          />
          <textarea
            placeholder="Your Message"
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 text-base min-h-[120px]"
            required
          />
          <button
            type="submit"
            className="w-full px-8 py-3 rounded-full bg-black text-white font-semibold text-lg tracking-wide hover:bg-gray-800 transition-colors"
            disabled={loading}
          >
            {loading ? "Sending…" : "Send Message"}
          </button>
          {user && (
            <button
              type="button"
              onClick={handleShowTickets}
              className="w-full px-8 py-3 rounded-full border border-gray-200 text-gray-700 font-medium bg-white hover:bg-gray-50 transition-colors duration-200 text-base mt-2 relative"
            >
              View My Tickets
              {notifiedTicketIds.length > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold shadow-lg border-2 border-white">
                  {notifiedTicketIds.length}
                </span>
              )}
            </button>
          )}
          {success && <div className="text-green-600 text-center mt-4">{success}</div>}
          {error && <div className="text-red-500 text-center mt-4">{error}</div>}
        </form>
      </div>
      {/* Tickets Modal */}
      {showTickets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 relative max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setShowTickets(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl font-bold"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">My Tickets</h2>
            {ticketsLoading ? (
              <div className="text-gray-500 text-center py-8">Loading…</div>
            ) : tickets.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No tickets found.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {tickets.map(ticket => (
                  <li key={ticket.id} className="py-4">
                    <div className="flex flex-col gap-1 relative">
                      <button
                        className="font-semibold text-gray-900 text-left w-full hover:underline"
                        onClick={() => openChat(ticket)}
                      >
                        {ticket.subject}
                        {notifiedTicketIds.includes(ticket.id) && (
                          <span className="ml-2 inline-block w-2 h-2 rounded-full bg-red-500 align-middle"></span>
                        )}
                      </button>
                      <div className="text-xs text-gray-500">Status: {ticket.status}</div>
                      <div className="text-xs text-gray-400">{new Date(ticket.updatedAt).toLocaleString()}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      {/* Chat-style ticket window */}
      {openChatTicket && (
        <div className="fixed bottom-6 right-6 z-50 w-80 max-w-full bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 rounded-t-2xl bg-gray-50">
            <div className="font-semibold text-gray-900 truncate pr-2">{openChatTicket.subject}</div>
            <button
              onClick={() => setOpenChatTicket(null)}
              className="text-gray-400 hover:text-black text-xl font-bold ml-2"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 max-h-80">
            <div className="text-xs text-gray-400 mb-2">Created: {new Date(openChatTicket.createdAt || openChatTicket.updatedAt).toLocaleString()}</div>
            <div className="flex flex-col gap-2">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={msg.sender === 'admin'
                    ? 'self-start bg-gray-100 rounded-lg px-3 py-2 text-purple-800 text-sm max-w-[80%]'
                    : 'self-end bg-black text-white rounded-lg px-3 py-2 text-sm max-w-[80%]'}
                >
                  <div className="text-xs mb-1 opacity-60">
                    {msg.sender === 'admin' ? 'Support' : 'You'} · {new Date(msg.createdAt).toLocaleString()}
                  </div>
                  {msg.message}
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={handleReply} className="flex items-center gap-2 border-t border-gray-100 px-4 py-3 bg-white rounded-b-2xl">
            <input
              type="text"
              value={replyMessage}
              onChange={e => setReplyMessage(e.target.value)}
              placeholder="Type your reply…"
              className="flex-1 px-3 py-2 rounded-full border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 text-sm"
              disabled={sendingReply}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-black text-white font-semibold text-sm tracking-wide hover:bg-gray-800 transition-colors"
              disabled={sendingReply || !replyMessage.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
} 