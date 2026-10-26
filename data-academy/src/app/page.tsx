import Navbar from "@/components/layout/Navbar";
import HeroButtons from "@/components/HeroButtons";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import CourseCard from "@/components/CourseCard";
import { prisma } from "@/lib/prisma";
import { getLevelColor, getLevelLabel, formatDuration, truncate } from "@/lib/utils";

export const instant = false;

async function getHomeData() {
  try {
    const [featuredCourses, learningPaths, testimonials, stats] = await Promise.all([
      prisma.course.findMany({
        where: { status: "PUBLISHED", isFeatured: true },
        take: 6,
        include: {
          category: true,
          instructors: { include: { user: { include: { profile: true } } }, where: { isPrimary: true }, take: 1 },
          _count: { select: { modules: true, enrollments: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.learningPath.findMany({
        where: { isPublished: true },
        orderBy: { order: "asc" },
      }),
      prisma.testimonial
        .findMany({
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
        })
        .then((list) =>
          list
            .filter((t: any) => t.isFeatured !== false)
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
            .slice(0, 6)
        ),
      Promise.all([
        prisma.course.count({ where: { status: "PUBLISHED" } }),
        prisma.enrollment.count({ where: { status: "ACTIVE" } }),
        prisma.enrollment.count({ where: { status: "COMPLETED" } }),
        prisma.learningPath.count({ where: { isPublished: true } }),
      ]),
    ]);

    return {
      featuredCourses,
      learningPaths,
      testimonials,
      stats: {
        publishedCourses: stats[0],
        activeLearners: stats[1],
        completedEnrollments: stats[2],
        learningPaths: stats[3],
      },
    };
  } catch (error) {
    console.warn("Could not load dynamic data from database, using fallback:", error);
    return {
      featuredCourses: [],
      learningPaths: [],
      testimonials: [],
      stats: {
        publishedCourses: 0,
        activeLearners: 0,
        completedEnrollments: 0,
        learningPaths: 0,
      },
    };
  }
}

const defaultPaths = [
  {
    key: "analytics",
    title: "Data Analytics",
    description: "Turn raw data into actionable business insights using analytics tools, SQL, and data visualization.",
    color: "#049fd9",
    href: "/paths#data-analytics",
  },
  {
    key: "datascience",
    title: "Data Science",
    description: "Apply statistical modeling, experimentation, and machine learning to extract knowledge from complex datasets.",
    color: "#00739c",
    href: "/paths#data-science",
  },
  {
    key: "ai",
    title: "Artificial Intelligence",
    description: "Build intelligent systems and neural architectures that understand language, vision, and decision patterns.",
    color: "#005073",
    href: "/paths#ai",
  },
  {
    key: "ml",
    title: "Machine Learning",
    description: "Train, evaluate, and deploy predictive models using Python, scikit-learn, and deep learning frameworks.",
    color: "#6abf4b",
    href: "/paths#ml",
  },
  {
    key: "python",
    title: "Python Programming",
    description: "Master modern Python from fundamentals to advanced data pipelines, automation, and API design.",
    color: "#46862e",
    href: "/paths#python",
  },
  {
    key: "sql",
    title: "SQL & Databases",
    description: "Query, design, and optimize relational data models for scalable analytics and enterprise reporting.",
    color: "#f37021",
    href: "/paths#sql",
  },
  {
    key: "bi",
    title: "Business Intelligence",
    description: "Build executive dashboards, KPI monitors, and data storytelling workflows for informed decisions.",
    color: "#0284c7",
    href: "/paths#bi",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Learn Concepts",
    description: "Work through structured modules combining concise instruction, architectural diagrams, and real-world case studies.",
  },
  {
    step: "02",
    title: "Practice in the Browser",
    description: "Write and execute real Python and SQL code directly in your browser with automated verification.",
  },
  {
    step: "03",
    title: "Complete Assessments",
    description: "Validate your comprehension through rigorous quizzes, practical labs, and real industry scenarios.",
  },
  {
    step: "04",
    title: "Build Projects",
    description: "Apply your skills to end-to-end guided projects that simulate production data engineering tasks.",
  },
  {
    step: "05",
    title: "Demonstrate Skills",
    description: "Earn verifiable certificates, establish your portfolio, and prove competencies to employers.",
  },
];

const whyLearnWith = [
  {
    key: "hands-on",
    title: "Hands-On Training",
    description: "Every curriculum emphasizes active practice with integrated coding environments and realistic datasets.",
  },
  {
    key: "structured",
    title: "Structured Pathways",
    description: "Progress through curated, sequential tracks aligned with industry job competencies from foundational to advanced.",
  },
  {
    key: "projects",
    title: "Production Projects",
    description: "Graduate with portfolio-ready deliverables that demonstrate end-to-end analytical capability.",
  },
  {
    key: "tracking",
    title: "Granular Progress",
    description: "Monitor milestones, lesson completion, and quiz accuracy in real time through an intuitive dashboard.",
  },
  {
    key: "tutor",
    title: "Expert Mentorship",
    description: "Receive actionable guidance and feedback from experienced data engineers, analysts, and instructors.",
  },
  {
    key: "skills",
    title: "Skills-Based Credentials",
    description: "Earn verifiable digital credentials that clearly document demonstrated technical proficiency.",
  },
];

function renderPathIcon(key: string) {
  switch (key) {
    case "analytics":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      );
    case "datascience":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2v7.31L4.35 19.46A2 2 0 0 0 6.09 22h11.82a2 2 0 0 0 1.74-2.54L14 9.31V2M8.5 2h7M7 16h10" />
        </svg>
      );
    case "ai":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
        </svg>
      );
    case "ml":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="18" r="3" />
          <path d="m8.5 7.5 7 3M8.5 16.5l7-3M6 9v6M18 9v6M8.5 8.5l7 7M8.5 15.5l7-7" />
        </svg>
      );
    case "python":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m16 18 6-6-6-6M8 6l-6 6 6 6M14 4l-4 16" />
        </svg>
      );
    case "sql":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    case "bi":
    default:
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      );
  }
}

