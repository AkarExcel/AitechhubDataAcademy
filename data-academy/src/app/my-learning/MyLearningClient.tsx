"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CourseData {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  coverImage?: string | null;
  level: string;
  estimatedHours: number;
  categoryName: string;
  categoryId?: string | null;
}

interface EnrollmentData {
  id: string;
  courseId: string;
  status: string;
  progress: number;
  enrolledAt: string | null;
  completedAt: string | null;
  lastAccessed: string | null;
  course: CourseData;
}

interface CertificateData {
  id: string;
  certificateCode: string;
  issueDate: string;
  courseTitle: string;
  courseSlug: string;
}

interface CategoryData {
  id: string;
  name: string;
  slug: string;
}

interface MyLearningClientProps {
  enrollments: EnrollmentData[];
  certificates: CertificateData[];
  categories: CategoryData[];
  availableCourses: CourseData[];
  userName: string;
}

export default function MyLearningClient({
  enrollments,
  certificates,
  categories,
  availableCourses,
}: MyLearningClientProps) {
  const router = useRouter();

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAcademy, setSelectedAcademy] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Active menu dropdown for course cards
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Display student's real enrolled courses directly from database
  const displayEnrollments: EnrollmentData[] = enrollments;

  // Filtered courses based on search & dropdowns
  const filteredCourses = useMemo(() => {
    return displayEnrollments.filter((item) => {
      const matchesSearch =
        item.course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.course.shortDescription &&
          item.course.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.course.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAcademy =
        selectedAcademy === "All" ||
        item.course.categoryName.toLowerCase() === selectedAcademy.toLowerCase();

      const matchesType =
        selectedType === "All" ||
        (selectedType === "In-Progress" && item.status === "ACTIVE") ||
        (selectedType === "Completed" && item.status === "COMPLETED");

      return matchesSearch && matchesAcademy && matchesType;
    });
  }, [displayEnrollments, searchQuery, selectedAcademy, selectedType]);

  // Close kebab menu on outside click
  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      onClick={() => setActiveMenuId(null)}
      style={{
        maxWidth: 1360,
        margin: "0 auto",
        padding: "2rem 2.5rem 4rem",
        color: "#1e293b",
        fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      }}
    >
      {/* ── TOP PAGE TITLE (Matching Screenshot: 📖 My Learning) ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.875rem",
          marginBottom: "1.75rem",
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#475569"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>

        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 400,
            color: "#334155",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          My Learning
        </h1>
      </div>

      {/* ── MAIN 2-COLUMN LAYOUT (Left: In-Progress Courses | Right: Achievements & Assignments) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "2.5rem",
          alignItems: "start",
        }}
        className="my-learning-grid"
      >
        {/* ════════════════════════════════════════════════════════════════════
            LEFT COLUMN: IN-PROGRESS COURSES
           ════════════════════════════════════════════════════════════════════ */}
        <div>
          {/* Subheading */}
          <h2
            style={{
              fontSize: "1.0625rem",
              fontWeight: 700,
              color: "#0f172a",
              margin: "0 0 1rem 0",
            }}
          >
            In-Progress
          </h2>

          {/* ── FILTER & SEARCH TOOLBAR (Exact replica from screenshot) ── */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            {/* Search Input Box */}
            <div
              style={{
                position: "relative",
                width: 260,
                maxWidth: "100%",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search course, training"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem 0.5rem 2.1rem",
                  fontSize: "0.8125rem",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#1e293b",
                  outline: "none",
                }}
              />
            </div>

            {/* Right Controls: Academy, Type, and View Switchers */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginLeft: "auto",
                flexWrap: "wrap",
              }}
            >
              {/* Academy Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8125rem" }}>
                <span style={{ color: "#64748b", fontWeight: 500 }}>Academy</span>
                <select
                  value={selectedAcademy}
                  onChange={(e) => setSelectedAcademy(e.target.value)}
                  style={{
                    padding: "0.45rem 1.75rem 0.45rem 0.75rem",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "0.8125rem",
                    color: "#0f172a",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="All">All</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Networking">Networking</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Data Science">Data Science</option>
                  <option value="SQL & Databases">SQL &amp; Databases</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8125rem" }}>
                <span style={{ color: "#64748b", fontWeight: 500 }}>Type</span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  style={{
                    padding: "0.45rem 1.75rem 0.45rem 0.75rem",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "0.8125rem",
                    color: "#0f172a",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="All">All</option>
                  <option value="In-Progress">In-Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* View Toggles (Grid / List) */}
              <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                {/* Grid Button */}
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px",
                    border: viewMode === "grid" ? "none" : "1px solid #cbd5e1",
                    background: viewMode === "grid" ? "var(--brand-blue-600, #004b87)" : "#ffffff",
                    color: viewMode === "grid" ? "#ffffff" : "#64748b",
                    cursor: "pointer",
                    boxShadow: viewMode === "grid" ? "0 2px 6px rgba(0, 75, 135, 0.25)" : "none",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </button>

                {/* List Button */}
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  title="List View"
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px",
                    border: viewMode === "list" ? "none" : "1px solid #cbd5e1",
                    background: viewMode === "list" ? "var(--brand-blue-600, #004b87)" : "#ffffff",
                    color: viewMode === "list" ? "#ffffff" : "#64748b",
                    cursor: "pointer",
                    boxShadow: viewMode === "list" ? "0 2px 6px rgba(0, 75, 135, 0.25)" : "none",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* ── COURSE CARDS LIST / GRID ── */}
          {filteredCourses.length === 0 ? (
            <div
              style={{
                background: "#f8fafc",
                borderRadius: "10px",
                border: "1px dashed #cbd5e1",
                padding: "3.5rem 2rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>
                {enrollments.length === 0 ? "🎓" : "🔍"}
              </div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem", color: "#0f172a", fontWeight: 700 }}>
                {enrollments.length === 0
                  ? "You have not enrolled in any courses yet"
                  : "No matching courses found"}
              </h3>
              <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "#64748b", maxWidth: 460, marginInline: "auto" }}>
                {enrollments.length === 0
                  ? "Explore the AI Tech Hub catalog and start mastering in-demand data science, AI, and analytics skills today."
                  : "Try adjusting your search criteria or clear your filters to view all your enrolled courses."}
              </p>
              <Link
                href="/courses"
                style={{
                  display: "inline-block",
                  padding: "0.625rem 1.35rem",
                  borderRadius: "6px",
                  background: "var(--brand-blue-600, #004b87)",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 2px 6px rgba(0, 75, 135, 0.25)",
                }}
              >
                Browse Course Catalog &rarr;
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  viewMode === "grid"
                    ? "repeat(auto-fill, minmax(250px, 1fr))"
                    : "1fr",
                gap: "1.25rem",
              }}
            >
              {filteredCourses.map((item) => {
                const course = item.course;
                const cover =
                  course.coverImage ||
                  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80";

                return (
                  <div
                    key={item.id}
                    style={{
                      background: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      overflow: "hidden",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                      display: "flex",
                      flexDirection: viewMode === "grid" ? "column" : "row",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.08)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.04)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {/* ── CARD THUMBNAIL WITH PLAY BUTTON & LEVEL PILL ── */}
                    <div
                      style={{
                        position: "relative",
                        width: viewMode === "grid" ? "100%" : 220,
                        height: viewMode === "grid" ? 145 : "auto",
                        minHeight: 145,
                        background: "#0f172a",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      <Image
                        src={cover}
                        alt={course.title}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 300px"
                        style={{ objectFit: "cover" }}
                      />

                      {/* Top-Left Level Badge (AI Tech Hub brand styling) */}
                      <span
                        style={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          background: "var(--brand-blue-subtle, #f0f6ff)",
                          color: "var(--brand-blue-700, #004074)",
                          border: "1px solid var(--brand-accent-200, #bae6fd)",
                          fontSize: "0.6875rem",
                          fontWeight: 800,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          zIndex: 2,
                          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        {course.level || "BEGINNER"}
                      </span>

                      {/* Center Play Circle Button (Interactive) */}
                      <Link
                        href={`/learn/${course.slug}`}
                        title="Resume Course"
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(0, 0, 0, 0.2)",
                          transition: "background 0.2s ease",
                          zIndex: 2,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0, 0, 0, 0.38)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0, 0, 0, 0.2)")}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            border: "2px solid #ffffff",
                            background: "rgba(15, 23, 42, 0.45)",
                            backdropFilter: "blur(4px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.35)",
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
                            <polygon points="6 4 20 12 6 20 6 4" />
                          </svg>
                        </div>
                      </Link>
                    </div>

                    {/* ── CARD BODY ── */}
                    <div
                      style={{
                        padding: "1rem 1.125rem",
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        {/* Provider line */}
                        <div
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "#0f172a",
                            lineHeight: 1.2,
                            marginBottom: "0.25rem",
                          }}
                        >
                          AI Tech Hub Data Academy
                        </div>

                        {/* Meta row: Course | Self-paced & Kebab Menu */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "0.75rem",
                            color: "#64748b",
                            marginBottom: "0.5rem",
                            position: "relative",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                            <span>Course | Self-paced</span>
                          </div>

                          {/* Kebab 3-dots button */}
                          <button
                            type="button"
                            onClick={(e) => toggleMenu(item.id, e)}
                            title="More options"
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--brand-blue-600, #004b87)",
                              cursor: "pointer",
                              padding: "2px 4px",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="5" r="2.2" />
                              <circle cx="12" cy="12" r="2.2" />
                              <circle cx="12" cy="19" r="2.2" />
                            </svg>
                          </button>

                          {/* Popover Menu */}
                          {activeMenuId === item.id && (
                            <div
                              style={{
                                position: "absolute",
                                right: 0,
                                top: "1.4rem",
                                background: "#ffffff",
                                borderRadius: "6px",
                                border: "1px solid #e2e8f0",
                                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.12)",
                                zIndex: 30,
                                minWidth: 160,
                                padding: "4px 0",
                              }}
                            >
                              <Link
                                href={`/learn/${course.slug}`}
                                style={{
                                  display: "block",
                                  padding: "0.5rem 1rem",
                                  fontSize: "0.8125rem",
                                  color: "#0f172a",
                                  textDecoration: "none",
                                  fontWeight: 600,
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                Resume Course
                              </Link>
                              <Link
                                href={`/courses/${course.slug}`}
                                style={{
                                  display: "block",
                                  padding: "0.5rem 1rem",
                                  fontSize: "0.8125rem",
                                  color: "#475569",
                                  textDecoration: "none",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                View Syllabus
                              </Link>
                            </div>
                          )}
                        </div>

                        {/* Course Title */}
                        <h3
                          style={{
                            margin: "0 0 0.15rem 0",
                            fontSize: "0.9375rem",
                            fontWeight: 700,
                            color: "#0f172a",
                            lineHeight: 1.3,
                          }}
                        >
                          <Link
                            href={`/learn/${course.slug}`}
                            style={{ color: "#0f172a", textDecoration: "none" }}
                          >
                            {course.title}
                          </Link>
                        </h3>

                        {/* Course Subtitle / Category */}
                        <div
                          style={{
                            fontSize: "0.8125rem",
                            color: "#64748b",
                            marginBottom: "0.5rem",
                          }}
                        >
                          {course.categoryName}
                        </div>

                        {/* Short Description */}
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#475569",
                            lineHeight: 1.45,
                            margin: "0 0 0.85rem 0",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {course.shortDescription ||
                            "Gain job-ready skills through hands-on labs, interactive notebooks, and comprehensive assessments."}
                        </p>
                      </div>

                      {/* Progress Bar & Resume Button */}
                      <div style={{ marginTop: "auto", paddingTop: "0.5rem", borderTop: "1px solid #f1f5f9" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            color: "#475569",
                            marginBottom: "0.3rem",
                          }}
                        >
                          <span>Progress</span>
                          <span>{item.progress}%</span>
                        </div>
                        <div
                          style={{
                            height: 5,
                            background: "#e2e8f0",
                            borderRadius: "999px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, item.progress)}%`,
                              height: "100%",
                              background:
                                item.progress === 100
                                  ? "var(--brand-blue-600, #004b87)"
                                  : "linear-gradient(90deg, #004b87 0%, #0088cc 100%)",
                              borderRadius: "999px",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            RIGHT COLUMN: LATEST ACHIEVEMENTS & UPCOMING ASSIGNMENTS
           ════════════════════════════════════════════════════════════════════ */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* ── SECTION 1: LATEST ACHIEVEMENTS ── */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.875rem",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Latest Achievements
              </h3>
              <Link
                href="/certificates"
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--brand-blue-600, #004b87)",
                  textDecoration: "underline",
                }}
              >
                Show all
              </Link>
            </div>

            {/* Achievement Card Item */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                padding: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              }}
            >
              {/* Circular Badge Icon with Data Analytics Graphic (Brand Colors) */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: "2px solid var(--brand-accent-200, #bae6fd)",
                  background: "var(--brand-blue-subtle, #f0f6ff)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--brand-blue-600, #004b87)",
                  flexShrink: 0,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 20V10" />
                  <path d="M12 20V4" />
                  <path d="M6 20v-6" />
                </svg>
              </div>

              {/* Achievement Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#94a3b8",
                  }}
                >
                  ACHIEVEMENTS
                </div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    marginTop: "0.1rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {certificates[0]?.courseTitle
                    ? `${certificates[0].courseTitle} Mastery`
                    : "Basics of Analytics"}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    fontSize: "0.75rem",
                    color: "#64748b",
                    marginTop: "0.2rem",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {certificates[0]?.courseTitle || "Introduction to Data Science"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 2: UPCOMING ASSIGNMENTS ── */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.875rem",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Upcoming Assignments
              </h3>
              <span
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--brand-blue-600, #004b87)",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Show all
              </span>
            </div>

            {/* Empty State Box matching screenshot with Brand Styling */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                padding: "2.75rem 1.5rem",
                textAlign: "center",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              }}
            >
              {/* Clipboard with checkboxes in brand blue tint */}
              <div
                style={{
                  width: 90,
                  height: 90,
                  margin: "0 auto 1.25rem",
                  background: "var(--brand-blue-subtle, #f0f6ff)",
                  border: "1px solid var(--brand-accent-200, #bae6fd)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--brand-blue-600, #004b87)",
                }}
              >
                <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  <path d="m9 14 2 2 4-4" />
                </svg>
              </div>

              <h4
                style={{
                  margin: "0 0 0.35rem 0",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                No Upcoming Assignments For Now
              </h4>

              <p
                style={{
                  margin: 0,
                  fontSize: "0.8125rem",
                  color: "#64748b",
                  lineHeight: 1.4,
                }}
              >
                Watch this space for upcoming assignments!
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* ── RESPONSIVE MEDIA QUERIES ── */}
      <style jsx global>{`
        @media (max-width: 992px) {
          .my-learning-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
