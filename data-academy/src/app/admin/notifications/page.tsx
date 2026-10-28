import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { getCourseAudienceBreakdown, getRecentBroadcasts } from "@/lib/notifications";
import StudentNotificationsClient from "./StudentNotificationsClient";

export const instant = false;

export const metadata = {
  title: "Student Notifications Dispatcher | Admin Console",
  description: "Dispatch in-app notifications directly to registered & enrolled students' notification bells.",
};

export default async function AdminStudentNotificationsPage() {
  const sessionUser = await requireRole(["TUTOR", "ADMIN"], {
    redirectUrl: "/unauthorized?required=TUTOR,ADMIN",
  });

  const [courses, initialBreakdown, recentBroadcasts] = await Promise.all([
    prisma.course.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
      },
      orderBy: { title: "asc" },
    }),
    getCourseAudienceBreakdown("all"),
    getRecentBroadcasts(20),
  ]);

  return (
    <StudentNotificationsClient
      courses={courses}
      initialBreakdown={initialBreakdown}
      initialBroadcasts={recentBroadcasts}
      currentUserRole={sessionUser.role}
      currentUserName={sessionUser.name || sessionUser.email}
    />
  );
}
