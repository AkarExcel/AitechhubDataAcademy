import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiAuth } from "@/lib/permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only administrators are permitted to publish courses
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: "Only administrators can publish courses to the academy catalog." },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const currentStatus = course.status;
    const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

    // If publishing, ensure course has at least 1 module with at least 1 lesson
    if (newStatus === "PUBLISHED") {
      const totalLessons = course.modules.reduce(
        (sum, mod) => sum + mod.lessons.length,
        0
      );

      if (course.modules.length === 0 || totalLessons === 0) {
        return NextResponse.json(
          {
            error:
              "Cannot publish an empty course. Please add at least 1 module and 1 lesson before publishing.",
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.course.update({
      where: { id },
      data: { status: newStatus },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Course ${newStatus === "PUBLISHED" ? "published to catalog" : "reverted to draft"}.`,
      status: updated.status,
    });
  } catch (error) {
    console.error("Course publish error:", error);
    return NextResponse.json({ error: "Failed to update course status." }, { status: 500 });
  }
}
