import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markAllNotificationsRead } from "@/lib/notifications";

// POST /api/notifications/mark-all-read - Mark all unread notifications as read
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await markAllNotificationsRead(session.user.id);
    return NextResponse.json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    console.error("Failed to mark all notifications read:", error);
    return NextResponse.json(
      { error: "Failed to update notifications." },
      { status: 500 }
    );
  }
}
