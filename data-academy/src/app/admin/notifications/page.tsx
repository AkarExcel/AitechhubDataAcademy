import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { getCourseAudienceBreakdown, getRecentBroadcasts } from "@/lib/notifications";
import StudentNotificationsClient from "./StudentNotificationsClient";

export const instant = false;

export const metadata = {
  title: "Notifications Dispatcher | Admin & Tutor Center",
  description: "Dispatch notifications directly to students, course cohorts, and instructors.",
};

export default async function AdminStudentNotificationsPage() {
  const sessionUser = await requireRole(["TUTOR", "ADMIN"], {
    redirectUrl: "/unauthorized?required=TUTOR,ADMIN",
  });

  const isTutor = sessionUser.role === "TUTOR";
  const isAdmin = sessionUser.role === "ADMIN";

  // If tutor, only show courses they instruct. If admin, show all courses.
  const courseFilter = isTutor
    ? { instructors: { some: { userId: sessionUser.id } } }
    : {};

  const [courses, recentBroadcasts, tutors] = await Promise.all([
    prisma.course.findMany({
      where: courseFilter,
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
    isAdmin
      ? prisma.user.findMany({
          where: {
            OR: [{ role: "TUTOR" }, { tutorProfile: { isNot: null } }],
            isActive: true,
          },
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            tutorProfile: {
              select: {
                headline: true,
                expertise: true,
              },
            },
            courseInstructors: {
              select: {
                course: {
                  select: { id: true, title: true },
                },
              },
            },
          },
          orderBy: { email: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const initialCourseId = isTutor ? (courses[0]?.id || "none") : "all";
  const initialBreakdown = await getCourseAudienceBreakdown(
    initialCourseId === "none" ? undefined : initialCourseId
  );

  const formattedTutors = tutors.map((t) => ({
    id: t.id,
    name: t.profile?.firstName
      ? `${t.profile.firstName} ${t.profile.lastName || ""}`.trim()
      : t.email,
    email: t.email,
    avatar: t.profile?.avatar || null,
    headline: t.tutorProfile?.headline || "Instructor",
    courses: t.courseInstructors.map((ci) => ci.course.title),
  }));

  return (
    <StudentNotificationsClient
      courses={courses}
      initialBreakdown={initialBreakdown}
      initialBroadcasts={recentBroadcasts}
      currentUserRole={sessionUser.role}
      currentUserName={sessionUser.name || sessionUser.email}
      initialTutors={formattedTutors}
    />
  );
}
