import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CourseCard from "@/components/CourseCard";
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

export const instant = false;

export const metadata = {
  title: "Course Catalog",
  description: "Browse all Data Science, AI, and Machine Learning courses available on Data Academy.",
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { courses, categories, total } = await getCourses(params);

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "var(--topbar-height)", minHeight: "100vh" }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, var(--na-navy-900) 0%, var(--na-navy-800) 100%)",
          padding: "4rem 0 3.5rem",
          textAlign: "center",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div className="container">
            <span className="badge badge-blue" style={{ marginBottom: "0.75rem" }}>
              {total} Courses Available
            </span>
            <h1 style={{ color: "#fff", fontSize: "clamp(2rem, 5vw, 3rem)", marginBottom: "0.75rem" }}>
              Explore Our Courses
            </h1>
            <p style={{ color: "var(--na-gray-300)", maxWidth: 540, margin: "0 auto" }}>
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
                style={{ flex: 1, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
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
                <h3 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--na-gray-500)", marginBottom: "1rem" }}>
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
                            ? "var(--na-blue-500)"
                            : "var(--na-gray-600)",
                          background: params.level === opt.value || (!params.level && !opt.value)
                            ? "#e0f2fe"
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
                          color: !params.category ? "var(--na-blue-500)" : "var(--na-gray-600)",
                          fontWeight: !params.category ? 600 : 400,
                          background: !params.category ? "#e0f2fe" : "transparent",
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
                            color: params.category === cat.slug ? "var(--na-blue-500)" : "var(--na-gray-600)",
                            fontWeight: params.category === cat.slug ? 600 : 400,
                            background: params.category === cat.slug ? "#e0f2fe" : "transparent",
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
                      color: params.free === "true" ? "var(--na-green-600)" : "var(--na-gray-600)",
                      fontWeight: params.free === "true" ? 600 : 400,
                      textDecoration: "none",
                    }}
                  >
                    <span style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: `2px solid ${params.free === "true" ? "var(--na-green-500)" : "var(--na-gray-300)"}`,
                      background: params.free === "true" ? "var(--na-green-500)" : "transparent",
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
                <p style={{ fontSize: "0.875rem", color: "var(--na-gray-500)" }}>
                  {courses.length} course{courses.length !== 1 ? "s" : ""} found
                </p>
              </div>

              {courses.length === 0 ? (
                <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--na-gray-100)", color: "var(--na-gray-500)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </div>
                  <h3 style={{ marginBottom: "0.5rem" }}>No courses found</h3>
                  <p style={{ marginBottom: "1.5rem", color: "var(--na-gray-500)" }}>Try adjusting your search or filters.</p>
                  <Link href="/courses" className="btn btn-secondary">Clear Filters</Link>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: "1.5rem" }}>
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
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
