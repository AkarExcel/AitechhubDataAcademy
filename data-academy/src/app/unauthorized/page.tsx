"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function UnauthorizedContent() {
  const params = useSearchParams();
  const requiredRole = params.get("required");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--na-gray-50)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid var(--na-gray-200)",
          boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.06)",
          padding: "3rem 2.5rem",
          textAlign: "center",
        }}
      >
        {/* Shield Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            color: "#e11d48",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.5rem",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: "1.625rem",
            fontWeight: 700,
            color: "#1b2533",
            marginBottom: "0.75rem",
            letterSpacing: "-0.02em",
          }}
        >
          Access Restricted
        </h1>

        <p
          style={{
            fontSize: "0.9375rem",
            color: "var(--na-gray-600)",
            lineHeight: 1.6,
            marginBottom: "1.75rem",
          }}
        >
          You do not have the required permissions to view this section.
          {requiredRole && (
            <>
              {" "}
              This area is strictly restricted to{" "}
              <strong style={{ color: "#1b2533" }}>{requiredRole}</strong> accounts.
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <Link
            href="/dashboard"
            className="btn btn-green"
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "9999px",
              fontWeight: 600,
              fontSize: "0.9375rem",
              textDecoration: "none",
            }}
          >
            Return to Learner Dashboard
          </Link>

          <Link
            href="/courses"
            className="btn btn-secondary"
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "9999px",
              fontWeight: 600,
              fontSize: "0.9375rem",
              textDecoration: "none",
            }}
          >
            Browse Course Catalog
          </Link>

          <Link
            href="/login"
            style={{
              fontSize: "0.8125rem",
              color: "var(--na-gray-500)",
              textDecoration: "underline",
              marginTop: "0.75rem",
            }}
          >
            Sign in with a different account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--na-gray-50)" }} />}>
      <UnauthorizedContent />
    </Suspense>
  );
}
