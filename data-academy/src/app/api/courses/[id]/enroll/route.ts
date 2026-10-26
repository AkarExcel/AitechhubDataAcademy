import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in to enroll." },
      { status: 401 }
    );
  }

  const { id: courseId } = await params;
  const userId = session.user.id;

  try {
    // 1. Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, slug: true, title: true, status: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    // 2. Check if enrollment already exists
    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existing) {
      // Update last accessed timestamp
      await prisma.enrollment.update({
        where: { id: existing.id },
        data: { lastAccessed: new Date() },
      });

      return NextResponse.json({
        success: true,
        alreadyEnrolled: true,
        courseSlug: course.slug,
        enrollment: existing,
      });
    }

    // 3. Create new active enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: "ACTIVE",
        progress: 0,
        lastAccessed: new Date(),
      },
    });

    // 4. Optionally create a welcome notification for student
    try {
      await prisma.notification.create({
        data: {
          userId,
          title: "Course Enrollment Confirmed",
          message: `You have successfully enrolled in "${course.title}". Start your first lesson today!`,
          type: "SYSTEM",
          link: `/learn/${course.slug}`,
        },
      });
    } catch (notifErr) {
      console.warn("Could not create enrollment notification:", notifErr);
    }

    return NextResponse.json({
      success: true,
      alreadyEnrolled: false,
      courseSlug: course.slug,
      enrollment,
    });
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json(
      { error: "Failed to enroll in course. Please try again." },
      { status: 500 }
    );
  }
}
