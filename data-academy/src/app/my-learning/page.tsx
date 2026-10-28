import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import MyLearningClient from "./MyLearningClient";

export const instant = false;

export const metadata = {
  title: "My Learning | AI Tech Hub Data Academy",
  description: "Track your active courses, learning progress, achievements, and upcoming coursework.",
};

export default async function MyLearningPage() {
  const sessionUser = await requireUser("/my-learning");
  const userId = sessionUser.id;

  // Fetch student enrollments, certificates/achievements, categories, and notification counts
  const [enrollments, certificates, categories, allCourses, unreadNotifications, userRecord] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            category: true,
            modules: {
              include: {
                lessons: {
                  select: { id: true, title: true, type: true, estimatedMinutes: true },
                },
              },
            },
          },
        },
      },
      orderBy: { lastAccessed: "desc" },
    }),
    prisma.certificate.findMany({
      where: { userId },
      include: { course: { select: { title: true, slug: true } } },
      orderBy: { issuedAt: "desc" },
      take: 5,
    }),
    prisma.courseCategory.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      include: { category: true },
      take: 6,
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    }),
  ]);

  const serializedEnrollments = enrollments.map((e) => ({
    id: e.id,
    courseId: e.courseId,
    status: e.status,
    progress: Math.round(e.progress || 0),
    enrolledAt: e.enrolledAt ? e.enrolledAt.toISOString() : null,
    completedAt: e.completedAt ? e.completedAt.toISOString() : null,
    lastAccessed: e.lastAccessed ? e.lastAccessed.toISOString() : null,
    course: {
      id: e.course.id,
      title: e.course.title,
      slug: e.course.slug,
      shortDescription: e.course.shortDescription,
      coverImage: e.course.coverImage,
      level: e.course.level,
      estimatedHours: e.course.estimatedHours,
      categoryName: e.course.category?.name || "Data Engineering",
      categoryId: e.course.categoryId,
    },
  }));

  const serializedCertificates = certificates.map((c) => ({
    id: c.id,
    certificateCode: c.certificateCode,
    issueDate: c.issuedAt.toISOString(),
    courseTitle: c.course.title,
    courseSlug: c.course.slug,
  }));

  const serializedPublishedCourses = allCourses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    shortDescription: c.shortDescription,
    coverImage: c.coverImage,
    level: c.level,
    estimatedHours: c.estimatedHours,
    categoryName: c.category?.name || "Data Engineering",
    categoryId: c.categoryId,
  }));

  return (
    <>
      <Navbar />
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "#ffffff",
          paddingTop: "calc(var(--topbar-height) + var(--announce-height))",
        }}
      >
        <DashboardSidebar
          user={{
            email: sessionUser.email,
            name: sessionUser.name,
            role: sessionUser.role,
            profile: userRecord?.profile,
          }}
          role={sessionUser.role}
          notificationCount={unreadNotifications}
        />

        <main style={{ flex: 1, minWidth: 0, overflowX: "hidden" }}>
          <MyLearningClient
            enrollments={serializedEnrollments}
            certificates={serializedCertificates}
            categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
            availableCourses={serializedPublishedCourses}
            userName={userRecord?.profile?.firstName || sessionUser.name || "Learner"}
          />
        </main>
      </div>
    </>
  );
}
