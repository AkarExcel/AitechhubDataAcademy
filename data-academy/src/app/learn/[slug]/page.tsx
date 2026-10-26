import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LearnPlayerClient from "./LearnPlayerClient";

export const instant = false;

export default async function CourseLearnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sessionUser = await requireUser(`/learn/${slug}`);

  // 1. Fetch course with modules and lessons
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: {
              resources: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  // 2. Find or auto-create enrollment for this student
  let enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: sessionUser.id,
        courseId: course.id,
      },
    },
  });

  if (!enrollment) {
    enrollment = await prisma.enrollment.create({
      data: {
        userId: sessionUser.id,
        courseId: course.id,
        status: "ACTIVE",
        progress: 0,
        lastAccessed: new Date(),
      },
    });
  } else {
    // Update last accessed
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { lastAccessed: new Date() },
    });
  }

  // 3. Fetch lesson progress for all lessons in this course
  const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const progressRecords = await prisma.lessonProgress.findMany({
    where: {
      userId: sessionUser.id,
      lessonId: { in: allLessonIds },
    },
    select: {
      lessonId: true,
      isComplete: true,
    },
  });

  const studentName = sessionUser.name || "Learner";

  return (
    <LearnPlayerClient
      course={course}
      enrollmentId={enrollment.id}
      initialProgress={enrollment.progress}
      initialProgressRecords={progressRecords}
      studentName={studentName}
    />
  );
}
