import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiAuth } from "@/lib/permissions";
import { z } from "zod";

const tutorProfileSchema = z.object({
  headline: z.string().max(160).optional().nullable(),
  biography: z.string().max(2000).optional().nullable(),
  expertise: z.array(z.string()).default([]),
  profileImage: z.string().optional().nullable(),
});

// GET /api/tutor/profile - Get current tutor's profile
export async function GET() {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      include: {
        profile: true,
        tutorProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.profile
          ? `${user.profile.firstName} ${user.profile.lastName}`
          : user.email.split("@")[0],
      },
      tutorProfile: user.tutorProfile,
    });
  } catch (error) {
    console.error("Tutor profile GET error:", error);
    return NextResponse.json({ error: "Failed to load profile." }, { status: 500 });
  }
}

// PUT /api/tutor/profile - Update current tutor's headline, biography, and expertise
export async function PUT(req: NextRequest) {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const body = await req.json();
    const parsed = tutorProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid profile data." },
        { status: 400 }
      );
    }

    const { headline, biography, expertise, profileImage } = parsed.data;

    // Preserve existing isApproved status
    const existing = await prisma.tutorProfile.findUnique({
      where: { userId: authResult.user.id },
    });

    const isApproved = existing ? existing.isApproved : false;

    const profile = await prisma.tutorProfile.upsert({
      where: { userId: authResult.user.id },
      update: {
        headline: headline || null,
        biography: biography || null,
        expertise,
        profileImage: profileImage || null,
      },
      create: {
        userId: authResult.user.id,
        headline: headline || null,
        biography: biography || null,
        expertise,
        profileImage: profileImage || null,
        isApproved,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Faculty profile updated successfully.",
      tutorProfile: profile,
    });
  } catch (error) {
    console.error("Tutor profile PUT error:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}

