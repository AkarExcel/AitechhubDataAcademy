import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteNotification } from "@/lib/notifications";

// DELETE /api/notifications/[id] - Delete/dismiss a notification
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteNotification(id, session.user.id);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return NextResponse.json(
      { error: "Failed to delete notification." },
      { status: 500 }
    );
  }
}
