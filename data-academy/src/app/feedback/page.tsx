import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getUserFeedback } from "@/lib/support-feedback";
import FeedbackClient from "./FeedbackClient";

export const instant = false;

export const metadata = {
  title: "Feedback & Course Reviews | AI Tech Hub Data Academy",
  description: "Share your thoughts, rate your learning experience, and help us improve.",
};

export default async function FeedbackPage() {
  const sessionUser = await requireUser("/feedback");
  const userId = sessionUser.id;

  const [initialFeedback, userProfile, userCourses, unreadNotificationCount] = await Promise.all([
    getUserFeedback(userId),
    prisma.userProfile.findUnique({
      where: { userId },
    }),
    sessionUser.role === "TUTOR"
      ? prisma.courseInstructor.findMany({
          where: { userId },
          select: { course: { select: { id: true, title: true } } },
        }).then((res) => res.map((r) => r.course))
      : prisma.enrollment.findMany({
          where: { userId },
          select: { course: { select: { id: true, title: true } } },
        }).then((res) => res.map((r) => r.course)),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  return (
    <>
      <Navbar />
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "var(--na-gray-50, #f8fafc)",
          paddingTop: "calc(var(--topbar-height) + var(--announce-height))",
        }}
      >
        <DashboardSidebar
          user={{
            email: sessionUser.email,
            name: sessionUser.name,
            role: sessionUser.role,
            profile: userProfile,
          }}
          role={sessionUser.role}
          notificationCount={unreadNotificationCount}
        />

        <main style={{ flex: 1, padding: "2.5rem 2rem", overflowX: "hidden" }}>
          <FeedbackClient
            initialFeedback={initialFeedback}
            userRole={sessionUser.role}
            userName={sessionUser.name || sessionUser.email}
            userEmail={sessionUser.email}
            userCourses={userCourses}
          />
        </main>
      </div>
    </>
  );
}

