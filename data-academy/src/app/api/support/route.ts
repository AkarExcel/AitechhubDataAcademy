import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/permissions";
import { createSupportTicket, getUserSupportTickets } from "@/lib/support-feedback";

// GET /api/support - Retrieve logged-in student or tutor tickets
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tickets = await getUserSupportTickets(user.id);
  return NextResponse.json({ tickets });
}

// POST /api/support - Submit a new support ticket
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { subject, category, description, priority = "NORMAL", courseId, courseTitle } = body;

    if (!subject?.trim() || !category?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: "Subject, category, and description are required." },
        { status: 400 }
      );
    }

    const result = await createSupportTicket({
      userId: user.id,
      subject,
      category,
      description,
      priority,
      courseId,
      courseTitle,
    });

    if (!result.success) {
      return NextResponse.json({ error: "Failed to create support ticket." }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticket: result.ticket });
  } catch (error) {
    console.error("Support ticket submission error:", error);
    return NextResponse.json({ error: "Failed to submit support ticket." }, { status: 500 });
  }
}

