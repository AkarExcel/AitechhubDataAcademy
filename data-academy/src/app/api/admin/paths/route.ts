import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiAuth } from "@/lib/permissions";
import { z } from "zod";

const pathSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters.").max(120),
  slug: z
    .string()
    .min(2)
    .max(140)
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(500),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isPublished: z.boolean().default(false),
  order: z.number().int().default(0),
  courseIds: z.array(z.string()).default([]),
});

// GET /api/admin/paths - List all learning paths with their courses
export async function GET(req: NextRequest) {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const paths = await prisma.learningPath.findMany({
      orderBy: { order: "asc" },
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

    return NextResponse.json({ paths });
  } catch (error) {
    console.error("Admin paths GET error:", error);
    return NextResponse.json({ error: "Failed to load learning paths." }, { status: 500 });
  }
}

// POST /api/admin/paths - Create a new learning path
export async function POST(req: NextRequest) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const body = await req.json();
    const parsed = pathSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid path data." },
        { status: 400 }
      );
    }

    const { courseIds, ...pathData } = parsed.data;

    // Check slug uniqueness
    const existing = await prisma.learningPath.findUnique({
      where: { slug: pathData.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A learning path with slug '${pathData.slug}' already exists.` },
        { status: 409 }
      );
    }

    const path = await prisma.learningPath.create({
      data: {
        ...pathData,
        courses: {
          create: courseIds.map((courseId, index) => ({
            courseId,
            order: index,
            isRequired: true,
          })),
        },
      },
      include: {
        courses: {
          include: {
            course: {
              select: { id: true, title: true, slug: true, level: true, estimatedHours: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, path }, { status: 201 });
  } catch (error) {
    console.error("Admin paths POST error:", error);
    return NextResponse.json({ error: "Failed to create learning path." }, { status: 500 });
  }
}
