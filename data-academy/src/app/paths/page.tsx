import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Career Paths | AI Tech Hub Data Academy",
  description:
    "Explore structured learning paths curated to build real-world skills from foundational to advanced. Each path groups courses that together prepare you for an in-demand data career.",
};

export const instant = false;

async function getPathsData() {
  try {
    const paths = await prisma.learningPath.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      include: {
        courses: {
          orderBy: { order: "asc" },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                shortDescription: true,
                level: true,
                estimatedHours: true,
                coverImage: true,
                status: true,
                isFree: true,
                _count: { select: { modules: true, enrollments: true } },
              },
            },
          },
        },
      },
    });
    return paths;
  } catch {
    return [];
  }
}

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const LEVEL_COLOR: Record<string, string> = {
  BEGINNER: "#0284c7",
  INTERMEDIATE: "#7c3aed",
  ADVANCED: "#dc2626",
};

// Default fallback paths when none exist in the DB
const DEFAULT_PATHS = [
  {
    id: "default-analytics",
    title: "Data Analytics",
    slug: "data-analytics",
    description:
      "Turn raw data into actionable business insights. You'll master SQL, data visualization, and analytics workflows to deliver data-driven decisions at scale.",
    color: "#049fd9",
    icon: "analytics",
    isPublished: true,
    order: 0,
    courses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "default-datascience",
    title: "Data Science",
    slug: "data-science",
    description:
      "Apply statistical modeling, experimentation, and machine learning to extract knowledge from complex datasets. Learn Python, Pandas, and ML pipelines end-to-end.",
    color: "#00739c",
    icon: "datascience",
    isPublished: true,
    order: 1,
    courses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "default-ai",
    title: "Artificial Intelligence",
    slug: "artificial-intelligence",
    description:
      "Build intelligent systems and neural architectures that understand language, vision, and decision patterns using the latest deep learning frameworks.",
    color: "#5b21b6",
    icon: "ai",
    isPublished: true,
    order: 2,
    courses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "default-ml",
    title: "Machine Learning",
    slug: "machine-learning",
    description:
      "Train, evaluate, and deploy predictive models using Python, scikit-learn, and deep learning. Build ML systems that work in real production environments.",
    color: "#6abf4b",
    icon: "ml",
    isPublished: true,
    order: 3,
    courses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "default-python",
    title: "Python Programming",
    slug: "python-programming",
    description:
      "Master modern Python from fundamentals to advanced data pipelines, automation, and API design. The essential language for every data professional.",
    color: "#f37021",
    icon: "python",
    isPublished: true,
    order: 4,
    courses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "default-sql",
    title: "SQL & Databases",
    slug: "sql-databases",
    description:
      "Query, design, and optimize relational data models for scalable analytics and enterprise reporting. Deep-dive into PostgreSQL, MySQL, and data warehouse SQL.",
    color: "#d97706",
    icon: "sql",
    isPublished: true,
    order: 5,
    courses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

function PathIcon({ icon, size = 28 }: { icon?: string | null; size?: number }) {
  const s = size;
  switch (icon) {
    case "analytics":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      );
    case "datascience":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2v7.31L4.35 19.46A2 2 0 0 0 6.09 22h11.82a2 2 0 0 0 1.74-2.54L14 9.31V2M8.5 2h7M7 16h10" />
        </svg>
      );
    case "ai":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
        </svg>
      );
    case "ml":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" /><circle cx="18" cy="18" r="3" />
          <path d="m8.5 7.5 7 3M8.5 16.5l7-3M6 9v6M18 9v6" />
        </svg>
      );
    case "python":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m16 18 6-6-6-6M8 6l-6 6 6 6M14 4l-4 16" />
        </svg>
      );
    case "sql":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    case "bi":
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
        </svg>
      );
  }
}

