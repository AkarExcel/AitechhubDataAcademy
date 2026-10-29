import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// GET /api/admin/notifications/recipients - Search/retrieve eligible students or tutors for notifications
export async function GET(req: NextRequest) {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") || "students"; // "students" | "tutors"
  const courseId = searchParams.get("courseId") || undefined;
  const search = searchParams.get("search")?.trim().toLowerCase() || "";

  const currentUser = authResult.user;
  const isAdmin = currentUser.role === "ADMIN";
  const isTutor = currentUser.role === "TUTOR";

  try {
    // ── SCOPE: TUTORS (Admin Only) ─────────────────────────────────────────
    if (scope === "tutors") {
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Only administrators can query or dispatch notifications to tutors." },
          { status: 403 }
        );
      }

      const tutors = await prisma.user.findMany({
        where: {
          OR: [{ role: "TUTOR" }, { tutorProfile: { isNot: null } }],
          isActive: true,
          ...(search
            ? {
                OR: [
                  { email: { contains: search, mode: "insensitive" } },
                  {
                    profile: {
                      OR: [
                        { firstName: { contains: search, mode: "insensitive" } },
                        { lastName: { contains: search, mode: "insensitive" } },
                      ],
                    },
                  },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          tutorProfile: {
            select: {
              headline: true,
              expertise: true,
            },
          },
          courseInstructors: {
            select: {
              course: {
                select: { id: true, title: true },
              },
            },
          },
        },
        orderBy: { email: "asc" },
        take: 50,
      });

      const formattedTutors = tutors.map((t) => {
        const name = t.profile?.firstName
          ? `${t.profile.firstName} ${t.profile.lastName || ""}`.trim()
          : t.email;
        return {
          id: t.id,
          name,
          email: t.email,
          avatar: t.profile?.avatar || null,
          headline: t.tutorProfile?.headline || "Instructor",
          courses: t.courseInstructors.map((ci) => ci.course.title),
        };
      });

      return NextResponse.json({ recipients: formattedTutors, count: formattedTutors.length });
    }

    // ── SCOPE: STUDENTS (Admin & Tutor) ────────────────────────────────────
    // If Tutor, constrain to students enrolled in courses taught by this tutor
    let allowedCourseIds: string[] | undefined = undefined;

    if (isTutor) {
      const tutorCourses = await prisma.courseInstructor.findMany({
        where: { userId: currentUser.id },
        select: { courseId: true },
      });
      allowedCourseIds = tutorCourses.map((tc) => tc.courseId);

      // If tutor has no assigned courses
      if (!allowedCourseIds.length) {
        return NextResponse.json({ recipients: [], count: 0 });
      }
    }

    // Determine target course filter
    const enrollmentWhere: any = {};
    if (courseId && courseId !== "all") {
      // If tutor, verify they teach this course
      if (isTutor && !allowedCourseIds?.includes(courseId)) {
        return NextResponse.json(
          { error: "You are not authorized to view students for this course." },
          { status: 403 }
        );
      }
      enrollmentWhere.courseId = courseId;
    } else if (isTutor && allowedCourseIds) {
      enrollmentWhere.courseId = { in: allowedCourseIds };
    }

    // If searching by student name or email
    if (search) {
      enrollmentWhere.user = {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          {
            profile: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      };
    }

    const enrollments = await prisma.enrollment.findMany({
      where: enrollmentWhere,
      select: {
        userId: true,
        progress: true,
        status: true,
        course: { select: { id: true, title: true } },
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
      take: 100,
    });

    // Deduplicate students while aggregating course information
    const studentMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        avatar: string | null;
        courses: { id: string; title: string; progress: number; status: string }[];
      }
    >();

    for (const e of enrollments) {
      const u = e.user;
      if (!studentMap.has(u.id)) {
        const name = u.profile?.firstName
          ? `${u.profile.firstName} ${u.profile.lastName || ""}`.trim()
          : u.email;
        studentMap.set(u.id, {
          id: u.id,
          name,
          email: u.email,
          avatar: u.profile?.avatar || null,
          courses: [],
        });
      }
      studentMap.get(u.id)!.courses.push({
        id: e.course.id,
        title: e.course.title,
        progress: e.progress,
        status: e.status,
      });
    }

    const recipients = Array.from(studentMap.values());

    return NextResponse.json({
      recipients,
      count: recipients.length,
    });
  } catch (error) {
    console.error("Error retrieving notification recipients:", error);
    return NextResponse.json(
      { error: "Failed to retrieve recipients." },
      { status: 500 }
    );
  }
}

