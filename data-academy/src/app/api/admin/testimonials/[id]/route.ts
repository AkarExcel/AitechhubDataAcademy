import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiAuth } from "@/lib/permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/testimonials/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { id } = await params;

  try {
    const testimonial = await prisma.testimonial.findUnique({
      where: { id },
    });

    if (!testimonial) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    return NextResponse.json({ testimonial });
  } catch (error: any) {
    console.error("GET /api/admin/testimonials/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonial" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/testimonials/[id] - Update testimonial
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { id } = await params;

  try {
    const existing = await prisma.testimonial.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      studentName,
      role,
      company,
      avatar,
      content,
      rating,
      courseTitle,
      isApproved,
      isFeatured,
      order,
    } = body;

    const updated = await prisma.testimonial.update({
      where: { id },
      data: {
        ...(studentName !== undefined && { studentName: studentName.trim() }),
        ...(role !== undefined && { role: role?.trim() || null }),
        ...(company !== undefined && { company: company?.trim() || null }),
        ...(avatar !== undefined && { avatar: avatar?.trim() || null }),
        ...(content !== undefined && { content: content.trim() }),
        ...(rating !== undefined && {
          rating: typeof rating === "number" ? Math.min(5, Math.max(1, rating)) : 5,
        }),
        ...(courseTitle !== undefined && { courseTitle: courseTitle?.trim() || null }),
        ...(isApproved !== undefined && { isApproved: Boolean(isApproved) }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
        ...(order !== undefined && { order: typeof order === "number" ? order : 0 }),
      },
    });

    return NextResponse.json({ testimonial: updated });
  } catch (error: any) {
    console.error("PUT /api/admin/testimonials/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update testimonial" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/testimonials/[id] - Delete testimonial
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { id } = await params;

  try {
    const existing = await prisma.testimonial.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
    }

    await prisma.testimonial.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Testimonial deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/admin/testimonials/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete testimonial" },
      { status: 500 }
    );
  }
}
