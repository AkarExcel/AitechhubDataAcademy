import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TOP_BANNERS, TopBannerItem } from "@/lib/top-banners";

// GET /api/admin/announcements/top-banner - Get all banners (active and inactive) for admin management
export async function GET() {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { key: "top_announcements_config" },
    });

    let banners: TopBannerItem[] = DEFAULT_TOP_BANNERS;

    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          banners = parsed;
        }
      } catch {
        banners = DEFAULT_TOP_BANNERS;
      }
    }

    return NextResponse.json({ banners });
  } catch (error) {
    console.error("Error fetching admin top banners:", error);
    return NextResponse.json(
      { error: "Failed to load top banner announcements." },
      { status: 500 }
    );
  }
}

// POST /api/admin/announcements/top-banner - Save updated banners array
export async function POST(req: NextRequest) {
  const authResult = await validateApiAuth(["TUTOR", "ADMIN"]);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const body = await req.json();
    const { banners } = body;

    if (!Array.isArray(banners)) {
      return NextResponse.json(
        { error: "Banners must be an array." },
        { status: 400 }
      );
    }

    // Save to PlatformSetting
    await prisma.platformSetting.upsert({
      where: { key: "top_announcements_config" },
      update: {
        value: JSON.stringify(banners),
        type: "json",
        label: "Top Announcements & Reminders Banner Configuration",
      },
      create: {
        key: "top_announcements_config",
        value: JSON.stringify(banners),
        type: "json",
        label: "Top Announcements & Reminders Banner Configuration",
      },
    });

    return NextResponse.json({ success: true, count: banners.length });
  } catch (error) {
    console.error("Error saving admin top banners:", error);
    return NextResponse.json(
      { error: "Failed to save top banner announcements." },
      { status: 500 }
    );
  }
}
