import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import NotificationsClient from "./NotificationsClient";

export const instant = false;

export const metadata = {
  title: "Notifications & Activity | AI Tech Hub Data Academy",
  description: "View coursework feedback, new material announcements, and course alerts.",
};

export default async function NotificationsPage() {
  const sessionUser = await requireUser("/notifications");
  const userId = sessionUser.id;

  const [notifications, unreadCount, userProfile] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
    prisma.userProfile.findUnique({
      where: { userId },
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
          notificationCount={unreadCount}
        />

        <main style={{ flex: 1, padding: "2.5rem 2rem", overflowX: "hidden" }}>
          <NotificationsClient
            initialNotifications={notifications}
            initialUnreadCount={unreadCount}
          />
        </main>
      </div>
    </>
  );
}
