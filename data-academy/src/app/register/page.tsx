"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      // Redirect to login with success message
      router.push("/login?registered=true");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-neutral-50)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
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
            <h1 style={{ fontSize: "1.5rem", marginBottom: "0.375rem" }}>Create your account</h1>
            <p style={{ fontSize: "0.875rem" }}>Start learning data skills for free today</p>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label htmlFor="reg-firstName" className="label">First name</label>
                <input
                  id="reg-firstName"
                  name="firstName"
                  type="text"
                  className="input"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Ada"
                  required
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label htmlFor="reg-lastName" className="label">Last name</label>
                <input
                  id="reg-lastName"
                  name="lastName"
                  type="text"
                  className="input"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Lovelace"
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="label">Email address</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                className="input"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="label">Password</label>
              <input
                id="reg-password"
                name="password"
                type="password"
                className="input"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="reg-confirmPassword" className="label">Confirm password</label>
              <input
                id="reg-confirmPassword"
                name="confirmPassword"
                type="password"
                className="input"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
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
                  Creating account…
                </span>
              ) : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.875rem", marginTop: "1.5rem", color: "var(--color-neutral-500)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ fontWeight: 600, color: "var(--color-brand-600)" }}>
              Sign in
            </Link>
          </p>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-neutral-400)", marginTop: "1.5rem" }}>
          By creating an account you agree to our{" "}
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
