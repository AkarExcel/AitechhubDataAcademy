import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import SettingsClient from "./SettingsClient";

export const instant = false;

export const metadata = {
  title: "Profile & Settings | AI Tech Hub Data Academy",
  description: "Manage your learner profile, view academic discounts, and learning history.",
};

export default async function SettingsPage() {
  const sessionUser = await requireUser("/settings");
  const userId = sessionUser.id;

  // Fetch user, profile, enrollments and notifications concurrently
  const [user, enrollments, unreadNotifications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    }),
    prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { lastAccessed: "desc" },
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  const completedCount = enrollments.filter((e) => e.status === "COMPLETED").length;
  const activeCount = enrollments.filter((e) => e.status === "ACTIVE").length;
  const totalHours = enrollments.reduce((sum, e) => sum + (e.course?.estimatedHours || 0), 0);

  const serializedEnrollments = enrollments.map((e) => ({
    id: e.id,
    courseId: e.courseId,
    status: e.status,
    progress: e.progress,
    lastAccessed: e.lastAccessed ? e.lastAccessed.toISOString() : null,
    enrolledAt: e.enrolledAt ? e.enrolledAt.toISOString() : null,
    completedAt: e.completedAt ? e.completedAt.toISOString() : null,
    course: {
      id: e.course.id,
      title: e.course.title,
      slug: e.course.slug,
      level: e.course.level,
      estimatedHours: e.course.estimatedHours,
      categoryName: e.course.category?.name || "Data Engineering",
    },
  }));

  const userProfile = user?.profile
    ? {
        id: user.profile.id,
        userId: user.profile.userId,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        avatar: user.profile.avatar,
        bio: user.profile.bio,
        country: user.profile.country,
        timezone: user.profile.timezone,
        website: user.profile.website,
        linkedin: user.profile.linkedin,
        twitter: user.profile.twitter,
        createdAt: user.profile.createdAt.toISOString(),
      }
    : null;

  return (
    <>
      <Navbar />
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "var(--canvas-bg, #f8fafc)",
          paddingTop: "calc(var(--topbar-height) + var(--announce-height))",
        }}
      >
        <DashboardSidebar
          user={{
            email: sessionUser.email,
            name: sessionUser.name,
            role: sessionUser.role,
            profile: user?.profile,
          }}
          role={sessionUser.role}
          notificationCount={unreadNotifications}
        />

        <main style={{ flex: 1, minWidth: 0, overflowX: "hidden" }}>
          <SettingsClient
            initialUser={{
              id: sessionUser.id,
              email: sessionUser.email,
              name: sessionUser.name,
              role: sessionUser.role,
              createdAt: user?.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
            }}
            initialProfile={userProfile}
            enrollments={serializedEnrollments}
            stats={{
              completedCourses: completedCount,
              activeCourses: activeCount,
              totalEnrolled: enrollments.length,
              totalHours,
            }}
          />
        </main>
      </div>
    </>
  );
}
