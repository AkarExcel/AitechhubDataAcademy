"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Missing reset token. Please request a new password reset link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--na-gray-50)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.25rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        {/* Brand Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.625rem",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "var(--radius-md)",
                background: "linear-gradient(135deg, var(--na-navy-800), var(--na-blue-500))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                boxShadow: "0 2px 8px rgba(0, 44, 75, 0.25)",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19h16M4 15l4-8 4 6 4-3 4 5" />
              </svg>
            </div>
            <div style={{ textAlign: "left", lineHeight: 1.15 }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "1.125rem",
                  color: "var(--na-gray-900)",
                  display: "block",
                }}
              >
                AitecHub
              </span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  color: "var(--na-blue-500)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Data Academy
              </span>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid var(--na-gray-200)",
            boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.06)",
            padding: "2.5rem 2rem",
          }}
        >
          {!token ? (
            /* INVALID TOKEN STATE */
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#fff1f2",
                  border: "1px solid #fecdd3",
                  color: "#e11d48",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>

              <h1
                style={{
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  color: "var(--na-gray-900)",
                  marginBottom: "0.5rem",
                }}
              >
                Invalid or Missing Link
              </h1>

              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--na-gray-600)",
                  lineHeight: 1.6,
                  marginBottom: "1.5rem",
                }}
              >
                This password reset link is invalid or incomplete. Please request a new link from the forgot password page.
              </p>

              <Link
                href="/forgot-password"
                className="btn btn-green"
                style={{
                  display: "inline-flex",
                  width: "100%",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "9999px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Request New Reset Link
              </Link>
            </div>
          ) : success ? (
            /* SUCCESS STATE */
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "var(--na-green-50)",
                  border: "1px solid var(--na-green-200)",
                  color: "var(--na-green-600)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>

              <h2
                style={{
                  fontSize: "1.375rem",
                  fontWeight: 700,
                  color: "var(--na-gray-900)",
                  marginBottom: "0.5rem",
                }}
              >
                Password Updated!
              </h2>

              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--na-gray-600)",
                  lineHeight: 1.6,
                  marginBottom: "1.75rem",
                }}
              >
                Your password has been securely reset. You can now log into your account using your new password.
              </p>

              <Link
                href="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  padding: "0.85rem 1.5rem",
                  background: "var(--na-green-400)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  borderRadius: "9999px",
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(106, 191, 75, 0.35)",
                }}
              >
                Continue to Sign In
              </Link>
            </div>
          ) : (
            /* RESET FORM */
            <>
              <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
                <h1
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "var(--na-gray-900)",
                    marginBottom: "0.5rem",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Set new password
                </h1>
                <p style={{ fontSize: "0.875rem", color: "var(--na-gray-600)" }}>
                  Must be at least 8 characters long.
                </p>
              </div>

              {error && (
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    background: "#fef2f2",
                    border: "1px solid #fca5a5",
                    borderRadius: "var(--radius-md)",
                    color: "#991b1b",
                    fontSize: "0.875rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label
                    htmlFor="reset-password"
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--na-gray-700)",
                      marginBottom: "0.375rem",
                    }}
                  >
                    New Password
                  </label>
                  <input
                    id="reset-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--na-gray-300)",
                      fontSize: "0.9375rem",
                      outline: "none",
                      background: "#fff",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="reset-confirm"
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--na-gray-700)",
                      marginBottom: "0.375rem",
                    }}
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="reset-confirm"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--na-gray-300)",
                      fontSize: "0.9375rem",
                      outline: "none",
                      background: "#fff",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.85rem 1.5rem",
                    background: "var(--na-green-400)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.9375rem",
                    borderRadius: "9999px",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(106, 191, 75, 0.35)",
                    width: "100%",
                    marginTop: "0.5rem",
                  }}
                >
                  {loading ? "Updating password…" : "Reset Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--na-gray-50)" }} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
