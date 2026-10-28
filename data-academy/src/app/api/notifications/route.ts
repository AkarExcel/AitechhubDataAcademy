import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getStudentNotifications,
  createNotification,
  NotificationCategory,
} from "@/lib/notifications";

// GET /api/notifications - Fetch authenticated user's notifications with category filtering
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = (searchParams.get("category") || "ALL").toUpperCase() as NotificationCategory;

  try {
    const data = await getStudentNotifications(session.user.id, category);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load notifications:", error);
    return NextResponse.json(
      { error: "Failed to load notifications." },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a notification for a user
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, message, link, type = "SYSTEM", targetUserId } = body;

    // Students can create personal study alerts or reminders for themselves; admins can target any user
    const recipientId =
      session.user.role === "ADMIN" && targetUserId
        ? targetUserId
        : session.user.id;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required." },
        { status: 400 }
      );
    }

    const notification = await createNotification({
      userId: recipientId,
      type,
      title,
      message,
      link,
    });

    return NextResponse.json({ success: true, notification }, { status: 201 });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
