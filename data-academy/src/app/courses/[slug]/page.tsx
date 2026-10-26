import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import EnrollButton from "@/components/EnrollButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLevelColor, getLevelLabel, formatDuration } from "@/lib/utils";

export const instant = false;

async function getCourse(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
    include: {
      category: true,
      instructors: {
        include: {
          user: { include: { profile: true } },
          tutor: true,
        },
      },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
      _count: {
        select: { enrollments: true, modules: true },
      },
    },
  });
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourse(slug);

  if (!course) {
    notFound();
  }

  const primaryInstructor = course.instructors.find((i) => i.isPrimary) || course.instructors[0];
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  const session = await auth();
  const isEnrolled = session?.user?.id
    ? !!(await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: course.id,
          },
        },
      }))
    : false;

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "var(--nav-offset, var(--topbar-height))", minHeight: "100vh", background: "var(--na-gray-50)" }}>
        {/* Course Hero Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, var(--na-navy-900) 0%, var(--na-navy-800) 100%)",
            color: "#fff",
            padding: "3.5rem 0 3rem",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="container">
            <div style={{ maxWidth: 860 }}>
              {/* Breadcrumb */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", fontSize: "0.8125rem", color: "var(--na-gray-400)" }}>
                <Link href="/" style={{ color: "var(--na-blue-300)", textDecoration: "none" }}>Home</Link>
                <span>/</span>
                <Link href="/courses" style={{ color: "var(--na-blue-300)", textDecoration: "none" }}>Courses</Link>
                <span>/</span>
                <span>{course.category?.name || "Catalog"}</span>
              </div>

              {/* Badges */}
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
                <span className={`badge ${getLevelColor(course.level)}`}>
                  {getLevelLabel(course.level)}
                </span>
                {course.isFree ? (
                  <span className="badge badge-green">Free Course</span>
                ) : (
                  <span className="badge badge-blue">${course.price}</span>
                )}
                <span className="badge badge-gray">{totalLessons} Lessons</span>
              </div>

              <h1 style={{ color: "#fff", fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 800, marginBottom: "1rem", letterSpacing: "-0.02em" }}>
                {course.title}
              </h1>

              <p style={{ fontSize: "1.0625rem", color: "var(--na-gray-300)", lineHeight: 1.6, marginBottom: "2rem" }}>
                {course.shortDescription}
              </p>

              {/* Primary Actions */}
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                <EnrollButton
                  courseId={course.id}
                  courseSlug={course.slug}
                  isEnrolled={isEnrolled}
                  isFree={course.isFree}
                  price={course.price}
                  variant="hero"
                />

                <span style={{ fontSize: "0.8125rem", color: "var(--na-gray-400)" }}>
                  {course._count.enrollments > 0 ? `${course._count.enrollments} learners enrolled` : "Open for self-paced enrollment"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body Grid */}
        <div className="container" style={{ padding: "3rem 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.65fr 1fr", gap: "2.5rem", alignItems: "flex-start" }}>
            {/* Left Column: Syllabus & Learning Outcomes */}
            <div>
              {/* Learning Outcomes */}
              {course.learningOutcomes.length > 0 && (
                <div className="card" style={{ padding: "1.75rem", marginBottom: "2rem" }}>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1b2533", marginBottom: "1rem" }}>
                    What You Will Learn
                  </h2>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    {course.learningOutcomes.map((outcome, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem", color: "var(--na-gray-700)" }}>
                        <span style={{ color: "var(--na-green-500)", fontWeight: 700 }}>&#10003;</span>
                        <span>{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Description */}
              <div className="card" style={{ padding: "1.75rem", marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1b2533", marginBottom: "1rem" }}>
                  Course Overview
                </h2>
                <div style={{ color: "var(--na-gray-700)", lineHeight: 1.7, fontSize: "0.9375rem", whiteSpace: "pre-line" }}>
                  {course.fullDescription}
                </div>
              </div>

              {/* Curriculum Modules */}
              <div className="card" style={{ padding: "1.75rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1b2533", marginBottom: "0.5rem" }}>
                  Course Curriculum
                </h2>
                <p style={{ fontSize: "0.84375rem", color: "var(--na-gray-500)", marginBottom: "1.5rem" }}>
                  {course.modules.length} Modules &bull; {totalLessons} Lessons &bull; {course.estimatedHours} Hours of Practical Content
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {course.modules.map((m, mIdx) => (
                    <div
                      key={m.id}
                      style={{
                        border: "1px solid var(--na-gray-200)",
                        borderRadius: "var(--radius-md)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          background: "var(--na-gray-50)",
                          padding: "1rem 1.25rem",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottom: m.lessons.length > 0 ? "1px solid var(--na-gray-200)" : "none",
                        }}
                      >
                        <div>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--na-blue-600)", textTransform: "uppercase" }}>
                            Module {mIdx + 1}
                          </span>
                          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1b2533", margin: "0.15rem 0 0" }}>
                            {m.title}
                          </h3>
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--na-gray-500)", fontWeight: 600 }}>
                          {m.lessons.length} lessons
                        </span>
                      </div>

                      <div style={{ padding: "0.5rem 1rem" }}>
                        {m.lessons.map((lesson, lIdx) => (
                          <div
                            key={lesson.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "0.5rem 0",
                              borderBottom: lIdx !== m.lessons.length - 1 ? "1px solid var(--na-gray-100)" : "none",
                              fontSize: "0.84375rem",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ fontSize: "0.6875rem", padding: "0.1rem 0.35rem", background: "rgba(4, 159, 217, 0.1)", color: "var(--na-blue-600)", fontWeight: 700, borderRadius: "3px" }}>
                                {lesson.type}
                              </span>
                              <span style={{ color: "var(--na-gray-800)" }}>{lesson.title}</span>
                              {lesson.isPreview && (
                                <span style={{ fontSize: "0.6875rem", color: "var(--na-green-600)", fontWeight: 600 }}>
                                  (Preview Available)
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: "0.75rem", color: "var(--na-gray-400)" }}>
                              {lesson.estimatedMinutes} min
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Key Details & Instructor Card */}
            <div>
              {/* Quick Info Card */}
              <div className="card" style={{ padding: "1.75rem", marginBottom: "1.75rem" }}>
                <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#1b2533", marginBottom: "1rem" }}>
                  Course At A Glance
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", fontSize: "0.875rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--na-gray-100)", paddingBottom: "0.5rem" }}>
                    <span style={{ color: "var(--na-gray-500)" }}>Duration</span>
                    <strong style={{ color: "#1b2533" }}>{formatDuration(course.estimatedHours)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--na-gray-100)", paddingBottom: "0.5rem" }}>
                    <span style={{ color: "var(--na-gray-500)" }}>Modules</span>
                    <strong style={{ color: "#1b2533" }}>{course.modules.length}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--na-gray-100)", paddingBottom: "0.5rem" }}>
                    <span style={{ color: "var(--na-gray-500)" }}>Lessons</span>
                    <strong style={{ color: "#1b2533" }}>{totalLessons}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--na-gray-100)", paddingBottom: "0.5rem" }}>
                    <span style={{ color: "var(--na-gray-500)" }}>Difficulty</span>
                    <strong style={{ color: "#1b2533" }}>{getLevelLabel(course.level)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--na-gray-100)", paddingBottom: "0.5rem" }}>
                    <span style={{ color: "var(--na-gray-500)" }}>Certificate</span>
                    <strong style={{ color: "var(--na-green-600)" }}>
                      {course.certificateEnabled ? "Verifiable Digital Credential" : "Not Included"}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--na-gray-500)" }}>Access</span>
                    <strong style={{ color: "#1b2533" }}>Lifetime Online Access</strong>
                  </div>
                </div>

                <div style={{ marginTop: "1.5rem" }}>
                  <EnrollButton
                    courseId={course.id}
                    courseSlug={course.slug}
                    isEnrolled={isEnrolled}
                    isFree={course.isFree}
                    price={course.price}
                    variant="sidebar"
                  />
                </div>
              </div>

              {/* Instructor Profile Card */}
              {primaryInstructor && (
                <div className="card" style={{ padding: "1.75rem" }}>
                  <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#1b2533", marginBottom: "1rem" }}>
                    Lead Instructor
                  </h3>

                  <div style={{ display: "flex", gap: "0.875rem", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--na-navy-800), var(--na-blue-500))",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "1.125rem",
                      }}
                    >
                      {primaryInstructor.user.profile?.firstName?.[0] || "I"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: "#1b2533" }}>
                        {primaryInstructor.user.profile?.firstName} {primaryInstructor.user.profile?.lastName}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--na-gray-500)" }}>
                        {primaryInstructor.tutor?.headline || "Data Academy Educator"}
                      </div>
                    </div>
                  </div>

                  {primaryInstructor.user.profile?.bio && (
                    <p style={{ fontSize: "0.8125rem", color: "var(--na-gray-600)", lineHeight: 1.6 }}>
                      {primaryInstructor.user.profile.bio}
                    </p>
                  )}
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
