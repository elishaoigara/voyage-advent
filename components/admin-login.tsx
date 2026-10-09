"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
export function AdminLogin({ configured }: { configured: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: f.get("email"),
          password: f.get("password"),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-login">
      <img src="/images/logo.png" width="82" height="82" alt="Voyage Advent" />
      <p className="eyebrow">THE STORE, BEHIND THE SCENES</p>
      <h1>Welcome back.</h1>
      <p>Sign in to manage your collection and orders.</p>
      {!configured && (
        <div className="note">
          Staff access will be available once Supabase is connected. Follow the
          setup instructions in the repository.
        </div>
      )}
      <form onSubmit={submit}>
        <label className="field">
          Staff email
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            disabled={!configured}
          />
        </label>
        <label className="field">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            disabled={!configured}
          />
        </label>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <button className="button dark wide" disabled={busy || !configured}>
          {busy ? "Signing in…" : "Sign in"}
          <ArrowRight size={17} />
        </button>
      </form>
      <Link href="/">← Back to the storefront</Link>
    </div>
  );
}
