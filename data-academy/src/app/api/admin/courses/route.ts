import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiAuth } from "@/lib/permissions";
import { z } from "zod";

const courseCreateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(120),
  slug: z.string().min(3).max(140).regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens."),
  shortDescription: z.string().min(10, "Short description must be at least 10 characters.").max(280),
  fullDescription: z.string().min(20, "Full description must be at least 20 characters."),
  categoryId: z.string().optional().nullable(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  estimatedHours: z.number().min(0).default(0),
  price: z.number().min(0).default(0),
  isFree: z.boolean().default(true),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  coverImage: z.string().optional().nullable(),
  prerequisites: z.array(z.string()).default([]),
  learningOutcomes: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  certificateEnabled: z.boolean().default(true),
});

// GET /api/admin/courses - List all courses with metrics
export async function GET(req: NextRequest) {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const categoryId = searchParams.get("categoryId");

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        category: true,
        instructors: {
          include: {
            user: { include: { profile: true } },
            tutor: true,
          },
        },
        _count: {
          select: {
            modules: true,
            enrollments: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Admin courses GET error:", error);
    return NextResponse.json({ error: "Failed to load courses." }, { status: 500 });
  }
}

// POST /api/admin/courses - Create course
export async function POST(req: NextRequest) {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const body = await req.json();
    const parsed = courseCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid course data." },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await prisma.course.findUnique({
      where: { slug: parsed.data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A course with slug '${parsed.data.slug}' already exists. Please pick a unique slug.` },
        { status: 409 }
      );
    }

    const course = await prisma.course.create({
      data: {
        ...parsed.data,
        categoryId: parsed.data.categoryId || null,
        instructors: {
          create: {
            userId: authResult.user.id,
            isPrimary: true,
          },
        },
      },
      include: {
        category: true,
        instructors: true,
      },
    });

    return NextResponse.json({ success: true, course }, { status: 201 });
  } catch (error) {
    console.error("Admin courses POST error:", error);
    return NextResponse.json({ error: "Failed to create course." }, { status: 500 });
  }
}
