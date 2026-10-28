"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string | Date;
}

interface NotificationsClientProps {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}

type TabType = "ALL" | "UNREAD" | "COURSE_UPDATE" | "COURSEWORK" | "CERTIFICATE";

export default function NotificationsClient({
  initialNotifications,
  initialUnreadCount,
}: NotificationsClientProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const router = useRouter();

  // Mark single as read
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Delete notification
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const target = notifications.find((n) => n.id === id);
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  // Click card action
  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      handleMarkAsRead(item.id);
    }
    if (item.link) {
      router.push(item.link);
    }
  };

  // Filter notifications by Tab and Search
  const filteredNotifications = notifications.filter((item) => {
    // 1. Tab filter
    if (activeTab === "UNREAD" && item.isRead) return false;
    if (activeTab === "COURSE_UPDATE" && !["ANNOUNCEMENT", "SYSTEM"].includes(item.type)) return false;
    if (activeTab === "COURSEWORK" && !["GRADE", "ASSESSMENT_RESULT", "DEADLINE"].includes(item.type)) return false;
    if (activeTab === "CERTIFICATE" && !["CERTIFICATE", "COURSE_COMPLETE"].includes(item.type)) return false;

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatRelativeTime = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getNotificationTheme = (type: string) => {
    switch (type) {
      case "CERTIFICATE":
      case "COURSE_COMPLETE":
        return {
          iconBg: "linear-gradient(135deg, #004b87 0%, #006fa8 100%)",
          color: "var(--brand-blue-700, #004074)",
          badgeBg: "var(--brand-blue-subtle, #f0f6ff)",
          label: "Credential Earned",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          ),
        };
      case "ASSESSMENT_RESULT":
      case "GRADE":
        return {
          iconBg: "linear-gradient(135deg, #003366 0%, #004b87 100%)",
          color: "var(--brand-blue-600, #004b87)",
          badgeBg: "var(--brand-blue-subtle, #f0f6ff)",
          label: "Coursework",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <path d="m9 11 3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          ),
        };
      case "ANNOUNCEMENT":
      case "SYSTEM":
        return {
          iconBg: "linear-gradient(135deg, #005a9e 0%, #0088cc 100%)",
          color: "var(--brand-accent-500, #006fa8)",
          badgeBg: "#e0f2fe",
          label: "Course Update",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          ),
        };
      case "DEADLINE":
      default:
        return {
          iconBg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          color: "#b45309",
          badgeBg: "#fffbeb",
          label: "Notice",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ),
        };
    }
  };

  const courseUpdateCount = notifications.filter((n) =>
    ["ANNOUNCEMENT", "SYSTEM"].includes(n.type)
  ).length;

  const courseworkCount = notifications.filter((n) =>
    ["GRADE", "ASSESSMENT_RESULT", "DEADLINE"].includes(n.type)
  ).length;

  const certificateCount = notifications.filter((n) =>
    ["CERTIFICATE", "COURSE_COMPLETE"].includes(n.type)
  ).length;

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto" }}>
      {/* ── TOP BANNER ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #001830 0%, #002b54 60%, #004b87 100%)",
          borderRadius: 20,
          padding: "2.25rem 2rem",
          color: "#ffffff",
          marginBottom: "2rem",
          boxShadow: "0 10px 25px rgba(0, 24, 48, 0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "1.25rem",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(255, 255, 255, 0.12)",
                padding: "0.3rem 0.8rem",
                borderRadius: 9999,
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--brand-accent-300, #38bdf8)",
                marginBottom: "0.75rem",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              Student Activity & Alert Center
            </div>

            <h1
              style={{
                fontSize: "2rem",
                color: "rgba(255, 255, 255, 1)",
                fontWeight: 900,
                margin: "0 0 0.4rem 0",
                letterSpacing: "-0.02em",
              }}
            >
              Student Notifications
            </h1>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "rgba(255,255,255,0.8)",
                margin: 0,
                maxWidth: 580,
                lineHeight: 1.5,
              }}
            >
              Stay on top of coursework feedback, assessment completions, new course materials, and verified certificate achievements.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: 10,
                padding: "0.6rem 1.15rem",
                fontSize: "0.8125rem",
                fontWeight: 700,
                cursor: isMarkingAll ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                transition: "all 0.2s ease",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="m9 11 3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <span>{isMarkingAll ? "Updating..." : "Mark All as Read"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── GUARANTEE BANNER: NEW MATERIAL NEVER AFFECTS CERTIFICATES ── */}
      <div
        style={{
          background: "linear-gradient(135deg, var(--brand-blue-subtle, #f0f6ff) 0%, #e0eefe 100%)",
          border: "1px solid var(--brand-accent-200, #bae6fd)",
          borderRadius: 14,
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "0.875rem",
          marginBottom: "1.75rem",
          boxShadow: "0 2px 10px rgba(0, 75, 135, 0.06)",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--brand-blue-600, #004b87) 0%, var(--brand-accent-500, #006fa8) 100%)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 2,
            boxShadow: "0 2px 6px rgba(0, 75, 135, 0.25)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div style={{ flex: 1, fontSize: "0.8125rem", lineHeight: 1.5, color: "var(--brand-navy-900, #002244)" }}>
          <strong style={{ color: "var(--brand-blue-700, #004074)" }}>Credential Protection Guarantee:</strong> When instructors publish new lessons, assignments, or update material for a course you have completed, your earned certificate remains <strong>permanently locked, valid, and authenticated</strong>. You will receive updates to review the new content at your leisure with zero risk to your graduation status.
        </div>
      </div>

      {/* ── FILTER TABS & SEARCH BAR ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Category Tabs */}
        <div
          style={{
            display: "flex",
            background: "var(--na-gray-200, #e2e8f0)",
            padding: "0.25rem",
            borderRadius: 10,
            gap: "0.25rem",
            overflowX: "auto",
            maxWidth: "100%",
          }}
        >
          {[
            { id: "ALL", label: "All", count: notifications.length },
            { id: "UNREAD", label: "Unread", count: unreadCount },
            { id: "COURSE_UPDATE", label: "Course Updates", count: courseUpdateCount },
            { id: "COURSEWORK", label: "Coursework", count: courseworkCount },
            { id: "CERTIFICATE", label: "Certificates", count: certificateCount },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                style={{
                  background: isActive ? "#ffffff" : "transparent",
                  color: isActive ? "var(--brand-blue-600, #004b87)" : "var(--na-gray-600, #475569)",
                  border: "none",
                  padding: "0.5rem 0.85rem",
                  borderRadius: 8,
                  fontSize: "0.8125rem",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      padding: "0.1rem 0.4rem",
                      borderRadius: 999,
                      background: isActive
                        ? tab.id === "UNREAD"
                          ? "#ef4444"
                          : "var(--brand-accent-100, #e0f2fe)"
                        : "rgba(0,0,0,0.08)",
                      color: isActive
                        ? tab.id === "UNREAD"
                          ? "#fff"
                          : "var(--brand-blue-600, #004b87)"
                        : "var(--na-gray-600, #475569)",
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Filter */}
        <div style={{ position: "relative", minWidth: 240 }}>
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.8rem 0.5rem 2.2rem",
              borderRadius: 8,
              border: "1px solid var(--na-gray-300, #cbd5e1)",
              fontSize: "0.8125rem",
              background: "#ffffff",
            }}
          />
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--na-gray-400, #94a3b8)"
            strokeWidth="2.2"
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* ── NOTIFICATIONS LIST ── */}
      {filteredNotifications.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            border: "1.5px dashed var(--na-gray-300, #cbd5e1)",
            padding: "4rem 2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--na-gray-100, #f1f5f9)",
              color: "var(--na-gray-400, #94a3b8)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 0.35rem 0", color: "var(--na-gray-800)" }}>
            {activeTab === "UNREAD" ? "You're all caught up!" : "No notifications found"}
          </h3>
          <p style={{ fontSize: "0.875rem", color: "var(--na-gray-500)", margin: 0 }}>
            {activeTab === "UNREAD"
              ? "All recent alerts have been reviewed."
              : "Notifications for coursework progress and course updates will appear here."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filteredNotifications.map((item) => {
            const theme = getNotificationTheme(item.type);

            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                style={{
                  background: item.isRead ? "#ffffff" : "var(--brand-accent-50, #f8fbff)",
                  borderRadius: 14,
                  border: item.isRead
                    ? "1px solid var(--na-gray-200, #e2e8f0)"
                    : "1.5px solid var(--brand-accent-300, #7dd3fc)",
                  padding: "1.25rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1.1rem",
                  cursor: item.link ? "pointer" : "default",
                  transition: "all 0.15s ease",
                  position: "relative",
                  boxShadow: item.isRead ? "0 2px 4px rgba(0,0,0,0.02)" : "0 4px 12px rgba(0, 75, 135, 0.08)",
                }}
                onMouseEnter={(e) => {
                  if (item.link) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.06)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (item.link) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = item.isRead
                      ? "0 2px 4px rgba(0,0,0,0.02)"
                      : "0 4px 12px rgba(0, 75, 135, 0.08)";
                  }
                }}
              >
                {/* Category Icon */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: theme.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  }}
                >
                  {theme.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.25rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "0.15rem 0.5rem",
                        borderRadius: 6,
                        background: theme.badgeBg,
                        color: theme.color,
                        letterSpacing: "0.03em",
                      }}
                    >
                      {theme.label}
                    </span>

                    <span style={{ fontSize: "0.75rem", color: "var(--na-gray-400, #94a3b8)" }}>
                      {formatRelativeTime(item.createdAt)}
                    </span>

                    {!item.isRead && (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "var(--brand-blue-600, #004b87)",
                          display: "inline-block",
                        }}
                        title="Unread notification"
                      />
                    )}
                  </div>

                  <h3
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: item.isRead ? 600 : 800,
                      color: "var(--na-gray-900, #0f172a)",
                      margin: "0 0 0.35rem 0",
                    }}
                  >
                    {item.title}
                  </h3>

                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--na-gray-600, #475569)",
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {item.message}
                  </p>

                  {item.link && (
                    <div style={{ marginTop: "0.6rem" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "var(--brand-blue-600, #004b87)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <span>Open & Review</span>
                        <span>→</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Action Icons */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    flexShrink: 0,
                  }}
                >
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(item.id, e)}
                      title="Mark as read"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--na-gray-400, #94a3b8)",
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--brand-blue-600, #004b87)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--na-gray-400, #94a3b8)")}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.id, e)}
                    title="Delete notification"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--na-gray-400, #94a3b8)",
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--na-gray-400, #94a3b8)")}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
