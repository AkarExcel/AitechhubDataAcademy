"use client";

import Link from "next/link";

export default function HeroButtons() {
  return (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
      <Link
        href="/courses"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.875rem 2rem",
          background: "linear-gradient(135deg, #3b82f6, #6366f1)",
          color: "#fff",
          fontWeight: 700,
          fontSize: "1rem",
          borderRadius: "var(--radius-lg)",
          textDecoration: "none",
          transition: "all var(--transition-base)",
          boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 30px rgba(99,102,241,0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.4)";
        }}
      >
        <span>Explore Courses</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      <Link
        href="/register"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.875rem 2rem",
          background: "rgba(255,255,255,0.08)",
          color: "#fff",
          fontWeight: 700,
          fontSize: "1rem",
          borderRadius: "var(--radius-lg)",
          textDecoration: "none",
          border: "1px solid rgba(255,255,255,0.15)",
          transition: "all var(--transition-base)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.15)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        Start Learning Free
      </Link>
    </div>
  );
}
