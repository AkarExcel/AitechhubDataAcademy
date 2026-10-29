"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface TutorNewCourseClientProps {
  categories: Category[];
  isVerified: boolean;
}

export default function TutorNewCourseClient({
  categories,
  isVerified,
}: TutorNewCourseClientProps) {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [level, setLevel] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">("BEGINNER");
  const [estimatedHours, setEstimatedHours] = useState(10);
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState(0);
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>([
    "Master core conceptual frameworks and tools",
    "Build hands-on production grade data projects",
  ]);
  const [outcomeInput, setOutcomeInput] = useState("");
  const [certificateEnabled, setCertificateEnabled] = useState(true);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If tutor is NOT verified, render locked state
  if (!isVerified) {
    return (
      <div style={{ maxWidth: 680, margin: "2rem auto", textAlign: "center" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #fed7aa",
            padding: "3rem 2rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#ffedd5",
              color: "#ea580c",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.75rem",
              marginBottom: "1.25rem",
            }}
          >
            🔒
          </div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1e293b", marginBottom: "0.5rem" }}>
            Faculty Verification Required
          </h2>

          <p style={{ fontSize: "0.9375rem", color: "#64748b", lineHeight: 1.6, maxWidth: 520, margin: "0 auto 1.75rem" }}>
            To uphold our educational standards and ensure certified student credentials, course authoring is exclusive to verified faculty members. Your tutor profile is currently under review by our administrative team.
          </p>

          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #ffedd5",
              borderRadius: 12,
              padding: "1.25rem",
              textAlign: "left",
              marginBottom: "2rem",
            }}
          >
            <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#9a3412", marginBottom: "0.5rem", textTransform: "uppercase" }}>
              Next Steps for Approval:
            </div>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.84rem", color: "#7c2d12", lineHeight: 1.6 }}>
              <li>Ensure your headline, bio, and expertise areas are filled out on your profile.</li>
              <li>An administrator will review your educator background and approve your profile.</li>
              <li>Once verified, course authoring will automatically unlock here!</li>
            </ul>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/tutor/profile"
              className="btn btn-primary"
              style={{
                background: "#ea580c",
                borderColor: "#ea580c",
                color: "#ffffff",
                fontWeight: 700,
                textDecoration: "none",
                padding: "0.65rem 1.25rem",
                borderRadius: 8,
              }}
            >
              Update Faculty Profile
            </Link>
            <Link
              href="/support"
              className="btn btn-secondary"
              style={{
                textDecoration: "none",
                padding: "0.65rem 1.25rem",
                borderRadius: 8,
              }}
            >
              Contact Admin Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(autoSlug);
  };

  // Handle Cover Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to upload image.");
      } else {
        setCoverImage(data.url);
      }
    } catch {
      setError("Failed to connect to the upload service.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddOutcome = () => {
    if (outcomeInput.trim()) {
      setLearningOutcomes((prev) => [...prev, outcomeInput.trim()]);
      setOutcomeInput("");
    }
  };

  const handleRemoveOutcome = (idx: number) => {
    setLearningOutcomes((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          categoryId: categoryId || null,
          level,
          estimatedHours: Number(estimatedHours),
          isFree,
          price: isFree ? 0 : Number(price),
          shortDescription,
          fullDescription,
          coverImage: coverImage || null,
          learningOutcomes,
          certificateEnabled,
          status: "DRAFT", // Tutors always author as DRAFT
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create course.");
      } else {
        // Redirect directly to tutor course studio with curriculum tab
        router.push(`/tutor/courses/${data.course.id}?tab=curriculum`);
      }
    } catch {
      setError("Network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      {/* ── BREADCRUMB ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <Link href="/tutor" style={{ color: "var(--brand-blue-600, #004b87)", fontSize: "0.875rem", textDecoration: "none" }}>
          Instructor Hub
        </Link>
        <span style={{ color: "#94a3b8" }}>/</span>
        <Link href="/tutor/courses" style={{ color: "var(--brand-blue-600, #004b87)", fontSize: "0.875rem", textDecoration: "none" }}>
          Courses
        </Link>
        <span style={{ color: "#94a3b8" }}>/</span>
        <span style={{ color: "#475569", fontSize: "0.875rem" }}>Author New Course</span>
      </div>

      {/* ── TITLE ── */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.35rem" }}>
          Author New Course
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9375rem", margin: 0 }}>
          Define the curriculum metadata, learning outcomes, and coursework details.
        </p>
      </div>

      {/* ── PUBLISHING WORKFLOW ALERT ── */}
      <div
        style={{
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: 12,
          padding: "1rem 1.25rem",
          marginBottom: "1.75rem",
          display: "flex",
          gap: "0.75rem",
          alignItems: "flex-start",
        }}
      >
        <div style={{ fontSize: "1.25rem", lineHeight: 1 }}>ℹ️</div>
        <div>
          <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1e40af", marginBottom: "0.2rem" }}>
            Course Publishing Process
          </div>
          <p style={{ fontSize: "0.8125rem", color: "#1d4ed8", margin: 0, lineHeight: 1.5 }}>
            Courses authored by instructors are initially created as <strong>Drafts</strong>. Once your modules, video lessons, and interactive coding exercises are complete, an academy administrator will review and publish your course to the public student catalog.
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "0.875rem 1rem",
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: 8,
            color: "#b91c1c",
            fontSize: "0.875rem",
            marginBottom: "1.5rem",
          }}
        >
          {error}
        </div>
      )}

      {/* ── FORM ── */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
        {/* Basic Info Card */}
        <div style={{ background: "#ffffff", padding: "1.75rem", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", marginBottom: "1.25rem" }}>
            Course Details
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Course Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Production Data Engineering with Apache Spark"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.9375rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Course URL Slug *
              </label>
              <input
                type="text"
                required
                placeholder="production-data-engineering-with-apache-spark"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}
                style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.875rem", fontFamily: "monospace" }}
              />
              <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.25rem 0 0" }}>
                Preview link: <code>/courses/{slug || "your-slug"}</code>
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.875rem", background: "#fff" }}
                >
                  <option value="">Select Category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Skill Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.875rem", background: "#fff" }}
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Estimated Study Hours
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Number(e.target.value))}
                  style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.875rem" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Short Description (Summary) *
              </label>
              <textarea
                required
                rows={2}
                placeholder="A high-impact 1-2 sentence overview shown on course preview cards..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.875rem", resize: "vertical" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Full Course Overview &amp; Curriculum Description *
              </label>
              <textarea
                required
                rows={5}
                placeholder="Provide a comprehensive breakdown of the topics, industry practical exercises, and tools covered in this course..."
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.875rem", resize: "vertical" }}
              />
            </div>
          </div>
        </div>

        {/* Pricing & Credentials Card */}
        <div style={{ background: "#ffffff", padding: "1.75rem", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", marginBottom: "1.25rem" }}>
            Enrollment &amp; Credentials
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => {
                    setIsFree(e.target.checked);
                    if (e.target.checked) setPrice(0);
                  }}
                  style={{ width: 16, height: 16 }}
                />
                Free Course
              </label>

              {!isFree && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#334155" }}>$</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Price in USD"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    style={{ width: 120, padding: "0.45rem 0.65rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.875rem" }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                id="certCheck"
                checked={certificateEnabled}
                onChange={(e) => setCertificateEnabled(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <label htmlFor="certCheck" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                Issue Verified Certificate upon 100% completion
              </label>
            </div>
          </div>
        </div>

        {/* Learning Outcomes */}
        <div style={{ background: "#ffffff", padding: "1.75rem", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
            What Students Will Learn
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "0 0 1rem 0" }}>
            Key skills and competencies students will gain after finishing this course.
          </p>

          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="e.g. Deploy ML models to Kubernetes with CI/CD"
              value={outcomeInput}
              onChange={(e) => setOutcomeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddOutcome();
                }
              }}
              style={{ flex: 1, padding: "0.55rem 0.85rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.875rem" }}
            />
            <button
              type="button"
              onClick={handleAddOutcome}
              className="btn btn-secondary"
              style={{ fontSize: "0.8125rem", fontWeight: 600 }}
            >
              Add Outcome
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {learningOutcomes.map((outcome, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.5rem 0.85rem",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  fontSize: "0.84rem",
                }}
              >
                <span>&bull; {outcome}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveOutcome(idx)}
                  style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 700, fontSize: "1rem" }}
                  title="Remove outcome"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Action */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", alignItems: "center" }}>
          <Link
            href="/tutor/courses"
            style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{
              background: "var(--na-green-500, #10b981)",
              borderColor: "var(--na-green-500, #10b981)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.9375rem",
              padding: "0.75rem 1.75rem",
              borderRadius: 10,
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Saving Draft & Initializing Syllabus..." : "Save Course & Open Syllabus Builder →"}
          </button>
        </div>
      </form>
    </div>
  );
}

