import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/permissions";
import { getAllFeedback, featureFeedbackAsTestimonial } from "@/lib/support-feedback";

// GET /api/admin/feedback - Retrieve all feedback submissions with filters
export async function GET(req: NextRequest) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { searchParams } = new URL(req.url);
  const rating = searchParams.get("rating") ? Number(searchParams.get("rating")) : undefined;
  const category = searchParams.get("category") || undefined;
  const role = searchParams.get("role") || undefined;
  const search = searchParams.get("search") || undefined;

  const result = await getAllFeedback({ rating, category, role, search });
  return NextResponse.json(result);
}

// POST /api/admin/feedback/feature - Promote feedback to public Testimonial
export async function POST(req: NextRequest) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const body = await req.json();
    const { feedbackId, studentName, role, company, content, rating, courseTitle } = body;

    if (!feedbackId || !studentName || !content) {
      return NextResponse.json(
        { error: "feedbackId, studentName, and content are required." },
        { status: 400 }
      );
    }

    const result = await featureFeedbackAsTestimonial({
      feedbackId,
      studentName,
      role,
      company,
      content,
      rating,
      courseTitle,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to feature feedback." }, { status: 400 });
    }

    return NextResponse.json({ success: true, testimonial: result.testimonial });
  } catch (error) {
    console.error("Admin feature feedback error:", error);
    return NextResponse.json({ error: "Failed to feature feedback." }, { status: 500 });
  }
}

