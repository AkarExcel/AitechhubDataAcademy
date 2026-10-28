import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface TopBannerItem {
  id: string;
  badge: string;
  type: string;
  message: string;
  linkText: string;
  linkUrl: string;
  isActive: boolean;
  createdAt: string;
}

export const DEFAULT_TOP_BANNERS: TopBannerItem[] = [
  {
    id: "banner-profile-name",
    badge: "Updates",
    type: "Reminder",
    message:
      "Check your profile name before course completion. Make sure it matches how you want it to appear on your certificate.",
    linkText: "Read more",
    linkUrl: "/settings",
    isActive: true,
    createdAt: "2026-10-28T00:00:00.000Z",
  },
  {
    id: "banner-curriculum",
    badge: "Notice",
    type: "Curriculum",
    message:
      "New hands-on interactive labs and coding exercises are now available in the Course Catalog.",
    linkText: "Explore Catalog",
    linkUrl: "/courses",
    isActive: true,
    createdAt: "2026-10-28T00:00:00.000Z",
  },
  {
    id: "banner-credentials",
    badge: "Verified",
    type: "Credentials",
    message:
      "Your earned certificates remain permanently valid and authenticated on the official registry.",
    linkText: "View Certificates",
    linkUrl: "/certificates",
    isActive: true,
    createdAt: "2026-10-28T00:00:00.000Z",
  },
];

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
