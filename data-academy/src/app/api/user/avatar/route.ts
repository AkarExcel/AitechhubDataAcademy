import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const authResult = await validateApiAuth();
  if (!authResult.authorized) {
    return authResult.errorResponse;
  }

  const userId = authResult.user.id;

  try {
    const formData = await req.formData();
    const file = (formData.get("avatar") || formData.get("file")) as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    // Size limit: 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Image file exceeds maximum permitted size of 5MB." },
        { status: 400 }
      );
    }

    // Allowed image types
    const allowedMime = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedMime.includes(file.type)) {
      return NextResponse.json(
        { error: "Only image files (JPEG, PNG, WebP, GIF) are allowed for profile avatars." },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    const avatarsDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(avatarsDir, { recursive: true });

    // Generate clean file name
    const ext = path.extname(file.name) || (file.type === "image/png" ? ".png" : ".jpg");
    const uniqueHash = crypto.randomBytes(8).toString("hex");
    const fileName = `avatar-${userId.slice(-6)}-${Date.now()}-${uniqueHash}${ext}`;
    const filePath = path.join(avatarsDir, fileName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const avatarUrl = `/uploads/avatars/${fileName}`;

    // Update UserProfile avatar
    await prisma.userProfile.upsert({
      where: { userId },
      update: { avatar: avatarUrl },
      create: {
        userId,
        firstName: authResult.user.name.split(" ")[0] || "Learner",
        lastName: authResult.user.name.split(" ")[1] || "",
        avatar: avatarUrl,
      },
    });

    return NextResponse.json({
      success: true,
      avatarUrl,
      message: "Avatar uploaded successfully.",
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json({ error: "Failed to upload avatar." }, { status: 500 });
  }
}
