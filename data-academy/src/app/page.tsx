import Navbar from "@/components/layout/Navbar";
import HeroButtons from "@/components/HeroButtons";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getLevelColor, getLevelLabel, formatDuration, truncate } from "@/lib/utils";

export const instant = false;

async function getHomeData() {
  const [featuredCourses, learningPaths, stats] = await Promise.all([
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
    stats: {
      publishedCourses: stats[0],
      activeLearners: stats[1],
      completedEnrollments: stats[2],
      learningPaths: stats[3],
    },
  };
}

const defaultPaths = [
  { icon: "📊", title: "Data Analytics", description: "Turn raw data into actionable business insights using analytics tools and visualization.", color: "#3b82f6", href: "/paths#data-analytics" },
  { icon: "🔬", title: "Data Science", description: "Apply statistical modeling and machine learning to extract knowledge from complex datasets.", color: "#6366f1", href: "/paths#data-science" },
  { icon: "🤖", title: "Artificial Intelligence", description: "Build intelligent systems that learn, reason, and make decisions.", color: "#8b5cf6", href: "/paths#ai" },
  { icon: "🧠", title: "Machine Learning", description: "Train and deploy predictive models with Python, scikit-learn, and deep learning frameworks.", color: "#06b6d4", href: "/paths#ml" },
  { icon: "🐍", title: "Python Programming", description: "Master Python from fundamentals to advanced data engineering and automation.", color: "#10b981", href: "/paths#python" },
  { icon: "🗄️", title: "SQL & Databases", description: "Query, design, and optimize relational databases for analytics and application development.", color: "#f59e0b", href: "/paths#sql" },
  { icon: "📈", title: "Business Intelligence", description: "Create dashboards, KPI reports, and data storytelling for business decision-making.", color: "#ef4444", href: "/paths#bi" },
];

const howItWorks = [
  { step: "01", icon: "📚", title: "Learn Concepts", description: "Work through structured lessons combining video, reading, diagrams, and real-world examples." },
  { step: "02", icon: "💻", title: "Practice in the Browser", description: "Write and run Python and SQL code directly in your browser with instant feedback." },
  { step: "03", icon: "✅", title: "Complete Assessments", description: "Test your understanding through quizzes, coding challenges, and scenario-based questions." },
  { step: "04", icon: "🏗️", title: "Build Projects", description: "Apply your skills to guided real-world projects that demonstrate practical competency." },
  { step: "05", icon: "🎓", title: "Demonstrate Skills", description: "Earn certificates, build your portfolio, and prove your data skills to employers." },
];

const whyLearnWith = [
  { icon: "🛠️", title: "Hands-On Training", description: "Every course includes practical exercises and browser-based coding environments." },
  { icon: "🗺️", title: "Structured Learning Paths", description: "Follow curated paths from beginner to advanced across all data and AI disciplines." },
  { icon: "📁", title: "Real-World Projects", description: "Build a portfolio of projects that reflect the work data professionals do every day." },
  { icon: "📊", title: "Progress Tracking", description: "Track your learning across lessons, modules, and courses with a personal dashboard." },
  { icon: "👩‍🏫", title: "Tutor Support", description: "Get feedback on assignments and projects from experienced data professionals." },
  { icon: "🏆", title: "Skills-Based Assessment", description: "Earn recognition only when you've genuinely demonstrated the required competency." },
];

export default async function HomePage() {
  const { featuredCourses, learningPaths, stats } = await getHomeData();
  const displayPaths = learningPaths.length > 0 ? learningPaths : defaultPaths;

  return (
    <>
      <Navbar />
      <main>
        {/* ─── HERO ──────────────────────────────────────── */}
        <section
          style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0f172a 100%)",
            display: "flex",
            alignItems: "center",
            paddingTop: "var(--topbar-height)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background grid */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `
                linear-gradient(rgba(99,102,241,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(99,102,241,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />
          {/* Glow orbs */}
          <div aria-hidden style={{ position: "absolute", top: "20%", left: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", filter: "blur(40px)" }} />
          <div aria-hidden style={{ position: "absolute", bottom: "20%", right: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)", filter: "blur(60px)" }} />

          <div className="container" style={{ position: "relative", zIndex: 1, paddingTop: "4rem", paddingBottom: "4rem" }}>
            <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }} className="animate-fade-up">
              {/* Badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 1rem", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "999px", marginBottom: "1.5rem" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
                <span style={{ fontSize: "0.8125rem", color: "#a5b4fc", fontWeight: 600, letterSpacing: "0.05em" }}>
                  DATA & AI EDUCATION PLATFORM
                </span>
              </div>

              <h1 style={{ color: "#fff", marginBottom: "1.5rem", fontSize: "clamp(2.25rem, 6vw, 4rem)" }}>
                Learn{" "}
                <span style={{ background: "linear-gradient(135deg, #818cf8, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  Data Science & AI
                </span>{" "}
                Through Practical Experience
              </h1>

              <p style={{ fontSize: "1.1875rem", color: "#94a3b8", lineHeight: 1.75, marginBottom: "2.5rem", maxWidth: 600, margin: "0 auto 2.5rem" }}>
                Master data analytics, machine learning, and AI through structured courses, 
                browser-based coding exercises, and real-world projects designed to build genuine competency.
              </p>

              <HeroButtons />

              {/* Trust bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2rem", marginTop: "3rem", flexWrap: "wrap" }}>
                {[
                  { value: stats.publishedCourses || "10+", label: "Courses" },
                  { value: stats.activeLearners || "500+", label: "Learners" },
                  { value: stats.learningPaths || "7", label: "Learning Paths" },
                  { value: "100%", label: "Practical" },
                ].map((item) => (
                  <div key={item.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>{item.value}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── FEATURED COURSES ──────────────────────────── */}
        {featuredCourses.length > 0 && (
          <section className="section" style={{ background: "var(--color-neutral-50)" }}>
            <div className="container">
              <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                <span className="badge badge-blue" style={{ marginBottom: "0.75rem" }}>Featured Courses</span>
                <h2>Start Your Learning Journey</h2>
                <p style={{ marginTop: "0.75rem", fontSize: "1.0625rem", maxWidth: 540, margin: "0.75rem auto 0" }}>
                  Carefully designed courses to take you from curious beginner to confident data professional.
                </p>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                  gap: "1.5rem",
                }}
                className="stagger-children"
              >
                {featuredCourses.map((course) => {
                  const instructor = course.instructors[0]?.user;
                  const name = instructor?.profile
                    ? `${instructor.profile.firstName} ${instructor.profile.lastName}`
                    : "Data Academy";

                  return (
                    <Link key={course.id} href={`/courses/${course.slug}`} style={{ textDecoration: "none" }}>
                      <div className="card card-hover">
                        {/* Thumbnail */}
                        <div style={{ height: 180, background: "linear-gradient(135deg, var(--color-brand-700), var(--color-accent-500))", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {course.coverImage ? (
                            <img src={course.coverImage} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span style={{ fontSize: "3rem" }}>📊</span>
                          )}
                          <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem" }}>
                            <span className={`badge ${getLevelColor(course.level)}`}>
                              {getLevelLabel(course.level)}
                            </span>
                          </div>
                          {course.isFree && (
                            <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem" }}>
                              <span className="badge badge-green">Free</span>
                            </div>
                          )}
                        </div>
                        {/* Content */}
                        <div style={{ padding: "1.25rem" }}>
                          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--color-neutral-900)" }}>
                            {course.title}
                          </h3>
                          <p style={{ fontSize: "0.8125rem", color: "var(--color-neutral-500)", marginBottom: "1rem", lineHeight: 1.6 }}>
                            {truncate(course.shortDescription, 100)}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8125rem", color: "var(--color-neutral-500)" }}>
                            <span>👤 {name}</span>
                            <div style={{ display: "flex", gap: "0.875rem" }}>
                              <span>📚 {course._count.modules} modules</span>
                              <span>⏱ {formatDuration(course.estimatedHours)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
                <Link href="/courses" className="btn btn-secondary btn-lg">
                  View All Courses →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ─── LEARNING PATHS ────────────────────────────── */}
        <section className="section">
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <span className="badge badge-purple" style={{ marginBottom: "0.75rem" }}>Learning Paths</span>
              <h2>Choose Your Data Career Path</h2>
              <p style={{ marginTop: "0.75rem", maxWidth: 520, margin: "0.75rem auto 0" }}>
                Follow structured sequences of courses built around the skills employers need most.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }} className="stagger-children">
              {defaultPaths.map((path) => (
                <Link
                  key={path.title}
                  href={("href" in path ? path.href : "#")}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="card card-hover"
                    style={{ padding: "1.5rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "var(--radius-md)",
                        background: `${("color" in path ? path.color : "#3b82f6")}18`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.5rem",
                        flexShrink: 0,
                      }}
                    >
                      {("icon" in path ? path.icon : "📊")}
                    </div>
                    <div>
                      <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-neutral-900)", marginBottom: "0.375rem" }}>
                        {path.title}
                      </h4>
                      <p style={{ fontSize: "0.8125rem", color: "var(--color-neutral-500)", lineHeight: 1.6 }}>
                        {("description" in path ? path.description : "")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HOW LEARNING WORKS ────────────────────────── */}
        <section className="section" style={{ background: "var(--color-neutral-900)" }}>
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <span className="badge badge-blue" style={{ marginBottom: "0.75rem" }}>How It Works</span>
              <h2 style={{ color: "#fff" }}>A Complete Learning Experience</h2>
              <p style={{ color: "#94a3b8", marginTop: "0.75rem", maxWidth: 520, margin: "0.75rem auto 0" }}>
                Each course takes you through a proven learning cycle designed to build lasting skills.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0", flexWrap: "wrap", justifyContent: "center" }}>
              {howItWorks.map((item, i) => (
                <div
                  key={item.step}
                  style={{
                    flex: "1",
                    minWidth: "180px",
                    maxWidth: "220px",
                    padding: "1.5rem 1rem",
                    textAlign: "center",
                    position: "relative",
                  }}
                >
                  {/* Connector line */}
                  {i < howItWorks.length - 1 && (
                    <div style={{ position: "absolute", top: "2.5rem", right: 0, width: "50%", height: 2, background: "rgba(99,102,241,0.3)", transform: "translateX(50%)", zIndex: 0 }} />
                  )}
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    margin: "0 auto 1rem",
                    position: "relative",
                    zIndex: 1,
                    boxShadow: "0 0 0 4px rgba(99,102,241,0.15)",
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ fontSize: "0.6875rem", fontWeight: 800, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.375rem" }}>
                    Step {item.step}
                  </div>
                  <h4 style={{ color: "#fff", fontSize: "0.9375rem", marginBottom: "0.5rem" }}>{item.title}</h4>
                  <p style={{ fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.6 }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── WHY LEARN WITH US ─────────────────────────── */}
        <section className="section">
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <span className="badge badge-green" style={{ marginBottom: "0.75rem" }}>Why Data Academy</span>
              <h2>Built for Real Learning</h2>
              <p style={{ marginTop: "0.75rem", maxWidth: 520, margin: "0.75rem auto 0" }}>
                We built this platform to deliver the practical, measurable learning that data careers demand.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
              {whyLearnWith.map((item) => (
                <div key={item.title} className="card" style={{ padding: "1.5rem" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.875rem" }}>{item.icon}</div>
                  <h4 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{item.title}</h4>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PLATFORM STATS ────────────────────────────── */}
        <section className="section" style={{ background: "linear-gradient(135deg, #eff6ff, #f5f3ff)" }}>
          <div className="container" style={{ textAlign: "center" }}>
            <h2 style={{ marginBottom: "3rem" }}>Growing Together</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.5rem", maxWidth: 800, margin: "0 auto" }}>
              {[
                { value: stats.publishedCourses, label: "Published Courses" },
                { value: stats.activeLearners, label: "Active Learners" },
                { value: stats.completedEnrollments, label: "Completed Courses" },
                { value: stats.learningPaths, label: "Learning Paths" },
              ].map((stat) => (
                <div key={stat.label} className="stat-card">
                  <div className="stat-value">{stat.value === 0 ? "—" : stat.value.toLocaleString()}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
            <p style={{ marginTop: "1.5rem", fontSize: "0.8125rem", color: "var(--color-neutral-400)" }}>
              Statistics shown are live database values.
            </p>
          </div>
        </section>

        {/* ─── CTA ───────────────────────────────────────── */}
        <section className="section" style={{ background: "linear-gradient(135deg, var(--color-brand-600), var(--color-accent-600))" }}>
          <div className="container" style={{ textAlign: "center" }}>
            <h2 style={{ color: "#fff", marginBottom: "1rem" }}>Ready to Start Your Data Journey?</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "1.0625rem", marginBottom: "2rem", maxWidth: 480, margin: "0 auto 2rem" }}>
              Join thousands of learners building real data and AI skills. Create your free account today.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/register" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.875rem 2rem",
                background: "#fff",
                color: "var(--color-brand-700)",
                fontWeight: 700,
                fontSize: "1rem",
                borderRadius: "var(--radius-lg)",
                textDecoration: "none",
                boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
                transition: "all var(--transition-base)",
              }}>
                Create Free Account
              </Link>
              <Link href="/courses" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.875rem 2rem",
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1rem",
                borderRadius: "var(--radius-lg)",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.3)",
                transition: "all var(--transition-base)",
              }}>
                Browse Courses
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
