"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAdminToken, isTokenValid } from "@/lib/admin-api";

export default function AdminLoginPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setAdminToken(token);
    try {
      const valid = await isTokenValid();
      if (!valid) {
        setError("Invalid admin token.");
        setLoading(false);
        return;
      }
      router.push("/admin/products");
    } catch {
      setError("Could not reach the products service. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 font-display text-3xl font-bold text-ink">CMS Login</h1>
      <p className="mb-6 text-sm text-ink/60">
        Enter the admin token (set via <code>ADMIN_TOKEN</code> on the products-service).
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="password"
          required
          placeholder="Admin token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="rounded-lg border border-black/10 px-4 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Checking…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
