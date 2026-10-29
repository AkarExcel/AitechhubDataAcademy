"use client";

import { useState } from "react";

export interface FeedbackItem {
  id: string;
  rating: number;
  category: string;
  content: string;
  courseTitle?: string | null;
  allowFeatured: boolean;
  status: string;
  isFeatured: boolean;
  createdAt: string | Date;
}

interface FeedbackClientProps {
  initialFeedback: FeedbackItem[];
  userRole: string;
  userName: string;
  userEmail: string;
  userCourses: { id: string; title: string }[];
}

export default function FeedbackClient({
  initialFeedback,
  userRole,
  userName,
  userEmail,
  userCourses,
}: FeedbackClientProps) {
  const isTutor = userRole === "TUTOR";
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>(initialFeedback);
  const [activeTab, setActiveTab] = useState<"NEW" | "HISTORY">(
    initialFeedback.length > 0 ? "NEW" : "NEW"
  );

  // Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState(
    isTutor ? "Teaching Studio Experience" : "Course Content Quality"
  );
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [content, setContent] = useState("");
  const [allowFeatured, setAllowFeatured] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setStatusMessage({ type: "error", text: "Please enter your review feedback." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const chosenCourse = userCourses.find((c) => c.id === selectedCourseId);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          category,
          content: content.trim(),
          courseId: selectedCourseId || undefined,
          courseTitle: chosenCourse?.title || undefined,
          allowFeatured,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback.");
      }

      setStatusMessage({
        type: "success",
        text: "Thank you! Your feedback has been recorded and will help shape our platform and curriculum.",
      });

      const newItem: FeedbackItem = {
        id: data.id || `fb-${Date.now()}`,
        rating,
        category,
        content: content.trim(),
        courseTitle: chosenCourse?.title || null,
        allowFeatured,
        status: "SUBMITTED",
        isFeatured: false,
        createdAt: new Date().toISOString(),
      };

      setFeedbackList((prev) => [newItem, ...prev]);

      // Reset form
      setContent("");
      setSelectedCourseId("");
      setRating(5);
      setActiveTab("HISTORY");
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", paddingBottom: "3rem" }}>
      {/* ── HERO BANNER ── */}
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
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {isTutor ? "Faculty Teaching Voice" : "Student Voice & Experience"}
        </div>

        <h1 style={{ fontSize: "2rem", color: "#ffffff", fontWeight: 900, margin: "0 0 0.4rem 0" }}>
          Feedback &amp; Reviews
        </h1>
        <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,0.85)", margin: 0, maxWidth: 600, lineHeight: 1.5 }}>
          Your perspectives drive our curriculum updates, coding exercise refinements, and platform design. Share what you love and what we can improve.
        </p>
      </div>

      {/* ── STATUS MESSAGE ── */}
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
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>Submit Review</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("HISTORY")}
          style={{
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: activeTab === "HISTORY" ? "3px solid var(--brand-blue-600, #004b87)" : "3px solid transparent",
            color: activeTab === "HISTORY" ? "var(--brand-blue-700, #004074)" : "var(--na-gray-600, #64748b)",
            fontWeight: activeTab === "HISTORY" ? 800 : 600,
            fontSize: "0.9375rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>My Submissions ({feedbackList.length})</span>
        </button>
      </div>

      {/* ── TAB 1: SUBMIT FEEDBACK FORM ── */}
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
          <form onSubmit={handleSubmit}>
            {/* Rating Stars */}
            <div style={{ marginBottom: "1.75rem", textAlign: "center", padding: "1.25rem", background: "var(--na-gray-50, #f8fafc)", borderRadius: 12 }}>
              <label style={{ display: "block", fontSize: "0.9375rem", fontWeight: 800, color: "var(--na-gray-900)", marginBottom: "0.5rem" }}>
                How would you rate your overall experience?
              </label>

              <div style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= (hoverRating || rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "0.25rem",
                        transition: "transform 0.15s ease",
                        transform: (hoverRating || rating) >= star ? "scale(1.15)" : "scale(1)",
                      }}
                      title={`${star} Star${star === 1 ? "" : "s"}`}
                    >
                      <svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill={isFilled ? "#f59e0b" : "none"}
                        stroke={isFilled ? "#d97706" : "#cbd5e1"}
                        strokeWidth="1.5"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  );
                })}
              </div>

              <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--brand-blue-700)", marginTop: "0.35rem" }}>
                {rating === 5 && "⭐ Outstanding - Exceeded Expectations!"}
                {rating === 4 && "⭐ Great Experience - Very Satisfied"}
                {rating === 3 && "⭐ Good - Has Room for Improvement"}
                {rating === 2 && "⭐ Fair - Several Issues"}
                {rating === 1 && "⭐ Needs Immediate Attention"}
              </div>
            </div>

            {/* Category & Course */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-gray-800)", marginBottom: "0.45rem" }}>
                  Feedback Focus Category *
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
                    fontWeight: 600,
                    background: "#ffffff",
                  }}
                >
                  <option value="Course Content Quality">📚 Course Content &amp; Syllabus Depth</option>
                  <option value="Coding Labs & Sandboxes">🧪 Hands-on Exercises &amp; Code Runner</option>
                  <option value="Instructor & Mentorship">👨‍🏫 Instructor Teaching &amp; Feedback</option>
                  <option value="Platform Performance">⚡ Platform Usability &amp; Design</option>
                  <option value="Feature Suggestion">💡 Feature Request or Idea</option>
                  <option value="General Experience">🌟 General Academy Feedback</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-gray-800)", marginBottom: "0.45rem" }}>
                  Specific Course (Optional)
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
                  <option value="">-- Academy-Wide Experience --</option>
                  {userCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Review content */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.45rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-gray-800)" }}>
                  Your Review &amp; Recommendations *
                </label>
                <span style={{ fontSize: "0.6875rem", color: "var(--na-gray-400)" }}>{content.length}/1000</span>
              </div>
              <textarea
                required
                rows={5}
                maxLength={1000}
                placeholder="What did you enjoy most about your learning experience? What tools, explanations, or exercises could we make even better?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
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

            {/* Opt-in to public testimonial */}
            <div
              style={{
                background: "var(--brand-blue-subtle, #f0f6ff)",
                border: "1px solid var(--brand-accent-200, #bae6fd)",
                borderRadius: 10,
                padding: "0.85rem 1rem",
                marginBottom: "1.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <input
                type="checkbox"
                id="allowFeatured"
                checked={allowFeatured}
                onChange={(e) => setAllowFeatured(e.target.checked)}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />
              <label htmlFor="allowFeatured" style={{ fontSize: "0.8125rem", color: "var(--brand-navy-900)", cursor: "pointer", lineHeight: 1.4 }}>
                <strong>Allow public testimonial spotlight:</strong> I agree to have my review and first name featured as a student testimonial on the academy landing page.
              </label>
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
              <span>{isSubmitting ? "Recording Feedback..." : "Submit Review"}</span>
            </button>
          </form>
        </div>
      )}

      {/* ── TAB 2: MY PAST FEEDBACK ── */}
      {activeTab === "HISTORY" && (
        <div>
          {feedbackList.length === 0 ? (
            <div
              style={{
                background: "#ffffff",
                borderRadius: 16,
                border: "1.5px dashed var(--na-gray-300, #cbd5e1)",
                padding: "3.5rem 2rem",
                textAlign: "center",
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--na-gray-800)", margin: "0 0 0.35rem" }}>
                No Feedback Recorded Yet
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--na-gray-500)", margin: "0 0 1.25rem" }}>
                Share your first course or platform review to help our community grow!
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
                + Write a Review
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {feedbackList.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: 14,
                    border: "1px solid var(--na-gray-200, #e2e8f0)",
                    padding: "1.25rem 1.5rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.25rem" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill={star <= item.rating ? "#f59e0b" : "#e2e8f0"}
                            stroke={star <= item.rating ? "#d97706" : "#cbd5e1"}
                            strokeWidth="1"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-gray-800)", marginLeft: "0.35rem" }}>
                          {item.rating}.0 / 5.0
                        </span>
                      </div>

                      <div style={{ fontSize: "0.75rem", color: "var(--na-gray-500)" }}>
                        Category: <strong>{item.category}</strong>
                        {item.courseTitle && (
                          <span>
                            {" "}• Course: <strong>{item.courseTitle}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--na-gray-400)", display: "block" }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      {item.isFeatured && (
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 800,
                            padding: "0.15rem 0.5rem",
                            borderRadius: 6,
                            background: "#dcfce7",
                            color: "#15803d",
                            display: "inline-block",
                            marginTop: "0.25rem",
                          }}
                        >
                          🌟 Featured Testimonial
                        </span>
                      )}
                    </div>
                  </div>

                  <p style={{ margin: "0.75rem 0 0 0", fontSize: "0.875rem", color: "var(--na-gray-700)", lineHeight: 1.55 }}>
                    &ldquo;{item.content}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

