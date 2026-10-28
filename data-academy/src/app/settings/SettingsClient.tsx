"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface SerializedCourse {
  id: string;
  title: string;
  slug: string;
  level: string;
  estimatedHours: number;
  categoryName: string;
}

interface SerializedEnrollment {
  id: string;
  courseId: string;
  status: string;
  progress: number;
  lastAccessed: string | null;
  enrolledAt: string | null;
  completedAt: string | null;
  course: SerializedCourse;
}

interface UserProfileData {
  id?: string;
  userId?: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  bio?: string | null;
  country?: string | null;
  timezone?: string | null;
  website?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
}

interface SettingsClientProps {
  initialUser: {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
  };
  initialProfile: UserProfileData | null;
  enrollments: SerializedEnrollment[];
  stats: {
    completedCourses: number;
    activeCourses: number;
    totalEnrolled: number;
    totalHours: number;
  };
}

type TabKey = "profile" | "discounts" | "history";

export default function SettingsClient({
  initialUser,
  initialProfile,
  enrollments,
  stats,
}: SettingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Tab Management (Transcripts disabled for all students)
  const initialTabParam = searchParams.get("tab") as TabKey | null;
  const validTabs: TabKey[] = ["profile", "discounts", "history"];
  const [activeTab, setActiveTab] = useState<TabKey>(
    initialTabParam && validTabs.includes(initialTabParam) ? initialTabParam : "profile"
  );

  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabKey | null;
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    router.replace(`/settings?${params.toString()}`, { scroll: false });
  };

  // Profile Form State
  const [firstName, setFirstName] = useState(
    initialProfile?.firstName || initialUser.name.split(" ")[0] || "Learner"
  );
  const [lastName, setLastName] = useState(
    initialProfile?.lastName || initialUser.name.split(" ").slice(1).join(" ") || ""
  );
  const [language, setLanguage] = useState("English (English)");
  const [country, setCountry] = useState(initialProfile?.country || "Nigeria");
  const [stateProvince, setStateProvince] = useState("Lagos");
  const [timezone, setTimezone] = useState(initialProfile?.timezone || "Africa/Lagos (WAT, UTC+1)");
  const [bio, setBio] = useState(initialProfile?.bio || "");
  const [linkedin, setLinkedin] = useState(initialProfile?.linkedin || "");
  const [website, setWebsite] = useState(initialProfile?.website || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialProfile?.avatar || null);

  // Status & Feedback State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Discount voucher copy feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Learning history filter
  const [historyFilter, setHistoryFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  // Dynamic Profile Completion Calculation
  const calculateCompletionRate = () => {
    let score = 0;
    const totalWeights = 7;
    if (firstName.trim()) score++;
    if (lastName.trim()) score++;
    if (country.trim()) score++;
    if (timezone.trim()) score++;
    if (bio.trim()) score++;
    if (avatarUrl) score++;
    if (linkedin.trim() || website.trim()) score++;
    return Math.round((score / totalWeights) * 100);
  };
  const completionRate = calculateCompletionRate();

  // Full display name
  const displayName = `${firstName} ${lastName}`.trim() || initialUser.name || "Learner";

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          avatar: avatarUrl,
          bio,
          country,
          timezone,
          website,
          linkedin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred while saving.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Avatar File Upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setAvatarError(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload avatar.");
      }

      setAvatarUrl(data.avatarUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setAvatarError(message);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const filteredEnrollments = enrollments.filter((e) => {
    if (historyFilter === "ACTIVE") return e.status === "ACTIVE";
    if (historyFilter === "COMPLETED") return e.status === "COMPLETED";
    return true;
  });

  return (
    <div style={{ paddingBottom: "4rem" }}>
      {/* ── TOP HERO BANNER (Matches Cisco NetAcad Design) ── */}
      <section
        style={{
          position: "relative",
          background: "linear-gradient(135deg, #051a30 0%, #082645 45%, #053b5e 100%)",
          color: "#ffffff",
          padding: "2.5rem 2rem 2.75rem",
          overflow: "hidden",
          borderBottom: "1px solid rgba(56, 189, 248, 0.25)",
        }}
      >
        {/* Decorative Wave Lines (AI Tech Hub cyan/blue accents) */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: 0.85,
          }}
          viewBox="0 0 1200 220"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 350,180 C 550,140 700,40 1200,90"
            stroke="rgba(56, 189, 248, 0.45)"
            strokeWidth="1.5"
          />
          <path
            d="M 380,195 C 600,165 740,60 1200,110"
            stroke="rgba(0, 136, 204, 0.35)"
            strokeWidth="1.2"
          />
          <path
            d="M 420,210 C 650,190 790,80 1200,130"
            stroke="rgba(0, 111, 168, 0.25)"
            strokeWidth="1.2"
          />
          <path
            d="M 300,160 C 500,110 680,20 1200,70"
            stroke="rgba(186, 230, 253, 0.2)"
            strokeWidth="1"
          />
        </svg>

        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "2rem",
          }}
        >
          {/* Left: Avatar & Welcome Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.75rem" }}>
            {/* Avatar with Camera Overlay */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: "50%",
                  border: "4px solid #ffffff",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
                  background: "#e2e8f0",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={104}
                    height={104}
                    unoptimized
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="54"
                      height="54"
                      viewBox="0 0 24 24"
                      fill="#ffffff"
                      opacity={0.9}
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarFileChange}
                style={{ display: "none" }}
              />

              {/* Camera Button at Bottom Right (Brand Blue) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                title="Change Profile Picture"
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--brand-blue-600, #004b87)",
                  border: "2.5px solid #ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: isUploadingAvatar ? "wait" : "pointer",
                  color: "#ffffff",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
                  transition: "transform 0.15s ease, background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.08)";
                  e.currentTarget.style.background = "var(--brand-blue-750, #003d73)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.background = "var(--brand-blue-600, #004b87)";
                }}
              >
                {isUploadingAvatar ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="animate-spin"
                  >
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                ) : (
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                )}
              </button>
            </div>

            {/* Learner Greeting */}
            <div>
              <div
                style={{
                  fontSize: "0.9375rem",
                  color: "rgba(255, 255, 255, 0.8)",
                  fontWeight: 400,
                  marginBottom: "0.15rem",
                }}
              >
                Welcome,
              </div>
              <h1
                style={{
                  fontSize: "1.875rem",
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: "-0.02em",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {displayName}
              </h1>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginTop: "0.35rem",
                  fontSize: "0.8125rem",
                  color: "rgba(255, 255, 255, 0.75)",
                  fontWeight: 500,
                }}
              >
                <span>Learner</span>
                <span style={{ opacity: 0.6 }}>•</span>
                <span>AI Tech Hub Data Academy</span>
              </div>
            </div>
          </div>

          {/* Right Side Stats (NO Badges, NO Certificates!) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2.5rem",
              background: "rgba(255, 255, 255, 0.04)",
              backdropFilter: "blur(8px)",
              padding: "0.875rem 1.75rem",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Stat 1: Courses Completed */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "8px",
                  background: "rgba(56, 189, 248, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#38bdf8",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "1.375rem", fontWeight: 700, lineHeight: 1 }}>
                  {stats.completedCourses}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "rgba(255, 255, 255, 0.7)",
                    marginTop: "0.2rem",
                    fontWeight: 500,
                  }}
                >
                  Courses Completed
                </div>
              </div>
            </div>

            {/* Vertical Separator */}
            <div
              style={{
                width: 1,
                height: 36,
                background: "rgba(255, 255, 255, 0.18)",
              }}
            />

            {/* Stat 2: Hours / Active Courses */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "8px",
                  background: "rgba(0, 196, 159, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#00C49F",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "1.375rem", fontWeight: 700, lineHeight: 1 }}>
                  {stats.totalHours > 0 ? `${stats.totalHours} hrs` : `${stats.activeCourses}`}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "rgba(255, 255, 255, 0.7)",
                    marginTop: "0.2rem",
                    fontWeight: 500,
                  }}
                >
                  {stats.totalHours > 0 ? "Hours Learned" : "Active Courses"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HORIZONTAL NAVIGATION TABS (Strictly Omit Badges & Certificates) ── */}
      <div
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          position: "sticky",
          top: "calc(var(--topbar-height) + var(--announce-height))",
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            padding: "0 2rem",
            display: "flex",
            alignItems: "center",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {/* TAB 1: Profile */}
          <button
            type="button"
            onClick={() => handleTabChange("profile")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "1rem 1.5rem",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "profile" ? "3px solid var(--brand-blue-600, #004b87)" : "3px solid transparent",
              color: activeTab === "profile" ? "var(--brand-blue-600, #004b87)" : "#64748b",
              fontWeight: activeTab === "profile" ? 700 : 500,
              fontSize: "0.9375rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            {/* Profile Icon */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={activeTab === "profile" ? "var(--brand-blue-600, #004b87)" : "#64748b"}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Profile</span>
          </button>

          {/* Divider */}
          <span style={{ width: 1, height: 22, background: "#e2e8f0" }} />

          {/* TAB 2: Discounts */}
          <button
            type="button"
            onClick={() => handleTabChange("discounts")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "1rem 1.5rem",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "discounts" ? "3px solid var(--brand-blue-600, #004b87)" : "3px solid transparent",
              color: activeTab === "discounts" ? "var(--brand-blue-600, #004b87)" : "#64748b",
              fontWeight: activeTab === "discounts" ? 700 : 500,
              fontSize: "0.9375rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            {/* Discounts Icon */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={activeTab === "discounts" ? "var(--brand-blue-600, #004b87)" : "#64748b"}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            <span>Discounts</span>
          </button>

          {/* Divider */}
          <span style={{ width: 1, height: 22, background: "#e2e8f0" }} />

          {/* TAB 3: Learning History */}
          <button
            type="button"
            onClick={() => handleTabChange("history")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "1rem 1.5rem",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "history" ? "3px solid var(--brand-blue-600, #004b87)" : "3px solid transparent",
              color: activeTab === "history" ? "var(--brand-blue-600, #004b87)" : "#64748b",
              fontWeight: activeTab === "history" ? 700 : 500,
              fontSize: "0.9375rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
          >
            {/* Learning History Icon */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={activeTab === "history" ? "var(--brand-blue-600, #004b87)" : "#64748b"}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M12 7v5l4 2" />
            </svg>
            <span>Learning History</span>
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div style={{ maxWidth: 1240, margin: "2rem auto 0", padding: "0 2rem" }}>
        {/* Error Feedback if avatar upload failed */}
        {avatarError && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "0.875rem 1.25rem",
              borderRadius: "8px",
              background: "#fee2e2",
              border: "1px solid #f87171",
              color: "#991b1b",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{avatarError}</span>
            <button
              type="button"
              onClick={() => setAvatarError(null)}
              style={{ background: "none", border: "none", color: "#991b1b", cursor: "pointer", fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: PROFILE
           ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            {/* Completion Banner (AI Tech Hub brand styling) */}
            <div
              style={{
                borderRadius: "12px",
                border: "1.5px solid var(--brand-accent-200, #bae6fd)",
                background: "var(--brand-blue-subtle, #f0f6ff)",
                padding: "1.25rem 1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1.25rem",
              }}
            >
              {/* Circular Progress Indicator */}
              <div
                style={{
                  position: "relative",
                  width: 52,
                  height: 52,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="52" height="52" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="3.2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--brand-blue-600, #004b87)"
                    strokeWidth="3.2"
                    strokeDasharray={`${completionRate}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span
                  style={{
                    position: "absolute",
                    fontSize: "0.8125rem",
                    fontWeight: 800,
                    color: "var(--brand-blue-700, #004074)",
                  }}
                >
                  {completionRate}%
                </span>
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    color: "var(--brand-navy-900, #002244)",
                    lineHeight: 1.3,
                  }}
                >
                  Help us improve learning for everyone
                </h2>
                <p
                  style={{
                    margin: "0.25rem 0 0",
                    fontSize: "0.8125rem",
                    color: "#475569",
                    lineHeight: 1.45,
                  }}
                >
                  Have a minute? Add to your profile to help us understand what learners need and who we&apos;re
                  reaching. Your input helps us improve our courses and expand access to more people.
                </p>
              </div>
            </div>

            {/* Basic Information Card */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                padding: "2rem",
              }}
            >
              <h3
                style={{
                  margin: "0 0 1.5rem",
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Basic Information
              </h3>

              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Row 1: First Name, Last Name, Default Language */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "1.25rem",
                  }}
                >
                  <div>
                    <label
                      htmlFor="firstName"
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "#334155",
                        marginBottom: "0.375rem",
                      }}
                    >
                      First Name<span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Excel"
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.875rem",
                        color: "#0f172a",
                        outline: "none",
                        transition: "border-color 0.15s ease",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand-blue-600, #004b87)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "#334155",
                        marginBottom: "0.375rem",
                      }}
                    >
                      Last Name<span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Akar"
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.875rem",
                        color: "#0f172a",
                        outline: "none",
                        transition: "border-color 0.15s ease",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--brand-blue-600, #004b87)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="language"
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "#334155",
                        marginBottom: "0.375rem",
                      }}
                    >
                      Default Language
                    </label>
                    <select
                      id="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.875rem",
                        color: "#0f172a",
                        outline: "none",
                        background: "#ffffff",
                      }}
                    >
                      <option value="English (English)">English (English)</option>
                      <option value="French (Français)">French (Français)</option>
                      <option value="Spanish (Español)">Spanish (Español)</option>
                      <option value="German (Deutsch)">German (Deutsch)</option>
                      <option value="Arabic (العربية)">Arabic (العربية)</option>
                      <option value="Portuguese (Português)">Portuguese (Português)</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Country or Region, State / Province, Timezone */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "1.25rem",
                  }}
                >
                  <div>
                    <label
                      htmlFor="country"
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "#334155",
                        marginBottom: "0.375rem",
                      }}
                    >
                      Country or Region<span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.875rem",
                        color: "#0f172a",
                        outline: "none",
                        background: "#ffffff",
                      }}
                    >
                      <option value="Nigeria">Nigeria</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Ghana">Ghana</option>
                      <option value="Kenya">Kenya</option>
                      <option value="South Africa">South Africa</option>
                      <option value="Germany">Germany</option>
                      <option value="India">India</option>
                      <option value="Australia">Australia</option>
                      <option value="United Arab Emirates">United Arab Emirates</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="stateProvince"
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "#334155",
                        marginBottom: "0.375rem",
                      }}
                    >
                      State / Province
                    </label>
                    <input
                      id="stateProvince"
                      type="text"
                      value={stateProvince}
                      onChange={(e) => setStateProvince(e.target.value)}
                      placeholder="e.g. Lagos, Abuja, California"
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.875rem",
                        color: "#0f172a",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="timezone"
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "#334155",
                        marginBottom: "0.375rem",
                      }}
                    >
                      Timezone
                    </label>
                    <select
                      id="timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.875rem",
                        color: "#0f172a",
                        outline: "none",
                        background: "#ffffff",
                      }}
                    >
                      <option value="Africa/Lagos (WAT, UTC+1)">Africa/Lagos (WAT, UTC+1)</option>
                      <option value="Europe/London (GMT, UTC+0)">Europe/London (GMT, UTC+0)</option>
                      <option value="America/New_York (EST, UTC-5)">America/New_York (EST, UTC-5)</option>
                      <option value="America/Los_Angeles (PST, UTC-8)">America/Los_Angeles (PST, UTC-8)</option>
                      <option value="Asia/Dubai (GST, UTC+4)">Asia/Dubai (GST, UTC+4)</option>
                      <option value="Asia/Kolkata (IST, UTC+5:30)">Asia/Kolkata (IST, UTC+5:30)</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Email Address (Read-only), LinkedIn, Website */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "1.25rem",
                  }}
                >
                  <div>
                    <label
                      htmlFor="email"
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "#334155",
                        marginBottom: "0.375rem",
                      }}
                    >
                      Email Address (Verified)
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="email"
                        type="email"
                        readOnly
                        disabled
                        value={initialUser.email}
                        style={{
                          width: "100%",
                          padding: "0.625rem 0.875rem",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          fontSize: "0.875rem",
                          color: "#64748b",
                          background: "#f8fafc",
                          cursor: "not-allowed",
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#059669",
                          background: "#ecfdf5",
                          padding: "2px 8px",
                          borderRadius: "999px",
                        }}
                      >
                        ✓ Verified
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="linkedin"
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "#334155",
                        marginBottom: "0.375rem",
                      }}
                    >
                      LinkedIn Profile URL
                    </label>
                    <input
                      id="linkedin"
                      type="url"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.875rem",
                        color: "#0f172a",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="website"
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "#334155",
                        marginBottom: "0.375rem",
                      }}
                    >
                      Portfolio / GitHub
                    </label>
                    <input
                      id="website"
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://github.com/username"
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.875rem",
                        color: "#0f172a",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Row 4: Bio / Career Headline */}
                <div>
                  <label
                    htmlFor="bio"
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "0.375rem",
                    }}
                  >
                    Professional Bio &amp; Goals
                  </label>
                  <textarea
                    id="bio"
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about your learning goals, current role, or target career path in Data Analytics, Engineering, or AI..."
                    style={{
                      width: "100%",
                      padding: "0.625rem 0.875rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.875rem",
                      color: "#0f172a",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </div>

                {/* Feedback Alerts */}
                {saveSuccess && (
                  <div
                    style={{
                      padding: "0.75rem 1rem",
                      borderRadius: "8px",
                      background: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      color: "#065f46",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span>✓</span>
                    <span>Your profile has been saved successfully!</span>
                  </div>
                )}

                {saveError && (
                  <div
                    style={{
                      padding: "0.75rem 1rem",
                      borderRadius: "8px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                      fontSize: "0.875rem",
                    }}
                  >
                    {saveError}
                  </div>
                )}

                {/* Submit Button */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button
                    type="submit"
                    disabled={isSaving}
                    style={{
                      background: "linear-gradient(135deg, var(--brand-blue-600, #004b87) 0%, var(--brand-accent-500, #006fa8) 100%)",
                      color: "#ffffff",
                      border: "none",
                      padding: "0.75rem 1.75rem",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      cursor: isSaving ? "wait" : "pointer",
                      boxShadow: "0 2px 6px rgba(0, 75, 135, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSaving) e.currentTarget.style.background = "linear-gradient(135deg, var(--brand-blue-700, #004074) 0%, var(--brand-blue-600, #004b87) 100%)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSaving) e.currentTarget.style.background = "linear-gradient(135deg, var(--brand-blue-600, #004b87) 0%, var(--brand-accent-500, #006fa8) 100%)";
                    }}
                  >
                    {isSaving && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="animate-spin"
                      >
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                    )}
                    <span>{isSaving ? "Saving Changes..." : "Save Changes"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Account Preferences & Security Card */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                padding: "2rem",
              }}
            >
              <h3
                style={{
                  margin: "0 0 0.5rem",
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Account &amp; Security
              </h3>
              <p style={{ margin: "0 0 1.5rem", fontSize: "0.8125rem", color: "#64748b" }}>
                Manage login security, credentials, and notification delivery.
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem 1.25rem",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}>
                    Account Password
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
                    Ensure your account is using a strong, unique password.
                  </div>
                </div>

                <Link
                  href="/reset-password"
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#0f172a",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Change Password
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: DISCOUNTS (Partner Vouchers & Academic Perks)
           ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "discounts" && (
          <div>
            <div style={{ marginBottom: "1.75rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.35rem" }}>
                Academic Discounts &amp; Partner Vouchers
              </h2>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
                Exclusive educational perks, cloud compute credits, and professional data platform vouchers
                sponsored for enrolled learners.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {[
                {
                  id: "aws",
                  title: "AWS Cloud Educate Credits",
                  provider: "Amazon Web Services",
                  discount: "$100 Free Cloud Credits",
                  description:
                    "Promotional credits for hands-on practice with AWS S3, Athena, EMR Spark, and Redshift Data Warehouses.",
                  code: "AITECH-AWS-100CREDIT",
                  category: "Cloud Computing",
                  validUntil: "Valid through 2026 Academic Year",
                  color: "#ea580c",
                  link: "https://aws.amazon.com/education/awseducate/",
                },
                {
                  id: "databricks",
                  title: "Databricks Academy Partner Voucher",
                  provider: "Databricks Inc.",
                  discount: "100% Free Access",
                  description:
                    "Access free Lakehouse compute sessions, Delta Lake tutorials, and community cloud spark execution.",
                  code: "DATABRICKS-AI-ACADEMY",
                  category: "Big Data & Spark",
                  validUntil: "Active • Cohort Perk",
                  color: "#dc2626",
                  link: "https://community.cloud.databricks.com/",
                },
                {
                  id: "datacamp",
                  title: "Data Practice Partner Discount",
                  provider: "Data Practice Network",
                  discount: "50% Off Annual Membership",
                  description:
                    "Deepen your Python, SQL, and data visualization exercises with 50% discount on supplementary platforms.",
                  code: "AITECH-50-DATAPRO",
                  category: "Skill Practice",
                  validUntil: "Active Verified Student",
                  color: "#059669",
                  link: "#",
                },
                {
                  id: "alumni",
                  title: "AI Tech Hub Pro Continuation",
                  provider: "AI Tech Hub Academy",
                  discount: "30% Alumni Scholarship",
                  description:
                    "Apply 30% reduction towards advanced Masterclasses, 1-on-1 career coaching, and executive capstones.",
                  code: "AITECH-ALUMNI-30",
                  category: "Academy Perk",
                  validUntil: "Perpetual Learner Benefit",
                  color: "#0284c7",
                  link: "/courses",
                },
              ].map((voucher) => (
                <div
                  key={voucher.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: voucher.color,
                    }}
                  />

                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: voucher.color,
                          background: `${voucher.color}15`,
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        {voucher.category}
                      </span>
                      <span style={{ fontSize: "0.6875rem", color: "#64748b", fontWeight: 500 }}>
                        {voucher.validUntil}
                      </span>
                    </div>

                    <h4
                      style={{
                        margin: "0 0 0.25rem",
                        fontSize: "1.125rem",
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      {voucher.title}
                    </h4>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: voucher.color, marginBottom: "0.75rem" }}>
                      {voucher.discount}
                    </div>

                    <p style={{ margin: "0 0 1.25rem", fontSize: "0.8125rem", color: "#475569", lineHeight: 1.45 }}>
                      {voucher.description}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px dashed #cbd5e1",
                      borderRadius: "8px",
                      padding: "0.75rem 1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.6875rem", color: "#64748b", textTransform: "uppercase" }}>
                        Promo Voucher Code
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a" }}>
                        {voucher.code}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(voucher.code)}
                      style={{
                        padding: "0.4rem 0.85rem",
                        borderRadius: "6px",
                        background: copiedCode === voucher.code ? "#059669" : "#0f172a",
                        color: "#ffffff",
                        border: "none",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {copiedCode === voucher.code ? "✓ Copied" : "Copy Code"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 3: LEARNING HISTORY
           ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "history" && (
          <div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                marginBottom: "1.75rem",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.35rem" }}>
                  Learning History
                </h2>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
                  Chronological record of your course enrollments, current progress, and completion dates.
                </p>
              </div>

              {/* Filter Pills */}
              <div
                style={{
                  display: "flex",
                  background: "#f1f5f9",
                  padding: "3px",
                  borderRadius: "8px",
                  gap: "2px",
                }}
              >
                {[
                  { label: "All Courses", value: "ALL" },
                  { label: "In Progress", value: "ACTIVE" },
                  { label: "Completed", value: "COMPLETED" },
                ].map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setHistoryFilter(f.value as "ALL" | "ACTIVE" | "COMPLETED")}
                    style={{
                      padding: "0.45rem 0.95rem",
                      borderRadius: "6px",
                      border: "none",
                      background: historyFilter === f.value ? "#ffffff" : "transparent",
                      color: historyFilter === f.value ? "#0f172a" : "#64748b",
                      fontSize: "0.8125rem",
                      fontWeight: historyFilter === f.value ? 700 : 500,
                      cursor: "pointer",
                      boxShadow: historyFilter === f.value ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredEnrollments.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  border: "1px dashed #cbd5e1",
                  padding: "3.5rem 2rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📚</div>
                <h4 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem", color: "#0f172a" }}>
                  No courses found under this filter
                </h4>
                <p style={{ margin: "0 0 1.25rem", color: "#64748b", fontSize: "0.875rem" }}>
                  Browse our extensive curriculum to kickstart your journey.
                </p>
                <Link
                  href="/courses"
                  style={{
                    display: "inline-block",
                    padding: "0.625rem 1.25rem",
                    borderRadius: "8px",
                    background: "var(--brand-blue-600, #004b87)",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    textDecoration: "none",
                    boxShadow: "0 2px 6px rgba(0, 75, 135, 0.25)",
                  }}
                >
                  Explore Course Catalog
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {filteredEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    style={{
                      background: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      padding: "1.25rem 1.75rem",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1.5rem",
                    }}
                  >
                    {/* Course Info */}
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: "0.35rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: "#e0f2fe",
                            color: "#0369a1",
                            textTransform: "uppercase",
                          }}
                        >
                          {enrollment.course.categoryName}
                        </span>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                          • {enrollment.course.level} • {enrollment.course.estimatedHours} hrs
                        </span>
                      </div>

                      <h4
                        style={{
                          margin: "0 0 0.5rem",
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {enrollment.course.title}
                      </h4>

                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        Enrolled:{" "}
                        {enrollment.enrolledAt
                          ? new Date(enrollment.enrolledAt).toLocaleDateString()
                          : "N/A"}{" "}
                        {enrollment.completedAt && (
                          <span style={{ color: "#059669", fontWeight: 600 }}>
                            • Completed: {new Date(enrollment.completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & Status */}
                    <div style={{ minWidth: 200 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          marginBottom: "0.35rem",
                          color: "#334155",
                        }}
                      >
                        <span>Progress</span>
                        <span>{Math.round(enrollment.progress)}%</span>
                      </div>

                      <div
                        style={{
                          height: 8,
                          background: "#e2e8f0",
                          borderRadius: "999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, Math.round(enrollment.progress))}%`,
                            height: "100%",
                            background:
                              enrollment.status === "COMPLETED"
                                ? "var(--brand-blue-600, #004b87)"
                                : "linear-gradient(90deg, #004b87, #0088cc)",
                            borderRadius: "999px",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>

                      <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background:
                              enrollment.status === "COMPLETED"
                                ? "var(--brand-blue-600, #004b87)"
                                : "var(--brand-accent-400, #0088cc)",
                          }}
                        />
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>
                          {enrollment.status === "COMPLETED" ? "Course Completed" : "In Progress"}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      <Link
                        href={`/learn/${enrollment.course.slug}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.625rem 1.25rem",
                          borderRadius: "8px",
                          background:
                            enrollment.status === "COMPLETED" ? "#f1f5f9" : "var(--brand-blue-600, #004b87)",
                          color: enrollment.status === "COMPLETED" ? "#0f172a" : "#ffffff",
                          fontSize: "0.8125rem",
                          fontWeight: 700,
                          textDecoration: "none",
                          border: enrollment.status === "COMPLETED" ? "1px solid #cbd5e1" : "none",
                        }}
                      >
                        <span>{enrollment.status === "COMPLETED" ? "Review Course" : "Continue"}</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
