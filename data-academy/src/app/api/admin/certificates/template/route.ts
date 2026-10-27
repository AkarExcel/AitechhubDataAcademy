import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/permissions";
import {
  getCertificateTemplate,
  saveCertificateTemplate,
  CertificateTemplateConfig,
} from "@/lib/certificateTemplate";


// GET /api/admin/certificates/template - Fetch current certificate template config
export async function GET() {
  const authResult = await validateApiAuth(["ADMIN", "TUTOR"]);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const template = await getCertificateTemplate();
    return NextResponse.json({ template });
  } catch (error) {
    console.error("Failed to load certificate template:", error);
    return NextResponse.json(
      { error: "Failed to load template configuration." },
      { status: 500 }
    );
  }
}

// PUT /api/admin/certificates/template - Update certificate template config
export async function PUT(req: NextRequest) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const body = (await req.json()) as Partial<CertificateTemplateConfig>;
    const updated = await saveCertificateTemplate(body);

    return NextResponse.json({
      success: true,
      template: updated,
    });
  } catch (error) {
    console.error("Failed to update certificate template:", error);
    return NextResponse.json(
      { error: "Failed to save template configuration." },
      { status: 500 }
    );
  }
}
