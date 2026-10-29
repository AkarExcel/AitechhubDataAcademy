export interface TopBannerItem {
  id: string;
  badge: string;
  type: string;
  message: string;
  linkText?: string;
  linkUrl?: string;
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

