"use client";
import { useState } from "react";
import { apiCall } from './utils/api';

export default function EmailSignupForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<null | "success" | "error">(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setMessage("");
    try {
      const res = await apiCall("/api/email-signup", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      setStatus("success");
      setMessage("Thank you for signing up!");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-4 flex gap-2 justify-center" onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Your email"
        className="px-3 py-2 rounded border border-gray-300 bg-white text-gray-900 focus:outline-none"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        disabled={loading}
      />
      <button
        className="px-4 py-2 rounded bg-black text-white font-medium"
        type="submit"
        disabled={loading}
      >
        {loading ? "Signing up..." : "Notify Me"}
      </button>
      {status && (
        <span className={status === "success" ? "text-green-600 ml-2" : "text-red-600 ml-2"}>{message}</span>
      )}
    </form>
  );
} 