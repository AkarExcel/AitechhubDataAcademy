"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AudienceSegment } from "@/lib/notifications";

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

interface StudentNotificationsClientProps {
  courses: CourseItem[];
  initialBreakdown: Breakdown;
  initialBroadcasts: BroadcastLog[];
  currentUserRole: string;
  currentUserName: string;
}

export default function StudentNotificationsClient({
  courses,
  initialBreakdown,
  initialBroadcasts,
  currentUserRole,
  currentUserName,
}: StudentNotificationsClientProps) {
  // Form State
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [selectedAudience, setSelectedAudience] = useState<AudienceSegment>("ALL");
  const [notificationType, setNotificationType] = useState<string>("ANNOUNCEMENT");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [customLink, setCustomLink] = useState("");

  // Breakdown & History State
  const [breakdown, setBreakdown] = useState<Breakdown>(initialBreakdown);
  const [broadcasts, setBroadcasts] = useState<BroadcastLog[]>(initialBroadcasts);
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<{ count: number; title: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected course object
  const currentCourse = useMemo(() => {
    if (selectedCourseId === "all") return null;
    return courses.find((c) => c.id === selectedCourseId) || null;
  }, [selectedCourseId, courses]);

  // Handle Course Change
  const handleCourseChange = async (courseId: string) => {
    setSelectedCourseId(courseId);
    setIsLoadingBreakdown(true);
    setSuccessBanner(null);
    setErrorMessage(null);

    // Auto-update link if empty or previously default
    if (courseId === "all") {
      setCustomLink("/my-learning");
    } else {
      const found = courses.find((c) => c.id === courseId);
      if (found) {
        setCustomLink(`/learn/${found.slug}`);
      }
    }

    try {
      const res = await fetch(`/api/admin/notifications/broadcast?courseId=${courseId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.breakdown) {
          setBreakdown(data.breakdown);
        }
      }
    } catch (err) {
      console.error("Failed to fetch audience breakdown:", err);
    } finally {
      setIsLoadingBreakdown(false);
    }
  };

  // Pre-built Quick Templates
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

      case "DEADLINE_NOTICE":
        setTitle(`📝 Upcoming Assessment Deadline for ${currentCourse ? currentCourse.title : "Coursework"}`);
        setMessage(
          `Reminder: Your upcoming graded module assessment and lab submissions for ${courseName} are due soon. Review the study resources and submit on time.`
        );
        setNotificationType("DEADLINE");
        setSelectedAudience("ACTIVE");
        setCustomLink(slug ? `/learn/${slug}` : "/my-learning");
        break;

      case "LIVE_WORKSHOP":
        setTitle(`🎙️ Live Instructor Q&A & Hands-on Lab Session`);
        setMessage(
          `Join our faculty for a live interactive workshop on ${courseName}. Bring your questions, code along with mentors, and review real-world industry case studies.`
        );
        setNotificationType("ANNOUNCEMENT");
        setSelectedAudience("ALL");
        setCustomLink("/dashboard");
        break;
    }
  };

  // Recipient Count based on active audience tab
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

  // Submit Broadcast
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setErrorMessage("Please enter both a title and message body.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessBanner(null);

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

      if (!res.ok) {
        throw new Error(data.error || "Failed to broadcast update notification.");
      }

      setSuccessBanner({
        count: data.notifiedStudents,
        title: title.trim(),
      });

      // Prepend to broadcast logs
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

      // Clear message or leave title for convenience
      setMessage("");
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while sending.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Duplicate / Resend from log
  const handleReuseLog = (log: BroadcastLog) => {
    setTitle(log.title);
    setMessage(log.message);
    setNotificationType(log.type);
    setSelectedAudience((log.audience as AudienceSegment) || "ALL");
    if (log.courseId) {
      handleCourseChange(log.courseId);
    } else {
      handleCourseChange("all");
    }
    window.scrollTo({ top: 180, behavior: "smooth" });
  };

  // Preview Notification Theme Helper
  const getThemePreview = (type: string) => {
    switch (type) {
      case "COURSE_COMPLETE":
      case "CERTIFICATE":
        return {
          iconBg: "linear-gradient(135deg, #004b87 0%, #006fa8 100%)",
          badgeBg: "var(--brand-blue-subtle, #f0f6ff)",
          color: "var(--brand-blue-700, #004074)",
          label: "Credential Earned",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          ),
        };
      case "DEADLINE":
        return {
          iconBg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          badgeBg: "#fffbeb",
          color: "#b45309",
          label: "Deadline Notice",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ),
        };
      case "ASSESSMENT_RESULT":
      case "GRADE":
        return {
          iconBg: "linear-gradient(135deg, #003366 0%, #004b87 100%)",
          badgeBg: "var(--brand-blue-subtle, #f0f6ff)",
          color: "var(--brand-blue-600, #004b87)",
          label: "Coursework Milestone",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <path d="m9 11 3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          ),
        };
      case "ANNOUNCEMENT":
      default:
        return {
          iconBg: "linear-gradient(135deg, #005a9e 0%, #0088cc 100%)",
          badgeBg: "#e0f2fe",
          color: "var(--brand-accent-500, #006fa8)",
          label: "Course Update",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          ),
        };
    }
  };

  const previewTheme = getThemePreview(notificationType);

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", paddingBottom: "3rem" }}>
      {/* ── TOP HERO HEADER ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #001830 0%, #002b54 55%, #004b87 100%)",
          borderRadius: 20,
          padding: "2.5rem 2rem",
          color: "#ffffff",
          marginBottom: "2rem",
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
            Instructional Outreach & Communications
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
                Updates &amp; Reminder Manager
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
                Broadcast curriculum updates, learning streak nudges, and deadline alerts to students and alumni without compromising their earned certificates.
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
                  transition: "all 0.2s ease",
                }}
              >
                <span>&larr; Admin Overview</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── SUCCESS BANNER ── */}
      {successBanner && (
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
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--brand-navy-900, #002244)" }}>
                Successfully Dispatched to {successBanner.count} Student{successBanner.count === 1 ? "" : "s"}!
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--brand-blue-700, #004074)" }}>
                Notification: &ldquo;{successBanner.title}&rdquo; is now live across student dashboards and alert feeds.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            style={{
              background: "none",
              border: "none",
              color: "var(--na-gray-500)",
              cursor: "pointer",
              fontSize: "1.25rem",
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* ── ERROR MESSAGE ── */}
      {errorMessage && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #f87171",
            color: "#991b1b",
            borderRadius: 12,
            padding: "1rem 1.25rem",
            marginBottom: "2rem",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* ── MAIN STUDIO GRID (COMPOSER + LIVE PREVIEW) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 0.9fr",
          gap: "2rem",
          alignItems: "start",
          marginBottom: "3rem",
        }}
      >
        {/* ── LEFT COLUMN: COMPOSER FORM ── */}
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
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--na-gray-900, #0f172a)", margin: "0 0 0.25rem" }}>
              Compose Update or Reminder
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--na-gray-500, #64748b)", margin: 0 }}>
              Select your course scope, audience segment, and customize your student message.
            </p>
          </div>

          <form onSubmit={handleBroadcast}>
            {/* 1. Target Course Selector */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "var(--na-gray-800, #1e293b)",
                  marginBottom: "0.45rem",
                }}
              >
                1. Target Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.9rem",
                  borderRadius: 10,
                  border: "1px solid var(--na-gray-300, #cbd5e1)",
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

            {/* 2. Target Audience Segment Selector */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: "var(--na-gray-800, #1e293b)",
                  }}
                >
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

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: "0.5rem",
                }}
              >
                {[
                  {
                    id: "ALL",
                    label: "All Enrolled",
                    count: breakdown.totalEnrolled,
                    desc: "Active & completed",
                  },
                  {
                    id: "ACTIVE",
                    label: "Active Learners",
                    count: breakdown.activeCount,
                    desc: "In-progress (<100%)",
                  },
                  {
                    id: "COMPLETED",
                    label: "Course Alumni",
                    count: breakdown.completedCount,
                    desc: "Certificates earned",
                  },
                  {
                    id: "FINAL_LAP",
                    label: "Final Lap (≥70%)",
                    count: breakdown.finalLapCount,
                    desc: "Near graduation",
                  },
                  {
                    id: "STALLED",
                    label: "Stalled (<50%)",
                    count: breakdown.stalledCount,
                    desc: "Needs nudge",
                  },
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
                        border: isSelected
                          ? "2px solid var(--brand-blue-600, #004b87)"
                          : "1px solid var(--na-gray-200, #e2e8f0)",
                        background: isSelected ? "var(--brand-blue-subtle, #f0f6ff)" : "#ffffff",
                        color: isSelected ? "var(--brand-blue-700, #004074)" : "var(--na-gray-700, #334155)",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{seg.label}</div>
                      <div
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: 800,
                          color: isSelected ? "var(--brand-blue-600, #004b87)" : "var(--na-gray-900, #0f172a)",
                          margin: "0.15rem 0",
                        }}
                      >
                        {seg.count}
                      </div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--na-gray-500)" }}>{seg.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Quick Templates Strip */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--na-gray-600)",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  marginBottom: "0.45rem",
                }}
              >
                Quick-Fill Template Suggestions:
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {[
                  { key: "NEW_MATERIAL", label: "📚 New Lessons Added" },
                  { key: "WEEKLY_NUDGE", label: "⏰ Weekly Momentum" },
                  { key: "CERTIFICATE_LAP", label: "🏆 Final Lap Certification" },
                  { key: "DEADLINE_NOTICE", label: "📝 Assessment Deadline" },
                  { key: "LIVE_WORKSHOP", label: "🎙️ Live Workshop" },
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
                      color: "#334155",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--brand-blue-subtle, #f0f6ff)";
                      e.currentTarget.style.color = "var(--brand-blue-600, #004b87)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#f1f5f9";
                      e.currentTarget.style.color = "#334155";
                    }}
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Notification Type */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "var(--na-gray-800, #1e293b)",
                  marginBottom: "0.45rem",
                }}
              >
                3. Notification Category
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {[
                  { id: "ANNOUNCEMENT", label: "📢 Course Update" },
                  { id: "DEADLINE", label: "⏰ Deadline Notice" },
                  { id: "ASSESSMENT_RESULT", label: "🎯 Coursework Milestone" },
                  { id: "COURSE_COMPLETE", label: "🏆 Credential Opportunity" },
                  { id: "SYSTEM", label: "⚙️ General Notice" },
                ].map((t) => {
                  const isSelected = notificationType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNotificationType(t.id)}
                      style={{
                        padding: "0.45rem 0.85rem",
                        borderRadius: 8,
                        border: isSelected ? "1.5px solid var(--brand-blue-600)" : "1px solid #e2e8f0",
                        background: isSelected ? "var(--brand-blue-subtle, #f0f6ff)" : "#ffffff",
                        color: isSelected ? "var(--brand-blue-700, #004074)" : "#475569",
                        fontSize: "0.8125rem",
                        fontWeight: isSelected ? 700 : 500,
                        cursor: "pointer",
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Title & Message Inputs */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-gray-800)" }}>
                  4. Notification Title
                </label>
                <span style={{ fontSize: "0.6875rem", color: "var(--na-gray-400)" }}>{title.length}/100</span>
              </div>
              <input
                type="text"
                required
                maxLength={100}
                placeholder="e.g. 📚 New Hands-on Lab Added: PySpark ETL Workflows"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.9rem",
                  borderRadius: 10,
                  border: "1px solid var(--na-gray-300, #cbd5e1)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-gray-800)" }}>
                  5. Message Content
                </label>
                <span style={{ fontSize: "0.6875rem", color: "var(--na-gray-400)" }}>{message.length}/500</span>
              </div>
              <textarea
                required
                rows={4}
                maxLength={500}
                placeholder="Provide clear, encouraging context for the learner. Mention what new exercises have been added or remind them of upcoming deadlines..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.9rem",
                  borderRadius: 10,
                  border: "1px solid var(--na-gray-300, #cbd5e1)",
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ marginBottom: "1.75rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "var(--na-gray-800)",
                  marginBottom: "0.4rem",
                }}
              >
                6. Call-to-Action Link (Optional)
              </label>
              <input
                type="text"
                placeholder={currentCourse ? `/learn/${currentCourse.slug}` : "/my-learning"}
                value={customLink}
                onChange={(e) => setCustomLink(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  borderRadius: 10,
                  border: "1px solid var(--na-gray-300, #cbd5e1)",
                  fontSize: "0.8125rem",
                  fontFamily: "monospace",
                }}
              />
            </div>

            {/* Credential Protection Callout */}
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
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "var(--brand-blue-600, #004b87)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div style={{ fontSize: "0.78125rem", color: "var(--brand-navy-900, #002244)", lineHeight: 1.45 }}>
                <strong style={{ color: "var(--brand-blue-700, #004074)" }}>Credential Integrity Protected:</strong> Course updates notify alumni so they can review new materials at their leisure. Existing earned certificates remain permanently authentic and verified on Supabase.
              </div>
            </div>

            {/* Broadcast Button */}
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                transition: "all 0.2s ease",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              <span>
                {isSubmitting
                  ? "Dispatching Notifications..."
                  : `Broadcast to ${estimatedRecipientCount} Student${estimatedRecipientCount === 1 ? "" : "s"}`}
              </span>
            </button>
          </form>
        </div>

        {/* ── RIGHT COLUMN: LIVE NOTIFICATION PREVIEW ── */}
        <div style={{ position: "sticky", top: "calc(var(--topbar-height) + 1rem)" }}>
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid var(--na-gray-200, #e2e8f0)",
              padding: "1.75rem",
              boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--brand-navy-950, #001830)" }}>
                Live Student Preview
              </div>
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--brand-blue-600, #004b87)",
                  background: "var(--brand-blue-subtle, #f0f6ff)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: 6,
                }}
              >
                Student Feed View
              </span>
            </div>

            <p style={{ fontSize: "0.75rem", color: "var(--na-gray-500)", margin: "0 0 1rem 0" }}>
              This is how your alert will render on the student&apos;s notification drawer and alerts page:
            </p>

            {/* Mocked Notification Card */}
            <div
              style={{
                background: "var(--brand-accent-50, #f8fbff)",
                borderRadius: 14,
                border: "1.5px solid var(--brand-accent-300, #7dd3fc)",
                padding: "1.15rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.85rem",
                boxShadow: "0 4px 12px rgba(0, 75, 135, 0.08)",
              }}
            >
              {/* Category Icon */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: previewTheme.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
              >
                {previewTheme.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    marginBottom: "0.25rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "0.15rem 0.45rem",
                      borderRadius: 6,
                      background: previewTheme.badgeBg,
                      color: previewTheme.color,
                      letterSpacing: "0.03em",
                    }}
                  >
                    {previewTheme.label}
                  </span>

                  <span style={{ fontSize: "0.75rem", color: "var(--na-gray-400)" }}>Just now</span>

                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--brand-blue-600, #004b87)",
                      display: "inline-block",
                    }}
                    title="Unread"
                  />
                </div>

                <h3
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 800,
                    color: "var(--na-gray-900, #0f172a)",
                    margin: "0 0 0.35rem 0",
                    lineHeight: 1.35,
                  }}
                >
                  {title || "📚 New Material & Lessons Added: Course Update"}
                </h3>

                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--na-gray-600, #475569)",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {message ||
                    "Fresh interactive modules and coding exercises have just been published for this course. Explore the new content at your own pace!"}
                </p>

                <div style={{ marginTop: "0.6rem" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--brand-blue-600, #004b87)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <span>Open &amp; Review</span>
                    <span>&rarr;</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick summary specs */}
            <div
              style={{
                marginTop: "1.25rem",
                paddingTop: "1rem",
                borderTop: "1px solid #f1f5f9",
                fontSize: "0.75rem",
                color: "#64748b",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
              }}
            >
              <div>
                <strong>Audience:</strong> {selectedAudience}
              </div>
              <div>
                <strong>Target:</strong> {currentCourse ? currentCourse.title : "All Courses"}
              </div>
              <div>
                <strong>Estimated Reach:</strong> {estimatedRecipientCount}
              </div>
              <div>
                <strong>Role Sender:</strong> {currentUserRole}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BROADCAST HISTORY & RECENT LOGS ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid var(--na-gray-200, #e2e8f0)",
          padding: "2rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--na-gray-900, #0f172a)", margin: "0 0 0.25rem" }}>
              Broadcast History &amp; Dispatched Reminders ({broadcasts.length})
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--na-gray-500, #64748b)", margin: 0 }}>
              Audit trail of updates and alerts dispatched across student feeds.
            </p>
          </div>
        </div>

        {broadcasts.length === 0 ? (
          <div
            style={{
              padding: "3rem 1rem",
              textAlign: "center",
              background: "#f8fafc",
              borderRadius: 12,
              border: "1px dashed #cbd5e1",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--brand-blue-subtle, #f0f6ff)",
                color: "var(--brand-blue-600, #004b87)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "0.75rem",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: "0.25rem" }}>No Reminders Sent Yet</div>
            <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>
              Use the studio above to send your first course update or learning reminder.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>Date &amp; Time</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>Title &amp; Type</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>Audience Scope</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>Target Course</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700, textAlign: "right" }}>Recipients</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700, textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {broadcasts.map((log) => {
                  const courseMatch = courses.find((c) => c.id === log.courseId);
                  const courseTitle = courseMatch ? courseMatch.title : "All Courses";
                  const dateStr = new Date(log.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "0.85rem 1rem", color: "#475569", whiteSpace: "nowrap" }}>
                        {dateStr}
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "0.15rem" }}>
                          {log.title}
                        </div>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            padding: "0.1rem 0.4rem",
                            borderRadius: 4,
                            background: "var(--brand-blue-subtle, #f0f6ff)",
                            color: "var(--brand-blue-700, #004074)",
                          }}
                        >
                          {log.type}
                        </span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.2rem 0.5rem",
                            borderRadius: 6,
                            background: "#f1f5f9",
                            fontWeight: 600,
                            color: "#334155",
                          }}
                        >
                          {log.audience}
                        </span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", color: "#334155", fontWeight: 600 }}>
                        {courseTitle}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right", fontWeight: 800, color: "var(--brand-blue-600, #004b87)" }}>
                        {log.recipientCount}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => handleReuseLog(log)}
                          title="Reuse this reminder"
                          style={{
                            background: "transparent",
                            border: "1px solid var(--brand-accent-200, #bae6fd)",
                            color: "var(--brand-blue-600, #004b87)",
                            borderRadius: 6,
                            padding: "0.3rem 0.65rem",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Duplicate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
