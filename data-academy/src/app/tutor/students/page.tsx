import { requireTutor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import TutorStudentsClient from "./TutorStudentsClient";

export const instant = false;

export const metadata = {
  title: "My Students | Tutor Hub",
  description: "View and manage enrolled students across your courses.",
};

export default async function TutorStudentsPage() {
  const sessionUser = await requireTutor({
    redirectUrl: "/unauthorized?required=TUTOR",
  });

  const [enrollments, courses] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        course: {
          instructors: {
            some: { userId: sessionUser.id },
          },
        },
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    }),
    prisma.course.findMany({
      where: {
        instructors: {
          some: { userId: sessionUser.id },
        },
      },
      select: {
        id: true,
        title: true,
      },
      orderBy: { title: "asc" },
    }),
  ]);

  const formattedEnrollments = enrollments.map((e) => {
    const studentName = e.user.profile
      ? `${e.user.profile.firstName} ${e.user.profile.lastName}`.trim()
      : e.user.email.split("@")[0];

    return {
      id: e.id,
      userId: e.userId,
      studentName: studentName || "Student",
      studentEmail: e.user.email,
      courseId: e.courseId,
      courseTitle: e.course.title,
      courseSlug: e.course.slug,
      status: e.status as "ACTIVE" | "COMPLETED" | "CANCELLED",
      progress: e.progress || 0,
      enrolledAt: e.enrolledAt.toISOString(),
      completedAt: e.completedAt ? e.completedAt.toISOString() : null,
      lastAccessed: e.lastAccessed ? e.lastAccessed.toISOString() : null,
    };
  });

  return (
    <TutorStudentsClient
      initialEnrollments={formattedEnrollments}
      courses={courses}
    />
  );
}

