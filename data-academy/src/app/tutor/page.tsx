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

  const isVerified = sessionUser.role === "ADMIN" || Boolean(tutorProfile?.isApproved);

  const displayName = user?.profile?.firstName
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : sessionUser.name || "Instructor";

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: "3rem" }}>
      {/* TOP HERO HEADER */}
      <div
        style={{
          background: "linear-gradient(135deg, var(--na-navy-900) 0%, #003a57 100%)",
          color: "#fff",
          padding: "2rem",
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(0, 24, 48, 0.15)",
          marginBottom: "2rem",
        }}
      >
        <div>
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--na-green-400)",
                  }}
                >
                  Faculty Portal
                </span>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.5rem",
                    borderRadius: 999,
                    background: isVerified ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                    color: isVerified ? "#34d399" : "#fbbf24",
                    border: isVerified ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(245, 158, 11, 0.4)",
                  }}
                >
                  {isVerified ? "✓ Verified Educator" : "⏳ Verification Pending"}
                </span>
              </div>
              <h1 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 800, color: "#fff", margin: 0 }}>
                Welcome back, {displayName}
              </h1>
              <p style={{ marginTop: "0.35rem", color: "var(--na-gray-300)", fontSize: "0.9375rem" }}>
                {tutorProfile?.headline || "Manage your curriculum, review active student cohorts, and create course material."}
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link
                href="/tutor/notifications"
                className="btn btn-secondary"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.3)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  fontWeight: 700,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span>Dispatch Alert</span>
              </Link>
              <Link
                href="/tutor/courses/new"
                className="btn btn-primary"
                style={{
                  background: isVerified ? "var(--na-green-500)" : "#64748b",
                  borderColor: isVerified ? "var(--na-green-500)" : "#64748b",
                  color: "#fff",
                  fontWeight: 700,
                  boxShadow: isVerified ? "0 4px 12px rgba(106, 191, 75, 0.3)" : "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                {!isVerified && <span>🔒</span>}
                <span>+ Create Course</span>
              </Link>
              <Link
                href="/tutor/courses"
                className="btn btn-secondary"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.2)",
                }}
              >
                My Courses ({assignedCourses.length})
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* METRICS ROW */}
      <div style={{ marginBottom: "2.5rem" }}>
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
                  href="/tutor/courses/new"
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
                  <Link href="/tutor/courses/new" className="btn btn-primary btn-sm">
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
                            href={`/tutor/courses/${course.id}`}
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
              {/* Student Outreach & Specialised Notifications Card */}
              <div
                className="card"
                style={{
                  padding: "1.5rem",
                  background: "linear-gradient(135deg, #001830 0%, #003a57 100%)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  marginBottom: "1.5rem",
                  boxShadow: "0 6px 20px rgba(0, 24, 48, 0.15)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--na-green-400)",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "#fff" }}>
                    Student Outreach Center
                  </h3>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "var(--na-gray-300)", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                  Send specialised 1-on-1 feedback, assignment review guidance, or broadcast course updates to your students.
                </p>
                <Link
                  href="/admin/notifications"
                  className="btn btn-sm btn-primary"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.8125rem",
                    background: "var(--na-green-500)",
                    borderColor: "var(--na-green-500)",
                    color: "#fff",
                  }}
                >
                  📢 Open Notification Dispatcher &rarr;
                </Link>
              </div>

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

              {/* Faculty Help & Feedback */}
              <div
                className="card"
                style={{
                  padding: "1.25rem 1.5rem",
                  background: "#fff",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--na-gray-200)",
                  marginTop: "1.5rem",
                }}
              >
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--na-navy-900)", marginBottom: "0.35rem" }}>
                  Instructor Support &amp; Feedback
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)", margin: "0 0 0.85rem 0", lineHeight: 1.45 }}>
                  Need help with course sandboxes or curriculum reviews? Have suggestions to improve the teaching experience?
                </p>
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <Link
                    href="/support"
                    className="btn btn-sm btn-secondary"
                    style={{ flex: 1, justifyContent: "center", fontSize: "0.75rem", fontWeight: 700 }}
                  >
                    🎫 Help Desk
                  </Link>
                  <Link
                    href="/feedback"
                    className="btn btn-sm btn-secondary"
                    style={{ flex: 1, justifyContent: "center", fontSize: "0.75rem", fontWeight: 700 }}
                  >
                    ⭐ Feedback
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
