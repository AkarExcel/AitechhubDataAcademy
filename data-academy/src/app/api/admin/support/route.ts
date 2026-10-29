import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/permissions";
import { getAllSupportTickets, updateSupportTicket } from "@/lib/support-feedback";

// GET /api/admin/support - Retrieve support tickets with filters
export async function GET(req: NextRequest) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "ALL";
  const priority = searchParams.get("priority") || "ALL";
  const role = searchParams.get("role") || "ALL";
  const search = searchParams.get("search") || "";

  const result = await getAllSupportTickets({ status, priority, role, search });
  return NextResponse.json(result);
}

// PATCH /api/admin/support - Update ticket status, priority, or admin resolution
export async function PATCH(req: NextRequest) {
  const authResult = await validateApiAuth(["ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const body = await req.json();
    const { ticketId, status, priority, adminResponse } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId is required." }, { status: 400 });
    }

    const adminName = authResult.user.name || "Academy Support Team";

    const result = await updateSupportTicket({
      ticketId,
      status,
      priority,
      adminResponse,
      adminName,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Update failed." }, { status: 400 });
    }

    return NextResponse.json({ success: true, ticket: result.ticket });
  } catch (error) {
    console.error("Admin support update error:", error);
    return NextResponse.json({ error: "Failed to update ticket." }, { status: 500 });
  }
}

