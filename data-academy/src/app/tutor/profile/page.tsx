import { requireTutor } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import TutorProfileClient from "./TutorProfileClient";

export const instant = false;

export const metadata = {
  title: "Faculty Profile | Tutor Hub",
  description: "View and update your educator credentials and biography.",
};

export default async function TutorProfilePage() {
  const sessionUser = await requireTutor({
    redirectUrl: "/unauthorized?required=TUTOR",
  });

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      profile: true,
      tutorProfile: true,
    },
  });

  const displayName = user?.profile
    ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
    : sessionUser.name || "Instructor";

  return (
    <TutorProfileClient
      initialProfile={user?.tutorProfile as any}
      user={{
        id: sessionUser.id,
        email: sessionUser.email,
        name: displayName,
      }}
      isAdmin={sessionUser.role === "ADMIN"}
    />
  );
}

