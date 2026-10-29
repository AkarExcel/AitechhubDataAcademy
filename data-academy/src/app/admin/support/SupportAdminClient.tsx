"use client";

import { useState } from "react";
import Link from "next/link";

export interface AdminTicketItem {
  id: string;
  userId: string;
  subject: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: string;
  category: string;
  details: string;
  courseTitle?: string | null;
  adminResponse?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  submitter: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface SupportAdminClientProps {
  initialTickets: AdminTicketItem[];
  initialStats: {
    totalCount: number;
    openCount: number;
    inProgressCount: number;
    resolvedCount: number;
    closedCount: number;
  };
}

export default function SupportAdminClient({
  initialTickets,
  initialStats,
}: SupportAdminClientProps) {
  const [tickets, setTickets] = useState<AdminTicketItem[]>(initialTickets);
  const [stats, setStats] = useState(initialStats);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Inspector State
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    initialTickets[0]?.id || null
  );
  const [inspectStatus, setInspectStatus] = useState<string>("");
  const [inspectPriority, setInspectPriority] = useState<string>("");
  const [inspectResponse, setInspectResponse] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  // When selecting a ticket
  const handleSelectTicket = (t: AdminTicketItem) => {
    setSelectedTicketId(t.id);
    setInspectStatus(t.status);
    setInspectPriority(t.priority);
    setInspectResponse(t.adminResponse || "");
    setActionSuccess(null);
  };

  const handleUpdateTicket = async () => {
    if (!activeTicket) return;
    setIsUpdating(true);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: activeTicket.id,
          status: inspectStatus,
          priority: inspectPriority,
          adminResponse: inspectResponse,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update ticket.");
      }

      setActionSuccess("Ticket updated and notification delivered to user bell!");

      // Update local ticket list
      setTickets((prev) =>
        prev.map((t) =>
          t.id === activeTicket.id
            ? {
                ...t,
                status: inspectStatus as any,
                priority: inspectPriority,
                adminResponse: inspectResponse.trim() || null,
                resolvedAt:
                  inspectStatus === "RESOLVED" || inspectStatus === "CLOSED"
                    ? new Date().toISOString()
                    : t.resolvedAt,
              }
            : t
        )
      );

