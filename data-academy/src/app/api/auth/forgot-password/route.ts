import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateResetToken } from "@/lib/tokens";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid email address." },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Check if user exists (case-insensitive email lookup)
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    let resetUrl: string | undefined;

    if (user && user.isActive) {
      // 1. Generate secure cryptographic token
      const token = generateResetToken(user);
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      resetUrl = `${baseUrl}/reset-password?token=${token}`;

      // 2. Print reset link in terminal for local development
      console.log("\n" + "=".repeat(75));
      console.log("📬 [DEV MODE - PASSWORD RESET LINK]");
      console.log(`To:         ${user.email}`);
      console.log(`Reset URL:  ${resetUrl}`);
      console.log("Expires in: 60 minutes");
      console.log("=".repeat(75) + "\n");

      // 3. Store notification for the user
      try {
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: "Password Reset Requested",
            message: "A password reset request was initiated for your account. If this was not you, please secure your account immediately.",
            type: "SYSTEM",
          },
        });
      } catch (err) {
        console.error("Failed to record reset notification:", err);
      }
    }

    // Always return a success response to prevent email enumeration
    // In development mode, provide the reset link in the response so you can test immediately
    const isDev = process.env.NODE_ENV !== "production";

    return NextResponse.json(
      {
        success: true,
        message:
          "If an account is associated with this email, you will receive instructions to reset your password shortly.",
        devResetUrl: isDev && resetUrl ? resetUrl : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
