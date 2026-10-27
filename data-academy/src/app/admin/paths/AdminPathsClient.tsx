"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

type Course = {
  id: string;
  title: string;
  slug: string;
  level: string;
  estimatedHours: number;
  coverImage: string | null;
  status: string;
};

type PathCourse = {
  id: string;
  order: number;
  isRequired: boolean;
  course: Course;
};

type LearningPath = {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string | null;
  color: string | null;
  isPublished: boolean;
  order: number;
  courses: PathCourse[];
};

type AllCourse = {
  id: string;
  title: string;
  slug: string;
  level: string;
  estimatedHours: number;
  status: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

const ICON_OPTIONS = [
  { value: "analytics", label: "Analytics (Bar Chart)" },
  { value: "datascience", label: "Data Science (Flask)" },
  { value: "ai", label: "Artificial Intelligence (CPU)" },
  { value: "ml", label: "Machine Learning (Network)" },
  { value: "python", label: "Python (Code)" },
  { value: "sql", label: "SQL (Database)" },
  { value: "bi", label: "Business Intelligence" },
];

const COLOR_PRESETS = [
  "#049fd9", "#00739c", "#5b21b6", "#6abf4b", "#f37021", "#d97706", "#0284c7",
  "#dc2626", "#059669", "#7c3aed", "#db2777",
];

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);
}

// ── Modal ──────────────────────────────────────────────────────────────────

