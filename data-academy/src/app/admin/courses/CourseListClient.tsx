"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  _count: { modules: number; enrollments: number };
  instructors: Array<{
    user: { profile: { firstName: string; lastName: string } | null };
  }>;
}

export default function CourseListClient({
  initialCourses,
  categories,
}: {
  initialCourses: CourseItem[];
  categories: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      c.shortDescription.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesCategory = categoryFilter === "ALL" || c.category?.id === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleTogglePublish = async (courseId: string) => {
    setActionLoading(courseId);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/publish`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error || "Failed to update publication status.", type: "error" });
      } else {
        setMessage({ text: data.message, type: "success" });
        setCourses((prev) =>
          prev.map((c) => (c.id === courseId ? { ...c, status: data.status } : c))
        );
        router.refresh();
      }
    } catch {
      setMessage({ text: "Network error occurred.", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCourse = async (courseId: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone.`)) {
      return;
    }

    setActionLoading(courseId);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error || "Failed to delete course.", type: "error" });
      } else {
        setMessage({ text: "Course deleted successfully.", type: "success" });
        setCourses((prev) => prev.filter((c) => c.id !== courseId));
        router.refresh();
      }
    } catch {
      setMessage({ text: "Network error occurred.", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {/* Alert Banner */}
      {message && (
        <div
          style={{
            padding: "0.875rem 1rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem",
            background: message.type === "success" ? "var(--na-green-50)" : "#fef2f2",
            border: `1px solid ${message.type === "success" ? "var(--na-green-200)" : "#fca5a5"}`,
            color: message.type === "success" ? "#166534" : "#991b1b",
            fontSize: "0.875rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: "1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem", flex: 1, minWidth: 260 }}>
          <input
            type="text"
            placeholder="Search courses by title, slug or keywords…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "0.55rem 0.875rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--na-gray-300)",
              fontSize: "0.875rem",
              outline: "none",
            }}
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "0.55rem 0.875rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--na-gray-300)",
              fontSize: "0.875rem",
              background: "#fff",
              outline: "none",
            }}
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Pills */}
        <div style={{ display: "flex", gap: "0.35rem", background: "var(--na-gray-100)", padding: "0.25rem", borderRadius: "var(--radius-md)" }}>
          {["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                border: "none",
                background: statusFilter === st ? "#fff" : "transparent",
                color: statusFilter === st ? "var(--na-gray-900)" : "var(--na-gray-600)",
                fontWeight: statusFilter === st ? 700 : 500,
                fontSize: "0.75rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "4px",
                cursor: "pointer",
                boxShadow: statusFilter === st ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Table */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "var(--na-gray-50)", borderBottom: "1px solid var(--na-gray-200)", color: "var(--na-gray-600)" }}>
                <th style={{ padding: "0.875rem 1.25rem", fontWeight: 600 }}>Course</th>
                <th style={{ padding: "0.875rem 1rem", fontWeight: 600 }}>Category</th>
                <th style={{ padding: "0.875rem 1rem", fontWeight: 600 }}>Level</th>
                <th style={{ padding: "0.875rem 1rem", fontWeight: 600 }}>Curriculum</th>
                <th style={{ padding: "0.875rem 1rem", fontWeight: 600 }}>Enrolled</th>
                <th style={{ padding: "0.875rem 1rem", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "0.875rem 1.25rem", fontWeight: 600, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "var(--na-gray-500)" }}>
                    No courses match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => {
                  const isBusy = actionLoading === c.id;
                  const statusBadgeClass =
                    c.status === "PUBLISHED"
                      ? "badge-green"
                      : c.status === "DRAFT"
                      ? "badge-amber"
                      : "badge-gray";

                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--na-gray-100)" }}>
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                          <div
                            style={{
                              width: 50,
                              height: 50,
                              borderRadius: "8px",
                              background: "linear-gradient(135deg, var(--na-navy-800), var(--na-blue-600))",
                              overflow: "hidden",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {c.coverImage ? (
                              <img src={c.coverImage} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.875rem" }}>
                                {c.title.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/admin/courses/${c.id}`}
                              style={{ fontWeight: 600, color: "#1b2533", textDecoration: "none" }}
                            >
                              {c.title}
                            </Link>
                            <div style={{ fontSize: "0.75rem", color: "var(--na-gray-400)" }}>/{c.slug}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "1rem", color: "var(--na-gray-700)" }}>
                        {c.category?.name || "General"}
                      </td>

                      <td style={{ padding: "1rem" }}>
                        <span className={`badge ${getLevelColor(c.level)}`}>
                          {getLevelLabel(c.level)}
                        </span>
                      </td>

                      <td style={{ padding: "1rem", color: "var(--na-gray-700)" }}>
                        <Link
                          href={`/admin/courses/${c.id}?tab=curriculum`}
                          style={{ color: "var(--na-blue-600)", fontWeight: 600, textDecoration: "underline" }}
                        >
                          {c._count.modules} modules
                        </Link>
                      </td>

                      <td style={{ padding: "1rem", color: "var(--na-gray-700)" }}>
                        {c._count.enrollments} learners
                      </td>

                      <td style={{ padding: "1rem" }}>
                        <span className={`badge ${statusBadgeClass}`}>
                          {c.status}
                        </span>
                      </td>

                      <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
                          {/* Publish/Unpublish toggle */}
                          <button
                            onClick={() => handleTogglePublish(c.id)}
                            disabled={isBusy}
                            style={{
                              padding: "0.35rem 0.65rem",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--na-gray-300)",
                              background: "#fff",
                              color: c.status === "PUBLISHED" ? "var(--na-amber)" : "var(--na-green-600)",
                              cursor: isBusy ? "not-allowed" : "pointer",
                            }}
                          >
                            {isBusy
                              ? "..."
                              : c.status === "PUBLISHED"
                              ? "Unpublish"
                              : "Publish"}
                          </button>

                          {/* Edit Details */}
                          <Link
                            href={`/admin/courses/${c.id}`}
                            className="btn btn-secondary"
                            style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
                          >
                            Edit
                          </Link>

                          {/* Public preview */}
                          <Link
                            href={`/courses/${c.slug}`}
                            target="_blank"
                            className="btn btn-ghost"
                            style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
                          >
                            View
                          </Link>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteCourse(c.id, c.title)}
                            disabled={isBusy}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#e11d48",
                              cursor: "pointer",
                              padding: "0.35rem",
                              borderRadius: "4px",
                            }}
                            title="Delete Course"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
