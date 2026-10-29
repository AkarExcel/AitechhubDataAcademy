"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { TopBannerItem } from "@/lib/top-banners";

interface UpdatesReminderClientProps {
  initialTopBanners: TopBannerItem[];
  currentUserRole?: string;
  currentUserName?: string;
  // Optional legacy props for backwards-compatibility
  courses?: unknown;
  initialBreakdown?: unknown;
  initialBroadcasts?: unknown;
}

function createBannerId(): string {
  return `banner-${Date.now()}`;
}

function createIsoTimestamp(): string {
  return new Date().toISOString();
}

export default function UpdatesReminderClient({
  initialTopBanners,
}: UpdatesReminderClientProps) {
  // ══════════════════════════════════════════════════════════════════════════
  // TOP BANNER ANNOUNCEMENTS & REMINDERS STATE
  // ══════════════════════════════════════════════════════════════════════════
  const [topBanners, setTopBanners] = useState<TopBannerItem[]>(initialTopBanners);
  const [isSavingBanners, setIsSavingBanners] = useState(false);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  // Editing banner state
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerForm, setBannerForm] = useState<{
    badge: string;
    type: string;
    message: string;
    linkText: string;
    linkUrl: string;
    isActive: boolean;
  }>({
    badge: "Updates",
    type: "Reminder",
    message: "Check your profile name before course completion. Make sure it matches how you want it to appear on your certificate.",
    linkText: "",
    linkUrl: "",
    isActive: true,
  });

  const activeCount = useMemo(
    () => topBanners.filter((b) => b.isActive).length,
    [topBanners]
  );

  // Open modal for creating new banner
  const handleOpenCreateModal = () => {
    handleResetBannerForm();
    setIsBannerModalOpen(true);
  };

  // Load a banner into form for editing in modal
  const handleEditBanner = (item: TopBannerItem) => {
    setEditingBannerId(item.id);
    setBannerForm({
      badge: item.badge,
      type: item.type || "",
      message: item.message,
      linkText: item.linkText || "",
      linkUrl: item.linkUrl || "",
      isActive: item.isActive,
    });
    setIsBannerModalOpen(true);
  };

  // Close modal and reset form
  const handleCloseBannerModal = () => {
    setIsBannerModalOpen(false);
    handleResetBannerForm();
  };

  // Reset banner form to new
  const handleResetBannerForm = () => {
    setEditingBannerId(null);
    setBannerForm({
      badge: "Updates",
      type: "Reminder",
      message: "",
      linkText: "",
      linkUrl: "",
      isActive: true,
    });
  };

  // Close modal on Escape key press
  useEffect(() => {
    if (!isBannerModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsBannerModalOpen(false);
        setEditingBannerId(null);
        setBannerForm({
          badge: "Updates",
          type: "Reminder",
          message: "",
          linkText: "",
          linkUrl: "",
          isActive: true,
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBannerModalOpen]);

  // Toggle active status of a banner
  const handleToggleBannerActive = async (id: string) => {
    const updated = topBanners.map((b) =>
      b.id === id ? { ...b, isActive: !b.isActive } : b
    );
    setTopBanners(updated);
    await saveBannersToApi(updated);
  };

  // Delete a banner
  const handleDeleteBanner = async (id: string) => {
    if (topBanners.length <= 1) {
      alert("At least one reminder banner must remain in the academy ledger.");
      return;
    }
    if (!confirm("Are you sure you want to delete this top banner reminder?")) return;
    const updated = topBanners.filter((b) => b.id !== id);
    setTopBanners(updated);
    if (editingBannerId === id) {
      handleCloseBannerModal();
    }
    await saveBannersToApi(updated);
  };

  // Save banner form (create or update)
  const handleSaveBannerForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.message.trim()) {
      alert("Please provide a message for the top reminder.");
      return;
    }

    const trimmedLinkText = bannerForm.linkText.trim();
    const trimmedLinkUrl = bannerForm.linkUrl.trim();

    let updated: TopBannerItem[];
    if (editingBannerId) {
      updated = topBanners.map((b) =>
        b.id === editingBannerId
          ? {
              ...b,
              badge: bannerForm.badge.trim() || "Updates",
              type: bannerForm.type.trim(),
              message: bannerForm.message.trim(),
              linkText: trimmedLinkText || undefined,
              linkUrl: trimmedLinkUrl || undefined,
              isActive: bannerForm.isActive,
            }
          : b
      );
    } else {
      const newItem: TopBannerItem = {
        id: createBannerId(),
        badge: bannerForm.badge.trim() || "Updates",
        type: bannerForm.type.trim(),
        message: bannerForm.message.trim(),
        linkText: trimmedLinkText || undefined,
        linkUrl: trimmedLinkUrl || undefined,
        isActive: bannerForm.isActive,
        createdAt: createIsoTimestamp(),
      };
      updated = [newItem, ...topBanners];
    }

    setTopBanners(updated);
    await saveBannersToApi(updated);
    handleCloseBannerModal();
  };

  // Save to API
  const saveBannersToApi = async (bannersList: TopBannerItem[]) => {
    setIsSavingBanners(true);
    setBannerSuccess(null);
    try {
      const res = await fetch("/api/admin/announcements/top-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banners: bannersList }),
      });
      if (res.ok) {
        setBannerSuccess("Top bar updates & reminders saved and published across the academy!");
        setTimeout(() => setBannerSuccess(null), 4000);
      } else {
        alert("Failed to save banner configuration.");
      }
    } catch (err) {
      console.error("Save banner error:", err);
      alert("Error saving banner configuration.");
    } finally {
      setIsSavingBanners(false);
    }
  };

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", paddingBottom: "3.5rem" }}>
      {/* ── TOP HERO HEADER ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #001830 0%, #002b54 55%, #004b87 100%)",
          borderRadius: 20,
          padding: "2.5rem 2rem",
          color: "#ffffff",
          marginBottom: "1.75rem",
          boxShadow: "0 10px 30px rgba(0, 24, 48, 0.2)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(255, 255, 255, 0.12)",
              padding: "0.35rem 0.85rem",
              borderRadius: 9999,
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--brand-accent-300, #38bdf8)",
              marginBottom: "1rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Public Announcement Bar &amp; Reminders
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: "1.5rem",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "2.125rem",
                  color: "#ffffff",
                  fontWeight: 900,
                  margin: "0 0 0.5rem 0",
                  letterSpacing: "-0.02em",
                }}
              >
                Top Banner Updates &amp; Reminders
              </h1>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "rgba(255, 255, 255, 0.85)",
                  margin: 0,
                  maxWidth: 640,
                  lineHeight: 1.5,
                }}
              >
                Broadcast sticky announcements and reminders at the top of the navbar to both registered students and unregistered visitors.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <Link
                href="/admin"
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  color: "#fff",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  borderRadius: 10,
                  padding: "0.6rem 1.15rem",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                }}
              >
                <span>&larr; Admin Overview</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {bannerSuccess && (
        <div
          style={{
            background: "linear-gradient(135deg, var(--brand-blue-subtle, #f0f6ff) 0%, #e0eefe 100%)",
            border: "1px solid var(--brand-accent-200, #bae6fd)",
            borderRadius: 14,
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
            color: "var(--brand-navy-900, #002244)",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <span style={{ color: "var(--brand-blue-600, #004b87)", fontSize: "1.25rem" }}>✓</span>
          <span>{bannerSuccess}</span>
        </div>
      )}

      {/* ── CONFIGURED TOP BANNERS MANAGER ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid var(--na-gray-200, #e2e8f0)",
          padding: "1.75rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.5rem",
            paddingBottom: "1rem",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.25rem" }}>
              Configured Top Reminders ({topBanners.length})
            </h3>
            <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: 0 }}>
              Active reminders ({activeCount}) cycle automatically in the sticky top banner across the academy website.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            style={{
              background: "linear-gradient(135deg, var(--brand-blue-600, #004b87) 0%, var(--brand-accent-500, #006fa8) 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: 10,
              padding: "0.6rem 1.25rem",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 2px 8px rgba(0, 75, 135, 0.25)",
              transition: "all var(--transition-fast)",
            }}
          >
            <span style={{ fontSize: "1rem", lineHeight: 1 }}>+</span> Create New Top Reminder
          </button>
        </div>

        {/* Grid of Configured Reminders */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {topBanners.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "1.35rem",
                borderRadius: 14,
                border: item.isActive
                  ? "1px solid var(--brand-accent-200, #bae6fd)"
                  : "1px solid var(--na-gray-200, #e2e8f0)",
                background: item.isActive ? "#ffffff" : "#f8fafc",
                opacity: item.isActive ? 1 : 0.75,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "1rem",
                boxShadow: item.isActive
                  ? "0 4px 12px rgba(0, 111, 168, 0.05)"
                  : "none",
                transition: "all 0.2s ease",
              }}
            >
              <div>
                {/* Header tags & status */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "0.75rem",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        padding: "3px 8px",
                        borderRadius: 4,
                        background: "linear-gradient(135deg, var(--brand-accent-500, #006fa8), var(--brand-accent-400, #0088cc))",
                        color: "#fff",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {item.badge}
                    </span>
                    {item.type && (
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--brand-blue-600, #004b87)" }}>
                        {item.type}:
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: item.isActive ? "var(--brand-blue-subtle, #f0f6ff)" : "#f1f5f9",
                        color: item.isActive ? "var(--brand-blue-700, #004074)" : "#64748b",
                      }}
                    >
                      {item.isActive ? "Active in Top Bar" : "Inactive"}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => handleToggleBannerActive(item.id)}
                      title={item.isActive ? "Deactivate reminder" : "Activate reminder"}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: 6,
                        padding: "0.25rem 0.55rem",
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        color: "#475569",
                        cursor: "pointer",
                      }}
                    >
                      {item.isActive ? "Disable" : "Enable"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditBanner(item)}
                      title="Edit reminder"
                      style={{
                        background: "#ffffff",
                        border: "1px solid var(--brand-accent-200, #bae6fd)",
                        borderRadius: 6,
                        padding: "0.25rem 0.55rem",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        color: "var(--brand-blue-600, #004b87)",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBanner(item.id)}
                      title="Delete reminder"
                      style={{
                        background: "#ffffff",
                        border: "1px solid #fecaca",
                        borderRadius: 6,
                        padding: "0.25rem 0.55rem",
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        color: "#dc2626",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <p style={{ fontSize: "0.875rem", color: "#1e293b", lineHeight: 1.5, margin: 0 }}>
                  {item.message}
                </p>
              </div>

              {/* Footer: Button link or Informational notice */}
              <div
                style={{
                  paddingTop: "0.65rem",
                  borderTop: "1px solid #f1f5f9",
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  flexWrap: "wrap",
                }}
              >
                {item.linkText && item.linkUrl ? (
                  <span style={{ color: "#475569" }}>
                    Button: <strong style={{ color: "var(--brand-blue-700, #004074)" }}>&ldquo;{item.linkText}&rdquo;</strong> &rarr;{" "}
                    <code style={{ color: "var(--brand-blue-600, #004b87)", background: "#f8fafc", padding: "1px 4px", borderRadius: 4 }}>
                      {item.linkUrl}
                    </code>
                  </span>
                ) : (
                  <span style={{ color: "#64748b", fontStyle: "italic", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                    <span>ℹ</span> No button link (Informational notice only)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CREATE / EDIT TOP REMINDER MODAL (DIALOG POP-UP) ── */}
      {isBannerModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="banner-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseBannerModal();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 18,
              border: "1px solid var(--na-gray-200, #e2e8f0)",
              maxWidth: "640px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              padding: "1.75rem 2rem",
              position: "relative",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1.25rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div>
                <h3
                  id="banner-modal-title"
                  style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.25rem" }}
                >
                  {editingBannerId ? "Edit Top Reminder" : "Create New Top Reminder"}
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: 0 }}>
                  Configure an announcement or reminder displayed in the top bar across all pages.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseBannerModal}
                aria-label="Close dialog"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  lineHeight: 1,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
              >
                &times;
              </button>
            </div>

            {/* Live In-Modal Preview */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "0.35rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Live Preview
              </label>
              <div
                style={{
                  background: "linear-gradient(90deg, #021a36 0%, #004b87 60%, #006fa8 100%)",
                  borderRadius: 10,
                  padding: "0.6rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  boxShadow: "0 2px 8px rgba(0, 75, 135, 0.2)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      padding: "2px 7px",
                      borderRadius: "9999px",
                      background: "linear-gradient(135deg, var(--brand-accent-500, #006fa8), var(--brand-accent-400, #0088cc))",
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {bannerForm.badge || "Updates"}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.92)", fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {bannerForm.type && (
                      <strong style={{ color: "var(--brand-accent-300, #38bdf8)", marginRight: "0.35rem" }}>
                        {bannerForm.type}:
                      </strong>
                    )}
                    {bannerForm.message || "Your reminder message preview..."}
                  </span>
                </div>

                {bannerForm.linkText.trim() && (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.15rem 0.65rem",
                      borderRadius: "9999px",
                      border: "1px solid rgba(56, 189, 248, 0.4)",
                      color: "#fff",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      background: "rgba(56, 189, 248, 0.12)",
                      flexShrink: 0,
                    }}
                  >
                    {bannerForm.linkText.trim()}
                  </span>
                )}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveBannerForm}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.3rem" }}>
                    Badge Label <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Updates, Notice"
                    value={bannerForm.badge}
                    onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.3rem" }}>
                    Category / Type (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Reminder, Notice"
                    value={bannerForm.type}
                    onChange={(e) => setBannerForm({ ...bannerForm, type: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.3rem" }}>
                  Reminder Message <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Check your profile name before course completion. Make sure it matches how you want it to appear on your certificate..."
                  value={bannerForm.message}
                  onChange={(e) => setBannerForm({ ...bannerForm, message: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.75rem",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8125rem",
                    lineHeight: 1.45,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Optional Button Link Section */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 12,
                  border: "1px dashed #cbd5e1",
                  padding: "1rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div style={{ marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1e293b" }}>
                    Action Button Link (Optional)
                  </span>
                  <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.2rem 0 0" }}>
                    Leave both fields blank if this reminder is purely informational and doesn&apos;t need a clickable button.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                      Button Text (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Read more, Register"
                      value={bannerForm.linkText}
                      onChange={(e) => setBannerForm({ ...bannerForm, linkText: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: "0.8125rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                      Destination Link (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. /settings, /courses"
                      value={bannerForm.linkUrl}
                      onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: "0.8125rem",
                        fontFamily: "monospace",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={bannerForm.isActive}
                  onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                  style={{ cursor: "pointer", width: 16, height: 16 }}
                />
                <label htmlFor="isActiveToggle" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#1e293b", cursor: "pointer" }}>
                  Publish and include in active top bar rotation
                </label>
              </div>

              {/* Modal Footer Actions */}
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={handleCloseBannerModal}
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    color: "#475569",
                    borderRadius: 8,
                    padding: "0.75rem 1.25rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBanners}
                  style={{
                    background: "linear-gradient(135deg, var(--brand-blue-600, #004b87) 0%, var(--brand-accent-500, #006fa8) 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "0.75rem 1.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    cursor: isSavingBanners ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 8px rgba(0, 75, 135, 0.25)",
                  }}
                >
                  {isSavingBanners
                    ? "Saving..."
                    : editingBannerId
                    ? "Update Top Reminder"
                    : "Save & Publish Reminder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
