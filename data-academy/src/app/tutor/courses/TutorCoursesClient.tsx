"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getLevelColor, getLevelLabel } from "@/lib/utils";

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  coverImage: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  isFree: boolean;
  price: number;
  category: { id: string; name: string } | null;
  _count: {
    modules: number;
    enrollments: number;
  };
  updatedAt: Date | string;
}

interface TutorCoursesClientProps {
  initialCourses: CourseItem[];
  isVerified: boolean;
}

export default function TutorCoursesClient({
  initialCourses,
  isVerified,
}: TutorCoursesClientProps) {
  const [courses] = useState<CourseItem[]>(initialCourses);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        search.trim() === "" ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.shortDescription.toLowerCase().includes(search.toLowerCase()) ||
        (c.category?.name && c.category.name.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === "ALL" ? true : c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [courses, search, statusFilter]);

  const stats = useMemo(() => {
    const total = courses.length;
    const published = courses.filter((c) => c.status === "PUBLISHED").length;
    const drafts = courses.filter((c) => c.status === "DRAFT").length;
    const totalStudents = courses.reduce((sum, c) => sum + (c._count.enrollments || 0), 0);
    return { total, published, drafts, totalStudents };
  }, [courses]);

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
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--na-navy-900, #001830)", margin: 0 }}>
              My Curriculum &amp; Courses
            </h1>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "0.2rem 0.6rem",
                borderRadius: 999,
                background: isVerified ? "#ecfdf5" : "#fef3c7",
                color: isVerified ? "#065f46" : "#92400e",
                border: isVerified ? "1px solid #a7f3d0" : "1px solid #fde68a",
              }}
            >
              {isVerified ? "✓ Verified Educator" : "⏳ Verification Pending"}
            </span>
          </div>
          <p style={{ color: "var(--na-gray-600, #475569)", fontSize: "0.875rem", margin: 0 }}>
            Author lessons, build coding challenges, and manage your academy syllabus.
          </p>
        </div>

        {/* Create Course Button */}
        <div>
          {isVerified ? (
            <Link
              href="/tutor/courses/new"
              className="btn btn-primary"
              style={{
                background: "var(--na-green-500, #10b981)",
                borderColor: "var(--na-green-500, #10b981)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.875rem",
                padding: "0.6rem 1.25rem",
                borderRadius: 10,
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                textDecoration: "none",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Create New Course</span>
            </Link>
          ) : (
            <div
              style={{
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                color: "#64748b",
                fontWeight: 600,
                fontSize: "0.8125rem",
                padding: "0.55rem 1rem",
                borderRadius: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
              title="You must be verified by an administrator before you can author courses."
            >
              <span>🔒 Create Course</span>
              <span style={{ fontSize: "0.6875rem", background: "#e2e8f0", padding: "0.15rem 0.4rem", borderRadius: 4 }}>
                Verification Required
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── METRICS SUMMARY CARDS ── */}
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
            Total Courses
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginTop: "0.25rem" }}>
            {stats.total}
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#059669", textTransform: "uppercase" }}>
            Published (Live)
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#059669", marginTop: "0.25rem" }}>
            {stats.published}
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#d97706", textTransform: "uppercase" }}>
            Drafts (Pending Publish)
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#d97706", marginTop: "0.25rem" }}>
            {stats.drafts}
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--brand-blue-600, #004b87)", textTransform: "uppercase" }}>
            Total Enrolled Students
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--brand-blue-700, #004074)", marginTop: "0.25rem" }}>
            {stats.totalStudents}
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
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
            placeholder="Search courses by title, category, or description..."
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

        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["ALL", "PUBLISHED", "DRAFT"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              style={{
                padding: "0.5rem 0.9rem",
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
              {status === "ALL" ? `All (${stats.total})` : status === "PUBLISHED" ? `Published (${stats.published})` : `Drafts (${stats.drafts})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── COURSE LIST ── */}
      {filteredCourses.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            border: "1px dashed #cbd5e1",
            padding: "3.5rem 2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#eff6ff",
              color: "var(--brand-blue-600, #004b87)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.35rem" }}>
            No courses found
          </h3>
          <p style={{ fontSize: "0.875rem", color: "#64748b", maxWidth: 420, margin: "0 auto 1.5rem" }}>
            {search || statusFilter !== "ALL"
              ? "No courses matched your current filter criteria."
              : isVerified
              ? "You have not authored any courses yet. Start designing your first curriculum today!"
              : "You have not been assigned to any courses yet, and your educator profile is pending review."}
          </p>
          {isVerified && (
            <Link
              href="/tutor/courses/new"
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 700, textDecoration: "none" }}
            >
              + Create Your First Course
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredCourses.map((c) => {
            const isLive = c.status === "PUBLISHED";

            return (
              <div
                key={c.id}
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  padding: "1.25rem 1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1.5rem",
                  flexWrap: "wrap",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        padding: "0.15rem 0.5rem",
                        borderRadius: 6,
                        background: isLive ? "#ecfdf5" : "#fef3c7",
                        color: isLive ? "#065f46" : "#92400e",
                        border: isLive ? "1px solid #a7f3d0" : "1px solid #fde68a",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em",
                      }}
                    >
                      {isLive ? "✓ Published" : "🔒 Draft"}
                    </span>

                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        color: getLevelColor(c.level),
                      }}
                    >
                      {getLevelLabel(c.level)}
                    </span>

                    {c.category && (
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        &bull; {c.category.name}
                      </span>
                    )}

                    {!isLive && (
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          color: "#b45309",
                          fontStyle: "italic",
                        }}
                      >
                        (Requires Admin Publishing)
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.35rem 0" }}>
                    {c.title}
                  </h3>

                  <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "0 0 0.5rem 0", lineHeight: 1.4 }}>
                    {c.shortDescription}
                  </p>

                  <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.75rem", color: "#64748b" }}>
                    <span>
                      📚 <strong>{c._count.modules}</strong> Modules
                    </span>
                    <span>
                      👥 <strong>{c._count.enrollments}</strong> Enrolled Students
                    </span>
                    <span>
                      💰 {c.isFree ? "Free" : `$${c.price}`}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexShrink: 0 }}>
                  <Link
                    href={`/courses/${c.slug}`}
                    target="_blank"
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      padding: "0.55rem 0.9rem",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "#334155",
                      textDecoration: "none",
                    }}
                  >
                    Preview
                  </Link>

                  <Link
                    href={`/tutor/courses/${c.id}`}
                    style={{
                      background: "var(--brand-blue-600, #004b87)",
                      color: "#ffffff",
                      borderRadius: 8,
                      padding: "0.55rem 1rem",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <span>Edit Syllabus &amp; Lessons</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

