"use client";

import Link from "next/link";
import { getLevelColor, getLevelLabel, truncate } from "@/lib/utils";

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    coverImage?: string | null;
    level: string;
    isFree?: boolean;
    price?: number;
    estimatedHours?: number;
    category?: { name: string; slug?: string } | null;
    instructors?: Array<{
      user?: {
        profile?: {
          firstName?: string;
          lastName?: string;
        } | null;
      } | null;
    }>;
    _count?: {
      modules?: number;
      enrollments?: number;
    };
  };
}

// Fallback high-quality imagery based on title/category keywords
function getFallbackImage(title: string, categoryName?: string): string {
  const text = (title + " " + (categoryName || "")).toLowerCase();
  if (text.includes("network") || text.includes("cloud") || text.includes("cyber")) {
    return "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=700&auto=format&fit=crop&q=80";
  }
  if (text.includes("python") || text.includes("programming") || text.includes("code")) {
    return "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=700&auto=format&fit=crop&q=80";
  }
  if (text.includes("ai") || text.includes("machine learning") || text.includes("intelligence") || text.includes("prompt")) {
    return "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=700&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&auto=format&fit=crop&q=80";
}

// Determine career pathway name
function getCareerPathName(title: string, categoryName?: string): string {
  const text = (title + " " + (categoryName || "")).toLowerCase();
  if (text.includes("data science")) return "Data Scientist";
  if (text.includes("analytics") || text.includes("bi")) return "Data Analyst";
  if (text.includes("ai") || text.includes("machine learning")) return "AI Engineer";
  if (text.includes("network")) return "Network Technician";
  if (text.includes("python")) return "Python Developer";
  if (text.includes("sql") || text.includes("database")) return "Database Administrator";
  return categoryName || "Data Professional";
}

export default function CourseCard({ course }: CourseCardProps) {
  const coverUrl = course.coverImage || getFallbackImage(course.title, course.category?.name);
  const careerPath = getCareerPathName(course.title, course.category?.name);
  const isBeginner = course.level.toUpperCase() === "BEGINNER";

  return (
    <Link
      href={`/courses/${course.slug}`}
      style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}
    >
      <div
        className="card-hover"
        style={{
          background: "#ffffff",
          borderRadius: "8px",
          border: "1px solid var(--na-gray-200)",
          borderBottom: "3px solid var(--brand-accent-500)", // AI Tech Hub vibrant brand accent
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        {/* ── TOP THUMBNAIL WITH BADGE & PLAY ICON ── */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "175px",
            background: "linear-gradient(135deg, var(--na-navy-900) 0%, var(--na-blue-700) 100%)",
            overflow: "hidden",
          }}
        >
          {/* Background image */}
          <img
            src={coverUrl}
            alt={course.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />

          {/* Dark gradient overlay for contrast */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.35) 100%)",
            }}
          />

          {/* Level Badge */}
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              zIndex: 2,
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "3px 8px",
                background: isBeginner ? "var(--brand-blue-600)" : "var(--brand-accent-500)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "0.6875rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                borderRadius: "3px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }}
            >
              {course.level}
            </span>
          </div>

          {/* Center Circular Play Button Overlay */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 2,
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(0, 0, 0, 0.45)",
              border: "2px solid #ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              backdropFilter: "blur(2px)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="#ffffff"
              stroke="#ffffff"
              strokeWidth="1"
              strokeLinejoin="round"
              style={{ marginLeft: 2 }}
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>

        {/* ── CARD BODY ── */}
        <div
          style={{
            padding: "1rem 1.125rem",
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          {/* Institution / Brand header (Preserves brand blue) */}
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--na-blue-700)",
              marginBottom: "0.35rem",
              letterSpacing: "0.01em",
            }}
          >
            AitecHub <strong style={{ color: "var(--na-navy-900)" }}>Data Academy</strong>
          </div>

          {/* Course Meta Row (Book Icon | Self-paced & Kebab Menu) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.65rem",
              fontSize: "0.75rem",
              color: "var(--na-gray-500)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>Course | Self-paced</span>
            </div>

            {/* 3-dots kebab menu in green */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                padding: "2px 4px",
                cursor: "pointer",
              }}
              title="Course options"
            >
              <span style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: "var(--na-green-500)" }} />
              <span style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: "var(--na-green-500)" }} />
              <span style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: "var(--na-green-500)" }} />
            </div>
          </div>

          {/* Main Course Title */}
          <h3
            style={{
              fontSize: "1.0625rem",
              fontWeight: 800,
              color: "var(--na-gray-900)",
              margin: "0 0 0.2rem 0",
              lineHeight: 1.3,
            }}
          >
            {course.title}
          </h3>

          {/* Subtitle / Localized Title (as in screenshot) */}
          <div
            style={{
              fontSize: "0.8125rem",
              color: "var(--na-gray-500)",
              marginBottom: "0.75rem",
              fontWeight: 500,
            }}
          >
            {course.title}
          </div>

          {/* Short Description */}
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--na-gray-600)",
              lineHeight: 1.55,
              margin: "0 0 1.25rem 0",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              flex: 1,
            }}
          >
            {course.shortDescription}
          </p>

          {/* ── CARD FOOTER (Career Pathway) ── */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: "0.75rem",
              borderTop: "1px solid var(--na-gray-100)",
            }}
          >
            <div
              style={{
                fontSize: "0.6875rem",
                color: "var(--na-gray-400)",
                marginBottom: "0.15rem",
              }}
            >
              Part of career path
            </div>
            <div
              style={{
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: "var(--na-green-600)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <span>{careerPath}</span>
              <span style={{ fontSize: "0.6875rem" }}>∨</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
