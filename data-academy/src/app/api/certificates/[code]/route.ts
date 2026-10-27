import { NextRequest, NextResponse } from "next/server";
import { getCertificateByCode } from "@/lib/certificates";
import { getCertificateTemplate } from "@/lib/certificateTemplate";


// GET /api/certificates/[code] - Public endpoint to view and verify an official certificate
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json(
        { error: "Certificate code is required." },
        { status: 400 }
      );
    }

    const certificate = await getCertificateByCode(code);
    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found or invalid credential ID." },
        { status: 404 }
      );
    }

    const template = await getCertificateTemplate();

    return NextResponse.json({
      certificate,
      template,
      verified: true,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching certificate by code:", error);
    return NextResponse.json(
      { error: "Failed to retrieve certificate." },
      { status: 500 }
    );
  }
}
