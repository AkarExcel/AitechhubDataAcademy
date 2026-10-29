"use client";

import { useState } from "react";
import Link from "next/link";

export interface TicketItem {
  id: string;
  subject: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: string;
  category: string;
  details: string;
  courseTitle?: string | null;
  adminResponse?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface SupportClientProps {
  initialTickets: TicketItem[];
  userRole: string;
  userName: string;
  userEmail: string;
  userCourses: { id: string; title: string }[];
}

const FAQ_ITEMS = [
  {
    q: "How do I claim and share my verified certificate?",
    a: "Once you achieve 100% completion in all required modules and pass the assessments, your certificate is automatically generated and permanently authenticated on Supabase. You can find and copy your verified link in the /certificates tab.",
  },
  {
    q: "What happens if new lessons or exercises are added to a completed course?",
    a: "Under our Credential Protection Guarantee, your earned certificate remains permanently valid, verified, and locked. New content is marked for your convenience so you can review it at your leisure without affecting your graduation standing.",
  },
  {
    q: "How do I resolve code challenge sandbox execution timeouts?",
    a: "Code challenges run inside secure micro-containers. Ensure your code does not contain infinite loops or excessive memory allocations. If the runner remains unresponsive, submit a ticket under 'Course Labs & Exercises' with your code snippet.",
  },
  {
    q: "How do tutors request syllabus updates or additional teaching permissions?",
    a: "Instructors can submit a ticket under 'Curriculum & Teaching Studio'. Our administrative staff typically reviews curriculum change requests within 24 business hours.",
  },
];

export default function SupportClient({
  initialTickets,
  userRole,
  userName,
  userEmail,
  userCourses,
}: SupportClientProps) {
  const isTutor = userRole === "TUTOR";
  const [tickets, setTickets] = useState<TicketItem[]>(initialTickets);
  const [activeTab, setActiveTab] = useState<"NEW" | "TICKETS" | "FAQ">(
    initialTickets.length > 0 ? "TICKETS" : "NEW"
  );

  // Form State
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState(
    isTutor ? "Curriculum & Teaching Studio" : "Course Labs & Exercises"
  );
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter for My Tickets
  const [ticketFilter, setTicketFilter] = useState<string>("ALL");
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setStatusMessage({ type: "error", text: "Please enter both a subject and issue description." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const chosenCourse = userCourses.find((c) => c.id === selectedCourseId);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          description: description.trim(),
          priority,
          courseId: selectedCourseId || undefined,
          courseTitle: chosenCourse?.title || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit support ticket.");
      }

      setStatusMessage({
        type: "success",
        text: `Support ticket #${data.ticket.id.slice(-6).toUpperCase()} logged successfully! We will review your inquiry shortly.`,
      });

      // Prepend to local tickets
      const newTicket: TicketItem = {
        id: data.ticket.id,
        subject: subject.trim(),
        status: "OPEN",
        priority,
        category,
        details: description.trim(),
        courseTitle: chosenCourse?.title || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTickets((prev) => [newTicket, ...prev]);

      // Reset form
      setSubject("");
      setDescription("");
      setSelectedCourseId("");
      setActiveTab("TICKETS");
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
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

  const filteredTickets = tickets.filter((t) => {
    if (ticketFilter === "ALL") return true;
    return t.status === ticketFilter;
  });

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", paddingBottom: "3rem" }}>
      {/* ── TOP HERO BANNER ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #001830 0%, #002b54 60%, #004b87 100%)",
          borderRadius: 20,
          padding: "2.5rem 2rem",
          color: "#ffffff",
          marginBottom: "2rem",
          boxShadow: "0 10px 25px rgba(0, 24, 48, 0.15)",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(255, 255, 255, 0.12)", padding: "0.3rem 0.8rem", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 700, color: "var(--brand-accent-300, #38bdf8)", marginBottom: "0.75rem", textTransform: "uppercase" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {isTutor ? "Faculty & Instructor Help Desk" : "Learner Support Desk"}
        </div>

        <h1 style={{ fontSize: "2rem", color: "#ffffff", fontWeight: 900, margin: "0 0 0.4rem 0" }}>
          Support &amp; Help Center
        </h1>
        <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.85)", margin: 0, maxWidth: 620, lineHeight: 1.5 }}>
          Have a question about code exercises, certificate issuance, or curriculum materials? Submit a ticket and our technical team will assist you.
        </p>
      </div>

      {/* ── STATUS BANNER ── */}
      {statusMessage && (
        <div
          style={{
            background: statusMessage.type === "success" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${statusMessage.type === "success" ? "#86efac" : "#fca5a5"}`,
            color: statusMessage.type === "success" ? "#166534" : "#991b1b",
            borderRadius: 12,
            padding: "1rem 1.25rem",
            marginBottom: "1.75rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "inherit" }}
          >
            &times;
          </button>
        </div>
      )}

      {/* ── TABS ── */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--na-gray-200, #e2e8f0)",
          marginBottom: "2rem",
          overflowX: "auto",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("NEW")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "NEW" ? "3px solid var(--brand-blue-600, #004b87)" : "3px solid transparent",
            color: activeTab === "NEW" ? "var(--brand-blue-700, #004074)" : "var(--na-gray-600, #64748b)",
            fontWeight: activeTab === "NEW" ? 800 : 600,
            fontSize: "0.9375rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Submit New Ticket</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TICKETS")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "TICKETS" ? "3px solid var(--brand-blue-600, #004b87)" : "3px solid transparent",
            color: activeTab === "TICKETS" ? "var(--brand-blue-700, #004074)" : "var(--na-gray-600, #64748b)",
            fontWeight: activeTab === "TICKETS" ? 800 : 600,
            fontSize: "0.9375rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="6" y1="8" x2="10" y2="8" />
            <line x1="6" y1="12" x2="18" y2="12" />
            <line x1="6" y1="16" x2="14" y2="16" />
          </svg>
          <span>My Tickets</span>
          {tickets.length > 0 && (
            <span
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                padding: "0.1rem 0.45rem",
                borderRadius: 999,
                background: "var(--brand-blue-subtle, #f0f6ff)",
                color: "var(--brand-blue-700, #004074)",
              }}
            >
              {tickets.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("FAQ")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "FAQ" ? "3px solid var(--brand-blue-600, #004b87)" : "3px solid transparent",
            color: activeTab === "FAQ" ? "var(--brand-blue-700, #004074)" : "var(--na-gray-600, #64748b)",
            fontWeight: activeTab === "FAQ" ? 800 : 600,
            fontSize: "0.9375rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>FAQs &amp; Help Guide</span>
        </button>
      </div>

      {/* ── TAB 1: SUBMIT NEW TICKET FORM ── */}
      {activeTab === "NEW" && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid var(--na-gray-200, #e2e8f0)",
            padding: "2rem",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ marginBottom: "1.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--na-gray-900, #0f172a)", margin: "0 0 0.25rem" }}>
              Submit a Support Ticket
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--na-gray-500, #64748b)", margin: 0 }}>
              Provide clear details about the challenge you are facing so we can route your ticket to the right department.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Subject */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-gray-800)", marginBottom: "0.45rem" }}>
                Ticket Subject *
              </label>
              <input
                type="text"
                required
                maxLength={120}
                placeholder="e.g. Code challenge timeout in PySpark ETL module"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.9rem",
                  borderRadius: 10,
                  border: "1px solid var(--na-gray-300, #cbd5e1)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              />
            </div>

            {/* Category & Priority Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-gray-800)", marginBottom: "0.45rem" }}>
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.7rem 0.9rem",
                    borderRadius: 10,
                    border: "1px solid var(--na-gray-300, #cbd5e1)",
                    fontSize: "0.875rem",
                    background: "#ffffff",
                    fontWeight: 600,
                  }}
                >
                  <option value="Course Labs & Exercises">🧪 Course Labs &amp; Coding Sandboxes</option>
                  <option value="Certificate Verification">🏆 Certificate &amp; Credential Claims</option>
                  <option value="Assessment Submissions">📝 Quiz &amp; Assignment Submissions</option>
                  <option value="Curriculum & Teaching Studio">📚 Curriculum &amp; Teaching Studio (Tutors)</option>
                  <option value="Account & Profile">👤 Account, Email &amp; Password</option>
                  <option value="Billing & Invoices">💳 Billing &amp; Enrollment Access</option>
                  <option value="Technical Glitch">⚙️ Bug or Platform Glitch</option>
                  <option value="Other Assistance">💬 Other Inquiry</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-gray-800)", marginBottom: "0.45rem" }}>
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  style={{
                    width: "100%",
                    padding: "0.7rem 0.9rem",
                    borderRadius: 10,
                    border: "1px solid var(--na-gray-300, #cbd5e1)",
                    fontSize: "0.875rem",
                    background: "#ffffff",
                    fontWeight: 600,
                  }}
                >
                  <option value="NORMAL">🟢 Normal (Standard Response)</option>
                  <option value="HIGH">🟡 High (Blocking Lesson Progress)</option>
                  <option value="URGENT">🔴 Urgent (Critical System Outage)</option>
                </select>
              </div>
            </div>

            {/* Related Course (Optional) */}
            {userCourses.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-gray-800)", marginBottom: "0.45rem" }}>
                  Related Course (Optional)
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.7rem 0.9rem",
                    borderRadius: 10,
                    border: "1px solid var(--na-gray-300, #cbd5e1)",
                    fontSize: "0.875rem",
                    background: "#ffffff",
                  }}
                >
                  <option value="">-- No specific course --</option>
                  {userCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Description */}
            <div style={{ marginBottom: "1.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.45rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-gray-800)" }}>
                  Detailed Description *
                </label>
                <span style={{ fontSize: "0.6875rem", color: "var(--na-gray-400)" }}>{description.length}/1000</span>
              </div>
              <textarea
                required
                rows={6}
                maxLength={1000}
                placeholder="Describe your issue with as much detail as possible. If applicable, mention the specific module, error message, or steps to reproduce..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.8rem",
                  borderRadius: 10,
                  border: "1px solid var(--na-gray-300, #cbd5e1)",
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: "linear-gradient(135deg, var(--brand-blue-600, #004b87) 0%, var(--brand-accent-500, #006fa8) 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: 10,
                padding: "0.85rem 1.75rem",
                fontSize: "0.9375rem",
                fontWeight: 700,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(0, 75, 135, 0.25)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              <span>{isSubmitting ? "Submitting Ticket..." : "Submit Support Request"}</span>
            </button>
          </form>
        </div>
      )}

      {/* ── TAB 2: MY TICKETS LIST ── */}
      {activeTab === "TICKETS" && (
        <div>
          {/* Status Filter */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setTicketFilter(st)}
                style={{
                  padding: "0.45rem 0.85rem",
                  borderRadius: 8,
                  border: ticketFilter === st ? "1.5px solid var(--brand-blue-600)" : "1px solid #e2e8f0",
                  background: ticketFilter === st ? "var(--brand-blue-subtle, #f0f6ff)" : "#ffffff",
                  color: ticketFilter === st ? "var(--brand-blue-700, #004074)" : "#475569",
                  fontSize: "0.8125rem",
                  fontWeight: ticketFilter === st ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>

          {filteredTickets.length === 0 ? (
            <div
              style={{
                background: "#ffffff",
                borderRadius: 16,
                border: "1.5px dashed var(--na-gray-300, #cbd5e1)",
                padding: "3.5rem 2rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "var(--na-gray-100)",
                  color: "var(--na-gray-400)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="6" y1="8" x2="10" y2="8" />
                  <line x1="6" y1="12" x2="18" y2="12" />
                </svg>
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--na-gray-800)", margin: "0 0 0.35rem" }}>
                No Support Tickets Found
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--na-gray-500)", margin: "0 0 1.25rem" }}>
                You have not submitted any inquiries matching this status.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("NEW")}
                style={{
                  background: "var(--brand-blue-600, #004b87)",
                  color: "#fff",
                  border: "none",
                  padding: "0.6rem 1.2rem",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                }}
              >
                + Submit a Ticket
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {filteredTickets.map((ticket) => {
                const badge = getStatusBadge(ticket.status);
                const isExpanded = expandedTicketId === ticket.id;

                return (
                  <div
                    key={ticket.id}
                    style={{
                      background: "#ffffff",
                      borderRadius: 14,
                      border: "1px solid var(--na-gray-200, #e2e8f0)",
                      padding: "1.25rem 1.5rem",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 800,
                              textTransform: "uppercase",
                              padding: "0.2rem 0.55rem",
                              borderRadius: 6,
                              background: badge.bg,
                              color: badge.color,
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
                              background: "var(--na-gray-100)",
                              color: "var(--na-gray-700)",
                            }}
                          >
                            #{ticket.id.slice(-6).toUpperCase()}
                          </span>

                          <span style={{ fontSize: "0.75rem", color: "var(--na-gray-500)" }}>
                            {ticket.category}
                          </span>

                          {ticket.priority !== "NORMAL" && (
                            <span
                              style={{
                                fontSize: "0.6875rem",
                                fontWeight: 700,
                                padding: "0.15rem 0.45rem",
                                borderRadius: 6,
                                background: ticket.priority === "URGENT" ? "#fee2e2" : "#fef3c7",
                                color: ticket.priority === "URGENT" ? "#991b1b" : "#92400e",
                              }}
                            >
                              {ticket.priority}
                            </span>
                          )}
                        </div>

                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--na-gray-900)", margin: "0 0 0.35rem 0" }}>
                          {ticket.subject}
                        </h3>

                        {ticket.courseTitle && (
                          <div style={{ fontSize: "0.75rem", color: "var(--brand-blue-600)", marginBottom: "0.4rem" }}>
                            Course: <strong>{ticket.courseTitle}</strong>
                          </div>
                        )}

                        <p
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--na-gray-600)",
                            margin: 0,
                            lineHeight: 1.5,
                            maxHeight: isExpanded ? "none" : "3.6em",
                            overflow: "hidden",
                          }}
                        >
                          {ticket.details}
                        </p>
                      </div>

                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--na-gray-400)", display: "block", marginBottom: "0.5rem" }}>
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>

                        <button
                          type="button"
                          onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--brand-blue-600)",
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          {isExpanded ? "Collapse Details ▲" : "View Details & Response ▼"}
                        </button>
                      </div>
                    </div>

                    {/* Admin Response Box (Expanded) */}
                    {isExpanded && (
                      <div
                        style={{
                          marginTop: "1.25rem",
                          paddingTop: "1rem",
                          borderTop: "1px solid #f1f5f9",
                        }}
                      >
                        {ticket.adminResponse ? (
                          <div
                            style={{
                              background: "linear-gradient(135deg, var(--brand-blue-subtle, #f0f6ff) 0%, #e0eefe 100%)",
                              border: "1px solid var(--brand-accent-200, #bae6fd)",
                              borderRadius: 10,
                              padding: "1rem 1.25rem",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--brand-blue-700)" }}>
                                💬 Staff Resolution from {ticket.resolvedBy || "Academy Support"}:
                              </span>
                              {ticket.resolvedAt && (
                                <span style={{ fontSize: "0.6875rem", color: "var(--brand-blue-600)" }}>
                                  ({new Date(ticket.resolvedAt).toLocaleDateString()})
                                </span>
                              )}
                            </div>
                            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--brand-navy-900)", lineHeight: 1.5 }}>
                              {ticket.adminResponse}
                            </p>
                          </div>
                        ) : (
                          <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)", fontStyle: "italic" }}>
                            Our support staff has received this ticket and will update you here and via your notification bell as soon as an agent investigates.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: FAQ & HELP GUIDE ── */}
      {activeTab === "FAQ" && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid var(--na-gray-200, #e2e8f0)",
            padding: "2rem",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--na-gray-900)", margin: "0 0 1.25rem 0" }}>
            Frequently Asked Questions
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {FAQ_ITEMS.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  border: "1px solid var(--na-gray-200, #e2e8f0)",
                  borderRadius: 12,
                  padding: "1.25rem",
                  background: "var(--na-gray-50, #f8fafc)",
                }}
              >
                <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--brand-navy-900, #002244)", marginBottom: "0.4rem" }}>
                  Q: {faq.q}
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--na-gray-600)", margin: 0, lineHeight: 1.55 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

