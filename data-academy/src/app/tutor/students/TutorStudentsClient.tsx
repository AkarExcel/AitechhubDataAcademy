"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface StudentEnrollmentItem {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  progress: number;
  enrolledAt: string;
  completedAt: string | null;
  lastAccessed: string | null;
}

interface CourseOption {
  id: string;
  title: string;
}

interface TutorStudentsClientProps {
  initialEnrollments: StudentEnrollmentItem[];
  courses: CourseOption[];
}

export default function TutorStudentsClient({
  initialEnrollments,
  courses,
}: TutorStudentsClientProps) {
  const [enrollments] = useState<StudentEnrollmentItem[]>(initialEnrollments);
  const [search, setSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search.trim() ||
        item.studentName.toLowerCase().includes(q) ||
        item.studentEmail.toLowerCase().includes(q) ||
        item.courseTitle.toLowerCase().includes(q);

      const matchesCourse =
        selectedCourseId === "ALL" || item.courseId === selectedCourseId;

      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [enrollments, search, selectedCourseId, statusFilter]);

  const metrics = useMemo(() => {
    const total = enrollments.length;
    const completed = enrollments.filter((e) => e.status === "COMPLETED").length;
    const active = enrollments.filter((e) => e.status === "ACTIVE").length;
    const avgProgress =
      total > 0
        ? Math.round(
            enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / total
          )
        : 0;

    return { total, completed, active, avgProgress };
  }, [enrollments]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* ── HEADER ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.75rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--na-navy-900, #001830)", margin: "0 0 0.25rem 0" }}>
            Student Roster &amp; Cohort Progress
          </h1>
          <p style={{ color: "var(--na-gray-600, #475569)", fontSize: "0.875rem", margin: 0 }}>
            Track student learning progress and send personalized 1-on-1 feedback across your courses.
          </p>
        </div>

        <Link
          href="/tutor/notifications"
          className="btn btn-primary"
          style={{
            background: "var(--brand-blue-600, #004b87)",
            borderColor: "var(--brand-blue-600, #004b87)",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "0.875rem",
            padding: "0.6rem 1.25rem",
            borderRadius: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            textDecoration: "none",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span>Send Feedback &amp; Alerts</span>
        </Link>
      </div>

      {/* ── METRICS TILES ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
            Enrolled Students
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginTop: "0.25rem" }}>
            {metrics.total}
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--brand-blue-600, #004b87)", textTransform: "uppercase" }}>
            Active Learners
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--brand-blue-700, #004074)", marginTop: "0.25rem" }}>
            {metrics.active}
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#059669", textTransform: "uppercase" }}>
            Completed Courses
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#059669", marginTop: "0.25rem" }}>
            {metrics.completed}
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase" }}>
            Average Progress
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#7c3aed", marginTop: "0.25rem" }}>
            {metrics.avgProgress}%
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          padding: "1rem",
          marginBottom: "1.5rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: 1, minWidth: 260 }}>
          <input
            type="text"
            placeholder="Search students by name, email, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.6rem 0.9rem",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: "0.875rem",
            }}
          />
        </div>

        {courses.length > 0 && (
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            style={{
              padding: "0.6rem 0.9rem",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: "0.84rem",
              fontWeight: 600,
              background: "#ffffff",
              color: "#0f172a",
              maxWidth: 240,
            }}
          >
            <option value="ALL">All Courses ({courses.length})</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        )}

        <div style={{ display: "flex", gap: "0.4rem" }}>
          {(["ALL", "ACTIVE", "COMPLETED"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              style={{
                padding: "0.5rem 0.85rem",
                borderRadius: 8,
                border: statusFilter === status ? "2px solid var(--brand-blue-600, #004b87)" : "1px solid #cbd5e1",
                background: statusFilter === status ? "var(--brand-blue-subtle, #f0f6ff)" : "#ffffff",
                color: statusFilter === status ? "var(--brand-blue-700, #004074)" : "#475569",
                fontWeight: 700,
                fontSize: "0.75rem",
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              {status === "ALL" ? "All" : status === "ACTIVE" ? "Active" : "Completed"}
            </button>
          ))}
        </div>
      </div>

      {/* ── TABLE / LIST ── */}
      {filteredEnrollments.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            border: "1px dashed #cbd5e1",
            padding: "3.5rem 2rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👥</div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.35rem" }}>
            No enrolled students found
          </h3>
          <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
            {search || selectedCourseId !== "ALL" || statusFilter !== "ALL"
              ? "No students match your filter criteria."
              : "Students will appear here once they enroll in your courses."}
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  <th style={{ padding: "0.85rem 1.25rem" }}>Student</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Course</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Progress</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Status</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Enrolled</th>
                  <th style={{ padding: "0.85rem 1.25rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrollments.map((e) => {
                  const isDone = e.status === "COMPLETED";

                  return (
                    <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, var(--brand-blue-600, #004b87) 0%, #006fa8 100%)",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.8125rem",
                              flexShrink: 0,
                            }}
                          >
                            {e.studentName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>
                              {e.studentName}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                              {e.studentEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "1rem 1rem" }}>
                        <Link
                          href={`/courses/${e.courseSlug}`}
                          target="_blank"
                          style={{ color: "var(--brand-blue-700, #004074)", fontWeight: 600, textDecoration: "none" }}
                        >
                          {e.courseTitle}
                        </Link>
                      </td>

                      <td style={{ padding: "1rem 1rem", minWidth: 140 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div style={{ flex: 1, background: "#e2e8f0", height: 6, borderRadius: 999, overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${Math.min(100, Math.max(0, e.progress))}%`,
                                height: "100%",
                                background: isDone ? "#10b981" : "var(--brand-blue-600, #004b87)",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", width: 36 }}>
                            {Math.round(e.progress)}%
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: "1rem 1rem" }}>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.5rem",
                            borderRadius: 6,
                            background: isDone ? "#ecfdf5" : "#eff6ff",
                            color: isDone ? "#065f46" : "#1e40af",
                          }}
                        >
                          {isDone ? "Completed" : "In Progress"}
                        </span>
                      </td>

                      <td style={{ padding: "1rem 1rem", color: "#64748b", fontSize: "0.8125rem" }}>
                        {formatDate(e.enrolledAt)}
                      </td>

                      <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                        <Link
                          href={`/tutor/notifications`}
                          style={{
                            background: "#f1f5f9",
                            border: "1px solid #cbd5e1",
                            borderRadius: 6,
                            padding: "0.35rem 0.75rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#334155",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                          }}
                          title={`Send 1-on-1 feedback to ${e.studentName}`}
                        >
                          <span>💬 Feedback</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

