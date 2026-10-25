import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiAuth } from "@/lib/permissions";
import { z } from "zod";

const moduleUpdateSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().optional().nullable(),
  order: z.number().int().optional(),
  isRequired: z.boolean().optional(),
});

// PUT /api/admin/modules/[id] - Update module
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = moduleUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid update data." },
        { status: 400 }
      );
    }

    const updated = await prisma.module.update({
      where: { id },
      data: parsed.data,
      include: { lessons: true },
    });

    return NextResponse.json({ success: true, module: updated });
  } catch (error) {
    console.error("Update module error:", error);
    return NextResponse.json({ error: "Failed to update module." }, { status: 500 });
  }
}

// DELETE /api/admin/modules/[id] - Delete module
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { id } = await params;

  try {
    await prisma.module.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Module deleted successfully." });
  } catch (error) {
    console.error("Delete module error:", error);
    return NextResponse.json({ error: "Failed to delete module." }, { status: 500 });
  }
}
