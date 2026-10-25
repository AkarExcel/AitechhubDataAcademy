import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiAuth } from "@/lib/permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { id: tutorProfileId } = await params;

  try {
    const profile = await prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
      include: { user: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Tutor profile not found." }, { status: 404 });
    }

    const updated = await prisma.tutorProfile.update({
      where: { id: tutorProfileId },
      data: { isApproved: !profile.isApproved },
    });

    // Notify user of status change
    try {
      await prisma.notification.create({
        data: {
          userId: profile.userId,
          title: updated.isApproved ? "Tutor Profile Approved" : "Tutor Status Updated",
          message: updated.isApproved
            ? "Congratulations! Your instructor profile has been approved. You can now build and manage courses."
            : "Your instructor access is currently paused. Please contact administration for details.",
          type: "SYSTEM",
        },
      });
    } catch (nErr) {
      console.error("Failed to notify tutor:", nErr);
    }

    return NextResponse.json({
      success: true,
      isApproved: updated.isApproved,
      message: `Tutor ${updated.isApproved ? "approved" : "unapproved"}.`,
    });
  } catch (error) {
    console.error("Tutor approve error:", error);
    return NextResponse.json({ error: "Failed to update tutor status." }, { status: 500 });
  }
}
