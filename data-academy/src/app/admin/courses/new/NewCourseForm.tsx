"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function NewCourseForm({ categories }: { categories: Category[] }) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [level, setLevel] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">("BEGINNER");
  const [estimatedHours, setEstimatedHours] = useState(20);
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
          status: "DRAFT",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create course.");
      } else {
        // Redirect to course builder with curriculum tab
        router.push(`/admin/courses/${data.course.id}?tab=curriculum`);
      }
    } catch {
      setError("Network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {error && (
        <div
          style={{
            padding: "0.875rem 1rem",
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: "var(--radius-md)",
            color: "#991b1b",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Basic Metadata */}
      <div className="card" style={{ padding: "1.75rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1b2533", marginBottom: "1.25rem" }}>
          1. General Course Details
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Title */}
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
              Course Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Applied Machine Learning with Python"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="input"
              style={{ width: "100%", padding: "0.625rem 0.875rem" }}
            />
          </div>

          {/* Slug */}
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
              URL Slug *
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--na-gray-400)" }}>/courses/</span>
              <input
                type="text"
                required
                placeholder="applied-machine-learning-python"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="input"
                style={{ flex: 1, padding: "0.625rem 0.875rem" }}
              />
            </div>
          </div>

          {/* Category & Level Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input"
                style={{ width: "100%", padding: "0.625rem 0.875rem", background: "#fff" }}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                Difficulty Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="input"
                style={{ width: "100%", padding: "0.625rem 0.875rem", background: "#fff" }}
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
          </div>

          {/* Estimated Hours & Pricing */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "center" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                Estimated Duration (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="300"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="input"
                style={{ width: "100%", padding: "0.625rem 0.875rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                Access Model
              </label>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", height: 42 }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="accessType"
                    checked={isFree}
                    onChange={() => setIsFree(true)}
                  />
                  Free Course
                </label>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="accessType"
                    checked={!isFree}
                    onChange={() => setIsFree(false)}
                  />
                  Paid Course
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Descriptions */}
      <div className="card" style={{ padding: "1.75rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1b2533", marginBottom: "1.25rem" }}>
          2. Descriptions &amp; Syllabus Overview
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Short Description */}
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
              Short Summary (Catalog card preview, max 280 chars) *
            </label>
            <textarea
              required
              rows={2}
              maxLength={280}
              placeholder="A concise, compelling overview of the course for cards and search results."
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="input"
              style={{ width: "100%", padding: "0.625rem 0.875rem", resize: "vertical" }}
            />
            <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--na-gray-400)" }}>
              {shortDescription.length}/280
            </div>
          </div>

          {/* Full Description */}
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
              Comprehensive Course Description (Markdown supported) *
            </label>
            <textarea
              required
              rows={6}
              placeholder="Detailed syllabus, prerequisites, background, who should take this course, and practical projects included."
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              className="input"
              style={{ width: "100%", padding: "0.625rem 0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", resize: "vertical" }}
            />
          </div>
        </div>
      </div>

      {/* Media & Cover Image Upload */}
      <div className="card" style={{ padding: "1.75rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1b2533", marginBottom: "1.25rem" }}>
          3. Media &amp; Cover Image
        </h2>

        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.5rem" }}>
            Course Thumbnail Image
          </label>

          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
            {/* Preview Box */}
            <div
              style={{
                width: 160,
                height: 100,
                borderRadius: "8px",
                background: "var(--na-gray-100)",
                border: "1px dashed var(--na-gray-300)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {coverImage ? (
                <img src={coverImage} alt="Cover preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "0.75rem", color: "var(--na-gray-400)" }}>No cover set</span>
              )}
            </div>

            {/* Upload controls */}
            <div style={{ flex: 1, minWidth: 240 }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.84375rem" }}
              />
              <span style={{ fontSize: "0.75rem", color: "var(--na-gray-500)", display: "block" }}>
                {uploading ? "Uploading file to server…" : "PNG, JPG, or WebP up to 15MB. 16:9 aspect ratio recommended."}
              </span>

              {/* Or manual URL */}
              <div style={{ marginTop: "0.5rem" }}>
                <input
                  type="url"
                  placeholder="Or paste external image URL"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="input"
                  style={{ width: "100%", padding: "0.45rem 0.75rem", fontSize: "0.8125rem" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Outcomes */}
      <div className="card" style={{ padding: "1.75rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1b2533", marginBottom: "1rem" }}>
          4. Learning Outcomes
        </h2>
        <p style={{ fontSize: "0.84375rem", color: "var(--na-gray-500)", marginBottom: "1rem" }}>
          What key skills and competencies will students gain after completing this course?
        </p>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="e.g. Train, evaluate, and tune regression models"
            value={outcomeInput}
            onChange={(e) => setOutcomeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddOutcome();
              }
            }}
            className="input"
            style={{ flex: 1, padding: "0.625rem 0.875rem" }}
          />
          <button
            type="button"
            onClick={handleAddOutcome}
            className="btn btn-secondary"
            style={{ padding: "0.625rem 1rem", fontSize: "0.875rem" }}
          >
            Add
          </button>
        </div>

        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {learningOutcomes.map((outcome, idx) => (
            <li
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.5rem 0.75rem",
                background: "var(--na-gray-50)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--na-gray-200)",
                fontSize: "0.875rem",
              }}
            >
              <span>&bull; {outcome}</span>
              <button
                type="button"
                onClick={() => handleRemoveOutcome(idx)}
                style={{ background: "none", border: "none", color: "#e11d48", cursor: "pointer", fontWeight: 700 }}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Submit Controls */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => router.push("/admin/courses")}
          className="btn btn-ghost"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting || uploading}
          className="btn btn-green"
          style={{
            padding: "0.75rem 2rem",
            borderRadius: "9999px",
            fontWeight: 700,
            fontSize: "1rem",
            boxShadow: "0 4px 14px rgba(106, 191, 75, 0.35)",
          }}
        >
          {submitting ? "Creating Course…" : "Create Course & Build Curriculum →"}
        </button>
      </div>
    </form>
  );
}
