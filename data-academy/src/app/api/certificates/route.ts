import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncStudentCertificates, autoGenerateCertificate } from "@/lib/certificates";


// GET /api/certificates - Fetch logged in user's certificates & auto-generate for completed courses
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 1. Sync & auto-generate certificates for all completed courses
    const certificates = await syncStudentCertificates(userId);

    // 2. Fetch all user enrollments with course details to show progress toward other certificates
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            level: true,
            estimatedHours: true,
            completionThreshold: true,
            certificateEnabled: true,
            _count: {
              select: { modules: true },
            },
          },
        },
      },
      orderBy: { lastAccessed: "desc" },
    });

    return NextResponse.json({
      certificates,
      enrollments,
    });
  } catch (error) {
    console.error("Failed to fetch student certificates:", error);
    return NextResponse.json(
      { error: "Failed to load certificates." },
      { status: 500 }
    );
  }
}

// POST /api/certificates - Explicitly claim or generate certificate for a completed course
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { courseId } = await req.json();
    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required." },
        { status: 400 }
      );
    }

    const cert = await autoGenerateCertificate(session.user.id, courseId);
    if (!cert) {
      return NextResponse.json(
        {
          error:
            "Certificate could not be generated. Please ensure you have completed all course requirements.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      certificate: cert,
    });
  } catch (error) {
    console.error("Failed to generate certificate:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
