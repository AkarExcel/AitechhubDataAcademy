import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { getCourseAudienceBreakdown, getRecentBroadcasts } from "@/lib/notifications";
import { DEFAULT_TOP_BANNERS, TopBannerItem } from "@/app/api/announcements/top-banner/route";
import UpdatesReminderClient from "./UpdatesReminderClient";

export const instant = false;

export default async function AdminUpdatesReminderPage() {
  const sessionUser = await requireRole(["TUTOR", "ADMIN"], {
    redirectUrl: "/unauthorized?required=TUTOR,ADMIN",
  });

  const [courses, initialBreakdown, recentBroadcasts, bannerSetting] = await Promise.all([
    prisma.course.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
      },
      orderBy: { title: "asc" },
    }),
    getCourseAudienceBreakdown("all"),
    getRecentBroadcasts(15),
    prisma.platformSetting.findUnique({
      where: { key: "top_announcements_config" },
    }),
  ]);

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
      courses={courses}
      initialBreakdown={initialBreakdown}
      initialBroadcasts={recentBroadcasts}
      initialTopBanners={initialTopBanners}
      currentUserRole={sessionUser.role}
      currentUserName={sessionUser.name || sessionUser.email}
    />
  );
}
