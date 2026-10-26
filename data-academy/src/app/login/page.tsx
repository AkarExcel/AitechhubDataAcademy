"use client";

import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
      } else {
        const session = await getSession();
        const role = session?.user?.role;

        const explicitCallback = params.get("callbackUrl");
        let destination = "/dashboard";

        if (
          explicitCallback &&
          explicitCallback !== "/dashboard" &&
          explicitCallback !== "/login" &&
          explicitCallback !== "/"
        ) {
          destination = explicitCallback;
        } else if (role === "ADMIN") {
          destination = "/admin";
        } else if (role === "TUTOR") {
          destination = "/tutor";
        } else {
          destination = "/dashboard";
        }

        window.location.href = destination;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-neutral-50)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, var(--na-navy-800), var(--na-blue-500))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 2px 8px rgba(0, 44, 75, 0.25)",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19h16M4 15l4-8 4 6 4-3 4 5" />
              </svg>
            </div>
            <div style={{ textAlign: "left", lineHeight: 1.15 }}>
              <span style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--na-gray-900)", display: "block" }}>
                AitecHub
              </span>
              <span style={{ fontWeight: 700, fontSize: "0.75rem", color: "var(--na-blue-500)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Data Academy
              </span>
            </div>
          </Link>
        </div>

        <div className="card" style={{ padding: "2rem" }}>
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "0.375rem" }}>Welcome back</h1>
            <p style={{ fontSize: "0.875rem" }}>Log in to continue your learning journey</p>
          </div>

          {error && (
            <div style={{
              padding: "0.75rem 1rem",
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "var(--radius-md)",
              color: "#991b1b",
              fontSize: "0.875rem",
              marginBottom: "1.25rem",
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label htmlFor="login-email" className="label">Email address</label>
              <input
                id="login-email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                <label htmlFor="login-password" className="label" style={{ marginBottom: 0 }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: "0.8125rem", color: "var(--color-brand-600)" }}>
                  Forgot password?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: "0.5rem", justifyContent: "center", width: "100%", padding: "0.75rem" }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  Signing in…
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.875rem", marginTop: "1.5rem", color: "var(--color-neutral-500)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ fontWeight: 600, color: "var(--color-brand-600)" }}>
              Create one for free
            </Link>
          </p>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-neutral-400)", marginTop: "1.5rem" }}>
          By signing in you agree to our{" "}
          <Link href="/terms" style={{ color: "var(--color-neutral-500)" }}>Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" style={{ color: "var(--color-neutral-500)" }}>Privacy Policy</Link>.
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
