import { requireTutor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import TutorCoursesClient from "./TutorCoursesClient";

export const instant = false;

export default async function TutorCoursesPage() {
  const sessionUser = await requireTutor({
    redirectUrl: "/unauthorized?required=TUTOR",
  });

  const [courses, tutorProfile] = await Promise.all([
    prisma.course.findMany({
      where: {
        instructors: {
          some: { userId: sessionUser.id },
        },
      },
      include: {
        category: true,
        _count: {
          select: { modules: true, enrollments: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.tutorProfile.findUnique({
      where: { userId: sessionUser.id },
    }),
  ]);

  const isVerified = sessionUser.role === "ADMIN" || Boolean(tutorProfile?.isApproved);

  return (
    <TutorCoursesClient
      initialCourses={courses as any}
      isVerified={isVerified}
    />
  );
}

