import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiAuth } from "@/lib/permissions";
import { z } from "zod";

const courseUpdateSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  slug: z.string().min(3).max(140).regex(/^[a-z0-9-]+$/).optional(),
  shortDescription: z.string().min(10).max(280).optional(),
  fullDescription: z.string().min(20).optional(),
  categoryId: z.string().optional().nullable(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  estimatedHours: z.number().min(0).optional(),
  price: z.number().min(0).optional(),
  isFree: z.boolean().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  isFeatured: z.boolean().optional(),
  coverImage: z.string().optional().nullable(),
  prerequisites: z.array(z.string()).optional(),
  learningOutcomes: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  certificateEnabled: z.boolean().optional(),
  completionThreshold: z.number().min(0).max(1).optional(),
});

// GET /api/admin/courses/[id] - Fetch course details with modules & lessons
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { id } = await params;

  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        instructors: {
          include: {
            user: { include: { profile: true } },
            tutor: true,
          },
        },
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                type: true,
                order: true,
                isRequired: true,
                isPreview: true,
                estimatedMinutes: true,
                videoUrl: true,
                content: true,
                learningObjectives: true,
                updatedAt: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Admin course detail GET error:", error);
    return NextResponse.json({ error: "Failed to load course details." }, { status: 500 });
  }
}

// PUT /api/admin/courses/[id] - Update course details
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = courseUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid update data." },
        { status: 400 }
      );
    }

    // If slug is changing, verify uniqueness
    if (parsed.data.slug) {
      const existing = await prisma.course.findFirst({
        where: {
          slug: parsed.data.slug,
          NOT: { id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: `Slug '${parsed.data.slug}' is already taken by another course.` },
          { status: 409 }
        );
      }
    }

    // If non-admin tutor is updating, verify instructor assignment and disallow publishing
    if (authResult.user.role !== "ADMIN") {
      const isInstructor = await prisma.courseInstructor.findFirst({
        where: { courseId: id, userId: authResult.user.id },
      });

      if (!isInstructor) {
        return NextResponse.json(
          { error: "You are not an assigned instructor for this course." },
          { status: 403 }
        );
      }

      if (parsed.data.status === "PUBLISHED") {
        return NextResponse.json(
          { error: "Only administrators can publish courses to the academy catalog." },
          { status: 403 }
        );
      }

      // Non-admins cannot modify isFeatured
      delete (parsed.data as any).isFeatured;
    }

    const updated = await prisma.course.update({
      where: { id },
      data: parsed.data,
      include: {
        category: true,
        instructors: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, course: updated });
  } catch (error) {
    console.error("Admin course detail PUT error:", error);
    return NextResponse.json({ error: "Failed to update course." }, { status: 500 });
  }
}

// DELETE /api/admin/courses/[id] - Delete course
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { id } = await params;

  try {
    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Course deleted successfully." });
  } catch (error) {
    console.error("Admin course detail DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete course." }, { status: 500 });
  }
}
