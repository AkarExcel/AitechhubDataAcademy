import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { syncStudentCertificates } from "@/lib/certificates";
import CertificatesClient from "./CertificatesClient";

export const instant = false;

export const metadata = {
  title: "My Certificates | AI Tech Hub Data Academy",
  description: "View, share, and verify your official course completion certificates.",
};

export default async function CertificatesPage() {
  const sessionUser = await requireUser("/certificates");

  const userId = sessionUser.id;

  // 1. Sync & automatically generate certificates for any completed courses
  const certificates = await syncStudentCertificates(userId);

  // 2. Fetch student's enrollments & notification counts
  const [enrollments, notifications, userProfile] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            level: true,
            estimatedHours: true,
            completionThreshold: true,
            certificateEnabled: true,
          },
        },
      },
      orderBy: { lastAccessed: "desc" },
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
    prisma.userProfile.findUnique({
      where: { userId },
    }),
  ]);

  const userName = userProfile
    ? `${userProfile.firstName} ${userProfile.lastName}`.trim()
    : sessionUser.email.split("@")[0];

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
          notificationCount={notifications}
        />

        <main style={{ flex: 1, padding: "2.5rem 2rem", overflowX: "hidden" }}>
          <CertificatesClient
            initialCertificates={certificates}
            enrollments={enrollments}
            userName={userName}
          />
        </main>
      </div>
    </>
  );
}
