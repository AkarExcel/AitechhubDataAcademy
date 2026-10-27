import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiAuth } from "@/lib/permissions";


// GET /api/admin/certificates - List all issued certificates & summary stats
export async function GET() {
  const authResult = await validateApiAuth(["ADMIN", "TUTOR"]);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const [certificates, totalCourses, totalStudents, completedEnrollments] =
      await Promise.all([
        prisma.certificate.findMany({
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                certificateEnabled: true,
              },
            },
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
          orderBy: { issuedAt: "desc" },
        }),
        prisma.course.count(),
        prisma.user.count({ where: { role: "STUDENT" } }),
        prisma.enrollment.count({ where: { status: "COMPLETED" } }),
      ]);

    return NextResponse.json({
      certificates,
      stats: {
        totalIssued: certificates.length,
        totalCourses,
        totalStudents,
        completedEnrollments,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin certificates:", error);
    return NextResponse.json(
      { error: "Failed to load admin certificate data." },
      { status: 500 }
    );
  }
}
