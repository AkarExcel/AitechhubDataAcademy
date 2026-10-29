"use client";

import { useState } from "react";
import Link from "next/link";

export interface AdminFeedbackItem {
  id: string;
  userId?: string | null;
  rating: number;
  category: string;
  content: string;
  courseId?: string | null;
  courseTitle?: string | null;
  allowFeatured: boolean;
  userRole: string;
  userName: string;
  userEmail: string;
  status: string;
  isFeatured: boolean;
  adminNotes?: string | null;
  createdAt: string | Date;
}

interface FeedbackAdminClientProps {
  initialFeedback: AdminFeedbackItem[];
  initialStats: {
    totalCount: number;
    avgRating: number;
    fiveStarCount: number;
    featuredCount: number;
  };
}

export default function FeedbackAdminClient({
  initialFeedback,
  initialStats,
}: FeedbackAdminClientProps) {
  const [feedbackItems, setFeedbackItems] = useState<AdminFeedbackItem[]>(initialFeedback);
  const [stats, setStats] = useState(initialStats);

  // Filters
  const [filterRating, setFilterRating] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Action State
  const [featuringId, setFeaturingId] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Feature as Testimonial
  const handleFeatureTestimonial = async (item: AdminFeedbackItem) => {
    setFeaturingId(item.id);
    setBannerMessage(null);

    try {
      const res = await fetch("/api/admin/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId: item.id,
          studentName: item.userName,
          role: item.userRole === "TUTOR" ? "Academy Instructor" : "Data Practitioner",
          content: item.content,
          rating: item.rating,
          courseTitle: item.courseTitle || "AI Tech Hub Academy",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to feature feedback.");
      }

      setBannerMessage({
        type: "success",
        text: `"${item.userName}'s" review is now featured publicly as a verified testimonial!`,
      });

      // Update in local state
      setFeedbackItems((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, isFeatured: true, status: "FEATURED" } : f))
      );

      setStats((prev) => ({
        ...prev,
        featuredCount: prev.featuredCount + 1,
      }));
    } catch (err: any) {
      setBannerMessage({
        type: "error",
        text: err.message || "Failed to promote feedback to testimonial.",
      });
    } finally {
      setFeaturingId(null);
    }
  };

  // Filtered List
  const filtered = feedbackItems.filter((f) => {
    if (filterRating !== "ALL" && f.rating !== Number(filterRating)) return false;
    if (filterCategory !== "ALL" && f.category !== filterCategory) return false;
    if (filterRole !== "ALL" && f.userRole !== filterRole) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.userName.toLowerCase().includes(q) ||
        f.userEmail.toLowerCase().includes(q) ||
        f.content.toLowerCase().includes(q) ||
        (f.courseTitle && f.courseTitle.toLowerCase().includes(q))
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
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Student &amp; Faculty Sentiment Center
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "2.125rem", color: "#ffffff", fontWeight: 900, margin: "0 0 0.4rem 0" }}>
              Feedback &amp; Reviews Hub
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "rgba(255, 255, 255, 0.85)", margin: 0, maxWidth: 640 }}>
              Review community ratings, monitor course quality metrics, and promote outstanding student reviews into featured landing page testimonials.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link
              href="/admin/testimonials"
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
              Public Testimonials Studio &rarr;
            </Link>
          </div>
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
        <div style={{ background: "#fff", borderRadius: 14, padding: "1.25rem", border: "1px solid var(--na-gray-200, #e2e8f0)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--na-gray-500)", textTransform: "uppercase" }}>Total Reviews</div>
          <div style={{ fontSize: "1.875rem", fontWeight: 900, color: "var(--na-gray-900)", marginTop: "0.25rem" }}>{stats.totalCount}</div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: "1.25rem", border: "1.5px solid #fde68a" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#b45309", textTransform: "uppercase" }}>Average Star Rating</div>
          <div style={{ fontSize: "1.875rem", fontWeight: 900, color: "#b45309", marginTop: "0.25rem" }}>{stats.avgRating} / 5.0</div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: "1.25rem", border: "1.5px solid #bbf7d0" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#15803d", textTransform: "uppercase" }}>5-Star Reviews</div>
          <div style={{ fontSize: "1.875rem", fontWeight: 900, color: "#15803d", marginTop: "0.25rem" }}>{stats.fiveStarCount}</div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: "1.25rem", border: "1.5px solid #bfdbfe" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>Featured Testimonials</div>
          <div style={{ fontSize: "1.875rem", fontWeight: 900, color: "#1d4ed8", marginTop: "0.25rem" }}>{stats.featuredCount}</div>
        </div>
      </div>

      {/* ── BANNER MESSAGE ── */}
      {bannerMessage && (
        <div
          style={{
            background: bannerMessage.type === "success" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${bannerMessage.type === "success" ? "#86efac" : "#fca5a5"}`,
            color: bannerMessage.type === "success" ? "#166534" : "#991b1b",
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
          <span>{bannerMessage.text}</span>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "inherit" }}
          >
            &times;
          </button>
        </div>
      )}

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
            placeholder="Search feedback by name, email, course, or text..."
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
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            style={{ padding: "0.6rem 0.85rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.8125rem", fontWeight: 600, background: "#fff" }}
          >
            <option value="ALL">Rating: All Stars</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: "0.6rem 0.85rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.8125rem", fontWeight: 600, background: "#fff" }}
          >
            <option value="ALL">Category: All Categories</option>
            <option value="Course Content Quality">Course Content</option>
            <option value="Coding Labs & Sandboxes">Coding Labs</option>
            <option value="Instructor & Mentorship">Instructor Teaching</option>
            <option value="Platform Performance">Platform Performance</option>
            <option value="Feature Suggestion">Feature Suggestions</option>
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

      {/* ── FEEDBACK CARDS GRID ── */}
      {filtered.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 14,
            padding: "3.5rem 1.5rem",
            textAlign: "center",
            border: "1.5px dashed #cbd5e1",
          }}
        >
          <div style={{ fontWeight: 700, color: "#64748b" }}>No feedback items match the selected filters.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem" }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              style={{
                background: "#ffffff",
                borderRadius: 14,
                border: item.isFeatured ? "2px solid #86efac" : "1px solid var(--na-gray-200, #e2e8f0)",
                padding: "1.5rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={star <= item.rating ? "#f59e0b" : "#e2e8f0"}
                        stroke={star <= item.rating ? "#d97706" : "#cbd5e1"}
                        strokeWidth="1"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                    <span style={{ fontSize: "0.8125rem", fontWeight: 800, color: "#b45309", marginLeft: "0.25rem" }}>
                      {item.rating}.0
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 800,
                      padding: "0.15rem 0.45rem",
                      borderRadius: 6,
                      background: item.userRole === "TUTOR" ? "#fef3c7" : "#e0e7ff",
                      color: item.userRole === "TUTOR" ? "#92400e" : "#3730a3",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.userRole}
                  </span>
                </div>

                <div style={{ fontSize: "0.9375rem", fontWeight: 800, color: "var(--na-gray-900)", marginBottom: "0.2rem" }}>
                  {item.userName}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--na-gray-500)", marginBottom: "0.6rem" }}>
                  {item.userEmail} • {new Date(item.createdAt).toLocaleDateString()}
                </div>

                <div style={{ fontSize: "0.75rem", color: "var(--brand-blue-700)", marginBottom: "0.6rem" }}>
                  <strong>{item.category}</strong>
                  {item.courseTitle && <span> • Course: {item.courseTitle}</span>}
                </div>

                <p style={{ margin: "0.75rem 0", fontSize: "0.85rem", color: "var(--na-gray-700)", lineHeight: 1.55 }}>
                  &ldquo;{item.content}&rdquo;
                </p>
              </div>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "0.85rem", marginTop: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  {item.isFeatured ? (
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#15803d", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      ✓ Featured on Landing Page
                    </span>
                  ) : item.allowFeatured ? (
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      ✓ Student opted in for public spotlight
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      Private review only
                    </span>
                  )}
                </div>

                {!item.isFeatured && (
                  <button
                    type="button"
                    onClick={() => handleFeatureTestimonial(item)}
                    disabled={featuringId === item.id}
                    style={{
                      background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "0.45rem 0.85rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: featuringId === item.id ? "not-allowed" : "pointer",
                    }}
                  >
                    {featuringId === item.id ? "Promoting..." : "🌟 Feature as Testimonial"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

