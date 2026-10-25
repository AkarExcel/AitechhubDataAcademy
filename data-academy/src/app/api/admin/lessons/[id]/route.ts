import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiAuth } from "@/lib/permissions";
import { z } from "zod";

const lessonUpdateSchema = z.object({
  title: z.string().min(2).max(140).optional(),
  type: z
    .enum([
      "VIDEO",
      "READING",
      "VIDEO_READING",
      "CODING_EXERCISE",
      "SQL_EXERCISE",
      "QUIZ",
      "ASSIGNMENT",
      "PROJECT",
      "DOWNLOADABLE",
      "EXTERNAL_RESOURCE",
    ])
    .optional(),
  estimatedMinutes: z.number().int().min(1).optional(),
  order: z.number().int().optional(),
  isRequired: z.boolean().optional(),
  isPreview: z.boolean().optional(),
  videoUrl: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  learningObjectives: z.array(z.string()).optional(),
});

// GET /api/admin/lessons/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { id } = await params;

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        resources: true,
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    return NextResponse.json({ lesson });
  } catch (error) {
    console.error("Get lesson error:", error);
    return NextResponse.json({ error: "Failed to load lesson." }, { status: 500 });
  }
}

// PUT /api/admin/lessons/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = lessonUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid update data." },
        { status: 400 }
      );
    }

    const updated = await prisma.lesson.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, lesson: updated });
  } catch (error) {
    console.error("Update lesson error:", error);
    return NextResponse.json({ error: "Failed to update lesson." }, { status: 500 });
  }
}

// DELETE /api/admin/lessons/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { id } = await params;

  try {
    await prisma.lesson.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Lesson deleted successfully." });
  } catch (error) {
    console.error("Delete lesson error:", error);
    return NextResponse.json({ error: "Failed to delete lesson." }, { status: 500 });
  }
}
