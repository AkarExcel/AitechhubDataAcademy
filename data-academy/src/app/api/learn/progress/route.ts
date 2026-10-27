import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const { lessonId, isComplete = true, watchedSeconds } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId is required." },
        { status: 400 }
      );
    }

    // 1. Fetch lesson and parent course
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              include: {
                modules: {
                  include: { lessons: { select: { id: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    const course = lesson.module.course;
    const courseId = course.id;

    // Collect all lesson IDs for this course
    const allCourseLessonIds = course.modules.flatMap((m) =>
      m.lessons.map((l) => l.id)
    );
    const totalLessons = allCourseLessonIds.length;

    // 2. Upsert LessonProgress
    const progressRecord = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        isComplete: Boolean(isComplete),
        completedAt: isComplete ? new Date() : null,
        ...(typeof watchedSeconds === "number" ? { watchedSeconds } : {}),
      },
      create: {
        userId,
        lessonId,
        isComplete: Boolean(isComplete),
        completedAt: isComplete ? new Date() : null,
        watchedSeconds: typeof watchedSeconds === "number" ? watchedSeconds : 0,
      },
    });

    // 3. Count total completed lessons in this course
    const completedCount = await prisma.lessonProgress.count({
      where: {
        userId,
        lessonId: { in: allCourseLessonIds },
        isComplete: true,
      },
    });

    const progressRatio = totalLessons > 0 ? completedCount / totalLessons : 0;
    const threshold = course.completionThreshold || 0.8;
    const isCourseFinished = progressRatio >= 1.0 || progressRatio >= threshold;

    // 4. Update or create Enrollment progress
    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {
        progress: progressRatio,
        lastAccessed: new Date(),
        status: isCourseFinished ? "COMPLETED" : "ACTIVE",
        completedAt: isCourseFinished ? new Date() : null,
      },
      create: {
        userId,
        courseId,
        status: isCourseFinished ? "COMPLETED" : "ACTIVE",
        progress: progressRatio,
        lastAccessed: new Date(),
        completedAt: isCourseFinished ? new Date() : null,
      },
    });

    // 5. Automatically generate certificate if course is completed
    let generatedCertificate = null;
    if (isCourseFinished) {
      try {
        const { autoGenerateCertificate } = await import("@/lib/certificates");
        generatedCertificate = await autoGenerateCertificate(userId, courseId);
      } catch (certError) {
        console.error("Automatic certificate generation error:", certError);
      }
    }

    return NextResponse.json({
      success: true,
      lessonId,
      isComplete: progressRecord.isComplete,
      completedLessons: completedCount,
      totalLessons,
      progressRatio,
      enrollmentStatus: enrollment.status,
      isCourseFinished,
      certificate: generatedCertificate
        ? {
            id: generatedCertificate.id,
            code: generatedCertificate.certificateCode,
            verificationUrl: generatedCertificate.verificationUrl,
          }
        : null,
    });
  } catch (error) {
    console.error("Failed to update lesson progress:", error);
    return NextResponse.json(
      { error: "Failed to record lesson progress." },
      { status: 500 }
    );
  }
}
