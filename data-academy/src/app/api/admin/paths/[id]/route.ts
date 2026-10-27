import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiAuth } from "@/lib/permissions";
import { z } from "zod";

const pathUpdateSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  slug: z.string().min(2).max(140).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().min(10).max(500).optional(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
  order: z.number().int().optional(),
  courseIds: z.array(z.string()).optional(),
});

// PATCH /api/admin/paths/[id] - Update a learning path
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = pathUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid data." },
        { status: 400 }
      );
    }

    const { courseIds, ...updateData } = parsed.data;

    // Check slug uniqueness if slug is being updated
    if (updateData.slug) {
      const existing = await prisma.learningPath.findFirst({
        where: { slug: updateData.slug, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: `A learning path with slug '${updateData.slug}' already exists.` },
          { status: 409 }
        );
      }
    }

    // Update path data and optionally replace course associations
    const path = await prisma.$transaction(async (tx) => {
      if (courseIds !== undefined) {
        // Remove all existing course associations then recreate
        await tx.learningPathCourse.deleteMany({ where: { learningPathId: id } });
        await tx.learningPathCourse.createMany({
          data: courseIds.map((courseId, index) => ({
            learningPathId: id,
            courseId,
            order: index,
            isRequired: true,
          })),
        });
      }

      return tx.learningPath.update({
        where: { id },
        data: updateData,
        include: {
          courses: {
            orderBy: { order: "asc" },
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  level: true,
                  estimatedHours: true,
                  coverImage: true,
                  status: true,
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json({ success: true, path });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Learning path not found." }, { status: 404 });
    }
    console.error("Admin paths PATCH error:", error);
    return NextResponse.json({ error: "Failed to update learning path." }, { status: 500 });
  }
}

// DELETE /api/admin/paths/[id] - Delete a learning path
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { id } = await params;

  try {
    await prisma.learningPath.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Learning path not found." }, { status: 404 });
    }
    console.error("Admin paths DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete learning path." }, { status: 500 });
  }
}
