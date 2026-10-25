import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiAuth } from "@/lib/permissions";
import { z } from "zod";

const tutorUpsertSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  headline: z.string().max(140).optional().nullable(),
  biography: z.string().optional().nullable(),
  expertise: z.array(z.string()).default([]),
  profileImage: z.string().optional().nullable(),
  isApproved: z.boolean().default(true),
});

// GET /api/admin/tutors - List all tutors and applicants
export async function GET(req: NextRequest) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const tutors = await prisma.user.findMany({
      where: {
        OR: [
          { role: "TUTOR" },
          { tutorProfile: { isNot: null } },
        ],
      },
      include: {
        profile: true,
        tutorProfile: {
          include: {
            courseInstructors: {
              include: {
                course: {
                  select: { id: true, title: true, slug: true, status: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tutors });
  } catch (error) {
    console.error("Admin tutors GET error:", error);
    return NextResponse.json({ error: "Failed to load tutors." }, { status: 500 });
  }
}

// POST /api/admin/tutors - Create/update tutor profile & grant role
export async function POST(req: NextRequest) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const body = await req.json();
    const parsed = tutorUpsertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid tutor profile data." },
        { status: 400 }
      );
    }

    const { userId, headline, biography, expertise, profileImage, isApproved } =
      parsed.data;

    // Ensure user role is updated to TUTOR
    await prisma.user.update({
      where: { id: userId },
      data: { role: "TUTOR" },
    });

    // Upsert tutor profile
    const profile = await prisma.tutorProfile.upsert({
      where: { userId },
      update: {
        headline: headline || null,
        biography: biography || null,
        expertise,
        profileImage: profileImage || null,
        isApproved,
      },
      create: {
        userId,
        headline: headline || null,
        biography: biography || null,
        expertise,
        profileImage: profileImage || null,
        isApproved,
      },
    });

    return NextResponse.json({ success: true, tutorProfile: profile });
  } catch (error) {
    console.error("Admin tutors POST error:", error);
    return NextResponse.json({ error: "Failed to save tutor profile." }, { status: 500 });
  }
}
