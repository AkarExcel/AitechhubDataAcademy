"use client";

import { useState, Suspense } from "react";
import Link from "next/link";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to process request. Please try again.");
      } else {
        setSubmittedEmail(email);
        if (data.devResetUrl) {
          setDevResetUrl(data.devResetUrl);
        }
        startCooldown();
      }
    } catch {
      setError("Unable to connect to the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !submittedEmail) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: submittedEmail }),
      });
      const data = await res.json();
      if (data.devResetUrl) {
        setDevResetUrl(data.devResetUrl);
      }
      startCooldown();
    } catch {
      setError("Failed to resend. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
      {/* Subtle background curved lines */}
      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 0,
        }}
        viewBox="0 0 1440 600"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M-50 100 C 300 20, 600 220, 1000 80 C 1200 -20, 1400 120, 1600 90"
          stroke="rgba(4, 159, 217, 0.08)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M-30 140 C 320 60, 620 260, 1020 120 C 1220 20, 1420 160, 1620 130"
          stroke="rgba(106, 191, 75, 0.08)"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>

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

        {/* Main Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid var(--na-gray-200)",
            boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.06)",
            padding: "2.5rem 2rem",
          }}
        >
          {!submittedEmail ? (
            /* FORM STATE */
            <>
              {/* Key Icon Badge */}
              <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
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
                    <circle cx="7.5" cy="15.5" r="5.5" />
                    <path d="m21 2-9.6 9.6" />
                    <path d="m15.5 7.5 3 3L22 7l-3-3" />
                  </svg>
                </div>
              </div>

              <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
                <h1
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "var(--na-gray-900)",
                    letterSpacing: "-0.02em",
                    marginBottom: "0.5rem",
                  }}
                >
                  Reset your password
                </h1>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--na-gray-600)",
                    lineHeight: 1.6,
                  }}
                >
                  Enter the email associated with your account, and we&apos;ll send you instructions to reset your password.
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
                    htmlFor="forgot-email"
                    style={{
                      display: "block",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--na-gray-700)",
                      marginBottom: "0.375rem",
                    }}
                  >
                    Email address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="learner@example.com"
                    autoComplete="email"
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--na-gray-300)",
                      fontSize: "0.9375rem",
                      outline: "none",
                      transition: "all var(--transition-fast)",
                      background: "#fff",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--na-green-500)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(106, 191, 75, 0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--na-gray-300)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.85rem 1.5rem",
                    background: "var(--na-green-400)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.9375rem",
                    borderRadius: "9999px",
                    border: "none",
                    cursor: loading || !email ? "not-allowed" : "pointer",
                    opacity: loading || !email ? 0.7 : 1,
                    transition: "all var(--transition-fast)",
                    boxShadow: "0 4px 14px rgba(106, 191, 75, 0.35)",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && email) {
                      e.currentTarget.style.background = "var(--na-green-500)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--na-green-400)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {loading ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          border: "2px solid rgba(255,255,255,0.4)",
                          borderTopColor: "#fff",
                          borderRadius: "50%",
                          animation: "spin 0.7s linear infinite",
                          display: "inline-block",
                        }}
                      />
                      Sending instructions…
                    </span>
                  ) : (
                    "Send Reset Instructions"
                  )}
                </button>
              </form>
            </>
          ) : (
            /* SUCCESS STATE */
            <div style={{ textAlign: "center" }}>
              {/* Envelope / Check Icon Badge */}
              <div
                style={{
                  width: 60,
                  height: 60,
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
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h9" />
                  <polyline points="22,6 12,13 2,6" />
                  <polyline points="16,19 19,22 23,17" />
                </svg>
              </div>

              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--na-gray-900)",
                  marginBottom: "0.5rem",
                  letterSpacing: "-0.02em",
                }}
              >
                Check your inbox
              </h2>

              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--na-gray-600)",
                  lineHeight: 1.6,
                  marginBottom: "1.5rem",
                }}
              >
                We sent password reset instructions to:
                <br />
                <strong style={{ color: "var(--na-gray-900)", wordBreak: "break-all" }}>{submittedEmail}</strong>
              </p>

              {devResetUrl && (
                <div
                  style={{
                    background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
                    borderRadius: "var(--radius-md)",
                    padding: "1rem 1.125rem",
                    marginBottom: "1.25rem",
                    border: "1px solid #bfdbfe",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        padding: "0.15rem 0.5rem",
                        background: "var(--na-blue-500)",
                        color: "#fff",
                        borderRadius: "4px",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      Dev Mode
                    </span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-gray-800)" }}>
                      Direct Reset Link
                    </span>
                  </div>
                  <p style={{ fontSize: "0.78125rem", color: "var(--na-gray-600)", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                    Since an external SMTP email server is not configured in .env yet, use this generated link to test resetting your password:
                  </p>
                  <Link
                    href={devResetUrl}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      color: "var(--na-blue-600)",
                      textDecoration: "underline",
                      wordBreak: "break-all",
                    }}
                  >
                    Click here to open Reset Password page →
                  </Link>
                </div>
              )}

              <div
                style={{
                  background: "var(--na-gray-50)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem",
                  fontSize: "0.8125rem",
                  color: "var(--na-gray-600)",
                  textAlign: "left",
                  lineHeight: 1.6,
                  marginBottom: "1.75rem",
                  border: "1px solid var(--na-gray-200)",
                }}
              >
                <div style={{ fontWeight: 600, color: "var(--na-gray-800)", marginBottom: "0.25rem" }}>
                  What happens next?
                </div>
                • Open the link in the email to set a new password.
                <br />
                • The link will expire in 60 minutes for security.
                <br />
                • Be sure to check your spam folder if it doesn&apos;t arrive soon.
              </div>

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
                  transition: "all var(--transition-fast)",
                  boxShadow: "0 4px 14px rgba(106, 191, 75, 0.35)",
                  marginBottom: "1rem",
                }}
              >
                Return to Sign In
              </Link>

              <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)" }}>
                Didn&apos;t receive an email?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  style={{
                    background: "none",
                    border: "none",
                    color: resendCooldown > 0 ? "var(--na-gray-400)" : "var(--na-green-600)",
                    fontWeight: 600,
                    cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                    textDecoration: "underline",
                    padding: 0,
                  }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Click to resend"}
                </button>
              </div>

              <div style={{ marginTop: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setSubmittedEmail(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--na-gray-500)",
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Try another email address
                </button>
              </div>
            </div>
          )}

          {/* Footer Back Link */}
          {!submittedEmail && (
            <div
              style={{
                marginTop: "1.75rem",
                paddingTop: "1.25rem",
                borderTop: "1px solid var(--na-gray-100)",
                textAlign: "center",
                fontSize: "0.875rem",
                color: "var(--na-gray-600)",
              }}
            >
              Remember your password?{" "}
              <Link
                href="/login"
                style={{
                  fontWeight: 600,
                  color: "var(--na-green-600)",
                  textDecoration: "none",
                }}
              >
                Sign in
              </Link>
            </div>
          )}
        </div>

        {/* Support Link */}
        <p
          style={{
            textAlign: "center",
            fontSize: "0.75rem",
            color: "var(--na-gray-500)",
            marginTop: "1.5rem",
          }}
        >
          Having trouble accessing your account?{" "}
          <Link href="/support" style={{ color: "var(--na-gray-600)", textDecoration: "underline" }}>
            Contact Support
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--na-gray-50)" }} />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
