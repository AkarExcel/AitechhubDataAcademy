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
          background: "var(--na-green-400)",
          color: "#fff",
          fontWeight: 700,
          fontSize: "1rem",
          borderRadius: "9999px",
          textDecoration: "none",
          transition: "all var(--transition-base)",
          boxShadow: "0 4px 14px rgba(106, 191, 75, 0.35)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--na-green-500)";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 6px 18px rgba(106, 191, 75, 0.45)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--na-green-400)";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 14px rgba(106, 191, 75, 0.35)";
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
          border: "1.5px solid var(--na-green-400)",
          color: "var(--na-gray-800)",
          fontWeight: 700,
          fontSize: "1rem",
          borderRadius: "9999px",
          textDecoration: "none",
          transition: "all var(--transition-base)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--na-green-50)";
          e.currentTarget.style.borderColor = "var(--na-green-500)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.borderColor = "var(--na-green-400)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        Explore Subjects
      </Link>
    </div>
  );
}
