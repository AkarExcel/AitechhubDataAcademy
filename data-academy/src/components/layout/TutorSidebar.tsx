"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface TutorSidebarProps {
  isVerified: boolean;
  tutorProfile?: {
    headline?: string | null;
    isApproved?: boolean;
    expertise?: string[];
  } | null;
  userName?: string;
  userEmail?: string;
}

export default function TutorSidebar({
  isVerified,
  tutorProfile,
  userName = "Instructor",
  userEmail = "",
}: TutorSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  const tutorNav = [
    {
      href: "/tutor",
      label: "Dashboard",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
      exact: true,
    },
    {
      href: "/tutor/courses",
      label: "My Courses",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
      exact: true,
    },
    {
      href: "/tutor/courses/new",
      label: "Create Course",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
      locked: !isVerified,
      lockedBadge: "Requires Verification",
    },
    {
      href: "/tutor/students",
      label: "My Students",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      href: "/tutor/notifications",
      label: "Notifications",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
    {
      href: "/support",
      label: "Help & Support",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      href: "/feedback",
      label: "Feedback & Reviews",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      href: "/tutor/profile",
      label: "Faculty Profile",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
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
      {/* ── TOP HEADER & EXPAND TOGGLE ── */}
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
                background: isVerified
                  ? "linear-gradient(135deg, #059669, #10b981)"
                  : "linear-gradient(135deg, #d97706, #f59e0b)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div style={{ lineHeight: 1.2, whiteSpace: "nowrap" }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.8125rem", letterSpacing: "0.06em", textTransform: "uppercase", display: "block" }}>
                Faculty Hub
              </span>
              <span style={{ color: isVerified ? "#34d399" : "#fbbf24", fontSize: "0.6875rem", fontWeight: 600 }}>
                {isVerified ? "Verified Instructor" : "Verification Pending"}
              </span>
            </div>
          </div>
        ) : null}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "rgba(255, 255, 255, 0.7)",
            borderRadius: "6px",
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.15s ease",
          }}
          title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* ── NAVIGATION LINKS ── */}
      <nav style={{ padding: "0.75rem 0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
        {tutorNav.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.625rem 0.75rem",
                borderRadius: "8px",
                color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.7)",
                background: isActive
                  ? "linear-gradient(90deg, rgba(5, 150, 105, 0.25) 0%, rgba(5, 150, 105, 0.1) 100%)"
                  : "transparent",
                borderLeft: isActive ? "3px solid #10b981" : "3px solid transparent",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: isActive ? 600 : 500,
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                position: "relative",
              }}
              title={!isExpanded ? item.label : undefined}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isActive ? "#34d399" : "rgba(255, 255, 255, 0.6)",
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                }}
              >
                {item.icon}
              </div>

              {isExpanded && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1 }}>
                  <span>{item.label}</span>
                  {item.locked && (
                    <span
                      style={{
                        fontSize: "0.625rem",
                        fontWeight: 700,
                        background: "rgba(245, 158, 11, 0.2)",
                        color: "#fbbf24",
                        padding: "0.15rem 0.4rem",
                        borderRadius: 4,
                        letterSpacing: "0.02em",
                      }}
                    >
                      Locked
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── FOOTER: FACULTY VERIFICATION BADGE ── */}
      <div
        style={{
          padding: isExpanded ? "1rem" : "0.75rem 0.5rem",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(0, 0, 0, 0.2)",
        }}
      >
        {isExpanded ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: isVerified ? "#10b981" : "#f59e0b",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: isVerified ? "#34d399" : "#fbbf24",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {isVerified ? "Verified Educator" : "Approval Pending"}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "0.6875rem", color: "rgba(255, 255, 255, 0.5)", lineHeight: 1.4 }}>
              {isVerified
                ? "You can create courses. Course publishing requires Admin approval."
                : "Course creation unlocks once your profile is verified by an admin."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center" }} title={isVerified ? "Verified Educator" : "Approval Pending"}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: isVerified ? "#10b981" : "#f59e0b",
                display: "inline-block",
              }}
            />
          </div>
        )}
      </div>
    </aside>
  );
}

