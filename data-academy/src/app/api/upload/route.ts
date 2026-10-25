import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/permissions";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  // Ensure user is authorized (TUTOR or ADMIN)
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) {
    return authResult.errorResponse;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Validate size (max 15MB)
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File exceeds maximum permitted size of 15MB." },
        { status: 400 }
      );
    }

    // Supported file types: images and documents
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "application/pdf",
      "text/plain",
      "text/csv",
      "application/json",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type '${file.type}' is not supported.` },
        { status: 400 }
      );
    }

    // Prepare upload directory
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique sanitized filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || ".bin";
    const uniqueId = crypto.randomBytes(12).toString("hex");
    const sanitizedOriginal = path
      .basename(file.name, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30);
    const fileName = `${sanitizedOriginal}_${uniqueId}${ext}`;

    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        fileName,
        size: file.size,
        type: file.type,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file. Please try again." },
      { status: 500 }
    );
  }
}
