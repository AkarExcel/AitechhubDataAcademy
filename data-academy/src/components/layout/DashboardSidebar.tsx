"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
    profile?: {
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  } | null;
  role: string;
  notificationCount?: number;
}

export default function DashboardSidebar({ user, role, notificationCount = 0 }: DashboardSidebarProps) {
  // Minimized by default as requested
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  const firstName = user?.profile?.firstName || user?.name?.split(" ")[0] || "Learner";
  const fullName = user?.profile?.firstName
    ? `${user.profile.firstName} ${user.profile.lastName || ""}`
    : user?.name || "Student";

  const navItems = [
    {
      href: "/dashboard",
      label: "Overview",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      href: "/my-learning",
      label: "My Learning",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      href: "/courses",
      label: "Course Catalog",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      href: "/paths",
      label: "Learning Paths",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
    },
    {
      href: "/assignments",
      label: "Assignments",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      href: "/assessments",
      label: "Assessments",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 11 3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      href: "/projects",
      label: "Projects",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
    },
    {
      href: "/certificates",
      label: "Certificates",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      className="no-scrollbar"
      style={{
        position: "sticky",
        top: "calc(var(--topbar-height) + var(--announce-height))",
        height: "calc(100vh - var(--topbar-height) - var(--announce-height))",
        width: isExpanded ? 240 : 68,
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
                background: "linear-gradient(135deg, var(--brand-blue-600, #004b87), var(--brand-accent-500, #006fa8))",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <div style={{ lineHeight: 1.2, whiteSpace: "nowrap" }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.8125rem", letterSpacing: "0.06em", textTransform: "uppercase", display: "block" }}>
                Student Portal
              </span>
              <span style={{ color: "var(--brand-accent-300, #38bdf8)", fontSize: "0.6875rem" }}>
                Learning Workspace
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

      {/* ── USER AVATAR / PROFILE ── */}
      <div
        style={{
          padding: isExpanded ? "1rem 1rem" : "0.75rem 0.5rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: isExpanded ? "flex-start" : "center",
          gap: "0.75rem",
        }}
      >
        <div
          title={!isExpanded ? fullName : undefined}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--brand-navy-800, #003366), var(--brand-accent-500, #006fa8))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            fontSize: "0.875rem",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
          }}
        >
          {firstName[0]?.toUpperCase() || "L"}
        </div>
        {isExpanded && (
          <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
            <div style={{ color: "#fff", fontSize: "0.875rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>
              {fullName}
            </div>
            <div style={{ color: "var(--brand-accent-300, #38bdf8)", fontSize: "0.75rem", fontWeight: 500 }}>
              {role === "ADMIN" ? "Administrator" : role === "TUTOR" ? "Instructor / Tutor" : "Student"}
            </div>
          </div>
        )}
      </div>

      {/* ── QUICK PORTAL SWITCHERS (IF ADMIN OR TUTOR) ── */}
      {(role === "ADMIN" || role === "TUTOR") && (
        <div style={{ padding: isExpanded ? "0.75rem 0.625rem" : "0.5rem 0.375rem" }}>
          {role === "ADMIN" && (
            <Link
              href="/admin"
              title={!isExpanded ? "Admin Console" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isExpanded ? "flex-start" : "center",
                gap: "0.6rem",
                color: "#38bdf8",
                fontWeight: 700,
                fontSize: "0.8125rem",
                background: "rgba(56, 189, 248, 0.12)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                padding: isExpanded ? "0.5rem 0.75rem" : "0.5rem 0",
                borderRadius: "8px",
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <span>⚙</span>
              {isExpanded && <span>Admin Console →</span>}
            </Link>
          )}
          {role === "TUTOR" && (
            <Link
              href="/tutor"
              title={!isExpanded ? "Instructor Portal" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isExpanded ? "flex-start" : "center",
                gap: "0.6rem",
                color: "#4ade80",
                fontWeight: 700,
                fontSize: "0.8125rem",
                background: "rgba(74, 222, 128, 0.12)",
                border: "1px solid rgba(74, 222, 128, 0.25)",
                padding: isExpanded ? "0.5rem 0.75rem" : "0.5rem 0",
                borderRadius: "8px",
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <span>🎓</span>
              {isExpanded && <span>Instructor Portal →</span>}
            </Link>
          )}
        </div>
      )}

      {/* ── NAVIGATION LINKS ── */}
      <nav
        style={{
          padding: isExpanded ? "0.75rem 0.625rem" : "0.75rem 0.375rem",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "0.35rem",
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
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
                background: isActive ? "var(--brand-blue-600, #004b87)" : "transparent",
                fontSize: "0.875rem",
                fontWeight: isActive ? 700 : 500,
                textDecoration: "none",
                transition: "all var(--transition-fast, 120ms ease)",
                whiteSpace: "nowrap",
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

      {/* ── NOTIFICATIONS & SETTINGS ── */}
      <div
        style={{
          padding: isExpanded ? "0.75rem 0.625rem" : "0.75rem 0.375rem",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "0.35rem",
        }}
      >
        <Link
          href="/notifications"
          title={!isExpanded ? `Notifications (${notificationCount})` : undefined}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: isExpanded ? "flex-start" : "center",
            gap: "0.75rem",
            padding: isExpanded ? "0.625rem 0.875rem" : "0.625rem 0",
            borderRadius: "8px",
            color: "rgba(255, 255, 255, 0.75)",
            fontSize: "0.875rem",
            fontWeight: 500,
            textDecoration: "none",
            transition: "all var(--transition-fast, 120ms ease)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.75)";
          }}
        >
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, position: "relative" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {!isExpanded && notificationCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--na-danger)",
                }}
              />
            )}
          </span>
          {isExpanded && <span>Notifications</span>}
          {isExpanded && notificationCount > 0 && (
            <span
              style={{
                marginLeft: "auto",
                minWidth: 20,
                height: 20,
                borderRadius: "999px",
                background: "var(--na-danger)",
                color: "#fff",
                fontSize: "0.6875rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
              }}
            >
              {notificationCount}
            </span>
          )}
        </Link>

        <Link
          href="/settings"
          title={!isExpanded ? "Settings" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isExpanded ? "flex-start" : "center",
            gap: "0.75rem",
            padding: isExpanded ? "0.625rem 0.875rem" : "0.625rem 0",
            borderRadius: "8px",
            color: "rgba(255, 255, 255, 0.75)",
            fontSize: "0.875rem",
            fontWeight: 500,
            textDecoration: "none",
            transition: "all var(--transition-fast, 120ms ease)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.75)";
          }}
        >
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          {isExpanded && <span>Settings</span>}
        </Link>
      </div>

      {/* ── BOTTOM FOOTNOTE / EXPAND HINT ── */}
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
            AI Tech Hub <strong style={{ color: "var(--brand-accent-300, #38bdf8)" }}>Data Academy</strong>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            title="Expand Sidebar"
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
