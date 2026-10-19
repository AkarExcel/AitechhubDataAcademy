import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getLevelColor, getLevelLabel, formatDuration, truncate } from "@/lib/utils";

interface SearchParams {
  level?: string;
  category?: string;
  search?: string;
  free?: string;
}

async function getCourses(params: SearchParams) {
  const where: Record<string, unknown> = { status: "PUBLISHED" };

  if (params.level && ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(params.level)) {
    where.level = params.level;
  }
  if (params.category) {
    where.category = { slug: params.category };
  }
  if (params.free === "true") {
    where.isFree = true;
  }
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { shortDescription: { contains: params.search, mode: "insensitive" } },
      { tags: { has: params.search } },
    ];
  }

  const [courses, categories, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: {
        category: true,
        instructors: {
          where: { isPrimary: true },
          include: { user: { include: { profile: true } } },
          take: 1,
        },
        _count: { select: { modules: true, enrollments: true } },
      },
      orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.courseCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.course.count({ where: { status: "PUBLISHED" } }),
  ]);

  return { courses, categories, total };
}

export const metadata = {
  title: "Course Catalog",
  description: "Browse all Data Science, AI, and Machine Learning courses available on Data Academy.",
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await Promise.resolve(searchParams);
  const { courses, categories, total } = await getCourses(params);

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "var(--topbar-height)", minHeight: "100vh" }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, var(--color-neutral-900), #1e1b4b)",
          padding: "4rem 0 3rem",
          textAlign: "center",
        }}>
          <div className="container">
            <span className="badge badge-blue" style={{ marginBottom: "0.75rem" }}>
              {total} Courses Available
            </span>
            <h1 style={{ color: "#fff", fontSize: "clamp(2rem, 5vw, 3rem)", marginBottom: "0.75rem" }}>
              Explore Our Courses
            </h1>
            <p style={{ color: "#94a3b8", maxWidth: 540, margin: "0 auto" }}>
              Structured courses built around practical skills in Data Science, Analytics, AI, and Machine Learning.
            </p>

            {/* Search bar */}
            <form style={{ marginTop: "2rem", display: "flex", gap: "0.5rem", maxWidth: 520, margin: "2rem auto 0" }}>
              <input
                type="text"
                name="search"
                defaultValue={params.search}
                placeholder="Search courses…"
                className="input"
                style={{ flex: 1, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
              />
              <button type="submit" className="btn btn-primary">Search</button>
            </form>
          </div>
        </div>

        <div className="container" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {/* Filters sidebar */}
            <aside style={{ width: 240, flexShrink: 0 }}>
              <div className="card" style={{ padding: "1.25rem", position: "sticky", top: "calc(var(--topbar-height) + 1rem)" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-neutral-500)", marginBottom: "1rem" }}>
                  Filters
                </h3>

                {/* Level */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>Level</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    {[
                      { value: "", label: "All Levels" },
                      { value: "BEGINNER", label: "Beginner" },
                      { value: "INTERMEDIATE", label: "Intermediate" },
                      { value: "ADVANCED", label: "Advanced" },
                    ].map((opt) => (
                      <a
                        key={opt.value}
                        href={`/courses?${new URLSearchParams({ ...params, level: opt.value }).toString()}`}
                        style={{
                          display: "block",
                          padding: "0.375rem 0.625rem",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.875rem",
                          fontWeight: params.level === opt.value || (!params.level && !opt.value) ? 600 : 400,
                          color: params.level === opt.value || (!params.level && !opt.value)
                            ? "var(--color-brand-600)"
                            : "var(--color-neutral-600)",
                          background: params.level === opt.value || (!params.level && !opt.value)
                            ? "var(--color-brand-50)"
                            : "transparent",
                          textDecoration: "none",
                        }}
                      >
                        {opt.label}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>Category</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      <a
                        href={`/courses?${new URLSearchParams({ ...params, category: "" }).toString()}`}
                        style={{
                          display: "block",
                          padding: "0.375rem 0.625rem",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.875rem",
                          color: !params.category ? "var(--color-brand-600)" : "var(--color-neutral-600)",
                          fontWeight: !params.category ? 600 : 400,
                          textDecoration: "none",
                        }}
                      >
                        All Categories
                      </a>
                      {categories.map((cat) => (
                        <a
                          key={cat.id}
                          href={`/courses?${new URLSearchParams({ ...params, category: cat.slug }).toString()}`}
                          style={{
                            display: "block",
                            padding: "0.375rem 0.625rem",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.875rem",
                            color: params.category === cat.slug ? "var(--color-brand-600)" : "var(--color-neutral-600)",
                            fontWeight: params.category === cat.slug ? 600 : 400,
                            textDecoration: "none",
                          }}
                        >
                          {cat.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Free filter */}
                <div>
                  <a
                    href={`/courses?${new URLSearchParams({ ...params, free: params.free === "true" ? "" : "true" }).toString()}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.875rem",
                      color: params.free === "true" ? "var(--color-brand-600)" : "var(--color-neutral-600)",
                      fontWeight: params.free === "true" ? 600 : 400,
                      textDecoration: "none",
                    }}
                  >
                    <span style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: `2px solid ${params.free === "true" ? "var(--color-brand-500)" : "var(--color-neutral-300)"}`,
                      background: params.free === "true" ? "var(--color-brand-500)" : "transparent",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {params.free === "true" && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                    Free only
                  </a>
                </div>
              </div>
            </aside>

            {/* Course grid */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <p style={{ fontSize: "0.875rem", color: "var(--color-neutral-500)" }}>
                  {courses.length} course{courses.length !== 1 ? "s" : ""} found
                </p>
              </div>

              {courses.length === 0 ? (
                <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
                  <h3 style={{ marginBottom: "0.5rem" }}>No courses found</h3>
                  <p style={{ marginBottom: "1.5rem" }}>Try adjusting your search or filters.</p>
                  <Link href="/courses" className="btn btn-secondary">Clear Filters</Link>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
                  {courses.map((course) => {
                    const instructor = course.instructors[0]?.user;
                    const name = instructor?.profile
                      ? `${instructor.profile.firstName} ${instructor.profile.lastName}`
                      : "Data Academy";

                    return (
                      <Link key={course.id} href={`/courses/${course.slug}`} style={{ textDecoration: "none" }}>
                        <div className="card card-hover">
                          {/* Thumbnail */}
                          <div style={{
                            height: 170,
                            background: "linear-gradient(135deg, var(--color-brand-700), var(--color-accent-500))",
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "2.5rem",
                          }}>
                            {course.coverImage ? (
                              <img src={course.coverImage} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : "📊"}
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
                            {course.isFeatured && (
                              <div style={{ position: "absolute", bottom: "0.75rem", right: "0.75rem" }}>
                                <span className="badge badge-amber">Featured</span>
                              </div>
                            )}
                          </div>

                          <div style={{ padding: "1.125rem" }}>
                            <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.375rem", color: "var(--color-neutral-900)" }}>
                              {course.title}
                            </h3>
                            <p style={{ fontSize: "0.8125rem", color: "var(--color-neutral-500)", marginBottom: "0.875rem", lineHeight: 1.6 }}>
                              {truncate(course.shortDescription, 90)}
                            </p>

                            <div style={{ fontSize: "0.8125rem", color: "var(--color-neutral-500)", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                              <span>👤 {name}</span>
                              <span>📚 {course._count.modules} modules</span>
                              {course.estimatedHours > 0 && <span>⏱ {formatDuration(course.estimatedHours)}</span>}
                              <span>👥 {course._count.enrollments} enrolled</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
