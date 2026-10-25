"use client";

import { useState } from "react";
import Image from "next/image";

interface Testimonial {
  id: string;
  studentName: string;
  role: string | null;
  company: string | null;
  avatar: string | null;
  content: string;
  rating: number;
  courseTitle: string | null;
  isApproved: boolean;
  isFeatured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface CourseOption {
  id: string;
  title: string;
  slug: string;
}

interface Props {
  initialTestimonials: Testimonial[];
  courses: CourseOption[];
}

export default function TestimonialsAdminClient({
  initialTestimonials,
  courses,
}: Props) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "APPROVED" | "PENDING" | "FEATURED">("ALL");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form fields
  const [studentName, setStudentName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [avatar, setAvatar] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [courseTitle, setCourseTitle] = useState("");
  const [isApproved, setIsApproved] = useState(true);
  const [isFeatured, setIsFeatured] = useState(true);
  const [order, setOrder] = useState(0);

  const openCreateModal = () => {
    setEditingId(null);
    setStudentName("");
    setRole("");
    setCompany("");
    setAvatar("");
    setContent("");
    setRating(5);
    setCourseTitle(courses[0]?.title || "Data Science Foundations");
    setIsApproved(true);
    setIsFeatured(true);
    setOrder(testimonials.length + 1);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (t: Testimonial) => {
    setEditingId(t.id);
    setStudentName(t.studentName);
    setRole(t.role || "");
    setCompany(t.company || "");
    setAvatar(t.avatar || "");
    setContent(t.content);
    setRating(t.rating);
    setCourseTitle(t.courseTitle || "");
    setIsApproved(t.isApproved);
    setIsFeatured(t.isFeatured);
    setOrder(t.order);
    setFormError("");
    setModalOpen(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAvatar(data.url);
    } catch (err: any) {
      alert("Failed to upload avatar: " + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !content.trim()) {
      setFormError("Student name and testimonial quote are required.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    const payload = {
      studentName: studentName.trim(),
      role: role.trim() || null,
      company: company.trim() || null,
      avatar: avatar.trim() || null,
      content: content.trim(),
      rating,
      courseTitle: courseTitle.trim() || null,
      isApproved,
      isFeatured,
      order: Number(order) || 0,
    };

    try {
      if (editingId) {
        // Update existing
        const res = await fetch(`/api/admin/testimonials/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update testimonial");

        setTestimonials((prev) =>
          prev.map((item) => (item.id === editingId ? data.testimonial : item))
        );
        setSuccessMessage("Testimonial updated successfully.");
      } else {
        // Create new
        const res = await fetch("/api/admin/testimonials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create testimonial");

        setTestimonials((prev) => [data.testimonial, ...prev]);
        setSuccessMessage("New testimonial added successfully.");
      }

      setModalOpen(false);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleApproved = async (t: Testimonial) => {
    const nextApproved = !t.isApproved;
    // optimistic update
    setTestimonials((prev) =>
      prev.map((item) => (item.id === t.id ? { ...item, isApproved: nextApproved } : item))
    );

    try {
      const res = await fetch(`/api/admin/testimonials/${t.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: nextApproved }),
      });
      if (!res.ok) throw new Error("Failed to update status");
    } catch (err: any) {
      // rollback
      setTestimonials((prev) =>
        prev.map((item) => (item.id === t.id ? { ...item, isApproved: t.isApproved } : item))
      );
      alert("Error: " + err.message);
    }
  };

  const toggleFeatured = async (t: Testimonial) => {
    const nextFeatured = !t.isFeatured;
    // optimistic update
    setTestimonials((prev) =>
      prev.map((item) => (item.id === t.id ? { ...item, isFeatured: nextFeatured } : item))
    );

    try {
      const res = await fetch(`/api/admin/testimonials/${t.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: nextFeatured }),
      });
      if (!res.ok) throw new Error("Failed to update featured state");
    } catch (err: any) {
      // rollback
      setTestimonials((prev) =>
        prev.map((item) => (item.id === t.id ? { ...item, isFeatured: t.isFeatured } : item))
      );
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/testimonials/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete testimonial");

      setTestimonials((prev) => prev.filter((item) => item.id !== deleteId));
      setDeleteId(null);
      setSuccessMessage("Testimonial deleted successfully.");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered list
  const filteredTestimonials = testimonials.filter((t) => {
    const matchSearch =
      search.trim() === "" ||
      t.studentName.toLowerCase().includes(search.toLowerCase()) ||
      (t.role && t.role.toLowerCase().includes(search.toLowerCase())) ||
      (t.company && t.company.toLowerCase().includes(search.toLowerCase())) ||
      (t.courseTitle && t.courseTitle.toLowerCase().includes(search.toLowerCase())) ||
      t.content.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (filter === "APPROVED") return t.isApproved;
    if (filter === "PENDING") return !t.isApproved;
    if (filter === "FEATURED") return t.isFeatured && t.isApproved;
    return true;
  });

  const stats = {
    total: testimonials.length,
    approved: testimonials.filter((t) => t.isApproved).length,
    featured: testimonials.filter((t) => t.isFeatured).length,
    avgRating: testimonials.length
      ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
      : "5.0",
  };

  return (
    <div>
      {/* ─── PAGE HEADER ────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "var(--na-navy-900)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Testimonials Showcase
          </h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--na-gray-600)", fontSize: "0.875rem" }}>
            Add, update, and manage student success stories showcased on the academy home page.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.6rem 1.25rem",
            borderRadius: "var(--radius-sm)",
            background: "#5eb839",
            border: "1.5px solid #5eb839",
            color: "#fff",
            fontSize: "0.875rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all var(--transition-fast)",
            boxShadow: "0 2px 8px rgba(94, 184, 57, 0.25)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#52a331";
            e.currentTarget.style.borderColor = "#52a331";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#5eb839";
            e.currentTarget.style.borderColor = "#5eb839";
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add Testimonial</span>
        </button>
      </div>

      {/* ─── SUCCESS ALERT BANNER ──────────────────────────────── */}
      {successMessage && (
        <div
          style={{
            background: "#ecfdf5",
            border: "1.5px solid #a7f3d0",
            color: "#065f46",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            fontWeight: 600,
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* ─── STATS SUMMARY CARDS ──────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--na-gray-200)",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--na-gray-500)", textTransform: "uppercase" }}>
            Total Testimonials
          </div>
          <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--na-navy-900)", marginTop: "0.35rem" }}>
            {stats.total}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--na-gray-500)", marginTop: "0.25rem" }}>
            In database
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid var(--na-gray-200)",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--na-gray-500)", textTransform: "uppercase" }}>
            Published / Active
          </div>
          <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "#16a34a", marginTop: "0.35rem" }}>
            {stats.approved}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--na-gray-500)", marginTop: "0.25rem" }}>
            Visible on platform
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid var(--na-gray-200)",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--na-gray-500)", textTransform: "uppercase" }}>
            Featured on Home
          </div>
          <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "var(--na-blue-500)", marginTop: "0.35rem" }}>
            {stats.featured}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--na-gray-500)", marginTop: "0.25rem" }}>
            Pinned to homepage grid
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid var(--na-gray-200)",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--na-gray-500)", textTransform: "uppercase" }}>
            Average Rating
          </div>
          <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "#eab308", marginTop: "0.35rem" }}>
            {stats.avgRating} ★
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--na-gray-500)", marginTop: "0.25rem" }}>
            Student satisfaction
          </div>
        </div>
      </div>

      {/* ─── FILTERS & SEARCH CONTROLS ────────────────────────── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--na-gray-200)",
          borderRadius: "var(--radius-md)",
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        {/* Search Input */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: 260 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by student name, role, company, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "0.875rem",
              color: "var(--na-gray-800)",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", color: "var(--na-gray-400)", cursor: "pointer" }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {(["ALL", "APPROVED", "FEATURED", "PENDING"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "9999px",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                border: filter === key ? "1.5px solid var(--na-navy-900)" : "1.5px solid var(--na-gray-200)",
                background: filter === key ? "var(--na-navy-900)" : "#fff",
                color: filter === key ? "#fff" : "var(--na-gray-700)",
                transition: "all var(--transition-fast)",
              }}
            >
              {key === "ALL" && "All Testimonials"}
              {key === "APPROVED" && "Approved"}
              {key === "FEATURED" && "Featured on Home"}
              {key === "PENDING" && "Pending"}
            </button>
          ))}
        </div>
      </div>

      {/* ─── TESTIMONIALS LIST / CARDS ────────────────────────── */}
      {filteredTestimonials.length === 0 ? (
        <div
          style={{
            background: "#fff",
            border: "1px dashed var(--na-gray-300)",
            borderRadius: "var(--radius-lg)",
            padding: "3.5rem 1.5rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💬</div>
          <div style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--na-navy-900)" }}>
            No testimonials found
          </div>
          <p style={{ color: "var(--na-gray-500)", fontSize: "0.875rem", maxWidth: 420, margin: "0.5rem auto 1.5rem" }}>
            {search ? "No testimonials match your search filter." : "Get started by adding your first student review or testimonial."}
          </p>
          <button
            onClick={openCreateModal}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "var(--radius-sm)",
              background: "#5eb839",
              border: "none",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            + Add First Testimonial
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.25rem" }}>
          {filteredTestimonials.map((t) => (
            <div
              key={t.id}
              style={{
                background: "#fff",
                border: "1px solid var(--na-gray-200)",
                borderRadius: "var(--radius-md)",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                boxShadow: "var(--shadow-xs)",
                transition: "box-shadow var(--transition-fast), border-color var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
                e.currentTarget.style.borderColor = "var(--na-blue-300)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "var(--shadow-xs)";
                e.currentTarget.style.borderColor = "var(--na-gray-200)";
              }}
            >
              {/* Card Header: Author Info */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginBottom: "1rem" }}>
                {t.avatar ? (
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      overflow: "hidden",
                      position: "relative",
                      border: "2px solid var(--na-gray-200)",
                      flexShrink: 0,
                    }}
                  >
                    <Image
                      src={t.avatar}
                      alt={t.studentName}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--na-navy-800), var(--na-blue-500))",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: "1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {t.studentName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                    <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--na-navy-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.studentName}
                    </div>
                    {/* Star Rating */}
                    <div style={{ display: "flex", color: "#eab308", fontSize: "0.875rem" }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} style={{ opacity: i < t.rating ? 1 : 0.25 }}>★</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-600)", marginTop: "0.15rem" }}>
                    {t.role && <span>{t.role}</span>}
                    {t.role && t.company && <span> • </span>}
                    {t.company && <span style={{ fontWeight: 600, color: "var(--na-navy-800)" }}>{t.company}</span>}
                  </div>

                  {t.courseTitle && (
                    <div
                      style={{
                        display: "inline-block",
                        marginTop: "0.4rem",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        padding: "0.15rem 0.5rem",
                        borderRadius: "9999px",
                        background: "var(--na-gray-100)",
                        color: "var(--na-blue-600)",
                      }}
                    >
                      {t.courseTitle}
                    </div>
                  )}
                </div>
              </div>

              {/* Quote Content */}
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "var(--na-gray-700)",
                  lineHeight: 1.6,
                  flex: 1,
                  fontStyle: "italic",
                  marginBottom: "1.25rem",
                  position: "relative",
                  paddingLeft: "0.75rem",
                  borderLeft: "2.5px solid var(--na-blue-400)",
                }}
              >
                &ldquo;{t.content}&rdquo;
              </div>

              {/* Badges / Toggles & Actions */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "0.875rem",
                  borderTop: "1px solid var(--na-gray-100)",
                  gap: "0.5rem",
                }}
              >
                {/* Toggles */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <button
                    onClick={() => toggleApproved(t)}
                    title={t.isApproved ? "Click to unpublish" : "Click to approve and publish"}
                    style={{
                      padding: "0.2rem 0.6rem",
                      borderRadius: "9999px",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "none",
                      background: t.isApproved ? "#ecfdf5" : "#fef2f2",
                      color: t.isApproved ? "#059669" : "#dc2626",
                    }}
                  >
                    {t.isApproved ? "✓ Published" : "✕ Draft"}
                  </button>

                  <button
                    onClick={() => toggleFeatured(t)}
                    title={t.isFeatured ? "Click to unpin from homepage" : "Click to feature on homepage"}
                    style={{
                      padding: "0.2rem 0.6rem",
                      borderRadius: "9999px",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "none",
                      background: t.isFeatured ? "#eff6ff" : "var(--na-gray-100)",
                      color: t.isFeatured ? "var(--na-blue-600)" : "var(--na-gray-500)",
                    }}
                  >
                    {t.isFeatured ? "★ Featured" : "☆ Standard"}
                  </button>
                </div>

                {/* Edit & Delete Buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <button
                    onClick={() => openEditModal(t)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "0.3rem 0.65rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--na-gray-300)",
                      background: "#fff",
                      color: "var(--na-navy-900)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setDeleteId(t.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "0.3rem 0.5rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid #fee2e2",
                      background: "#fff",
                      color: "#dc2626",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                    title="Delete testimonial"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── CREATE / EDIT MODAL ──────────────────────────────── */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(1, 25, 54, 0.5)",
            backdropFilter: "blur(2px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            animation: "fade-in 0.2s ease",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "var(--radius-lg)",
              maxWidth: 680,
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--na-gray-200)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--na-navy-900)", margin: 0 }}>
                  {editingId ? "Edit Testimonial" : "Add Student Testimonial"}
                </h2>
                <p style={{ margin: "0.2rem 0 0", color: "var(--na-gray-500)", fontSize: "0.8125rem" }}>
                  Fill in student details and review quote below.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.25rem",
                  color: "var(--na-gray-400)",
                  cursor: "pointer",
                  padding: "0.25rem",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
              {formError && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    padding: "0.75rem",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.8125rem",
                    marginBottom: "1rem",
                  }}
                >
                  {formError}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-navy-900)", marginBottom: "0.35rem" }}>
                    Student Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amara Okonkwo"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1.5px solid var(--na-gray-300)",
                      fontSize: "0.875rem",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-navy-900)", marginBottom: "0.35rem" }}>
                    Student Role / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Data Analyst"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1.5px solid var(--na-gray-300)",
                      fontSize: "0.875rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-navy-900)", marginBottom: "0.35rem" }}>
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Standard Bank Group"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1.5px solid var(--na-gray-300)",
                      fontSize: "0.875rem",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-navy-900)", marginBottom: "0.35rem" }}>
                    Course Associated
                  </label>
                  <input
                    type="text"
                    list="course-list"
                    placeholder="e.g. Data Science Foundations"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1.5px solid var(--na-gray-300)",
                      fontSize: "0.875rem",
                      outline: "none",
                    }}
                  />
                  <datalist id="course-list">
                    {courses.map((c) => (
                      <option key={c.id} value={c.title} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Avatar upload + rating row */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1rem", marginBottom: "1rem", alignItems: "flex-start" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-navy-900)", marginBottom: "0.35rem" }}>
                    Student Photo / Avatar
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="Image URL or upload"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "0.5rem 0.75rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1.5px solid var(--na-gray-300)",
                        fontSize: "0.8125rem",
                        outline: "none",
                      }}
                    />
                    <label
                      style={{
                        padding: "0.5rem 0.75rem",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--na-gray-100)",
                        border: "1px solid var(--na-gray-300)",
                        color: "var(--na-gray-700)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {uploadingAvatar ? "Uploading..." : "Upload File"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        style={{ display: "none" }}
                        disabled={uploadingAvatar}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-navy-900)", marginBottom: "0.35rem" }}>
                    Rating ({rating} Stars)
                  </label>
                  <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", paddingTop: "0.25rem" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "1.5rem",
                          cursor: "pointer",
                          color: star <= rating ? "#eab308" : "#cbd5e1",
                          lineHeight: 1,
                          padding: 0,
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content / Quote Textarea */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-navy-900)", marginBottom: "0.35rem" }}>
                  Testimonial Quote / Story *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the student's learning experience, career transformation, or feedback..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1.5px solid var(--na-gray-300)",
                    fontSize: "0.875rem",
                    outline: "none",
                    fontFamily: "var(--font-sans)",
                    lineHeight: 1.5,
                  }}
                />
              </div>

              {/* Settings / Toggles */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--na-gray-50)",
                  padding: "0.85rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "1.5rem",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600, color: "var(--na-gray-800)" }}>
                  <input
                    type="checkbox"
                    checked={isApproved}
                    onChange={(e) => setIsApproved(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: "#5eb839" }}
                  />
                  <span>Published &amp; Active</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600, color: "var(--na-gray-800)" }}>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: "var(--na-blue-500)" }}
                  />
                  <span>Feature on Homepage</span>
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--na-gray-700)" }}>Order:</span>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
                    style={{
                      width: 60,
                      padding: "0.25rem 0.5rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--na-gray-300)",
                      fontSize: "0.8125rem",
                      textAlign: "center",
                    }}
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--na-gray-500)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  Live Homepage Card Preview
                </div>
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid var(--na-gray-200)",
                    borderRadius: "var(--radius-md)",
                    padding: "1.25rem",
                    boxShadow: "0 4px 12px rgba(1, 25, 54, 0.05)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--na-navy-800), var(--na-blue-500))",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        flexShrink: 0,
                      }}
                    >
                      {studentName ? studentName.charAt(0) : "S"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "var(--na-navy-900)" }}>
                        {studentName || "Student Name"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--na-gray-600)" }}>
                        {(role || company) ? `${role}${role && company ? " at " : ""}${company}` : "Graduate / Learner"}
                      </div>
                    </div>
                    <div style={{ marginLeft: "auto", color: "#eab308", fontSize: "0.8125rem" }}>
                      {"★".repeat(rating)}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--na-gray-700)", fontStyle: "italic", lineHeight: 1.5 }}>
                    &ldquo;{content || "Your student testimonial review quote will appear here..."}&rdquo;
                  </p>
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: "0.55rem 1.25rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1.5px solid var(--na-gray-300)",
                    background: "#fff",
                    color: "var(--na-gray-700)",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "0.55rem 1.5rem",
                    borderRadius: "var(--radius-sm)",
                    background: "#5eb839",
                    border: "1.5px solid #5eb839",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? "Saving..." : editingId ? "Update Testimonial" : "Create Testimonial"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ────────────────────────── */}
      {deleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(1, 25, 54, 0.5)",
            backdropFilter: "blur(2px)",
            zIndex: 110,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            animation: "fade-in 0.2s ease",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "var(--radius-md)",
              maxWidth: 420,
              width: "100%",
              padding: "1.5rem",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            }}
          >
            <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#dc2626", margin: "0 0 0.5rem" }}>
              Delete Testimonial?
            </h3>
            <p style={{ margin: "0 0 1.25rem", color: "var(--na-gray-600)", fontSize: "0.875rem", lineHeight: 1.5 }}>
              Are you sure you want to permanently delete this testimonial? This action cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  padding: "0.45rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1.5px solid var(--na-gray-300)",
                  background: "#fff",
                  color: "var(--na-gray-700)",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  padding: "0.45rem 1.25rem",
                  borderRadius: "var(--radius-sm)",
                  background: "#dc2626",
                  border: "1.5px solid #dc2626",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
