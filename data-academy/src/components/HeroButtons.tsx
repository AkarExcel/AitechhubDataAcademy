"use client";

import Link from "next/link";

export default function HeroButtons() {
  return (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
      <Link
        href="/register"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0.85rem 2.25rem",
          background: "linear-gradient(135deg, var(--brand-blue-600) 0%, var(--brand-accent-500) 100%)",
          color: "#fff",
          fontWeight: 700,
          fontSize: "1rem",
          borderRadius: "9999px",
          textDecoration: "none",
          transition: "all var(--transition-base)",
          boxShadow: "0 4px 14px rgba(0, 111, 168, 0.35)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "linear-gradient(135deg, var(--brand-navy-800) 0%, var(--brand-accent-400) 100%)";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 111, 168, 0.45)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "linear-gradient(135deg, var(--brand-blue-600) 0%, var(--brand-accent-500) 100%)";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 14px rgba(0, 111, 168, 0.35)";
        }}
      >
        Start Learning
      </Link>
      <Link
        href="/courses"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0.85rem 2.25rem",
          background: "#fff",
          border: "2px solid var(--brand-blue-600)",
          color: "var(--brand-navy-800)",
          fontWeight: 700,
          fontSize: "1rem",
          borderRadius: "9999px",
          textDecoration: "none",
          transition: "all var(--transition-base)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--brand-blue-subtle)";
          e.currentTarget.style.borderColor = "var(--brand-accent-500)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.borderColor = "var(--brand-blue-600)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        Explore Subjects
      </Link>
    </div>
  );
}