export default async function PathsPage() {
  const dbPaths = await getPathsData();
  const paths = dbPaths.length > 0 ? dbPaths : DEFAULT_PATHS;

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "calc(var(--topbar-height) + var(--announce-height))" }}>

        {/* ── HERO ── */}
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, #001830 0%, #003366 55%, #004b87 100%)",
            padding: "5rem 0 4rem",
          }}
        >
          {/* Subtle background grid */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute", inset: 0,
              backgroundImage: "radial-gradient(circle, rgba(0,136,204,0.08) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              pointerEvents: "none",
            }}
          />
          {/* Glow orb */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute", top: "-80px", right: "10%",
              width: 400, height: 400, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(0,136,204,0.22) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div className="container" style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                background: "rgba(0,136,204,0.15)", border: "1px solid rgba(56,189,248,0.25)",
                borderRadius: 9999, padding: "0.375rem 1rem", marginBottom: "1.5rem",
                color: "#7dd3fc", fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.04em",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
              </svg>
              CAREER PATHWAYS
            </div>

            <h1
              style={{
                fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 800,
                color: "#fff", lineHeight: 1.15, marginBottom: "1.25rem",
                letterSpacing: "-0.02em",
              }}
            >
              Choose your{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #38bdf8, #0088cc)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                career path
              </span>
            </h1>

            <p
              style={{
                fontSize: "1.125rem", color: "rgba(255,255,255,0.75)",
                maxWidth: 620, margin: "0 auto 2.5rem", lineHeight: 1.7,
              }}
            >
              Every path is a curated sequence of courses that build on each other — taking you from first principles to job-ready skills in your chosen field.
            </p>

            {/* Stats bar */}
            <div
              style={{
                display: "inline-flex", gap: "2.5rem", flexWrap: "wrap", justifyContent: "center",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16, padding: "1rem 2rem",
              }}
            >
              {[
                { label: "Learning Paths", value: paths.length.toString() },
                { label: "Curated Courses", value: paths.reduce((sum, p) => sum + (p.courses?.length || 0), 0).toString() || "20+" },
                { label: "Career Outcomes", value: "7+" },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#38bdf8" }}>{stat.value}</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW PATHS WORK ── */}
        <section style={{ background: "var(--na-gray-50)", padding: "3.5rem 0", borderBottom: "1px solid var(--na-gray-200)" }}>
          <div className="container">
            <p style={{ textAlign: "center", fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-blue-500)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "2rem" }}>
              HOW PATHS WORK
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
              {[
                { step: "01", title: "Pick a path", desc: "Choose the career direction that aligns with your goals." },
                { step: "02", title: "Follow the sequence", desc: "Courses are ordered — each one builds on the last." },
                { step: "03", title: "Practice & verify", desc: "Complete labs, quizzes, and projects to validate skills." },
                { step: "04", title: "Earn credentials", desc: "Graduate with a verifiable certificate for each course." },
              ].map((item) => (
                <div key={item.step} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: "linear-gradient(135deg, #004b87, #0088cc)",
                      color: "#fff", fontWeight: 800, fontSize: "0.75rem",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#1b2533", fontSize: "0.9375rem", marginBottom: "0.25rem" }}>{item.title}</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)", lineHeight: 1.55 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PATH CARDS ── */}
        <section style={{ background: "#fff", padding: "4rem 0 5rem" }}>
          <div className="container">
            <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
              {paths.map((path, pathIndex) => {
                const pathColor = path.color || "#004b87";
                const hasDbCourses = path.courses && path.courses.length > 0;

                return (
                  <div
                    key={path.id}
                    id={path.slug}
                    style={{
                      border: "1px solid var(--na-gray-200)",
                      borderRadius: 20,
                      overflow: "hidden",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                      transition: "box-shadow 0.2s",
                    }}
                  >
                    {/* Path Header */}
                    <div
                      style={{
                        padding: "2rem 2.5rem",
                        background: `linear-gradient(135deg, ${pathColor}15 0%, ${pathColor}08 100%)`,
                        borderBottom: `3px solid ${pathColor}`,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "1.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: 60, height: 60, borderRadius: 16, flexShrink: 0,
                          background: `linear-gradient(135deg, ${pathColor}, ${pathColor}bb)`,
                          color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: `0 8px 20px ${pathColor}40`,
                        }}
                      >
                        <PathIcon icon={path.icon} size={28} />
                      </div>

                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1b2533", margin: 0 }}>
                            {path.title}
                          </h2>
                          <span
                            style={{
                              background: `${pathColor}20`,
                              color: pathColor,
                              border: `1px solid ${pathColor}40`,
                              borderRadius: 9999,
                              padding: "0.2rem 0.75rem",
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                            }}
                          >
                            {hasDbCourses ? `${path.courses.length} Courses` : "Coming Soon"}
                          </span>
                        </div>
                        <p style={{ color: "var(--na-gray-600)", fontSize: "0.9375rem", lineHeight: 1.6, margin: 0, maxWidth: 640 }}>
                          {path.description}
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "0.75rem", flexShrink: 0, alignItems: "center" }}>
                        <Link
                          href={`/courses?path=${path.slug}`}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.625rem 1.375rem", borderRadius: 9999,
                            background: pathColor, color: "#fff",
                            fontWeight: 700, fontSize: "0.875rem",
                            textDecoration: "none",
                            transition: "opacity 0.15s",
                          }}
                        >
                          Start Path
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>

                    {/* Course Sequence */}
                    {hasDbCourses ? (
                      <div style={{ padding: "1.75rem 2.5rem" }}>
                        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--na-gray-400)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
                          COURSE SEQUENCE
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                          {path.courses.map((pc: any, idx: number) => {
                            const course = pc.course;
                            const isLast = idx === path.courses.length - 1;
                            return (
                              <div key={pc.id || course.id} style={{ display: "flex", gap: "1rem", alignItems: "stretch" }}>
                                {/* Step indicator */}
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40, flexShrink: 0 }}>
                                  <div
                                    style={{
                                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                                      background: `${pathColor}18`,
                                      border: `2px solid ${pathColor}`,
                                      color: pathColor,
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                      fontWeight: 800, fontSize: "0.8125rem",
                                    }}
                                  >
                                    {idx + 1}
                                  </div>
                                  {!isLast && (
                                    <div style={{ width: 2, flex: 1, background: `${pathColor}25`, margin: "4px 0" }} />
                                  )}
                                </div>

                                {/* Course card */}
                                <div
                                  style={{
                                    flex: 1,
                                    marginBottom: isLast ? 0 : "0.75rem",
                                    paddingBottom: isLast ? 0 : "0.75rem",
                                  }}
                                >
                                  <Link
                                    href={`/courses/${course.slug}`}
                                    style={{
                                      display: "flex", gap: "1rem", alignItems: "center",
                                      padding: "0.875rem 1rem",
                                      background: "var(--na-gray-50)",
                                      border: "1px solid var(--na-gray-200)",
                                      borderRadius: 12,
                                      textDecoration: "none",
                                      transition: "border-color 0.15s, background 0.15s",
                                    }}
                                    className="path-course-link"
                                  >
                                    {/* Thumbnail */}
                                    <div
                                      style={{
                                        width: 48, height: 48, borderRadius: 8, flexShrink: 0,
                                        background: `linear-gradient(135deg, ${pathColor}cc, ${pathColor}88)`,
                                        overflow: "hidden",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                      }}
                                    >
                                      {course.coverImage ? (
                                        <img src={course.coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                      ) : (
                                        <span style={{ color: "#fff", fontWeight: 800, fontSize: "1.125rem" }}>
                                          {(idx + 1).toString()}
                                        </span>
                                      )}
                                    </div>

                                    {/* Details */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontWeight: 700, color: "#1b2533", fontSize: "0.9375rem", marginBottom: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {course.title}
                                      </div>
                                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                                        <span
                                          style={{
                                            fontSize: "0.6875rem", fontWeight: 700, borderRadius: 9999,
                                            padding: "0.2rem 0.6rem",
                                            background: `${LEVEL_COLOR[course.level] || "#0284c7"}18`,
                                            color: LEVEL_COLOR[course.level] || "#0284c7",
                                          }}
                                        >
                                          {LEVEL_LABEL[course.level] || course.level}
                                        </span>
                                        {course.estimatedHours > 0 && (
                                          <span style={{ fontSize: "0.75rem", color: "var(--na-gray-500)" }}>
                                            {course.estimatedHours}h
                                          </span>
                                        )}
                                        {course.isFree && (
                                          <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#059669", background: "#d1fae5", borderRadius: 9999, padding: "0.2rem 0.6rem" }}>
                                            FREE
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--na-gray-400)" strokeWidth="2">
                                      <path d="M9 18l6-6-6-6" />
                                    </svg>
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: "2.5rem", textAlign: "center" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🚀</div>
                        <p style={{ color: "var(--na-gray-500)", fontSize: "0.9375rem" }}>
                          Courses for this path are coming soon. <Link href="/courses" style={{ color: pathColor, fontWeight: 600 }}>Browse all courses →</Link>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <section
          style={{
            padding: "4rem 0",
            background: "linear-gradient(135deg, #001830 0%, #003366 60%, #004b87 100%)",
            textAlign: "center",
          }}
        >
          <div className="container">
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800, color: "#fff", marginBottom: "1rem" }}>
              Ready to start your path?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.0625rem", marginBottom: "2rem", maxWidth: 480, margin: "0 auto 2rem" }}>
              Join thousands of learners building careers in data, AI, and analytics.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/register"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.75rem 1.75rem", borderRadius: 9999,
                  background: "linear-gradient(135deg, #0088cc, #38bdf8)",
                  color: "#fff", fontWeight: 700, fontSize: "0.9375rem",
                  textDecoration: "none",
                }}
              >
                Get Started Free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/courses"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.75rem 1.75rem", borderRadius: 9999,
                  background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff", fontWeight: 600, fontSize: "0.9375rem",
                  textDecoration: "none",
                }}
              >
                Browse All Courses
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
