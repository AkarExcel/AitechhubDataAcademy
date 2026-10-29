import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { DEFAULT_TOP_BANNERS, TopBannerItem } from "@/lib/top-banners";
import UpdatesReminderClient from "./UpdatesReminderClient";

export const instant = false;

export default async function AdminUpdatesReminderPage() {
  const sessionUser = await requireRole(["TUTOR", "ADMIN"], {
    redirectUrl: "/unauthorized?required=TUTOR,ADMIN",
  });

  const bannerSetting = await prisma.platformSetting.findUnique({
    where: { key: "top_announcements_config" },
  });

  let initialTopBanners: TopBannerItem[] = DEFAULT_TOP_BANNERS;
  if (bannerSetting?.value) {
    try {
      const parsed = JSON.parse(bannerSetting.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        initialTopBanners = parsed;
      }
    } catch {
      initialTopBanners = DEFAULT_TOP_BANNERS;
    }
  }

  return (
    <UpdatesReminderClient
      initialTopBanners={initialTopBanners}
      currentUserRole={sessionUser.role}
      currentUserName={sessionUser.name || sessionUser.email}
    />
  );
}
