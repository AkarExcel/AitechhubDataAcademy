import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiAuth } from "@/lib/permissions";
import { z } from "zod";

const lessonCreateSchema = z.object({
  title: z.string().min(2, "Lesson title must be at least 2 characters.").max(140),
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
    .default("READING"),
  estimatedMinutes: z.number().int().min(1).default(15),
  order: z.number().int().optional(),
  isRequired: z.boolean().default(true),
  isPreview: z.boolean().default(false),
  videoUrl: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  learningObjectives: z.array(z.string()).default([]),
});

// POST /api/admin/modules/[id]/lessons - Create lesson
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { id: moduleId } = await params;

  try {
    const body = await req.json();
    const parsed = lessonCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid lesson data." },
        { status: 400 }
      );
    }

    // Determine lesson order
    let order = parsed.data.order;
    if (order === undefined) {
      const lastLesson = await prisma.lesson.findFirst({
        where: { moduleId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = (lastLesson?.order ?? 0) + 1;
    }

    const lesson = await prisma.lesson.create({
      data: {
        moduleId,
        title: parsed.data.title,
        type: parsed.data.type,
        estimatedMinutes: parsed.data.estimatedMinutes,
        order,
        isRequired: parsed.data.isRequired,
        isPreview: parsed.data.isPreview,
        videoUrl: parsed.data.videoUrl || null,
        content: parsed.data.content || null,
        learningObjectives: parsed.data.learningObjectives,
      },
    });

    // Notify all enrolled students (including completed students) of the new lesson
    try {
      const moduleWithCourse = await prisma.module.findUnique({
        where: { id: moduleId },
        include: { course: { select: { id: true, title: true, slug: true } } },
      });

      if (moduleWithCourse?.course) {
        const { notifyCourseStudents } = await import("@/lib/notifications");
        await notifyCourseStudents({
          courseId: moduleWithCourse.course.id,
          title: `📚 New Material Added: ${lesson.title}`,
          message: `New learning content "${lesson.title}" has been added to "${moduleWithCourse.course.title}". Check out the update!`,
          link: `/learn/${moduleWithCourse.course.slug}?lessonId=${lesson.id}`,
          type: "ANNOUNCEMENT",
          includeCompleted: true,
        });
      }
    } catch (notifErr) {
      console.warn("Failed to broadcast new lesson notification:", notifErr);
    }

    return NextResponse.json({ success: true, lesson }, { status: 201 });
  } catch (error) {
    console.error("Create lesson error:", error);
    return NextResponse.json({ error: "Failed to create lesson." }, { status: 500 });
  }
}