      // Recalculate stats
      setStats((prev) => {
        const oldStatus = activeTicket.status;
        const newStatus = inspectStatus;
        if (oldStatus === newStatus) return prev;

        const updated = { ...prev };
        if (oldStatus === "OPEN") updated.openCount = Math.max(0, updated.openCount - 1);
        if (oldStatus === "IN_PROGRESS") updated.inProgressCount = Math.max(0, updated.inProgressCount - 1);
        if (oldStatus === "RESOLVED") updated.resolvedCount = Math.max(0, updated.resolvedCount - 1);

        if (newStatus === "OPEN") updated.openCount += 1;
        if (newStatus === "IN_PROGRESS") updated.inProgressCount += 1;
        if (newStatus === "RESOLVED") updated.resolvedCount += 1;

        return updated;
      });
    } catch (err: any) {
      alert(err.message || "Failed to update ticket.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return { bg: "#fef3c7", color: "#b45309", label: "Open" };
      case "IN_PROGRESS":
        return { bg: "#dbeafe", color: "#1d4ed8", label: "In Progress" };
      case "RESOLVED":
        return { bg: "#dcfce7", color: "#15803d", label: "Resolved" };
      case "CLOSED":
      default:
        return { bg: "#f1f5f9", color: "#475569", label: "Closed" };
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
    if (filterPriority !== "ALL" && t.priority !== filterPriority) return false;
    if (filterRole !== "ALL" && t.submitter.role !== filterRole) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.subject.toLowerCase().includes(q) ||
        t.details.toLowerCase().includes(q) ||
        t.submitter.email.toLowerCase().includes(q) ||
        t.submitter.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      {/* ── TOP HERO HEADER ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #001830 0%, #002b54 55%, #004b87 100%)",
          borderRadius: 20,
          padding: "2.5rem 2rem",
          color: "#ffffff",
          marginBottom: "2rem",
          boxShadow: "0 10px 30px rgba(0, 24, 48, 0.2)",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(255, 255, 255, 0.12)", padding: "0.35rem 0.85rem", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 700, color: "var(--brand-accent-300, #38bdf8)", marginBottom: "1rem", textTransform: "uppercase" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Support Operations Desk
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "2.125rem", color: "#ffffff", fontWeight: 900, margin: "0 0 0.4rem 0" }}>
              Support Ticket Management
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "rgba(255, 255, 255, 0.85)", margin: 0, maxWidth: 640 }}>
              Review, assign, and respond to platform inquiries from students and instructors across all active courses.
            </p>
          </div>

          <Link
            href="/admin"
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              color: "#fff",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              borderRadius: 10,
              padding: "0.6rem 1.15rem",
              fontSize: "0.8125rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            &larr; Admin Overview
          </Link>
        </div>
      </div>

      {/* ── METRICS ROW ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        <div style={{ background: "#fff", borderRadius: 14, padding: "1.25rem", border: "1px solid var(--na-gray-200, #e2e8f0)", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--na-gray-500)", textTransform: "uppercase" }}>Total Inquiries</div>
          <div style={{ fontSize: "1.875rem", fontWeight: 900, color: "var(--na-gray-900)", marginTop: "0.25rem" }}>{stats.totalCount}</div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: "1.25rem", border: "1.5px solid #fde68a", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#b45309", textTransform: "uppercase" }}>Open Tickets</div>
          <div style={{ fontSize: "1.875rem", fontWeight: 900, color: "#b45309", marginTop: "0.25rem" }}>{stats.openCount}</div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: "1.25rem", border: "1.5px solid #bfdbfe", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>In Progress</div>
          <div style={{ fontSize: "1.875rem", fontWeight: 900, color: "#1d4ed8", marginTop: "0.25rem" }}>{stats.inProgressCount}</div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: "1.25rem", border: "1.5px solid #bbf7d0", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#15803d", textTransform: "uppercase" }}>Resolved</div>
          <div style={{ fontSize: "1.875rem", fontWeight: 900, color: "#15803d", marginTop: "0.25rem" }}>{stats.resolvedCount}</div>
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          border: "1px solid var(--na-gray-200, #e2e8f0)",
          padding: "1rem 1.25rem",
          marginBottom: "1.75rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 240 }}>
          <input
            type="text"
            placeholder="Search tickets by subject, user, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.6rem 0.85rem",
              borderRadius: 8,
              border: "1px solid var(--na-gray-300, #cbd5e1)",
              fontSize: "0.8125rem",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: "0.6rem 0.85rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.8125rem", fontWeight: 600, background: "#fff" }}
          >
            <option value="ALL">Status: All</option>
            <option value="OPEN">Status: Open</option>
            <option value="IN_PROGRESS">Status: In Progress</option>
            <option value="RESOLVED">Status: Resolved</option>
            <option value="CLOSED">Status: Closed</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{ padding: "0.6rem 0.85rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.8125rem", fontWeight: 600, background: "#fff" }}
          >
            <option value="ALL">Priority: All</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{ padding: "0.6rem 0.85rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.8125rem", fontWeight: 600, background: "#fff" }}
          >
            <option value="ALL">Role: All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="TUTOR">Tutors</option>
          </select>
        </div>
      </div>

      {/* ── TWO-COLUMN WORKBENCH: TICKET LIST + RESOLUTION INSPECTOR ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "1.75rem",
          alignItems: "start",
        }}
      >
        {/* Left: Ticket List */}
        <div>
          {filteredTickets.length === 0 ? (
            <div
              style={{
                background: "#ffffff",
                borderRadius: 14,
                padding: "3rem 1.5rem",
                textAlign: "center",
                border: "1px dashed #cbd5e1",
              }}
            >
              <div style={{ fontWeight: 700, color: "#64748b" }}>No tickets match the selected filters.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {filteredTickets.map((t) => {
                const badge = getStatusBadge(t.status);
                const isSelected = selectedTicketId === t.id;

                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTicket(t)}
                    style={{
                      background: isSelected ? "var(--brand-blue-subtle, #f0f6ff)" : "#ffffff",
                      border: isSelected
                        ? "2px solid var(--brand-blue-600, #004b87)"
                        : "1px solid var(--na-gray-200, #e2e8f0)",
                      borderRadius: 12,
                      padding: "1.1rem",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: isSelected ? "0 4px 12px rgba(0, 75, 135, 0.08)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.35rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 800,
                            padding: "0.15rem 0.45rem",
                            borderRadius: 6,
                            background: badge.bg,
                            color: badge.color,
                            textTransform: "uppercase",
                          }}
                        >
                          {badge.label}
                        </span>

                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            padding: "0.15rem 0.45rem",
                            borderRadius: 6,
                            background: t.submitter.role === "TUTOR" ? "#fef3c7" : "#e0e7ff",
                            color: t.submitter.role === "TUTOR" ? "#92400e" : "#3730a3",
                          }}
                        >
                          {t.submitter.role}
                        </span>

                        {t.priority !== "NORMAL" && (
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              padding: "0.15rem 0.45rem",
                              borderRadius: 6,
                              background: t.priority === "URGENT" ? "#fee2e2" : "#fef3c7",
                              color: t.priority === "URGENT" ? "#991b1b" : "#92400e",
                            }}
                          >
                            {t.priority}
                          </span>
                        )}
                      </div>

                      <span style={{ fontSize: "0.6875rem", color: "var(--na-gray-400)" }}>
                        {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--na-gray-900)", margin: "0 0 0.25rem 0" }}>
                      {t.subject}
                    </h3>

                    <div style={{ fontSize: "0.75rem", color: "var(--na-gray-500)", marginBottom: "0.4rem" }}>
                      From: <strong>{t.submitter.name}</strong> ({t.submitter.email})
                    </div>

                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--na-gray-600)",
                        margin: 0,
                        lineHeight: 1.45,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {t.details}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Resolution Inspector Drawer */}
        <div style={{ position: "sticky", top: "calc(var(--topbar-height) + 1rem)" }}>
          {activeTicket ? (
            <div
              style={{
                background: "#ffffff",
                borderRadius: 16,
                border: "1px solid var(--na-gray-200, #e2e8f0)",
                padding: "1.75rem",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--brand-blue-600)" }}>
                      Ticket #{activeTicket.id.slice(-6).toUpperCase()}
                    </span>
                    <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--na-gray-900)", margin: "0.2rem 0" }}>
                      {activeTicket.subject}
                    </h2>
                  </div>
                </div>

                <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-600)", marginTop: "0.4rem" }}>
                  Submitter: <strong>{activeTicket.submitter.name}</strong> ({activeTicket.submitter.email}) •{" "}
                  <span style={{ fontWeight: 700, color: activeTicket.submitter.role === "TUTOR" ? "#b45309" : "#1d4ed8" }}>
                    {activeTicket.submitter.role}
                  </span>
                </div>
              </div>

              {actionSuccess && (
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", padding: "0.6rem 0.8rem", borderRadius: 8, fontSize: "0.8125rem", fontWeight: 600, marginBottom: "1rem" }}>
                  {actionSuccess}
                </div>
              )}

              {/* Description */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--na-gray-500)", textTransform: "uppercase" }}>
                  Issue Description
                </label>
                <div style={{ marginTop: "0.35rem", padding: "0.85rem", background: "var(--na-gray-50, #f8fafc)", borderRadius: 8, fontSize: "0.85rem", color: "var(--na-gray-800)", lineHeight: 1.5 }}>
                  {activeTicket.details}
                </div>
              </div>

              {/* Status and Priority select */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--na-gray-700)", marginBottom: "0.3rem" }}>
                    Update Status
                  </label>
                  <select
                    value={inspectStatus}
                    onChange={(e) => setInspectStatus(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.8125rem", fontWeight: 600, background: "#fff" }}
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--na-gray-700)", marginBottom: "0.3rem" }}>
                    Priority
                  </label>
                  <select
                    value={inspectPriority}
                    onChange={(e) => setInspectPriority(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.8125rem", fontWeight: 600, background: "#fff" }}
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Admin Response Note */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--na-gray-700)", marginBottom: "0.3rem" }}>
                  Staff Resolution / Response Note
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain the solution or next steps. This note will be dispatched to the student/tutor's in-app notification bell..."
                  value={inspectResponse}
                  onChange={(e) => setInspectResponse(e.target.value)}
                  style={{ width: "100%", padding: "0.7rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.8125rem", lineHeight: 1.45, fontFamily: "inherit" }}
                />
              </div>

              {/* Action Buttons */}
              <button
                type="button"
                onClick={handleUpdateTicket}
                disabled={isUpdating}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, var(--brand-blue-600, #004b87) 0%, var(--brand-accent-500, #006fa8) 100%)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 8,
                  padding: "0.75rem",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  cursor: isUpdating ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <span>{isUpdating ? "Saving Updates..." : "Save & Notify Submitter"}</span>
              </button>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 16, padding: "2rem", textAlign: "center", border: "1px dashed #cbd5e1" }}>
              <div style={{ color: "#64748b", fontSize: "0.875rem" }}>Select a ticket from the left column to view details and post a resolution.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

