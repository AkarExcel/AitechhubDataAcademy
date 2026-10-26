import Navbar from "@/components/layout/Navbar";
import { requireTutor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate, getLevelColor, getLevelLabel } from "@/lib/utils";

export const instant = false;

async function getTutorData(userId: string) {
  try {
    const [user, tutorProfile, assignedCourses, recentEnrollments] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      }),
      prisma.tutorProfile.findUnique({
        where: { userId },
      }),
      prisma.course.findMany({
        where: {
          instructors: {
            some: { userId },
          },
        },
        include: {
          category: true,
          _count: {
            select: { modules: true, enrollments: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.enrollment.findMany({
        where: {
          course: {
            instructors: {
              some: { userId },
            },
          },
        },
        include: {
          user: { include: { profile: true } },
          course: { select: { title: true, slug: true } },
        },
        orderBy: { enrolledAt: "desc" },
        take: 6,
      }),
    ]);

    const totalStudents = assignedCourses.reduce(
      (sum, c) => sum + (c._count?.enrollments || 0),
      0
    );
    const totalModules = assignedCourses.reduce(
      (sum, c) => sum + (c._count?.modules || 0),
      0
    );

    return {
      user,
      tutorProfile,
      assignedCourses,
      recentEnrollments,
      totalStudents,
      totalModules,
    };
  } catch (error) {
    console.error("Failed to load tutor data:", error);
    return {
      user: null,
      tutorProfile: null,
      assignedCourses: [],
      recentEnrollments: [],
      totalStudents: 0,
      totalModules: 0,
    };
  }
}

export default async function TutorDashboard() {
  const sessionUser = await requireTutor({ redirectUrl: "/unauthorized?required=TUTOR" });
  const {
    user,
    tutorProfile,
    assignedCourses,
    recentEnrollments,
    totalStudents,
    totalModules,
  } = await getTutorData(sessionUser.id);

  const displayName = user?.profile?.firstName
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : sessionUser.name || "Instructor";

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "100vh", background: "var(--na-gray-50)", paddingBottom: "4rem" }}>
        {/* TOP HERO HEADER */}
        <div
          style={{
            background: "linear-gradient(135deg, var(--na-navy-900) 0%, #003a57 100%)",
            color: "#fff",
            padding: "2.5rem 0 3.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="container">
            {sessionUser.role === "ADMIN" && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.25rem 0.75rem",
                  background: "rgba(4, 159, 217, 0.2)",
                  border: "1px solid rgba(4, 159, 217, 0.4)",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  color: "var(--na-blue-300)",
                  marginBottom: "1rem",
                }}
              >
                <span>Viewing Instructor Portal as Administrator</span>
                <Link
                  href="/admin"
                  style={{ color: "#fff", textDecoration: "underline", fontWeight: 600 }}
                >
                  Admin Center →
                </Link>
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1.5rem",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--na-green-400)",
                    display: "block",
                    marginBottom: "0.35rem",
                  }}
                >
                  Instructor &amp; Tutor Portal
                </span>
                <h1 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 800, color: "#fff", margin: 0 }}>
                  Welcome, {displayName}
                </h1>
                <p style={{ marginTop: "0.35rem", color: "var(--na-gray-300)", fontSize: "0.9375rem" }}>
                  {tutorProfile?.headline || "Manage your curriculum, review active student cohorts, and create course material."}
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link
                  href="/admin/courses/new"
                  className="btn btn-primary"
                  style={{
                    background: "var(--na-green-500)",
                    borderColor: "var(--na-green-500)",
                    color: "#fff",
                    fontWeight: 700,
                    boxShadow: "0 4px 12px rgba(106, 191, 75, 0.3)",
                  }}
                >
                  + Create New Course
                </Link>
                <Link
                  href="/dashboard"
                  className="btn btn-secondary"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.2)",
                  }}
                >
                  Student Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="container" style={{ marginTop: "-2rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
              marginBottom: "2.5rem",
            }}
          >
            <div
              className="card"
              style={{
                padding: "1.5rem",
                borderRadius: "var(--radius-md)",
                background: "#fff",
                border: "1px solid var(--na-gray-200)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--na-gray-500)", textTransform: "uppercase" }}>
                Assigned Courses
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--na-navy-900)", marginTop: "0.25rem" }}>
                {assignedCourses.length}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--na-blue-500)", marginTop: "0.25rem" }}>
                Active curriculum modules
              </div>
            </div>

            <div
              className="card"
              style={{
                padding: "1.5rem",
                borderRadius: "var(--radius-md)",
                background: "#fff",
                border: "1px solid var(--na-gray-200)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--na-gray-500)", textTransform: "uppercase" }}>
                Total Students Enrolled
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--na-navy-900)", marginTop: "0.25rem" }}>
                {totalStudents}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--na-green-600)", marginTop: "0.25rem" }}>
                Across all your courses
              </div>
            </div>

            <div
              className="card"
              style={{
                padding: "1.5rem",
                borderRadius: "var(--radius-md)",
                background: "#fff",
                border: "1px solid var(--na-gray-200)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--na-gray-500)", textTransform: "uppercase" }}>
                Total Course Modules
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--na-navy-900)", marginTop: "0.25rem" }}>
                {totalModules}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)", marginTop: "0.25rem" }}>
                Hands-on learning units
              </div>
            </div>

            <div
              className="card"
              style={{
                padding: "1.5rem",
                borderRadius: "var(--radius-md)",
                background: "#fff",
                border: "1px solid var(--na-gray-200)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--na-gray-500)", textTransform: "uppercase" }}>
                Instructor Status
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--na-green-600)", marginTop: "0.5rem" }}>
                ✓ Verified Instructor
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)", marginTop: "0.25rem" }}>
                Certified teaching permissions
              </div>
            </div>
          </div>

          {/* MAIN CONTENT GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "2rem",
            }}
          >
            {/* LEFT COLUMN: ASSIGNED COURSES */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1.25rem",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--na-navy-900)", margin: 0 }}>
                    My Courses
                  </h2>
                  <p style={{ fontSize: "0.875rem", color: "var(--na-gray-500)", margin: "0.15rem 0 0" }}>
                    Courses where you are assigned as lead instructor or contributor
                  </p>
                </div>
                <Link
                  href="/admin/courses/new"
                  className="btn btn-sm btn-secondary"
                  style={{ fontSize: "0.8125rem" }}
                >
                  + Add Course
                </Link>
              </div>

              {assignedCourses.length === 0 ? (
                <div
                  className="card"
                  style={{
                    padding: "3rem 2rem",
                    textAlign: "center",
                    background: "#fff",
                    borderRadius: "var(--radius-md)",
                    border: "1px dashed var(--na-gray-300)",
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "rgba(4, 159, 217, 0.1)",
                      color: "var(--na-blue-500)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--na-navy-900)", marginBottom: "0.5rem" }}>
                    No courses assigned yet
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--na-gray-500)", maxWidth: 420, margin: "0 auto 1.5rem" }}>
                    You have not been assigned to any published courses yet. Create a new course syllabus or contact the academy administrator.
                  </p>
                  <Link href="/admin/courses/new" className="btn btn-primary btn-sm">
                    Create Your First Course
                  </Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {assignedCourses.map((course) => {
                    const isPublished = course.status === "PUBLISHED";
                    return (
                      <div
                        key={course.id}
                        className="card card-hover"
                        style={{
                          padding: "1.25rem 1.5rem",
                          background: "#fff",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--na-gray-200)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "1.5rem",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                            <span
                              style={{
                                fontSize: "0.6875rem",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                padding: "0.15rem 0.5rem",
                                borderRadius: "9999px",
                                background: isPublished ? "rgba(106, 191, 75, 0.15)" : "rgba(243, 112, 33, 0.15)",
                                color: isPublished ? "var(--na-green-600)" : "var(--na-orange-600)",
                              }}
                            >
                              {course.status}
                            </span>
                            <span
                              style={{
                                fontSize: "0.6875rem",
                                fontWeight: 600,
                                color: getLevelColor(course.level),
                              }}
                            >
                              {getLevelLabel(course.level)}
                            </span>
                            {course.category && (
                              <span style={{ fontSize: "0.75rem", color: "var(--na-gray-500)" }}>
                                • {course.category.name}
                              </span>
                            )}
                          </div>

                          <h3
                            style={{
                              fontSize: "1.0625rem",
                              fontWeight: 700,
                              color: "var(--na-navy-900)",
                              margin: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {course.title}
                          </h3>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "1.25rem",
                              marginTop: "0.5rem",
                              fontSize: "0.8125rem",
                              color: "var(--na-gray-500)",
                            }}
                          >
                            <span>
                              <strong>{course._count?.modules || 0}</strong> Modules
                            </span>
                            <span>
                              <strong>{course._count?.enrollments || 0}</strong> Students Enrolled
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, alignItems: "center" }}>
                          <Link
                            href={`/admin/courses/${course.id}`}
                            className="btn btn-sm btn-primary"
                            style={{
                              fontSize: "0.8125rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              fontWeight: 600,
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit Lessons &amp; Content
                          </Link>
                          <Link
                            href={`/courses/${course.slug}`}
                            className="btn btn-sm btn-secondary"
                            style={{
                              fontSize: "0.8125rem",
                            }}
                            target="_blank"
                          >
                            View Live ↗
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: RECENT ENROLLMENTS & PROFILE */}
            <div>
              {/* Tutor Profile Card */}
              <div
                className="card"
                style={{
                  padding: "1.5rem",
                  background: "#fff",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--na-gray-200)",
                  marginBottom: "1.5rem",
                }}
              >
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--na-navy-900)", marginBottom: "0.75rem" }}>
                  Instructor Profile
                </h3>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
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
                      fontWeight: 700,
                      fontSize: "1.125rem",
                    }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--na-navy-900)" }}>{displayName}</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)" }}>{user?.email}</div>
                  </div>
                </div>

                {tutorProfile?.expertise && tutorProfile.expertise.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--na-gray-500)", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                      Expertise Areas
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {tutorProfile.expertise.map((exp, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            background: "var(--na-gray-100)",
                            color: "var(--na-navy-900)",
                            fontWeight: 500,
                          }}
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {tutorProfile?.biography && (
                  <p style={{ fontSize: "0.8125rem", color: "var(--na-gray-600)", lineHeight: 1.5, margin: 0 }}>
                    {tutorProfile.biography}
                  </p>
                )}
              </div>

              {/* Recent Student Enrollments */}
              <div
                className="card"
                style={{
                  padding: "1.5rem",
                  background: "#fff",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--na-gray-200)",
                }}
              >
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--na-navy-900)", marginBottom: "0.75rem" }}>
                  Recent Student Enrollments
                </h3>

                {recentEnrollments.length === 0 ? (
                  <p style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)", margin: 0 }}>
                    No students have enrolled in your courses yet.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {recentEnrollments.map((e) => {
                      const studentName = e.user?.profile?.firstName
                        ? `${e.user.profile.firstName} ${e.user.profile.lastName}`
                        : e.user?.email || "Student";
                      return (
                        <div
                          key={e.id}
                          style={{
                            padding: "0.5rem 0",
                            borderBottom: "1px solid var(--na-gray-100)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--na-navy-900)" }}>
                              {studentName}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--na-gray-500)" }}>
                              {e.course.title}
                            </div>
                          </div>
                          <span style={{ fontSize: "0.6875rem", color: "var(--na-gray-400)", whiteSpace: "nowrap" }}>
                            {formatDate(e.enrolledAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
