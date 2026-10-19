import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate, formatDuration } from "@/lib/utils";

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

export default async function StudentDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { user, enrollments, notifications, recentProgress, completedCount } =
    await getDashboardData(session.user.id);

  const firstName = user?.profile?.firstName || "Learner";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-neutral-50)" }}>
      {/* Sidebar */}
      <aside className="sidebar" style={{ position: "relative", minHeight: "auto", width: 240, flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: "1.25rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              background: "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-500))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: "0.875rem",
            }}>
              DA
            </div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.9375rem" }}>Data Academy</span>
          </Link>
        </div>

        {/* User info */}
        <div style={{ padding: "1rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--color-brand-600), var(--color-accent-500))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.875rem",
              flexShrink: 0,
            }}>
              {firstName[0].toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ color: "#fff", fontSize: "0.875rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.profile?.firstName} {user?.profile?.lastName}
              </div>
              <div style={{ color: "var(--color-neutral-400)", fontSize: "0.75rem" }}>Student</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "0.75rem 0.5rem", flex: 1 }}>
          {[
            { href: "/dashboard", icon: "🏠", label: "Overview", active: true },
            { href: "/my-learning", icon: "🎓", label: "My Learning" },
            { href: "/courses", icon: "📚", label: "Course Catalog" },
            { href: "/paths", icon: "🗺️", label: "Learning Paths" },
            { href: "/assignments", icon: "📝", label: "Assignments" },
            { href: "/assessments", icon: "✅", label: "Assessments" },
            { href: "/projects", icon: "🏗️", label: "Projects" },
            { href: "/certificates", icon: "🏆", label: "Certificates" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${item.active ? "active" : ""}`}
            >
              <span style={{ fontSize: "1rem" }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom links */}
        <div style={{ padding: "0.75rem 0.5rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/notifications" className="sidebar-nav-item" style={{ position: "relative" }}>
            <span style={{ fontSize: "1rem" }}>🔔</span>
            <span>Notifications</span>
            {notifications.length > 0 && (
              <span style={{
                marginLeft: "auto",
                minWidth: 20,
                height: 20,
                borderRadius: "999px",
                background: "var(--color-danger)",
                color: "#fff",
                fontSize: "0.6875rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
              }}>
                {notifications.length}
              </span>
            )}
          </Link>
          <Link href="/settings" className="sidebar-nav-item">
            <span style={{ fontSize: "1rem" }}>⚙️</span>
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "2rem", overflowX: "hidden" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.625rem", marginBottom: "0.25rem" }}>
            {greeting}, {firstName}! 👋
          </h1>
          <p style={{ color: "var(--color-neutral-500)", fontSize: "0.9375rem" }}>
            {enrollments.length > 0
              ? `You have ${enrollments.length} course${enrollments.length !== 1 ? "s" : ""} in progress.`
              : "You haven't enrolled in any courses yet. Browse the catalog to get started!"}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { icon: "📚", value: enrollments.length, label: "In Progress", color: "var(--color-brand-600)" },
            { icon: "✅", value: completedCount, label: "Completed", color: "var(--color-success)" },
            { icon: "🔔", value: notifications.length, label: "Notifications", color: "var(--color-warning)" },
            { icon: "🏆", value: 0, label: "Certificates", color: "#8b5cf6" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="card"
              style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}
            >
              <div style={{ fontSize: "1.5rem" }}>{stat.icon}</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: stat.color, letterSpacing: "-0.03em" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--color-neutral-500)", fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* My Courses */}
        <section style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Continue Learning</h2>
            <Link href="/my-learning" style={{ fontSize: "0.875rem", color: "var(--color-brand-600)", fontWeight: 600 }}>
              View all →
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎓</div>
              <h3 style={{ fontSize: "1.125rem", marginBottom: "0.5rem" }}>No courses yet</h3>
              <p style={{ marginBottom: "1.5rem", color: "var(--color-neutral-500)" }}>
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
                      background: "linear-gradient(135deg, var(--color-brand-700), var(--color-accent-500))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "2.5rem",
                    }}>
                      {course.coverImage ? (
                        <img src={course.coverImage} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : "📊"}
                    </div>

                    <div style={{ padding: "1rem" }}>
                      <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                        {course.title}
                      </h3>
                      <p style={{ fontSize: "0.8125rem", color: "var(--color-neutral-500)", marginBottom: "0.875rem" }}>
                        by {instructorName}
                      </p>

                      {/* Progress */}
                      <div style={{ marginBottom: "0.875rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--color-neutral-500)", marginBottom: "0.375rem" }}>
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
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>Recent Activity</h2>
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
                      borderBottom: i < recentProgress.length - 1 ? "1px solid var(--color-neutral-100)" : "none",
                    }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "var(--color-brand-50)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      ✅
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-neutral-900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {progress.lesson.title}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-neutral-400)" }}>
                        {progress.lesson.module.course.title}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-neutral-400)", flexShrink: 0 }}>
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
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>Explore More</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
            {[
              { href: "/courses", icon: "📚", title: "Browse Courses", desc: "Find your next course" },
              { href: "/paths", icon: "🗺️", title: "Learning Paths", desc: "Follow a structured path" },
              { href: "/certificates", icon: "🏆", title: "Certificates", desc: "View your achievements" },
              { href: "/settings", icon: "👤", title: "Profile", desc: "Update your details" },
            ].map((item) => (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <div className="card card-hover" style={{ padding: "1.25rem" }}>
                  <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-neutral-900)", marginBottom: "0.25rem" }}>{item.title}</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-neutral-500)" }}>{item.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
