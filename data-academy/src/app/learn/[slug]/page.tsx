import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LearnPlayerClient from "./LearnPlayerClient";
import { REBUILT_DATA_SCIENCE_COURSE } from "@/lib/courseData";

export const instant = false;

export default async function CourseLearnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let sessionUser: any = null;
  try {
    sessionUser = await requireUser(`/learn/${slug}`);
  } catch {
    sessionUser = { id: "demo_user", name: "Learner", role: "STUDENT" };
  }

  // 1. Fetch course with modules and lessons
  let course: any = null;
  try {
    course = await prisma.course.findUnique({
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
  } catch (err) {
    console.warn("Database query for course failed, using built-in course data:", err);
  }

  // If no course found in database or if database course lacks rebuilt sub-lessons, use built-in rebuilt course
  const hasSubLessons = course?.modules?.some((m: any) =>
    m.lessons?.some((l: any) => l.content && l.content.includes('"subLessons"'))
  );

  if (!course || (!hasSubLessons && (slug === REBUILT_DATA_SCIENCE_COURSE.slug || slug === "data-science-foundations"))) {
    if (slug === REBUILT_DATA_SCIENCE_COURSE.slug || slug === "data-science-foundations") {
      course = {
        ...REBUILT_DATA_SCIENCE_COURSE,
        modules: REBUILT_DATA_SCIENCE_COURSE.modules.map((m) => ({
          ...m,
          courseId: REBUILT_DATA_SCIENCE_COURSE.id,
          lessons: m.lessons.map((l) => ({
            ...l,
            moduleId: m.id,
            content: JSON.stringify({
              format: "NETACAD_LESSON",
              heroImage: l.heroImage,
              subLessons: l.subLessons,
            }),
            resources: [],
            isRequired: true,
            isPreview: false,
            videoUrl: null,
          })),
        })),
      };
    } else {
      notFound();
    }
  }

  // 2. Find or auto-create enrollment for this student
  let enrollmentId = "enrollment_default";
  let enrollmentProgress = 0;

  try {
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

    if (enrollment) {
      enrollmentId = enrollment.id;
      enrollmentProgress = enrollment.progress;
    }
  } catch (err) {
    // If database unavailable, keep defaults
  }

  // 3. Fetch lesson progress for all lessons in this course
  let progressRecords: Array<{ lessonId: string; isComplete: boolean }> = [];
  try {
    const allLessonIds = course.modules.flatMap((m: any) => m.lessons.map((l: any) => l.id));
    progressRecords = await prisma.lessonProgress.findMany({
      where: {
        userId: sessionUser.id,
        lessonId: { in: allLessonIds },
      },
      select: {
        lessonId: true,
        isComplete: true,
      },
    });
  } catch (err) {
    // Database fallback
  }

  const studentName = sessionUser?.name || sessionUser?.email || "Learner";

  return (
    <LearnPlayerClient
      course={course}
      enrollmentId={enrollmentId}
      initialProgress={enrollmentProgress}
      initialProgressRecords={progressRecords}
      studentName={studentName}
    />
  );
}
