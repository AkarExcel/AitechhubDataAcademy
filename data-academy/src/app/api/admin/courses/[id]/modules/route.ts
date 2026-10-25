import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiAuth } from "@/lib/permissions";
import { z } from "zod";

const moduleSchema = z.object({
  title: z.string().min(2, "Module title must be at least 2 characters.").max(120),
  description: z.string().optional().nullable(),
  order: z.number().int().optional(),
  isRequired: z.boolean().default(true),
});

// POST /api/admin/courses/[id]/modules - Create module
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { id: courseId } = await params;

  try {
    const body = await req.json();
    const parsed = moduleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid module data." },
        { status: 400 }
      );
    }

    // Determine order
    let order = parsed.data.order;
    if (order === undefined) {
      const lastModule = await prisma.module.findFirst({
        where: { courseId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = (lastModule?.order ?? 0) + 1;
    }

    const newModule = await prisma.module.create({
      data: {
        courseId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        order,
        isRequired: parsed.data.isRequired,
      },
      include: {
        lessons: true,
      },
    });

    return NextResponse.json({ success: true, module: newModule }, { status: 201 });
  } catch (error) {
    console.error("Create module error:", error);
    return NextResponse.json({ error: "Failed to create module." }, { status: 500 });
  }
}
