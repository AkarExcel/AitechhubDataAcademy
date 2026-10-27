"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminSidebarProps {
  isAdmin: boolean;
  adminNav: {
    href: string;
    label: string;
    icon: React.ReactNode;
  }[];
}

export default function AdminSidebar({ isAdmin, adminNav }: AdminSidebarProps) {
  // Minimized by default as requested
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className="no-scrollbar"
      style={{
        position: "sticky",
        top: "calc(var(--topbar-height) + var(--announce-height))",
        height: "calc(100vh - var(--topbar-height) - var(--announce-height))",
        width: isExpanded ? 250 : 68,
        flexShrink: 0,
        background: "var(--brand-navy-950, #001830)",
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflowX: "hidden",
        overflowY: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        zIndex: 30,
        boxShadow: isExpanded ? "4px 0 20px rgba(0, 0, 0, 0.15)" : "none",
      }}
    >
      {/* ── TOP HEADER & ANIMATED TOGGLE BUTTON ── */}
      <div
        style={{
          padding: isExpanded ? "1rem 1rem" : "1rem 0.5rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: isExpanded ? "space-between" : "center",
          gap: "0.5rem",
          minHeight: 64,
        }}
      >
        {isExpanded ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", overflow: "hidden" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                background: isAdmin ? "linear-gradient(135deg, #0284c7, #0369a1)" : "linear-gradient(135deg, #004b87, #006fa8)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div style={{ lineHeight: 1.2, whiteSpace: "nowrap" }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.8125rem", letterSpacing: "0.06em", textTransform: "uppercase", display: "block" }}>
                {isAdmin ? "Admin Console" : "Instructor Hub"}
              </span>
              <span style={{ color: "var(--brand-accent-300, #38bdf8)", fontSize: "0.6875rem" }}>
                {isAdmin ? "Platform Operations" : "Curriculum Studio"}
              </span>
            </div>
          </div>
        ) : null}

        {/* Animated Sidebar Toggle Button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? "Minimize Sidebar" : "Expand Sidebar"}
          style={{
            width: 34,
            height: 34,
            borderRadius: "8px",
            background: isExpanded ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.12)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--brand-accent-500, #006fa8)";
            e.currentTarget.style.transform = "scale(1.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isExpanded ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.12)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* ── NAVIGATION LINKS ── */}
      <nav
        style={{
          padding: isExpanded ? "1rem 0.625rem" : "1rem 0.375rem",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "0.35rem",
        }}
      >
        {adminNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!isExpanded ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isExpanded ? "flex-start" : "center",
                gap: "0.75rem",
                padding: isExpanded ? "0.625rem 0.875rem" : "0.625rem 0",
                borderRadius: "8px",
                color: isActive ? "#ffffff" : "rgba(255,255,255,0.75)",
                background: isActive
                  ? "var(--brand-blue-600, #004b87)"
                  : "transparent",
                fontSize: "0.875rem",
                fontWeight: isActive ? 700 : 500,
                textDecoration: "none",
                transition: "all var(--transition-fast, 120ms ease)",
                whiteSpace: "nowrap",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.color = "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,0.75)";
                }
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                  flexShrink: 0,
                  color: isActive ? "var(--brand-accent-300, #38bdf8)" : "currentColor",
                }}
              >
                {item.icon}
              </span>
              {isExpanded && (
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── FOOTER FOOTNOTE / QUICK TOGGLE HINT ── */}
      <div
        style={{
          padding: isExpanded ? "0.875rem 1rem" : "0.75rem 0.25rem",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          fontSize: "0.6875rem",
          color: "rgba(255, 255, 255, 0.6)",
          textAlign: isExpanded ? "left" : "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {isExpanded ? (
          <div>
            Logged in as <strong style={{ color: "#fff" }}>{isAdmin ? "Platform Admin" : "Instructor"}</strong>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            title="Click to expand"
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              fontSize: "0.6875rem",
              padding: "0.2rem",
            }}
          >
            ▸
          </button>
        )}
      </div>
    </aside>
  );
}
