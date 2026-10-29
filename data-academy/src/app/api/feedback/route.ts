import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/permissions";
import { submitFeedback, getUserFeedback } from "@/lib/support-feedback";

// GET /api/feedback - Retrieve feedback submissions by current user
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feedback = await getUserFeedback(user.id);
  return NextResponse.json({ feedback });
}

// POST /api/feedback - Submit new feedback
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { rating, category, content, courseId, courseTitle, allowFeatured } = body;

    if (!rating || !category?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Rating, category, and review comments are required." },
        { status: 400 }
      );
    }

    const result = await submitFeedback({
      userId: user.id,
      rating: Number(rating),
      category,
      content,
      courseId,
      courseTitle,
      allowFeatured: Boolean(allowFeatured),
      userRole: user.role,
      userName: user.name,
      userEmail: user.email,
    });

    if (!result.success) {
      return NextResponse.json({ error: "Failed to record feedback." }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json({ error: "Failed to submit feedback." }, { status: 500 });
  }
}

