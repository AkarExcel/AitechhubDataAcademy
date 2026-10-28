import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  avatar: z.string().trim().nullable().optional(),
  bio: z.string().trim().max(1000).nullable().optional(),
  country: z.string().trim().max(100).nullable().optional(),
  timezone: z.string().trim().max(100).nullable().optional(),
  website: z.string().trim().max(255).nullable().optional(),
  linkedin: z.string().trim().max(255).nullable().optional(),
  twitter: z.string().trim().max(255).nullable().optional(),
});

// GET /api/user/profile - Fetch current authenticated user's profile & statistics
export async function GET() {
  const authResult = await validateApiAuth();
  if (!authResult.authorized) {
    return authResult.errorResponse;
  }

  const userId = authResult.user.id;

  try {
    const [user, completedCount, activeCount, enrollments] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      }),
      prisma.enrollment.count({
        where: { userId, status: "COMPLETED" },
      }),
      prisma.enrollment.count({
        where: { userId, status: "ACTIVE" },
      }),
      prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              level: true,
              estimatedHours: true,
            },
          },
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const totalHours = enrollments.reduce((sum, e) => sum + (e.course.estimatedHours || 0), 0);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      profile: user.profile,
      stats: {
        completedCourses: completedCount,
        activeCourses: activeCount,
        totalEnrolled: enrollments.length,
        totalHours,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Failed to fetch user profile." }, { status: 500 });
  }
}

// PUT /api/user/profile - Update current user's profile details
export async function PUT(req: NextRequest) {
  const authResult = await validateApiAuth();
  if (!authResult.authorized) {
    return authResult.errorResponse;
  }

  const userId = authResult.user.id;

  try {
    const body = await req.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Upsert UserProfile record
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar || null,
        bio: data.bio || null,
        country: data.country || null,
        timezone: data.timezone || null,
        website: data.website || null,
        linkedin: data.linkedin || null,
        twitter: data.twitter || null,
      },
      create: {
        userId,
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar || null,
        bio: data.bio || null,
        country: data.country || null,
        timezone: data.timezone || null,
        website: data.website || null,
        linkedin: data.linkedin || null,
        twitter: data.twitter || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
