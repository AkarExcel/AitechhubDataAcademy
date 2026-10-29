import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getUserSupportTickets } from "@/lib/support-feedback";
import SupportClient from "./SupportClient";

export const instant = false;

export const metadata = {
  title: "Support & Help Center | AI Tech Hub Data Academy",
  description: "Get assistance with courses, code sandboxes, certificates, or platform operations.",
};

export default async function SupportPage() {
  const sessionUser = await requireUser("/support");
  const userId = sessionUser.id;

  const [initialTickets, userProfile, userCourses, unreadNotificationCount] = await Promise.all([
    getUserSupportTickets(userId),
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
          <SupportClient
            initialTickets={initialTickets}
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

