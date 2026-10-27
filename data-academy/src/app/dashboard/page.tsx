import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

async function getDashboardData(userId: string) {
  const [user, enrollments, notifications, recentProgress] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    }),
    prisma.enrollment.findMany({
      where: { userId, status: "ACTIVE" },
      include: {
        course: {
          include: {
            modules: { include: { lessons: true } },
            instructors: {
              where: { isPrimary: true },
              include: { user: { include: { profile: true } } },
              take: 1,
            },
          },
        },
      },
      orderBy: { lastAccessed: "desc" },
      take: 6,
    }),
    prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.lessonProgress.findMany({
      where: { userId, isComplete: true },
      orderBy: { completedAt: "desc" },
      take: 5,
      include: { lesson: { include: { module: { include: { course: true } } } } },
    }),
  ]);

  const completedCount = await prisma.enrollment.count({
    where: { userId, status: "COMPLETED" },
  });

  return { user, enrollments, notifications, recentProgress, completedCount };
}

export const instant = false;

export default async function StudentDashboard() {
  const sessionUser = await requireUser("/dashboard");

  const { user, enrollments, notifications, recentProgress, completedCount } =
    await getDashboardData(sessionUser.id);

  const firstName = user?.profile?.firstName || "Learner";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <Navbar />
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "var(--na-gray-50)",
          paddingTop: "calc(var(--topbar-height) + var(--announce-height))",
        }}
      >
        {/* Dashboard Sidebar (Minimized by default, animated expand) */}
        <DashboardSidebar
          user={user}
          role={sessionUser.role}
          notificationCount={notifications.length}
        />

      {/* Main content */}
      <main style={{ flex: 1, padding: "2rem", overflowX: "hidden" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.625rem", marginBottom: "0.25rem", color: "var(--na-gray-900)" }}>
            {greeting}, {firstName}
          </h1>
          <p style={{ color: "var(--na-gray-500)", fontSize: "0.9375rem" }}>
            {enrollments.length > 0
              ? `You have ${enrollments.length} course${enrollments.length !== 1 ? "s" : ""} in progress.`
              : "You haven't enrolled in any courses yet. Browse the catalog to get started!"}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            {
              value: enrollments.length,
              label: "In Progress",
              color: "var(--na-blue-500)",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              ),
            },
            {
              value: completedCount,
              label: "Completed",
              color: "var(--na-green-500)",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 11 3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              ),
            },
            {
              value: notifications.length,
              label: "Notifications",
              color: "var(--na-amber)",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              ),
            },
            {
              value: 0,
              label: "Certificates",
              color: "#005073",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              ),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="card"
              style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}
            >
              <div style={{ color: stat.color }}>{stat.icon}</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: stat.color, letterSpacing: "-0.03em" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)", fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* My Courses */}
        <section style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--na-gray-900)" }}>Continue Learning</h2>
            <Link href="/my-learning" style={{ fontSize: "0.875rem", color: "var(--na-blue-500)", fontWeight: 600 }}>
              View all →
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--na-gray-100)", color: "var(--na-gray-500)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <h3 style={{ fontSize: "1.125rem", marginBottom: "0.5rem", color: "var(--na-gray-900)" }}>No courses yet</h3>
              <p style={{ marginBottom: "1.5rem", color: "var(--na-gray-500)" }}>
                Explore the course catalog and enroll in a course to begin your learning journey.
              </p>
              <Link href="/courses" className="btn btn-primary">
                Browse Courses
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {enrollments.map((enrollment) => {
                const course = enrollment.course;
                const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
                const instructor = course.instructors[0]?.user;
                const instructorName = instructor?.profile
                  ? `${instructor.profile.firstName} ${instructor.profile.lastName}`
                  : "Data Academy";

                return (
                  <div key={enrollment.id} className="card card-hover">
                    {/* Thumbnail */}
                    <div style={{
                      height: 140,
                      background: "linear-gradient(135deg, var(--na-navy-800), var(--na-blue-600))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "hidden",
                    }}>
                      {course.coverImage ? (
                        <img src={course.coverImage} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "rgba(255,255,255,0.85)" }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" />
                            <line x1="8" y1="21" x2="16" y2="21" />
                            <line x1="12" y1="17" x2="12" y2="21" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div style={{ padding: "1rem" }}>
                      <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.25rem", color: "var(--na-gray-900)" }}>
                        {course.title}
                      </h3>
                      <p style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)", marginBottom: "0.875rem" }}>
                        by {instructorName}
                      </p>

                      {/* Progress */}
                      <div style={{ marginBottom: "0.875rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--na-gray-500)", marginBottom: "0.375rem" }}>
                          <span>{Math.round(enrollment.progress * 100)}% complete</span>
                          <span>{totalLessons} lessons</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${enrollment.progress * 100}%` }} />
                        </div>
                      </div>

                      <Link
                        href={`/learn/${course.slug}`}
                        className="btn btn-primary btn-sm"
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        {enrollment.progress > 0 ? "Continue Learning" : "Start Course"}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        {recentProgress.length > 0 && (
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem", color: "var(--na-gray-900)" }}>Recent Activity</h2>
            <div className="card">
              <div style={{ padding: "0 0.5rem" }}>
                {recentProgress.map((progress, i) => (
                  <div
                    key={progress.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.875rem",
                      padding: "0.875rem 0.5rem",
                      borderBottom: i < recentProgress.length - 1 ? "1px solid var(--na-gray-100)" : "none",
                    }}
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--na-green-50)",
                      color: "var(--na-green-600)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 8.5l3.5 3.5 6.5-8" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {progress.lesson.title}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--na-gray-400)" }}>
                        {progress.lesson.module.course.title}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--na-gray-400)", flexShrink: 0 }}>
                      {progress.completedAt ? formatDate(progress.completedAt) : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Quick actions */}
        <section>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem", color: "var(--na-gray-900)" }}>Explore More</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
            {[
              {
                href: "/courses",
                title: "Browse Courses",
                desc: "Find your next course",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                ),
              },
              {
                href: "/paths",
                title: "Learning Paths",
                desc: "Follow a structured path",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                  </svg>
                ),
              },
              {
                href: "/certificates",
                title: "Certificates",
                desc: "View your achievements",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="6" />
                    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                  </svg>
                ),
              },
              {
                href: "/settings",
                title: "Profile",
                desc: "Update your details",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="7" r="4" />
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  </svg>
                ),
              },
            ].map((item) => (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <div className="card card-hover" style={{ padding: "1.25rem", height: "100%" }}>
                  <div style={{ color: "var(--na-blue-500)", marginBottom: "0.625rem" }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--na-gray-900)", marginBottom: "0.25rem" }}>{item.title}</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)" }}>{item.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  </>
  );
}