function renderFeatureIcon(key: string) {
  switch (key) {
    case "hands-on":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    case "structured":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case "projects":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "tracking":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20v-6M6 20V10M18 20V4" />
        </svg>
      );
    case "tutor":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "skills":
    default:
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      );
  }
}

export default async function HomePage() {
  const { featuredCourses, learningPaths, testimonials, stats } = await getHomeData();
  const displayPaths = learningPaths.length > 0 ? learningPaths : defaultPaths;

  return (
    <>
      <Navbar />
      <main>
        {/* NETACAD STYLE HERO SECTION */}
        <section className="netacad-hero">
          {/* Subtle fluid wave curves in background */}
          <svg
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 0,
            }}
            viewBox="0 0 1440 600"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M-50 80 C 250 10, 500 180, 850 60 C 1100 -20, 1300 110, 1500 80"
              stroke="rgba(4, 159, 217, 0.12)"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M-30 110 C 270 40, 520 210, 870 90 C 1120 10, 1320 140, 1520 110"
              stroke="rgba(4, 159, 217, 0.08)"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M-10 140 C 290 70, 540 240, 890 120 C 1140 40, 1340 170, 1540 140"
              stroke="rgba(4, 159, 217, 0.05)"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M900 480 C 1100 380, 1250 460, 1500 390"
              stroke="rgba(106, 191, 75, 0.12)"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M930 510 C 1130 410, 1280 490, 1530 420"
              stroke="rgba(106, 191, 75, 0.08)"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>

          <div className="container" style={{ position: "relative", zIndex: 1 }}>
            <div className="netacad-hero-grid">
              {/* LEFT COLUMN: HERO COPY & CALL TO ACTIONS */}
              <div>
                {/* Hot market notification badge */}
                <Link href="/courses" className="netacad-badge">
                  {/* Clean SVG Flame Icon */}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#f37021"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
                  </svg>
                  <span>
                    <strong>The data &amp; AI job market is hot!</strong> See why thousands of learners begin with our{" "}
                    <span style={{ textDecoration: "underline", color: "var(--na-green-600)", fontWeight: 600 }}>
                      free Intro to Data Science course
                    </span>
                  </span>
                </Link>

                <h1 className="netacad-hero-title">
                  Build your skills.
                  <br />
                  <span>Build your future.</span>
                </h1>

                <p className="netacad-hero-desc">
                  Free online courses. In-person learning. Certification-aligned pathways designed to help you stand out in the job market. From AI and Data Analytics to Machine Learning and Python, it&apos;s all here.
                </p>

                <p className="netacad-hero-question">
                  Are you ready to begin, change, or propel your career?
                </p>

                <HeroButtons />
              </div>

              {/* RIGHT COLUMN: 3-PHOTO ORGANIC COLLAGE */}
              <div className="netacad-hero-collage">
                {/* Dot matrix decorative pattern */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "-25px",
                    bottom: "20px",
                    zIndex: 0,
                    pointerEvents: "none",
                  }}
                >
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                    <pattern id="heroDots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                      <circle cx="2.5" cy="2.5" r="1.5" fill="#94a3b8" opacity="0.55" />
                    </pattern>
                    <rect width="120" height="120" fill="url(#heroDots)" />
                  </svg>
                </div>

                {/* Concentric wavy circle badge */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "185px",
                    bottom: "95px",
                    zIndex: 3,
                    width: 95,
                    height: 95,
                    pointerEvents: "none",
                  }}
                >
                  <svg width="95" height="95" viewBox="0 0 100 100" fill="none">
                    <defs>
                      <clipPath id="circleWaveClip">
                        <circle cx="50" cy="50" r="48" />
                      </clipPath>
                    </defs>
                    <circle cx="50" cy="50" r="48" fill="rgba(243, 246, 255, 0.95)" stroke="rgba(123, 136, 232, 0.35)" strokeWidth="1" />
                    <g clipPath="url(#circleWaveClip)" stroke="#7b88e8" strokeWidth="2.5" fill="none" strokeLinecap="round">
                      <path d="M-10 16 Q 10 10, 25 16 T 55 16 T 85 16 T 115 16" />
                      <path d="M-10 26 Q 10 20, 25 26 T 55 26 T 85 26 T 115 26" />
                      <path d="M-10 36 Q 10 30, 25 36 T 55 36 T 85 36 T 115 36" />
                      <path d="M-10 46 Q 10 40, 25 46 T 55 46 T 85 46 T 115 46" />
                      <path d="M-10 56 Q 10 50, 25 56 T 55 56 T 85 56 T 115 56" />
                      <path d="M-10 66 Q 10 60, 25 66 T 55 66 T 85 66 T 115 66" />
                      <path d="M-10 76 Q 10 70, 25 76 T 55 76 T 85 76 T 115 76" />
                      <path d="M-10 86 Q 10 80, 25 86 T 55 86 T 85 86 T 115 86" />
                    </g>
                  </svg>
                </div>

                {/* Left Photo: Portrait with asymmetric curved corners */}
                <div style={{ position: "relative", zIndex: 1 }}>
                  <img
                    src="/images/hero_portrait.jpg"
                    alt="Data Academy student learning"
                    style={{
                      width: "235px",
                      height: "360px",
                      objectFit: "cover",
                      borderRadius: "32px 32px 80px 32px",
                      display: "block",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
                    }}
                  />
                </div>

                {/* Right Column: Stacked 2 photos */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "relative", zIndex: 1 }}>
                  <img
                    src="/images/hero_collab.jpg"
                    alt="Students collaborating"
                    style={{
                      width: "270px",
                      height: "170px",
                      objectFit: "cover",
                      borderRadius: "32px 32px 32px 10px",
                      display: "block",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
                    }}
                  />
                  <img
                    src="/images/hero_learner.jpg"
                    alt="Student studying with headphones"
                    style={{
                      width: "270px",
                      height: "210px",
                      objectFit: "cover",
                      borderRadius: "10px 32px 80px 32px",
                      display: "block",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* FLOATING NETACAD STATS CARD */}
            <div className="netacad-stats-card">
              <div className="netacad-stats-grid">
                {/* Metric 1 */}
                <div className="netacad-stat-col">
                  <div style={{ fontSize: "1.875rem", fontWeight: 700, color: "#1b2533", letterSpacing: "-0.02em" }}>
                    33.3 million
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-600)", marginTop: "0.35rem", lineHeight: 1.4 }}>
                    Students since our start in 1997
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="netacad-stat-col">
                  <div style={{ fontSize: "1.875rem", fontWeight: 700, color: "#1b2533", letterSpacing: "-0.02em" }}>
                    32,600
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-600)", marginTop: "0.35rem", lineHeight: 1.4 }}>
                    Educators around the world
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="netacad-stat-col">
                  <div style={{ fontSize: "1.875rem", fontWeight: 700, color: "#1b2533", letterSpacing: "-0.02em" }}>
                    12,700
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-600)", marginTop: "0.35rem", lineHeight: 1.4 }}>
                    Organizations offering our courses
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="netacad-stat-col">
                  <div style={{ fontSize: "1.875rem", fontWeight: 700, color: "#1b2533", letterSpacing: "-0.02em" }}>
                    195
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-600)", marginTop: "0.35rem", lineHeight: 1.4 }}>
                    Countries where we serve learners
                  </div>
                </div>

                {/* Metric 5 */}
                <div className="netacad-stat-col">
                  <div style={{ fontSize: "1.875rem", fontWeight: 700, color: "#1b2533", letterSpacing: "-0.02em" }}>
                    97%
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-600)", marginTop: "0.35rem", lineHeight: 1.4 }}>
                    Students obtained a career and/or educational opportunity.<sup>1</sup>
                  </div>
                </div>
              </div>

              {/* Footnote */}
              <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.6875rem", color: "#94a3b8" }}>
                As of fiscal 2026
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED COURSES */}
        {featuredCourses.length > 0 && (
          <section className="section" style={{ background: "var(--na-gray-50)" }}>
            <div className="container">
              <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                <span className="section-label" style={{ color: "var(--na-blue-500)" }}>CURATED CATALOG</span>
                <h2>Explore Featured Courses</h2>
                <p style={{ marginTop: "0.5rem", fontSize: "1rem", maxWidth: 540, margin: "0.5rem auto 0", color: "var(--na-gray-600)" }}>
                  Rigorous curriculums created to transition motivated learners into confident data practitioners.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                {featuredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>

              <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
                <Link href="/courses" className="btn btn-secondary btn-lg">
                  View Full Course Catalog →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* LEARNING PATHS */}
        <section className="section" style={{ background: "#fff" }}>
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <span className="section-label" style={{ color: "var(--na-blue-500)" }}>CAREER PATHWAYS</span>
              <h2>Structured Tracks for Every Goal</h2>
              <p style={{ marginTop: "0.5rem", maxWidth: 540, margin: "0.5rem auto 0", color: "var(--na-gray-600)" }}>
                End-to-end curriculums aligned with roles in modern data science, engineering, and artificial intelligence.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }} className="stagger-children">
              {defaultPaths.map((path) => (
                <Link
                  key={path.title}
                  href={path.href}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="card card-hover"
                    style={{ padding: "1.5rem", display: "flex", gap: "1.125rem", alignItems: "flex-start", height: "100%" }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "var(--radius-md)",
                        background: `${path.color}15`,
                        color: path.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        border: `1px solid ${path.color}30`,
                      }}
                    >
                      {renderPathIcon(path.key)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--na-gray-900)", marginBottom: "0.375rem" }}>
                        {path.title}
                      </h4>
                      <p style={{ fontSize: "0.84375rem", color: "var(--na-gray-600)", lineHeight: 1.6 }}>
                        {path.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* HOW LEARNING WORKS */}
        <section className="section" style={{ background: "var(--na-navy-900)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <span className="section-label" style={{ color: "var(--na-blue-300)" }}>LEARNING METHODOLOGY</span>
              <h2 style={{ color: "#fff" }}>How Skills-to-Career Works</h2>
              <p style={{ color: "var(--na-gray-300)", marginTop: "0.5rem", maxWidth: 540, margin: "0.5rem auto 0" }}>
                A proven cyclical framework emphasizing conceptual clarity, browser execution, and verified output.
              </p>
            </div>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
              {howItWorks.map((item, i) => (
                <div
                  key={item.step}
                  style={{
                    flex: "1",
                    minWidth: "190px",
                    maxWidth: "220px",
                    padding: "1.5rem 1rem",
                    textAlign: "center",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "var(--radius-md)",
                      background: "rgba(4, 159, 217, 0.15)",
                      border: "1.5px solid var(--na-blue-400)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.125rem",
                      fontWeight: 800,
                      color: "var(--na-blue-300)",
                      margin: "0 auto 1.25rem",
                      boxShadow: "0 4px 12px rgba(4, 159, 217, 0.2)",
                    }}
                  >
                    {item.step}
                  </div>

                  <h4 style={{ color: "#fff", fontSize: "0.9375rem", marginBottom: "0.5rem", fontWeight: 700 }}>{item.title}</h4>
                  <p style={{ fontSize: "0.8125rem", color: "var(--na-gray-400)", lineHeight: 1.65 }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY LEARN WITH US */}
        <section className="section" style={{ background: "var(--na-gray-50)" }}>
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <span className="section-label" style={{ color: "var(--na-green-600)" }}>PLATFORM ADVANTAGES</span>
              <h2>Engineered for Verifiable Competency</h2>
              <p style={{ marginTop: "0.5rem", maxWidth: 540, margin: "0.5rem auto 0", color: "var(--na-gray-600)" }}>
                Built around industry-standard specifications that prioritize demonstrated capability over passive watching.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
              {whyLearnWith.map((item) => (
                <div key={item.title} className="card" style={{ padding: "1.75rem", display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "var(--radius-md)",
                      background: "rgba(106, 191, 75, 0.12)",
                      color: "var(--na-green-600)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1rem",
                      border: "1px solid rgba(106, 191, 75, 0.25)",
                    }}
                  >
                    {renderFeatureIcon(item.key)}
                  </div>
                  <h4 style={{ fontWeight: 700, marginBottom: "0.5rem", fontSize: "1.0625rem", color: "var(--na-gray-900)" }}>{item.title}</h4>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "var(--na-gray-600)" }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── STUDENT TESTIMONIALS & SUCCESS STORIES ─────────── */}
        {testimonials && testimonials.length > 0 && (
          <section className="section" style={{ background: "#ffffff", borderTop: "1px solid var(--na-gray-200)" }}>
            <div className="container">
              <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
                <span className="section-label" style={{ color: "var(--na-blue-500)" }}>
                  STUDENT SUCCESS &amp; CAREER IMPACT
                </span>
                <h2 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.25rem)", fontWeight: 800, color: "var(--na-navy-900)" }}>
                  Hear From Our Graduates
                </h2>
                <p style={{ marginTop: "0.5rem", maxWidth: 580, margin: "0.5rem auto 0", color: "var(--na-gray-600)", fontSize: "1rem", lineHeight: 1.6 }}>
                  Real stories from learners who transformed their technical skills, passed industry interviews, and accelerated their data careers.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "1.75rem",
                }}
              >
                {testimonials.map((t) => (
                  <div
                    key={t.id}
                    className="card card-hover"
                    style={{
                      padding: "1.75rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      position: "relative",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--na-gray-200)",
                      background: "#fff",
                    }}
                  >
                    <div>
                      {/* Top bar: Stars & Verified Badge */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "1.25rem",
                        }}
                      >
                        {/* 5-Star Rating */}
                        <div style={{ display: "flex", gap: "2px", color: "#eab308", fontSize: "1rem" }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} style={{ opacity: i < t.rating ? 1 : 0.25 }}>★</span>
                          ))}
                        </div>

                        {/* Verified Learner Pill */}
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.55rem",
                            borderRadius: "9999px",
                            background: "#ecfdf5",
                            color: "#059669",
                            border: "1px solid #a7f3d0",
                          }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Verified Graduate
                        </span>
                      </div>

                      {/* Quote Content */}
                      <p
                        style={{
                          fontSize: "0.9375rem",
                          lineHeight: 1.7,
                          color: "var(--na-gray-700)",
                          fontStyle: "italic",
                          margin: "0 0 1.5rem",
                        }}
                      >
                        &ldquo;{t.content}&rdquo;
                      </p>
                    </div>

                    {/* Author Footer */}
                    <div
                      style={{
                        paddingTop: "1.25rem",
                        borderTop: "1px solid var(--na-gray-100)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.875rem",
                      }}
                    >
                      {t.avatar ? (
                        <img
                          src={t.avatar}
                          alt={t.studentName}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "1.5px solid var(--na-gray-200)",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, var(--na-navy-800), var(--na-blue-500))",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "0.9375rem",
                            flexShrink: 0,
                          }}
                        >
                          {t.studentName
                            .split(" ")
                            .map((n: string) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: "0.9375rem",
                            color: "var(--na-navy-900)",
                            letterSpacing: "-0.01em",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t.studentName}
                        </div>

                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--na-gray-600)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginTop: "0.1rem",
                          }}
                        >
                          {t.role && <span>{t.role}</span>}
                          {t.role && t.company && <span> • </span>}
                          {t.company && <span style={{ fontWeight: 600, color: "var(--na-navy-800)" }}>{t.company}</span>}
                        </div>

                        {t.courseTitle && (
                          <div
                            style={{
                              fontSize: "0.6875rem",
                              color: "var(--na-blue-500)",
                              fontWeight: 600,
                              marginTop: "0.2rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {t.courseTitle}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* PLATFORM STATS */}
        <section className="section" style={{ background: "#fff", borderTop: "1px solid var(--na-gray-200)" }}>
          <div className="container" style={{ textAlign: "center" }}>
            <span className="section-label" style={{ color: "var(--na-blue-500)" }}>PLATFORM IMPACT</span>
            <h2 style={{ marginBottom: "2.5rem" }}>Growing Learner Community</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.5rem", maxWidth: 900, margin: "0 auto" }}>
              {[
                { value: stats.publishedCourses, label: "Published Courses" },
                { value: stats.activeLearners, label: "Active Learners" },
                { value: stats.completedEnrollments, label: "Completed Enrollments" },
                { value: stats.learningPaths, label: "Career Tracks" },
              ].map((stat) => (
                <div key={stat.label} className="stat-card">
                  <div className="stat-value" style={{ color: "var(--na-blue-500)" }}>
                    {stat.value === 0 ? "—" : stat.value.toLocaleString()}
                  </div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="section" style={{ background: "linear-gradient(135deg, var(--na-navy-900), var(--na-navy-800))", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="container" style={{ textAlign: "center" }}>
            <h2 style={{ color: "#fff", marginBottom: "1rem", fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}>
              Ready to Accelerate Your Data Career?
            </h2>
            <p style={{ color: "var(--na-gray-300)", fontSize: "1.0625rem", marginBottom: "2rem", maxWidth: 520, margin: "0 auto 2rem", lineHeight: 1.7 }}>
              Start learning immediately with free access to foundational courses, interactive code environments, and community tracks.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/register"
                className="btn btn-green btn-lg"
                style={{ padding: "0.875rem 2rem", fontSize: "1rem" }}
              >
                Create Free Account
              </Link>
              <Link
                href="/courses"
                className="btn btn-primary btn-lg"
                style={{ padding: "0.875rem 2rem", fontSize: "1rem" }}
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
