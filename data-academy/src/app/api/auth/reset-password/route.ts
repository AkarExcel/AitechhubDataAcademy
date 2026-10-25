import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyResetToken } from "@/lib/tokens";
import bcrypt from "bcryptjs";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(128, "Password must not exceed 128 characters."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input data." },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // Verify token cryptographic signature, expiry, and single-use validity
    const verification = await verifyResetToken(token);

    if (!verification.valid || !verification.user) {
      return NextResponse.json(
        { error: verification.error || "Invalid or expired password reset link." },
        { status: 400 }
      );
    }

    const user = verification.user;

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Record confirmation notification
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Password Changed",
          message: "Your account password was successfully updated. If you did not make this change, please contact support immediately.",
          type: "SYSTEM",
        },
      });
    } catch (err) {
      console.error("Failed to record reset notification:", err);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your password has been successfully reset. You can now log in.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while resetting your password." },
      { status: 500 }
    );
  }
}
