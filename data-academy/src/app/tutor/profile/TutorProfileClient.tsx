"use client";

import { useState } from "react";
import Link from "next/link";

interface TutorProfileClientProps {
  initialProfile: {
    id?: string;
    headline: string | null;
    biography: string | null;
    expertise: string[];
    profileImage: string | null;
    isApproved: boolean;
    rating: number;
    totalStudents: number;
  } | null;
  user: {
    id: string;
    email: string;
    name: string;
  };
  isAdmin: boolean;
}

export default function TutorProfileClient({
  initialProfile,
  user,
  isAdmin,
}: TutorProfileClientProps) {
  const isApproved = isAdmin || Boolean(initialProfile?.isApproved);

  const [headline, setHeadline] = useState(initialProfile?.headline || "");
  const [biography, setBiography] = useState(initialProfile?.biography || "");
  const [expertise, setExpertise] = useState<string[]>(initialProfile?.expertise || []);
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleAddTag = () => {
    if (newTag.trim() && !expertise.includes(newTag.trim())) {
      setExpertise([...expertise, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setExpertise(expertise.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/tutor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: headline.trim() || null,
          biography: biography.trim() || null,
          expertise,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }

      setMessage({ text: "Faculty profile updated successfully!", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to save changes.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      {/* ── HEADER ── */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--na-navy-900, #001830)", margin: 0 }}>
            Faculty Profile &amp; Credentials
          </h1>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "0.2rem 0.6rem",
              borderRadius: 999,
              background: isApproved ? "#ecfdf5" : "#fef3c7",
              color: isApproved ? "#065f46" : "#92400e",
              border: isApproved ? "1px solid #a7f3d0" : "1px solid #fde68a",
            }}
          >
            {isApproved ? "✓ Verified Educator" : "⏳ Verification Pending"}
          </span>
        </div>
        <p style={{ color: "var(--na-gray-600, #475569)", fontSize: "0.875rem", margin: 0 }}>
          Manage your instructor public credentials, areas of expertise, and teaching biography.
        </p>
      </div>

      {/* ── VERIFICATION STATUS CARD ── */}
      <div
        style={{
          background: isApproved
            ? "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)"
            : "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
          border: isApproved ? "1px solid #bbf7d0" : "1px solid #fed7aa",
          borderRadius: 14,
          padding: "1.5rem",
          marginBottom: "2rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "1.25rem",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: isApproved ? "#dcfce7" : "#ffedd5",
            color: isApproved ? "#15803d" : "#ea580c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.25rem",
            flexShrink: 0,
          }}
        >
          {isApproved ? "✓" : "⏳"}
        </div>

        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 800,
              color: isApproved ? "#166534" : "#9a3412",
              margin: "0 0 0.35rem 0",
            }}
          >
            {isApproved ? "Verified Faculty Status" : "Verification In Progress"}
          </h3>
          <p
            style={{
              fontSize: "0.84rem",
              color: isApproved ? "#15803d" : "#c2410c",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {isApproved
              ? "Your instructor account is fully verified. You can author courses, build coding challenges, and guide students anytime. Only academy administrators can publish courses to the live catalog."
              : "Your educator credentials are under administrative review. Once verified, you will be able to author and create new courses. In the meantime, keep your profile up to date."}
          </p>

          {!isApproved && (
            <div style={{ marginTop: "0.75rem" }}>
              <Link
                href="/support"
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#ea580c",
                  textDecoration: "underline",
                }}
              >
                Need expedited verification? Contact Academy Administration →
              </Link>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: "0.85rem 1.25rem",
            borderRadius: 8,
            marginBottom: "1.5rem",
            background: message.type === "success" ? "#ecfdf5" : "#fef2f2",
            border: message.type === "success" ? "1px solid #a7f3d0" : "1px solid #fca5a5",
            color: message.type === "success" ? "#065f46" : "#b91c1c",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          {message.text}
        </div>
      )}

      {/* ── PROFILE EDIT FORM ── */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
        <div style={{ background: "#ffffff", padding: "1.75rem", borderRadius: 14, border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", marginBottom: "1.25rem" }}>
            Faculty Identity &amp; Bio
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Full Name &amp; Account Email
              </label>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <input
                  type="text"
                  disabled
                  value={user.name}
                  style={{ flex: 1, padding: "0.65rem 0.9rem", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: "0.875rem" }}
                />
                <input
                  type="text"
                  disabled
                  value={user.email}
                  style={{ flex: 1, padding: "0.65rem 0.9rem", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: "0.875rem" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Professional Headline *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Lead Machine Learning Engineer &amp; PySpark Specialist"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.875rem" }}
              />
              <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.25rem 0 0" }}>
                Shown on your course cards and lesson instructor badges.
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Educator Biography &amp; Background
              </label>
              <textarea
                rows={5}
                placeholder="Share your industry experience, teaching background, and notable achievements..."
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.875rem", resize: "vertical" }}
              />
            </div>
          </div>
        </div>

        {/* Expertise Tags */}
        <div style={{ background: "#ffffff", padding: "1.75rem", borderRadius: 14, border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
            Areas of Technical Expertise
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "0 0 1rem 0" }}>
            Add tags representing your core domains (e.g. Python, BigQuery, Deep Learning, SQL, MLOps).
          </p>

          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="e.g. Apache Spark"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              style={{ flex: 1, padding: "0.55rem 0.85rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.875rem" }}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="btn btn-secondary"
              style={{ fontSize: "0.8125rem", fontWeight: 600 }}
            >
              Add Skill
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {expertise.map((tag) => (
              <span
                key={tag}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1e40af",
                  borderRadius: 999,
                  padding: "0.25rem 0.65rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                }}
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", padding: 0 }}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary"
            style={{
              background: "var(--brand-blue-600, #004b87)",
              borderColor: "var(--brand-blue-600, #004b87)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.9375rem",
              padding: "0.75rem 1.75rem",
              borderRadius: 10,
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          >
            {isSaving ? "Saving Changes..." : "Save Faculty Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