function PathFormModal({
  path,
  allCourses,
  onClose,
  onSaved,
}: {
  path?: LearningPath;
  allCourses: AllCourse[];
  onClose: () => void;
  onSaved: (p: LearningPath) => void;
}) {
  const isEdit = !!path;

  const [form, setForm] = useState({
    title: path?.title || "",
    slug: path?.slug || "",
    description: path?.description || "",
    icon: path?.icon || "analytics",
    color: path?.color || "#049fd9",
    isPublished: path?.isPublished ?? false,
    order: path?.order ?? 0,
  });

  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(
    path?.courses.map((pc) => pc.course.id) || []
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseSearch, setCourseSearch] = useState("");

  function handleTitleChange(title: string) {
    setForm((f) => ({ ...f, title, slug: isEdit ? f.slug : slugify(title) }));
  }

  function toggleCourse(id: string) {
    setSelectedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function moveCourse(id: string, dir: -1 | 1) {
    setSelectedCourseIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = isEdit ? `/api/admin/paths/${path!.id}` : "/api/admin/paths";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, courseIds: selectedCourseIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      onSaved(data.path);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredCourses = allCourses.filter(
    (c) =>
      !courseSearch ||
      c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.slug.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const selectedCourses = selectedCourseIds
    .map((id) => allCourses.find((c) => c.id === id))
    .filter(Boolean) as AllCourse[];

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 20, width: "100%", maxWidth: 800,
          maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.5rem 2rem", borderBottom: "1px solid var(--na-gray-200)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "linear-gradient(135deg, #001830, #003366)",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", margin: 0 }}>
              {isEdit ? "Edit Learning Path" : "Create New Learning Path"}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8125rem", margin: "0.2rem 0 0" }}>
              {isEdit ? `Editing: ${path!.title}` : "Set up a new career pathway with courses"}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff", width: 36, height: 36, borderRadius: "50%", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem",
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ overflow: "auto", flex: 1 }}>
          <div style={{ padding: "1.75rem 2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

            {/* Title */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Path Title *</label>
              <input
                required value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Data Analytics"
                style={inputStyle}
              />
            </div>

            {/* Slug */}
            <div>
              <label style={labelStyle}>URL Slug *</label>
              <input
                required value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="data-analytics"
                style={inputStyle}
              />
              <p style={{ fontSize: "0.6875rem", color: "var(--na-gray-400)", marginTop: "0.25rem" }}>
                /paths#{form.slug}
              </p>
            </div>

            {/* Order */}
            <div>
              <label style={labelStyle}>Display Order</label>
              <input
                type="number" min="0" value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                style={inputStyle}
              />
            </div>

            {/* Description */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Description *</label>
              <textarea
                required value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Short description of what learners will achieve..."
                style={{ ...inputStyle, resize: "vertical", height: "auto" }}
              />
            </div>

            {/* Icon */}
            <div>
              <label style={labelStyle}>Icon</label>
              <select
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                style={inputStyle}
              >
                {ICON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label style={labelStyle}>Accent Color</label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                {COLOR_PRESETS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    style={{
                      width: 28, height: 28, borderRadius: "50%", background: c,
                      border: form.color === c ? "3px solid #1b2533" : "2px solid transparent",
                      cursor: "pointer", boxShadow: form.color === c ? "0 0 0 2px white" : "none",
                      flexShrink: 0,
                    }}
                  />
                ))}
                <input
                  type="color" value={form.color || "#049fd9"}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  style={{ width: 28, height: 28, border: "none", borderRadius: "50%", cursor: "pointer", padding: 0, background: "none" }}
                />
              </div>
            </div>

            {/* Published toggle */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                <div
                  onClick={() => setForm((f) => ({ ...f, isPublished: !f.isPublished }))}
                  style={{
                    width: 44, height: 24, borderRadius: 9999,
                    background: form.isPublished ? "#0284c7" : "var(--na-gray-300)",
                    position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: "absolute", top: 2,
                      left: form.isPublished ? 22 : 2,
                      width: 20, height: 20, borderRadius: "50%",
                      background: "#fff", transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1b2533" }}>
                  {form.isPublished ? "Published (visible on /paths)" : "Draft (hidden from public)"}
                </span>
              </label>
            </div>

            {/* Course picker */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Course Sequence</label>

              {/* Selected courses (ordered list) */}
              {selectedCourses.length > 0 && (
                <div
                  style={{
                    border: "1px solid var(--na-gray-200)", borderRadius: 10, marginBottom: "0.75rem",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: "0.625rem 1rem", background: "var(--na-gray-50)", borderBottom: "1px solid var(--na-gray-200)" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--na-gray-500)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      SELECTED ({selectedCourses.length}) — Drag or use arrows to reorder
                    </span>
                  </div>
                  {selectedCourses.map((c, idx) => (
                    <div
                      key={c.id}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        padding: "0.625rem 1rem",
                        borderBottom: idx < selectedCourses.length - 1 ? "1px solid var(--na-gray-100)" : "none",
                        background: "#fff",
                      }}
                    >
                      <span style={{ width: 24, height: 24, borderRadius: "50%", background: form.color || "#049fd9", color: "#fff", fontSize: "0.75rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {idx + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1b2533", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--na-gray-400)" }}>{LEVEL_LABEL[c.level]} · {c.estimatedHours}h</div>
                      </div>
                      <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
                        <button type="button" onClick={() => moveCourse(c.id, -1)} disabled={idx === 0} style={arrowBtnStyle} title="Move Up">↑</button>
                        <button type="button" onClick={() => moveCourse(c.id, 1)} disabled={idx === selectedCourses.length - 1} style={arrowBtnStyle} title="Move Down">↓</button>
                        <button type="button" onClick={() => toggleCourse(c.id)} style={{ ...arrowBtnStyle, color: "#ef4444" }} title="Remove">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Search + pick courses */}
              <div style={{ border: "1px solid var(--na-gray-200)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "0.625rem 1rem", borderBottom: "1px solid var(--na-gray-100)" }}>
                  <input
                    type="search"
                    placeholder="Search courses to add..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    style={{ ...inputStyle, margin: 0, fontSize: "0.8125rem" }}
                  />
                </div>
                <div style={{ maxHeight: 220, overflow: "auto" }}>
                  {filteredCourses.length === 0 ? (
                    <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--na-gray-400)", fontSize: "0.875rem" }}>
                      No courses found
                    </div>
                  ) : (
                    filteredCourses.map((c) => {
                      const isSelected = selectedCourseIds.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleCourse(c.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.875rem",
                            padding: "0.625rem 1rem", cursor: "pointer",
                            background: isSelected ? `${form.color || "#049fd9"}08` : "#fff",
                            borderBottom: "1px solid var(--na-gray-50)",
                            transition: "background 0.12s",
                          }}
                        >
                          <div
                            style={{
                              width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                              border: `2px solid ${isSelected ? form.color || "#049fd9" : "var(--na-gray-300)"}`,
                              background: isSelected ? form.color || "#049fd9" : "transparent",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            {isSelected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1b2533", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                            <div style={{ fontSize: "0.6875rem", color: "var(--na-gray-400)" }}>
                              {LEVEL_LABEL[c.level]} · {c.estimatedHours}h · {c.status}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          {error && (
            <div style={{ margin: "0 2rem 1rem", padding: "0.75rem 1rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          <div
            style={{
              padding: "1.25rem 2rem", borderTop: "1px solid var(--na-gray-200)",
              display: "flex", justifyContent: "flex-end", gap: "0.75rem",
              background: "var(--na-gray-50)",
            }}
          >
            <button type="button" onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
            <button
              type="submit" disabled={loading}
              style={{
                padding: "0.625rem 1.5rem", borderRadius: 9999,
                background: "linear-gradient(135deg, #004b87, #0088cc)",
                color: "#fff", fontWeight: 700, border: "none", cursor: loading ? "not-allowed" : "pointer",
                fontSize: "0.9375rem", opacity: loading ? 0.7 : 1,
                display: "flex", alignItems: "center", gap: "0.5rem",
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  Saving...
                </>
              ) : (
                isEdit ? "Save Changes" : "Create Path"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Shared styles ───────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.8125rem", fontWeight: 600,
  color: "var(--na-gray-700)", marginBottom: "0.375rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.5625rem 0.875rem",
  border: "1px solid var(--na-gray-300)", borderRadius: 8,
  fontSize: "0.9375rem", color: "#1b2533",
  background: "#fff", boxSizing: "border-box",
  outline: "none",
};

const arrowBtnStyle: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 6, border: "1px solid var(--na-gray-200)",
  background: "#fff", cursor: "pointer", color: "var(--na-gray-600)",
  fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center",
  lineHeight: 1,
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: "0.625rem 1.25rem", borderRadius: 9999,
  border: "1px solid var(--na-gray-300)", background: "#fff",
  color: "var(--na-gray-700)", fontWeight: 600, cursor: "pointer", fontSize: "0.9375rem",
};

// ── Main Client Component ───────────────────────────────────────────────────

export default function AdminPathsClient({
  initialPaths,
  allCourses,
}: {
  initialPaths: LearningPath[];
  allCourses: AllCourse[];
}) {
  const [paths, setPaths] = useState<LearningPath[]>(initialPaths);
  const [modal, setModal] = useState<"create" | LearningPath | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleSaved = useCallback((saved: LearningPath) => {
    setPaths((prev) => {
      const existing = prev.findIndex((p) => p.id === saved.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = saved;
        return next.sort((a, b) => a.order - b.order);
      }
      return [...prev, saved].sort((a, b) => a.order - b.order);
    });
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this learning path? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/paths/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Failed to delete.");
        return;
      }
      setPaths((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function handleTogglePublish(path: LearningPath) {
    setTogglingId(path.id);
    try {
      const res = await fetch(`/api/admin/paths/${path.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !path.isPublished }),
      });
      const data = await res.json();
      if (res.ok) handleSaved(data.path);
      else alert(data.error || "Failed.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <>
      {/* Modals */}
      {modal === "create" && (
        <PathFormModal allCourses={allCourses} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal && modal !== "create" && (
        <PathFormModal
          path={modal as LearningPath}
          allCourses={allCourses}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Top actions */}
      <div
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "1rem", marginBottom: "1.75rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/admin" style={{ color: "var(--na-blue-500)", fontSize: "0.875rem", textDecoration: "none" }}>Admin</Link>
            <span style={{ color: "var(--na-gray-400)" }}>/</span>
            <span style={{ color: "var(--na-gray-600)", fontSize: "0.875rem" }}>Learning Paths</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1b2533", margin: 0 }}>Learning Paths</h1>
          <p style={{ color: "var(--na-gray-500)", fontSize: "0.9375rem", margin: "0.25rem 0 0" }}>
            {paths.length} path{paths.length !== 1 ? "s" : ""} · {paths.filter((p) => p.isPublished).length} published
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link
            href="/paths"
            target="_blank"
            className="btn btn-secondary"
            style={{ padding: "0.625rem 1.25rem", borderRadius: 9999, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Preview Page
          </Link>
          <button
            onClick={() => setModal("create")}
            className="btn btn-green"
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.625rem 1.25rem", borderRadius: 9999, fontWeight: 700,
              border: "none", cursor: "pointer", fontSize: "0.9375rem",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Path
          </button>
        </div>
      </div>

      {/* Empty state */}
      {paths.length === 0 && (
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🗺️</div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1b2533", marginBottom: "0.5rem" }}>No learning paths yet</h3>
          <p style={{ color: "var(--na-gray-500)", marginBottom: "1.5rem" }}>
            Create your first learning path to organize courses into career tracks.
          </p>
          <button
            onClick={() => setModal("create")}
            className="btn btn-green"
            style={{ padding: "0.625rem 1.5rem", borderRadius: 9999, fontWeight: 700, border: "none", cursor: "pointer", fontSize: "0.9375rem" }}
          >
            Create First Path
          </button>
        </div>
      )}

      {/* Paths grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {paths.map((path) => {
          const pathColor = path.color || "#004b87";
          return (
            <div
              key={path.id}
              className="card"
              style={{
                padding: "0", overflow: "hidden",
                border: `1px solid ${pathColor}30`,
                transition: "box-shadow 0.2s",
              }}
            >
              {/* Path row header */}
              <div
                style={{
                  display: "flex", alignItems: "center", gap: "1.25rem",
                  padding: "1.25rem 1.5rem",
                  borderLeft: `4px solid ${pathColor}`,
                  flexWrap: "wrap",
                  background: `linear-gradient(135deg, ${pathColor}08, transparent)`,
                }}
              >
                {/* Icon blob */}
                <div
                  style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: `linear-gradient(135deg, ${pathColor}, ${pathColor}bb)`,
                    color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 4px 12px ${pathColor}40`,
                  }}
                >
                  {/* simple path symbol */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3" />
                  </svg>
                </div>

                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "1.0625rem", color: "#1b2533" }}>{path.title}</span>
                    <span
                      style={{
                        fontSize: "0.6875rem", fontWeight: 700, borderRadius: 9999, padding: "0.2rem 0.6rem",
                        letterSpacing: "0.05em", textTransform: "uppercase",
                        background: path.isPublished ? "#d1fae5" : "var(--na-gray-100)",
                        color: path.isPublished ? "#059669" : "var(--na-gray-500)",
                      }}
                    >
                      {path.isPublished ? "Published" : "Draft"}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--na-gray-500)" }}>
                      {path.courses.length} course{path.courses.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)", margin: "0.25rem 0 0", lineHeight: 1.5 }}>
                    {path.description.length > 120 ? path.description.slice(0, 120) + "…" : path.description}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button
                    onClick={() => handleTogglePublish(path)}
                    disabled={togglingId === path.id}
                    style={{
                      ...secondaryBtnStyle,
                      padding: "0.4rem 0.875rem",
                      fontSize: "0.8125rem",
                      background: path.isPublished ? "#fff3cd" : "#d1fae5",
                      borderColor: path.isPublished ? "#fbbf24" : "#6ee7b7",
                      color: path.isPublished ? "#92400e" : "#065f46",
                      opacity: togglingId === path.id ? 0.6 : 1,
                    }}
                  >
                    {path.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => setModal(path)}
                    style={{ ...secondaryBtnStyle, padding: "0.4rem 0.875rem", fontSize: "0.8125rem" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(path.id)}
                    disabled={deleting === path.id}
                    style={{
                      ...secondaryBtnStyle,
                      padding: "0.4rem 0.75rem",
                      fontSize: "0.8125rem",
                      color: deleting === path.id ? "var(--na-gray-400)" : "#dc2626",
                      borderColor: "#fca5a5",
                      background: "#fff",
                    }}
                  >
                    {deleting === path.id ? "…" : "Delete"}
                  </button>
                </div>
              </div>

              {/* Course sequence mini-list */}
              {path.courses.length > 0 && (
                <div style={{ padding: "0.75rem 1.5rem 1rem", borderTop: "1px solid var(--na-gray-100)" }}>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {path.courses.map((pc, idx) => (
                      <div
                        key={pc.id}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.5rem",
                          background: "var(--na-gray-50)", border: "1px solid var(--na-gray-200)",
                          borderRadius: 8, padding: "0.35rem 0.75rem",
                          fontSize: "0.8125rem",
                        }}
                      >
                        <span style={{ width: 20, height: 20, borderRadius: "50%", background: pathColor, color: "#fff", fontSize: "0.625rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontWeight: 600, color: "#1b2533" }}>{pc.course.title}</span>
                        <span style={{ color: "var(--na-gray-400)", fontSize: "0.75rem" }}>{LEVEL_LABEL[pc.course.level]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
