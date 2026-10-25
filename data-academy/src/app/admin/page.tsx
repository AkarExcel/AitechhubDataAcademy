import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getLevelColor, getLevelLabel } from "@/lib/utils";

export const instant = false;

async function getAdminOverviewData() {
  const [
    totalCourses,
    publishedCourses,
    draftCourses,
    totalModules,
    totalLessons,
    totalTutors,
    totalEnrollments,
    recentCourses,
    tutors,
  ] = await Promise.all([
    prisma.course.count(),
    prisma.course.count({ where: { status: "PUBLISHED" } }),
    prisma.course.count({ where: { status: "DRAFT" } }),
    prisma.module.count(),
    prisma.lesson.count(),
    prisma.tutorProfile.count({ where: { isApproved: true } }),
    prisma.enrollment.count(),
    prisma.course.findMany({
      take: 8,
      orderBy: { updatedAt: "desc" },
      include: {
        category: true,
        instructors: {
          include: {
            user: { include: { profile: true } },
          },
        },
        _count: {
          select: {
            modules: true,
            enrollments: true,
          },
        },
      },
    }),
    prisma.tutorProfile.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        user: { include: { profile: true } },
        courseInstructors: true,
      },
    }),
  ]);

  return {
    stats: {
      totalCourses,
      publishedCourses,
      draftCourses,
      totalModules,
      totalLessons,
      totalTutors,
      totalEnrollments,
    },
    recentCourses,
    tutors,
  };
}

export default async function AdminDashboardPage() {
  const { stats, recentCourses, tutors } = await getAdminOverviewData();

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Top Banner / Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1b2533", marginBottom: "0.25rem" }}>
            Admin Overview
          </h1>
          <p style={{ color: "var(--na-gray-600)", fontSize: "0.9375rem" }}>
            Monitor curriculum, courses, instructors, and platform content.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link
            href="/admin/courses/new"
            className="btn btn-green"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1.25rem",
              borderRadius: "9999px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create New Course
          </Link>
          <Link
            href="/admin/courses"
            className="btn btn-secondary"
            style={{
              padding: "0.625rem 1.25rem",
              borderRadius: "9999px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Manage All Courses
          </Link>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2.5rem",
        }}
      >
        {/* Card 1: Courses */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--na-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Courses
            </span>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                background: "rgba(4, 159, 217, 0.12)",
                color: "var(--na-blue-500)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </span>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1b2533", letterSpacing: "-0.02em" }}>
            {stats.totalCourses}
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)", marginTop: "0.35rem" }}>
            <strong style={{ color: "var(--na-green-600)" }}>{stats.publishedCourses}</strong> Published &bull;{" "}
            <strong style={{ color: "var(--na-warning)" }}>{stats.draftCourses}</strong> Drafts
          </div>
        </div>

        {/* Card 2: Curriculum Units */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--na-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Curriculum Lessons
            </span>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                background: "rgba(106, 191, 75, 0.12)",
                color: "var(--na-green-600)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 11 3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </span>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1b2533", letterSpacing: "-0.02em" }}>
            {stats.totalLessons}
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)", marginTop: "0.35rem" }}>
            Across <strong>{stats.totalModules}</strong> structured modules
          </div>
        </div>

        {/* Card 3: Instructors */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--na-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Active Tutors
            </span>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                background: "rgba(243, 112, 33, 0.12)",
                color: "#f37021",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1b2533", letterSpacing: "-0.02em" }}>
            {stats.totalTutors}
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)", marginTop: "0.35rem" }}>
            Approved platform educators
          </div>
        </div>

        {/* Card 4: Enrollments */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--na-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Enrollments
            </span>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                background: "rgba(99, 102, 241, 0.12)",
                color: "#6366f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1b2533", letterSpacing: "-0.02em" }}>
            {stats.totalEnrollments}
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)", marginTop: "0.35rem" }}>
            Students learning across catalog
          </div>
        </div>
      </div>

      {/* Courses Management Table */}
      <div className="card" style={{ padding: "1.75rem", marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1b2533" }}>
              Course Catalog Operations
            </h2>
            <p style={{ fontSize: "0.84375rem", color: "var(--na-gray-500)" }}>
              Manage curriculum, publish status, and instructor assignments
            </p>
          </div>
          <Link href="/admin/courses" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--na-blue-500)" }}>
            View Full List ({stats.totalCourses}) &rarr;
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--na-gray-200)", color: "var(--na-gray-500)" }}>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Course</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Category</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Level</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Curriculum</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Students</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "0.75rem 1rem", fontWeight: 600, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentCourses.map((c) => {
                const statusColor =
                  c.status === "PUBLISHED"
                    ? "badge-green"
                    : c.status === "DRAFT"
                    ? "badge-amber"
                    : "badge-gray";

                return (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--na-gray-100)" }}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: "6px",
                            background: "linear-gradient(135deg, var(--na-navy-800), var(--na-blue-600))",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {c.coverImage ? (
                            <img src={c.coverImage} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.8125rem" }}>
                              {c.title.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#1b2533" }}>{c.title}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--na-gray-400)" }}>/{c.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "1rem", color: "var(--na-gray-700)" }}>
                      {c.category?.name || "General"}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span className={`badge ${getLevelColor(c.level)}`}>
                        {getLevelLabel(c.level)}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", color: "var(--na-gray-700)" }}>
                      <strong>{c._count.modules}</strong> modules
                    </td>
                    <td style={{ padding: "1rem", color: "var(--na-gray-700)" }}>
                      {c._count.enrollments} learners
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span className={`badge ${statusColor}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <Link
                          href={`/admin/courses/${c.id}`}
                          className="btn btn-secondary"
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/courses/${c.slug}`}
                          target="_blank"
                          className="btn btn-ghost"
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tutors Snapshot */}
      <div className="card" style={{ padding: "1.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1b2533" }}>
              Active Instructors &amp; Tutors
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)" }}>
              Faculty members assigned to deliver curriculum and assess learners
            </p>
          </div>
          <Link href="/admin/tutors" style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--na-blue-500)" }}>
            View All Tutors &rarr;
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
          {tutors.map((t) => (
            <div
              key={t.id}
              style={{
                border: "1px solid var(--na-gray-200)",
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                display: "flex",
                gap: "0.875rem",
                alignItems: "center",
              }}
            >
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
                  fontSize: "1rem",
                  flexShrink: 0,
                }}
              >
                {t.user.profile?.firstName?.[0] || "T"}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontWeight: 600, color: "#1b2533", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.user.profile?.firstName} {t.user.profile?.lastName}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--na-gray-500)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.headline || "Instructor"}
                </div>
                <div style={{ fontSize: "0.6875rem", color: "var(--na-green-600)", fontWeight: 600, marginTop: "0.15rem" }}>
                  {t.isApproved ? "Approved Educator" : "Pending Review"} &bull; {t.courseInstructors.length} courses
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
