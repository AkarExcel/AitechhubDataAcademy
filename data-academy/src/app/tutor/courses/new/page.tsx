import { requireTutor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import TutorNewCourseClient from "./TutorNewCourseClient";

export const instant = false;

export default async function TutorNewCoursePage() {
  const sessionUser = await requireTutor({
    redirectUrl: "/unauthorized?required=TUTOR",
  });

  const [categories, tutorProfile] = await Promise.all([
    prisma.courseCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.tutorProfile.findUnique({
      where: { userId: sessionUser.id },
    }),
  ]);

  const isVerified = sessionUser.role === "ADMIN" || Boolean(tutorProfile?.isApproved);

  return (
    <TutorNewCourseClient
      categories={categories}
      isVerified={isVerified}
    />
  );
}

