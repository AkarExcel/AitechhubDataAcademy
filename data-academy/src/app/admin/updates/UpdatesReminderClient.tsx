"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AudienceSegment } from "@/lib/notifications";
import { TopBannerItem } from "@/app/api/announcements/top-banner/route";

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  _count: {
    enrollments: number;
    modules: number;
  };
}

interface Breakdown {
  totalEnrolled: number;
  activeCount: number;
  completedCount: number;
  stalledCount: number;
  finalLapCount: number;
}

interface BroadcastLog {
  id: string;
  createdAt: string | Date;
  courseId: string | null;
  title: string;
  message: string;
  type: string;
  audience: string;
  recipientCount: number;
  senderName: string;
}

interface UpdatesReminderClientProps {
  courses: CourseItem[];
  initialBreakdown: Breakdown;
  initialBroadcasts: BroadcastLog[];
  initialTopBanners: TopBannerItem[];
  currentUserRole: string;
  currentUserName: string;
}

export default function UpdatesReminderClient({
  courses,
  initialBreakdown,
  initialBroadcasts,
  initialTopBanners,
  currentUserRole,
  currentUserName,
}: UpdatesReminderClientProps) {
  // Main Tab: "TOP_BANNER" | "STUDENT_BROADCASTS"
  const [activeMainTab, setActiveMainTab] = useState<"TOP_BANNER" | "STUDENT_BROADCASTS">("TOP_BANNER");

  // ══════════════════════════════════════════════════════════════════════════
  // 1. TOP BANNER ANNOUNCEMENTS & REMINDERS STATE
  // ══════════════════════════════════════════════════════════════════════════
  const [topBanners, setTopBanners] = useState<TopBannerItem[]>(initialTopBanners);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isSavingBanners, setIsSavingBanners] = useState(false);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  // Editing banner state
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
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
    linkText: "Read more",
    linkUrl: "/settings",
    isActive: true,
  });

  const activeTopBanners = useMemo(
    () => topBanners.filter((b) => b.isActive),
    [topBanners]
  );

  const previewBanner = useMemo(() => {
    if (activeTopBanners.length === 0) {
      return {
        badge: bannerForm.badge || "Updates",
        type: bannerForm.type || "Reminder",
        message: bannerForm.message || "Enter your reminder message...",
        linkText: bannerForm.linkText || "Read more",
        linkUrl: bannerForm.linkUrl || "/settings",
      };
    }
    return activeTopBanners[previewIndex % activeTopBanners.length];
  }, [activeTopBanners, previewIndex, bannerForm]);

  // Load a banner into form for editing
  const handleEditBanner = (item: TopBannerItem) => {
    setEditingBannerId(item.id);
    setBannerForm({
      badge: item.badge,
      type: item.type,
      message: item.message,
      linkText: item.linkText,
      linkUrl: item.linkUrl,
      isActive: item.isActive,
    });
    window.scrollTo({ top: 320, behavior: "smooth" });
  };

  // Reset banner form to new
  const handleResetBannerForm = () => {
    setEditingBannerId(null);
    setBannerForm({
      badge: "Updates",
      type: "Reminder",
      message: "",
      linkText: "Read more",
      linkUrl: "/settings",
      isActive: true,
    });
  };

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
    if (editingBannerId === id) handleResetBannerForm();
    await saveBannersToApi(updated);
  };

  // Save banner form (create or update)
  const handleSaveBannerForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.message.trim()) {
      alert("Please provide a message for the top reminder.");
      return;
    }

    let updated: TopBannerItem[];
    if (editingBannerId) {
      updated = topBanners.map((b) =>
        b.id === editingBannerId
          ? {
              ...b,
              badge: bannerForm.badge.trim() || "Updates",
              type: bannerForm.type.trim(),
              message: bannerForm.message.trim(),
              linkText: bannerForm.linkText.trim() || "Read more",
              linkUrl: bannerForm.linkUrl.trim() || "/settings",
              isActive: bannerForm.isActive,
            }
          : b
      );
    } else {
      const newItem: TopBannerItem = {
        id: `banner-${Date.now()}`,
        badge: bannerForm.badge.trim() || "Updates",
        type: bannerForm.type.trim(),
        message: bannerForm.message.trim(),
        linkText: bannerForm.linkText.trim() || "Read more",
        linkUrl: bannerForm.linkUrl.trim() || "/settings",
        isActive: bannerForm.isActive,
        createdAt: new Date().toISOString(),
      };
      updated = [newItem, ...topBanners];
    }

    setTopBanners(updated);
    await saveBannersToApi(updated);
    handleResetBannerForm();
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

  // ══════════════════════════════════════════════════════════════════════════
  // 2. IN-APP STUDENT BROADCASTS STATE
  // ══════════════════════════════════════════════════════════════════════════
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [selectedAudience, setSelectedAudience] = useState<AudienceSegment>("ALL");
  const [notificationType, setNotificationType] = useState<string>("ANNOUNCEMENT");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [customLink, setCustomLink] = useState("");

  const [breakdown, setBreakdown] = useState<Breakdown>(initialBreakdown);
  const [broadcasts, setBroadcasts] = useState<BroadcastLog[]>(initialBroadcasts);
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<{ count: number; title: string } | null>(null);

  const currentCourse = useMemo(() => {
    if (selectedCourseId === "all") return null;
    return courses.find((c) => c.id === selectedCourseId) || null;
  }, [selectedCourseId, courses]);

  const handleCourseChange = async (courseId: string) => {
    setSelectedCourseId(courseId);
    setIsLoadingBreakdown(true);
    setBroadcastSuccess(null);

    if (courseId === "all") {
      setCustomLink("/my-learning");
    } else {
      const found = courses.find((c) => c.id === courseId);
      if (found) setCustomLink(`/learn/${found.slug}`);
    }

    try {
      const res = await fetch(`/api/admin/notifications/broadcast?courseId=${courseId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.breakdown) setBreakdown(data.breakdown);
      }
    } catch (err) {
      console.error("Failed to fetch breakdown:", err);
    } finally {
      setIsLoadingBreakdown(false);
    }
  };

  const applyTemplate = (templateKey: string) => {
    const courseName = currentCourse ? currentCourse.title : "your enrolled courses";
    const slug = currentCourse ? currentCourse.slug : "";

    switch (templateKey) {
      case "NEW_MATERIAL":
        setTitle(`📚 New Material & Lessons Added: ${currentCourse ? currentCourse.title : "Course Update"}`);
        setMessage(
          `Fresh interactive modules, coding exercises, and practice questions have just been published for ${courseName}. Explore the new content at your own pace! If you already completed this course, your earned certificate remains 100% verified and permanently valid.`
        );
        setNotificationType("ANNOUNCEMENT");
        setSelectedAudience("ALL");
        setCustomLink(slug ? `/learn/${slug}` : "/my-learning");
        break;
      case "WEEKLY_NUDGE":
        setTitle(`⏰ Keep Up Your Learning Momentum in ${currentCourse ? currentCourse.title : "AI Tech Hub"}`);
        setMessage(
          `Consistency is the secret to mastering data & AI skills! Spend 20 minutes today tackling the next exercise or project milestone in ${courseName}.`
        );
        setNotificationType("SYSTEM");
        setSelectedAudience("ACTIVE");
        setCustomLink(slug ? `/learn/${slug}` : "/my-learning");
        break;
      case "CERTIFICATE_LAP":
        setTitle(`🏆 Final Lap: You're Close to Your Verified Certificate!`);
        setMessage(
          `You have completed the major milestones in ${courseName}. Finish the final assessments today to automatically unlock and claim your official credential for LinkedIn.`
        );
        setNotificationType("COURSE_COMPLETE");
        setSelectedAudience("FINAL_LAP");
        setCustomLink(slug ? `/learn/${slug}` : "/certificates");
        break;
    }
  };

  const estimatedRecipientCount = useMemo(() => {
    switch (selectedAudience) {
      case "ACTIVE":
        return breakdown.activeCount;
      case "COMPLETED":
        return breakdown.completedCount;
      case "STALLED":
        return breakdown.stalledCount;
      case "FINAL_LAP":
        return breakdown.finalLapCount;
      case "ALL":
      default:
        return breakdown.totalEnrolled;
    }
  }, [selectedAudience, breakdown]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert("Please provide title and message content.");
      return;
    }

    setIsSubmitting(true);
    setBroadcastSuccess(null);

    try {
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          audience: selectedAudience,
          title: title.trim(),
          message: message.trim(),
          link: customLink.trim() || undefined,
          type: notificationType,
          includeCompleted: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to broadcast.");

      setBroadcastSuccess({ count: data.notifiedStudents, title: title.trim() });

      const newLog: BroadcastLog = {
        id: `log-${Date.now()}`,
        createdAt: new Date().toISOString(),
        courseId: selectedCourseId === "all" ? null : selectedCourseId,
        title: title.trim(),
        message: message.trim(),
        type: notificationType,
        audience: selectedAudience,
        recipientCount: data.notifiedStudents,
        senderName: currentUserName || "Administrator",
      };
      setBroadcasts((prev) => [newLog, ...prev]);
      setMessage("");
    } catch (err: any) {
      alert(err.message || "Failed to broadcast notification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", paddingBottom: "3.5rem" }}>
      {/* ── NOTICE: CLARIFYING DISTINCTION BETWEEN TOP BANNER AND NOTIFICATIONS ── */}
      <div
        style={{
          background: "linear-gradient(135deg, var(--brand-blue-subtle, #f0f6ff) 0%, #e0eefe 100%)",
          border: "1px solid var(--brand-accent-200, #bae6fd)",
          borderRadius: 14,
          padding: "0.85rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.2rem" }}>📢</span>
          <div style={{ fontSize: "0.8125rem", color: "var(--brand-navy-900, #002244)" }}>
            <strong>Updates &amp; Reminder Banner:</strong> This sticky top bar is broadcast to <strong>both registered and unregistered visitors</strong> across the academy navbar.
          </div>
        </div>
        <Link
          href="/admin/notifications"
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "var(--brand-blue-700, #004074)",
            background: "#ffffff",
            padding: "0.4rem 0.85rem",
            borderRadius: 8,
            textDecoration: "none",
            border: "1px solid var(--brand-accent-200, #bae6fd)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          Open Student Notifications Dispatcher &rarr;
        </Link>
      </div>

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

      {/* ── PRIMARY TAB SWITCHER: TOP BANNER vs IN-APP BROADCASTS ── */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          background: "var(--na-gray-200, #e2e8f0)",
          padding: "0.35rem",
          borderRadius: 12,
          marginBottom: "2rem",
          maxWidth: 600,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveMainTab("TOP_BANNER")}
          style={{
            flex: 1,
            padding: "0.65rem 1rem",
            borderRadius: 8,
            border: "none",
            background: activeMainTab === "TOP_BANNER" ? "#ffffff" : "transparent",
            color: activeMainTab === "TOP_BANNER" ? "var(--brand-blue-700, #004074)" : "var(--na-gray-600, #475569)",
            fontWeight: activeMainTab === "TOP_BANNER" ? 800 : 600,
            fontSize: "0.875rem",
            cursor: "pointer",
            boxShadow: activeMainTab === "TOP_BANNER" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            transition: "all 0.15s ease",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="2" y="4" width="20" height="6" rx="2" />
            <path d="M6 14h12" />
            <path d="M6 18h7" />
          </svg>
          <span>Top Banner Reminders ({activeTopBanners.length} active)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("STUDENT_BROADCASTS")}
          style={{
            flex: 1,
            padding: "0.65rem 1rem",
            borderRadius: 8,
            border: "none",
            background: activeMainTab === "STUDENT_BROADCASTS" ? "#ffffff" : "transparent",
            color: activeMainTab === "STUDENT_BROADCASTS" ? "var(--brand-blue-700, #004074)" : "var(--na-gray-600, #475569)",
            fontWeight: activeMainTab === "STUDENT_BROADCASTS" ? 800 : 600,
            fontSize: "0.875rem",
            cursor: "pointer",
            boxShadow: activeMainTab === "STUDENT_BROADCASTS" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            transition: "all 0.15s ease",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span>Course Student Broadcasts</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: TOP BANNER UPDATES & REMINDERS (THE SCREENSHOT BANNER)        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeMainTab === "TOP_BANNER" && (
        <div>
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

          {/* ── LIVE INTERACTIVE BANNER PREVIEW (EXACT SCREENSHOT BAR IN BRAND COLORS) ── */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid var(--na-gray-200, #e2e8f0)",
              padding: "1.5rem",
              marginBottom: "2rem",
              boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--brand-accent-400, #0088cc)",
                    display: "inline-block",
                  }}
                />
                <h3 style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--brand-navy-950, #001830)", margin: 0 }}>
                  Live Top Bar Preview (AI Tech Hub Brand Colors)
                </h3>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--na-gray-500)" }}>
                Rendered across the very top of all student &amp; admin pages
              </span>
            </div>

            {/* The exact top bar */}
            <div
              style={{
                height: 44,
                borderRadius: 8,
                background: "linear-gradient(90deg, #001830 0%, #002244 35%, #003366 70%, #004b87 100%)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 1.25rem",
                fontSize: "0.8125rem",
                boxShadow: "0 4px 12px rgba(0, 24, 48, 0.25)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", overflow: "hidden", whiteSpace: "nowrap" }}>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "0.75rem",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    background: "linear-gradient(135deg, var(--brand-accent-500, #006fa8), var(--brand-accent-400, #0088cc))",
                    color: "#ffffff",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    boxShadow: "0 2px 6px rgba(0, 136, 204, 0.3)",
                    flexShrink: 0,
                  }}
                >
                  {previewBanner.badge}
                </span>
                <span style={{ color: "rgba(255,255,255,0.92)", fontSize: "0.8125rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {previewBanner.type && (
                    <strong style={{ color: "var(--brand-accent-300, #38bdf8)", marginRight: "0.4rem" }}>
                      {previewBanner.type}:
                    </strong>
                  )}
                  {previewBanner.message}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.2rem 0.85rem",
                    borderRadius: "9999px",
                    border: "1px solid rgba(56, 189, 248, 0.4)",
                    color: "#fff",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    background: "rgba(56, 189, 248, 0.12)",
                  }}
                >
                  {previewBanner.linkText}
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "rgba(255,255,255,0.75)", fontSize: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setPreviewIndex((p) => (p > 0 ? p - 1 : activeTopBanners.length - 1))}
                    style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "0 2px" }}
                  >
                    &lt;
                  </button>
                  <span style={{ fontWeight: 700, color: "var(--brand-accent-300, #38bdf8)" }}>
                    {activeTopBanners.length > 0 ? `${(previewIndex % activeTopBanners.length) + 1}/${activeTopBanners.length}` : "1/1"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewIndex((p) => (p < activeTopBanners.length - 1 ? p + 1 : 0))}
                    style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "0 2px" }}
                  >
                    &gt;
                  </button>
                </div>

                <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.2)" }} />

                <span style={{ color: "rgba(255,255,255,0.8)", cursor: "pointer" }}>&times;</span>
              </div>
            </div>
          </div>

          {/* ── TWO-COLUMN BANNER STUDIO (LIST OF BANNERS + EDIT/CREATE FORM) ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: "2rem",
              alignItems: "start",
            }}
          >
            {/* LEFT: Existing Top Banners List */}
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
                  marginBottom: "1.25rem",
                  paddingBottom: "0.75rem",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.15rem" }}>
                    Configured Banner Reminders ({topBanners.length})
                  </h3>
                  <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: 0 }}>
                    Active banners automatically cycle in the top banner carousel across the site.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetBannerForm}
                  style={{
                    background: "var(--brand-blue-subtle, #f0f6ff)",
                    border: "1px solid var(--brand-accent-200, #bae6fd)",
                    color: "var(--brand-blue-600, #004b87)",
                    borderRadius: 8,
                    padding: "0.45rem 0.85rem",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Add New Reminder
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {topBanners.map((item) => {
                  const isEditing = editingBannerId === item.id;
                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: "1.15rem",
                        borderRadius: 12,
                        border: isEditing
                          ? "2px solid var(--brand-blue-600, #004b87)"
                          : "1px solid var(--na-gray-200, #e2e8f0)",
                        background: item.isActive ? "#ffffff" : "#f8fafc",
                        opacity: item.isActive ? 1 : 0.7,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 800,
                              textTransform: "uppercase",
                              padding: "2px 8px",
                              borderRadius: 4,
                              background: "linear-gradient(135deg, var(--brand-accent-500, #006fa8), var(--brand-accent-400, #0088cc))",
                              color: "#fff",
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
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: item.isActive ? "var(--brand-blue-subtle, #f0f6ff)" : "#f1f5f9",
                              color: item.isActive ? "var(--brand-blue-700, #004074)" : "#64748b",
                            }}
                          >
                            {item.isActive ? "Active in Top Bar" : "Inactive"}
                          </span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "0.35rem" }}>
                          <button
                            type="button"
                            onClick={() => handleToggleBannerActive(item.id)}
                            title={item.isActive ? "Deactivate banner" : "Activate banner"}
                            style={{
                              background: "none",
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
                            title="Edit banner"
                            style={{
                              background: "none",
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
                            title="Delete banner"
                            style={{
                              background: "none",
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

                      <div style={{ fontSize: "0.8125rem", color: "#1e293b", lineHeight: 1.45, marginBottom: "0.4rem" }}>
                        {item.message}
                      </div>

                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        Button: <strong>&ldquo;{item.linkText}&rdquo;</strong> &rarr; <code style={{ color: "var(--brand-blue-600)" }}>{item.linkUrl}</code>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Create / Edit Form */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: 16,
                border: "1px solid var(--na-gray-200, #e2e8f0)",
                padding: "1.75rem",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                position: "sticky",
                top: "calc(var(--topbar-height) + 1rem)",
              }}
            >
              <div style={{ marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.15rem" }}>
                  {editingBannerId ? "Edit Top Reminder" : "Create New Top Reminder"}
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: 0 }}>
                  Customize the badge, text, and button link for the top banner.
                </p>
              </div>

              <form onSubmit={handleSaveBannerForm}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.3rem" }}>
                      Badge Label
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Updates, Notice"
                      value={bannerForm.badge}
                      onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.3rem" }}>
                      Type Prefix (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Reminder, Notice"
                      value={bannerForm.type}
                      onChange={(e) => setBannerForm({ ...bannerForm, type: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.3rem" }}>
                    Message Text
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Check your profile name before course completion..."
                    value={bannerForm.message}
                    onChange={(e) => setBannerForm({ ...bannerForm, message: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: "0.8125rem",
                      lineHeight: 1.45,
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.3rem" }}>
                      Button Text
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Read more"
                      value={bannerForm.linkText}
                      onChange={(e) => setBannerForm({ ...bannerForm, linkText: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.3rem" }}>
                      Destination Link
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="/settings"
                      value={bannerForm.linkUrl}
                      onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        fontSize: "0.8125rem",
                        fontFamily: "monospace",
                      }}
                    />
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
                    Publish and show in active carousel
                  </label>
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    type="submit"
                    disabled={isSavingBanners}
                    style={{
                      flex: 1,
                      background: "linear-gradient(135deg, var(--brand-blue-600, #004b87) 0%, var(--brand-accent-500, #006fa8) 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "0.75rem 1rem",
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
                      : "Add to Top Bar"}
                  </button>

                  {editingBannerId && (
                    <button
                      type="button"
                      onClick={handleResetBannerForm}
                      style={{
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        color: "#475569",
                        borderRadius: 8,
                        padding: "0.75rem 1rem",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: COURSE & STUDENT IN-APP BROADCASTS                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeMainTab === "STUDENT_BROADCASTS" && (
        <div>
          {broadcastSuccess && (
            <div
              style={{
                background: "linear-gradient(135deg, var(--brand-blue-subtle, #f0f6ff) 0%, #e0eefe 100%)",
                border: "1px solid var(--brand-accent-200, #bae6fd)",
                borderRadius: 14,
                padding: "1.25rem 1.5rem",
                marginBottom: "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 4px 14px rgba(0, 75, 135, 0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--brand-blue-600, #004b87) 0%, var(--brand-accent-500, #006fa8) 100%)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✓
                </div>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--brand-navy-900, #002244)" }}>
                    Dispatched to {broadcastSuccess.count} Student{broadcastSuccess.count === 1 ? "" : "s"}!
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--brand-blue-700, #004074)" }}>
                    Notification: &ldquo;{broadcastSuccess.title}&rdquo; is now active in student feeds.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastSuccess(null)}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.25rem" }}
              >
                &times;
              </button>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.3fr 0.9fr",
              gap: "2rem",
              alignItems: "start",
              marginBottom: "3rem",
            }}
          >
            {/* COMPOSER FORM */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: 16,
                border: "1px solid var(--na-gray-200, #e2e8f0)",
                padding: "2rem",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ marginBottom: "1.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.25rem" }}>
                  Compose Coursework Broadcast
                </h2>
                <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: 0 }}>
                  Send targeted in-app alerts directly into student notification drawers.
                </p>
              </div>

              <form onSubmit={handleBroadcast}>
                {/* Target Course */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.45rem" }}>
                    1. Target Course
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.9rem",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      background: "#ffffff",
                      color: "#0f172a",
                    }}
                  >
                    <option value="all">🌐 All Courses (Global Academy Broadcast)</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c._count.enrollments} enrolled students)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Audience Segment */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1e293b" }}>
                      2. Audience Segment
                    </label>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--brand-blue-600, #004b87)",
                        background: "var(--brand-blue-subtle, #f0f6ff)",
                        padding: "0.15rem 0.55rem",
                        borderRadius: 999,
                        border: "1px solid var(--brand-accent-200, #bae6fd)",
                      }}
                    >
                      {isLoadingBreakdown ? "Calculating..." : `${estimatedRecipientCount} student${estimatedRecipientCount === 1 ? "" : "s"} targeted`}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.5rem" }}>
                    {[
                      { id: "ALL", label: "All Enrolled", count: breakdown.totalEnrolled, desc: "Active & completed" },
                      { id: "ACTIVE", label: "Active Learners", count: breakdown.activeCount, desc: "In-progress (<100%)" },
                      { id: "COMPLETED", label: "Course Alumni", count: breakdown.completedCount, desc: "Certificates earned" },
                      { id: "FINAL_LAP", label: "Final Lap (≥70%)", count: breakdown.finalLapCount, desc: "Near graduation" },
                      { id: "STALLED", label: "Stalled (<50%)", count: breakdown.stalledCount, desc: "Needs nudge" },
                    ].map((seg) => {
                      const isSelected = selectedAudience === seg.id;
                      return (
                        <button
                          key={seg.id}
                          type="button"
                          onClick={() => setSelectedAudience(seg.id as AudienceSegment)}
                          style={{
                            padding: "0.6rem 0.5rem",
                            borderRadius: 10,
                            border: isSelected ? "2px solid var(--brand-blue-600)" : "1px solid #e2e8f0",
                            background: isSelected ? "var(--brand-blue-subtle, #f0f6ff)" : "#ffffff",
                            color: isSelected ? "var(--brand-blue-700)" : "#334155",
                            cursor: "pointer",
                            textAlign: "center",
                          }}
                        >
                          <div style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{seg.label}</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0.15rem 0" }}>{seg.count}</div>
                          <div style={{ fontSize: "0.6875rem", color: "#64748b" }}>{seg.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Templates */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "0.45rem" }}>
                    Quick-Fill Templates:
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {[
                      { key: "NEW_MATERIAL", label: "📚 New Lessons Added" },
                      { key: "WEEKLY_NUDGE", label: "⏰ Weekly Momentum" },
                      { key: "CERTIFICATE_LAP", label: "🏆 Final Lap Certification" },
                    ].map((tmpl) => (
                      <button
                        key={tmpl.key}
                        type="button"
                        onClick={() => applyTemplate(tmpl.key)}
                        style={{
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          borderRadius: 999,
                          padding: "0.3rem 0.75rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {tmpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title & Message */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                    Notification Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 📚 New Hands-on Lab Added: PySpark ETL Workflows"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.9rem",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                    }}
                  />
                </div>

                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                    Message Content
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide details about the update or deadline..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.9rem",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: "0.875rem",
                      lineHeight: 1.5,
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* Credential Guarantee */}
                <div
                  style={{
                    background: "linear-gradient(135deg, var(--brand-blue-subtle, #f0f6ff) 0%, #e0eefe 100%)",
                    border: "1px solid var(--brand-accent-200, #bae6fd)",
                    borderRadius: 12,
                    padding: "0.85rem 1rem",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    marginBottom: "1.75rem",
                  }}
                >
                  <div style={{ fontSize: "0.78125rem", color: "var(--brand-navy-900, #002244)", lineHeight: 1.45 }}>
                    <strong style={{ color: "var(--brand-blue-700, #004074)" }}>Credential Integrity Protected:</strong> Course updates notify alumni so they can review new materials at their leisure. Existing earned certificates remain permanently authentic and verified on Supabase.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || estimatedRecipientCount === 0}
                  style={{
                    width: "100%",
                    background:
                      estimatedRecipientCount === 0
                        ? "#94a3b8"
                        : "linear-gradient(135deg, var(--brand-blue-600, #004b87) 0%, var(--brand-accent-500, #006fa8) 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 10,
                    padding: "0.85rem 1.5rem",
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    cursor: isSubmitting || estimatedRecipientCount === 0 ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(0, 75, 135, 0.25)",
                  }}
                >
                  {isSubmitting
                    ? "Dispatching Notifications..."
                    : `Broadcast to ${estimatedRecipientCount} Student${estimatedRecipientCount === 1 ? "" : "s"}`}
                </button>
              </form>
            </div>

            {/* PREVIEW */}
            <div style={{ position: "sticky", top: "calc(var(--topbar-height) + 1rem)" }}>
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 16,
                  border: "1px solid var(--na-gray-200, #e2e8f0)",
                  padding: "1.75rem",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.75rem" }}>
                  Live Student Notification Drawer Preview
                </div>
                <div
                  style={{
                    background: "var(--brand-accent-50, #f8fbff)",
                    borderRadius: 14,
                    border: "1.5px solid var(--brand-accent-300, #7dd3fc)",
                    padding: "1.15rem",
                    boxShadow: "0 4px 12px rgba(0, 75, 135, 0.08)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.35rem" }}>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "0.15rem 0.45rem",
                        borderRadius: 6,
                        background: "var(--brand-blue-subtle, #f0f6ff)",
                        color: "var(--brand-blue-600, #004b87)",
                      }}
                    >
                      {notificationType}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Just now</span>
                  </div>
                  <h4 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.35rem" }}>
                    {title || "📚 New Material & Lessons Added: Course Update"}
                  </h4>
                  <p style={{ fontSize: "0.8125rem", color: "#475569", margin: 0, lineHeight: 1.45 }}>
                    {message || "Fresh interactive modules and coding exercises have just been published for this course."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Broadcast History Table */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid var(--na-gray-200, #e2e8f0)",
              padding: "2rem",
              boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            }}
          >
            <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#0f172a", margin: "0 0 1rem" }}>
              Dispatched Broadcasts History ({broadcasts.length})
            </h3>
            {broadcasts.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>No broadcasts sent yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1.5px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                    <th style={{ padding: "0.6rem 0.8rem" }}>Date</th>
                    <th style={{ padding: "0.6rem 0.8rem" }}>Title</th>
                    <th style={{ padding: "0.6rem 0.8rem" }}>Audience</th>
                    <th style={{ padding: "0.6rem 0.8rem", textAlign: "right" }}>Recipients</th>
                  </tr>
                </thead>
                <tbody>
                  {broadcasts.map((log) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "0.75rem 0.8rem", color: "#64748b" }}>
                        {new Date(log.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "0.75rem 0.8rem", fontWeight: 700, color: "#0f172a" }}>{log.title}</td>
                      <td style={{ padding: "0.75rem 0.8rem" }}>{log.audience}</td>
                      <td style={{ padding: "0.75rem 0.8rem", textAlign: "right", fontWeight: 800, color: "var(--brand-blue-600)" }}>
                        {log.recipientCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
