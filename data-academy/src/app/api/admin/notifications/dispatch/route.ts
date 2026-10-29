import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/permissions";
import {
  notifyCourseStudents,
  sendSpecializedStudentNotification,
  sendTutorNotification,
  AudienceSegment,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

// POST /api/admin/notifications/dispatch
// Universal dispatcher for Course Broadcasts, 1-on-1 Student Notifications, and Tutor Notifications
export async function POST(req: NextRequest) {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const currentUser = authResult.user;
  const isAdmin = currentUser.role === "ADMIN";
  const isTutor = currentUser.role === "TUTOR";

  try {
    const body = await req.json();
    const {
      mode = "COURSE_BROADCAST", // "COURSE_BROADCAST" | "SPECIALIZED_STUDENT" | "ALL_TUTORS" | "INDIVIDUAL_TUTOR"
      courseId,
      studentId,
      tutorId,
      tutorIds,
      audience = "ALL",
      title,
      message,
      link,
      type = "ANNOUNCEMENT",
      specializedType = "DIRECT_MESSAGE",
      includeCompleted = true,
    } = body;

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Title and message are required." },
        { status: 400 }
      );
    }

    const senderName = currentUser.name || currentUser.email;

    // ── 1. MODE: ALL_TUTORS (Admin Only) ──────────────────────────────────
    if (mode === "ALL_TUTORS") {
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Only administrators can send notifications to tutors." },
          { status: 403 }
        );
      }

      const result = await sendTutorNotification({
        title,
        message,
        link: link?.trim() || "/tutor",
        type,
        senderId: currentUser.id,
        senderName,
        tutorId: "all",
      });

      return NextResponse.json({
        success: true,
        mode: "ALL_TUTORS",
        recipientCount: result.count,
        targetName: "All Faculty & Instructors",
      });
    }

    // ── 2. MODE: INDIVIDUAL_TUTOR / SELECTED_TUTORS (Admin Only) ──────────
    if (mode === "INDIVIDUAL_TUTOR" || mode === "SELECTED_TUTORS") {
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Only administrators can send notifications to tutors." },
          { status: 403 }
        );
      }

      const ids = tutorIds && Array.isArray(tutorIds) && tutorIds.length > 0
        ? tutorIds
        : tutorId
        ? [tutorId]
        : [];

      if (!ids.length) {
        return NextResponse.json(
          { error: "At least one target instructor must be selected." },
          { status: 400 }
        );
      }

      const result = await sendTutorNotification({
        title,
        message,
        link: link?.trim() || "/tutor",
        type,
        senderId: currentUser.id,
        senderName,
        tutorIds: ids,
      });

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        mode: "INDIVIDUAL_TUTOR",
        recipientCount: result.count,
        targetName: result.targetName || `${ids.length} Instructor(s)`,
      });
    }

    // ── 3. MODE: SPECIALIZED_STUDENT (Admin & Tutor) ──────────────────────
    if (mode === "SPECIALIZED_STUDENT") {
      if (!studentId) {
        return NextResponse.json(
          { error: "Target studentId is required for specialized notification." },
          { status: 400 }
        );
      }

      // If tutor, verify student is enrolled in at least one course taught by this tutor
      if (isTutor) {
        const hasSharedCourse = await prisma.enrollment.findFirst({
          where: {
            userId: studentId,
            course: {
              instructors: {
                some: { userId: currentUser.id },
              },
            },
          },
        });

        if (!hasSharedCourse) {
          return NextResponse.json(
            { error: "You can only send specialized notifications to students enrolled in your courses." },
            { status: 403 }
          );
        }
      }

      const result = await sendSpecializedStudentNotification({
        studentId,
        title,
        message,
        link: link?.trim() || "/my-learning",
        type,
        senderId: currentUser.id,
        senderName,
        senderRole: currentUser.role,
        courseId: courseId && courseId !== "all" ? courseId : undefined,
        specializedType,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        mode: "SPECIALIZED_STUDENT",
        recipientCount: 1,
        targetName: result.studentName || "Student",
        studentEmail: result.studentEmail,
      });
    }

    // ── 4. MODE: COURSE_BROADCAST (Admin & Tutor) ─────────────────────────
    if (mode === "COURSE_BROADCAST") {
      const targetCourseId = courseId || "all";

      // If Tutor, verify they teach the selected course
      if (isTutor) {
        if (targetCourseId === "all") {
          return NextResponse.json(
            { error: "Tutors must select one of their assigned courses to broadcast." },
            { status: 400 }
          );
        }

        const isInstructor = await prisma.courseInstructor.findUnique({
          where: {
            courseId_userId: {
              courseId: targetCourseId,
              userId: currentUser.id,
            },
          },
        });

        if (!isInstructor) {
          return NextResponse.json(
            { error: "You are not an assigned instructor for this course." },
            { status: 403 }
          );
        }
      }

      let defaultLink = link?.trim();
      if (!defaultLink) {
        if (targetCourseId !== "all") {
          const course = await prisma.course.findUnique({
            where: { id: targetCourseId },
            select: { slug: true },
          });
          defaultLink = course ? `/learn/${course.slug}` : "/my-learning";
        } else {
          defaultLink = "/my-learning";
        }
      }

      const broadcastRes = await notifyCourseStudents({
        courseId: targetCourseId,
        title,
        message,
        link: defaultLink,
        type,
        audience: audience as AudienceSegment,
        includeCompleted,
        senderId: currentUser.id,
      });

      return NextResponse.json({
        success: true,
        mode: "COURSE_BROADCAST",
        recipientCount: broadcastRes.count,
        totalEnrolled: broadcastRes.totalEnrolled,
        audience,
      });
    }

    return NextResponse.json({ error: "Invalid dispatch mode." }, { status: 400 });
  } catch (error) {
    console.error("Dispatch notification error:", error);
    return NextResponse.json(
      { error: "Failed to dispatch notification." },
      { status: 500 }
    );
  }
}

