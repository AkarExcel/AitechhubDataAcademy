import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/permissions";
import { autoGenerateCertificate } from "@/lib/certificates";


// POST /api/admin/certificates/issue - Admin manually issues or regenerates a certificate
export async function POST(req: NextRequest) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const body = await req.json();
    const { userId, courseId, force = true } = body;

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: "Both userId and courseId are required." },
        { status: 400 }
      );
    }

    const certificate = await autoGenerateCertificate(userId, courseId, force);

    if (!certificate) {
      return NextResponse.json(
        { error: "Could not issue certificate. Please check user and course IDs." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      certificate,
    });
  } catch (error) {
    console.error("Admin certificate issuance failed:", error);
    return NextResponse.json(
      { error: "Failed to issue certificate." },
      { status: 500 }
    );
  }
}
