import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TopBannerItem, DEFAULT_TOP_BANNERS } from "@/lib/top-banners";

// GET /api/announcements/top-banner - Public endpoint for Navbar to retrieve active banners
export async function GET() {
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

    const activeBanners = banners.filter((b) => b.isActive);

    return NextResponse.json({
      banners: activeBanners.length > 0 ? activeBanners : DEFAULT_TOP_BANNERS,
    });
  } catch (error) {
    console.error("Error fetching top banner announcements:", error);
    return NextResponse.json({ banners: DEFAULT_TOP_BANNERS });
  }
}
