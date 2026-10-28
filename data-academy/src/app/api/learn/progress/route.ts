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
    const isProgressThresholdMet = progressRatio >= 1.0 || progressRatio >= threshold;

    // Check if student has already earned a certificate or completed this course
    const [existingEnrollment, existingCert] = await Promise.all([
      prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      }),
      prisma.certificate.findUnique({
        where: { userId_courseId: { userId, courseId } },
      }),
    ]);

    // GUARANTEE: If a student already earned a certificate or previously graduated,
    // adding new material to the course NEVER demotes them or affects their certificate!
    const isAlreadyGraduated =
      existingEnrollment?.status === "COMPLETED" || Boolean(existingCert);
    const isCourseFinished = isAlreadyGraduated || isProgressThresholdMet;

    const finalCompletedAt =
      existingEnrollment?.completedAt ||
      (isCourseFinished ? new Date() : null);

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
        completedAt: finalCompletedAt,
      },
      create: {
        userId,
        courseId,
        status: isCourseFinished ? "COMPLETED" : "ACTIVE",
        progress: progressRatio,
        lastAccessed: new Date(),
        completedAt: finalCompletedAt,
      },
    });

    // 5. Coursework notification for quizzes, assignments, and practical exercises
    if (isComplete && lesson) {
      const courseworkTypes = [
        "QUIZ",
        "ASSIGNMENT",
        "PROJECT",
        "CODING_EXERCISE",
        "SQL_EXERCISE",
      ];
      if (courseworkTypes.includes(lesson.type)) {
        try {
          const { notifyStudentCoursework } = await import("@/lib/notifications");
          await notifyStudentCoursework({
            userId,
            courseTitle: course.title,
            lessonTitle: lesson.title,
            lessonType: lesson.type,
            lessonId: lesson.id,
            courseSlug: course.slug,
          });
        } catch (notifErr) {
          console.warn("Could not dispatch coursework notification:", notifErr);
        }
      }
    }

    // 6. Automatically generate certificate if course is completed
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
