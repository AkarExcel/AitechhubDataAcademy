import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiAuth } from "@/lib/permissions";
import { z } from "zod";

const assignInstructorSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  isPrimary: z.boolean().default(false),
});

// GET /api/admin/courses/[id]/instructors - List instructors
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { id: courseId } = await params;

  try {
    const instructors = await prisma.courseInstructor.findMany({
      where: { courseId },
      include: {
        user: { include: { profile: true } },
        tutor: true,
      },
    });

    return NextResponse.json({ instructors });
  } catch (error) {
    console.error("Get instructors error:", error);
    return NextResponse.json({ error: "Failed to load course instructors." }, { status: 500 });
  }
}

// POST /api/admin/courses/[id]/instructors - Assign instructor
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { id: courseId } = await params;

  try {
    const body = await req.json();
    const parsed = assignInstructorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid instructor assignment." },
        { status: 400 }
      );
    }

    const { userId, isPrimary } = parsed.data;

    // Fetch tutor profile if exists
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
    });

    // If setting as primary, demote any other existing primary instructor
    if (isPrimary) {
      await prisma.courseInstructor.updateMany({
        where: { courseId },
        data: { isPrimary: false },
      });
    }

    const assignment = await prisma.courseInstructor.upsert({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
      update: {
        tutorId: tutorProfile?.id || null,
        isPrimary,
      },
      create: {
        courseId,
        userId,
        tutorId: tutorProfile?.id || null,
        isPrimary,
      },
      include: {
        user: { include: { profile: true } },
        tutor: true,
      },
    });

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error) {
    console.error("Assign instructor error:", error);
    return NextResponse.json({ error: "Failed to assign instructor." }, { status: 500 });
  }
}

// DELETE /api/admin/courses/[id]/instructors - Remove instructor
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { id: courseId } = await params;

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query parameter is required." }, { status: 400 });
    }

    await prisma.courseInstructor.delete({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true, message: "Instructor removed from course." });
  } catch (error) {
    console.error("Remove instructor error:", error);
    return NextResponse.json({ error: "Failed to remove instructor." }, { status: 500 });
  }
}
