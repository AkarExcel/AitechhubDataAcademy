import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/permissions";
import {
  notifyCourseStudents,
  getCourseAudienceBreakdown,
  getRecentBroadcasts,
  AudienceSegment,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

// GET /api/admin/notifications/broadcast - Retrieve audience metrics and broadcast logs
export async function GET(req: NextRequest) {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId") || undefined;

  try {
    const [breakdown, recentBroadcasts, courses] = await Promise.all([
      getCourseAudienceBreakdown(courseId),
      getRecentBroadcasts(12),
      prisma.course.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          _count: { select: { enrollments: true, modules: true } },
        },
        orderBy: { title: "asc" },
      }),
    ]);

    return NextResponse.json({
      breakdown,
      recentBroadcasts,
      courses,
    });
  } catch (error) {
    console.error("Error fetching broadcast metrics:", error);
    return NextResponse.json(
      { error: "Failed to load broadcast metrics." },
      { status: 500 }
    );
  }
}

// POST /api/admin/notifications/broadcast - Broadcast course update to target students & alumni
export async function POST(req: NextRequest) {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const body = await req.json();
    const {
      courseId,
      title,
      message,
      link,
      type = "ANNOUNCEMENT",
      audience = "ALL",
      includeCompleted = true,
    } = body;

    if (!courseId || !title || !message) {
      return NextResponse.json(
        { error: "courseId, title, and message are required." },
        { status: 400 }
      );
    }

    let defaultLink = link;

    if (courseId !== "all") {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true, slug: true },
      });

      if (!course) {
        return NextResponse.json({ error: "Course not found." }, { status: 404 });
      }

      if (!defaultLink) {
        defaultLink = `/learn/${course.slug}`;
      }
    } else {
      if (!defaultLink) {
        defaultLink = "/my-learning";
      }
    }

    const res = await notifyCourseStudents({
      courseId,
      title,
      message,
      link: defaultLink,
      type,
      audience: audience as AudienceSegment,
      includeCompleted,
      senderId: authResult.user.id,
    });

    return NextResponse.json({
      success: true,
      notifiedStudents: res.count,
      totalEnrolled: res.totalEnrolled,
      audience,
    });
  } catch (error) {
    console.error("Course broadcast error:", error);
    return NextResponse.json(
      { error: "Failed to broadcast notification." },
      { status: 500 }
    );
  }
}
