import { prisma } from "@/lib/prisma";
import { requireTutor } from "@/lib/permissions";
import { getCourseAudienceBreakdown, getRecentBroadcasts } from "@/lib/notifications";
import StudentNotificationsClient from "@/app/admin/notifications/StudentNotificationsClient";

export const instant = false;

export const metadata = {
  title: "Faculty Notifications | Tutor Hub",
  description: "Dispatch notifications to course cohorts and send specialized feedback to students.",
};

export default async function TutorNotificationsPage() {
  const sessionUser = await requireTutor({
    redirectUrl: "/unauthorized?required=TUTOR",
  });

  const [courses, recentBroadcasts] = await Promise.all([
    prisma.course.findMany({
      where: {
        instructors: {
          some: { userId: sessionUser.id },
        },
      },
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
    getRecentBroadcasts(20),
  ]);

  const defaultCourseId = courses[0]?.id || "all";
  const initialBreakdown = await getCourseAudienceBreakdown(defaultCourseId);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <StudentNotificationsClient
        courses={courses}
        initialBreakdown={initialBreakdown}
        initialBroadcasts={recentBroadcasts}
        currentUserRole={sessionUser.role}
        currentUserName={sessionUser.name}
        initialTutors={[]}
      />
    </div>
  );
}
