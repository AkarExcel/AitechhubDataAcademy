import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiAuth } from "@/lib/permissions";

// GET /api/admin/testimonials - List all testimonials
export async function GET(req: NextRequest) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const filter = searchParams.get("filter") || "ALL"; // ALL | APPROVED | PENDING | FEATURED

  try {
    const where: any = {};

    if (search) {
      where.OR = [
        { studentName: { contains: search, mode: "insensitive" } },
        { role: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { courseTitle: { contains: search, mode: "insensitive" } },
      ];
    }

    if (filter === "APPROVED") {
      where.isApproved = true;
    } else if (filter === "PENDING") {
      where.isApproved = false;
    }

    let testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    if (filter === "FEATURED") {
      testimonials = testimonials.filter((t: any) => t.isFeatured && t.isApproved);
    }

    // Sort by order asc, then date desc
    testimonials.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    const all = await prisma.testimonial.findMany();
    const counts = {
      total: all.length,
      approved: all.filter((t: any) => t.isApproved).length,
      featured: all.filter((t: any) => t.isFeatured && t.isApproved).length,
      pending: all.filter((t: any) => !t.isApproved).length,
    };

    return NextResponse.json({ testimonials, counts });
  } catch (error: any) {
    console.error("GET /api/admin/testimonials error:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}

// POST /api/admin/testimonials - Create new testimonial
export async function POST(req: NextRequest) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
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

    if (!studentName?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Student name and testimonial content are required." },
        { status: 400 }
      );
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        studentName: studentName.trim(),
        role: role?.trim() || null,
        company: company?.trim() || null,
        avatar: avatar?.trim() || null,
        content: content.trim(),
        rating: typeof rating === "number" ? Math.min(5, Math.max(1, rating)) : 5,
        courseTitle: courseTitle?.trim() || null,
        isApproved: isApproved !== undefined ? Boolean(isApproved) : true,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : true,
        order: typeof order === "number" ? order : 0,
      },
    });

    return NextResponse.json({ testimonial }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/testimonials error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create testimonial" },
      { status: 500 }
    );
  }
}
