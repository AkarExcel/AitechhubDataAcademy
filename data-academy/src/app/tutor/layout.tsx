import Navbar from "@/components/layout/Navbar";
import TutorSidebar from "@/components/layout/TutorSidebar";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await requireRole(["TUTOR", "ADMIN"], {
    redirectUrl: "/unauthorized?required=TUTOR,ADMIN",
  });

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      profile: true,
      tutorProfile: true,
    },
  });

  const isAdmin = sessionUser.role === "ADMIN";
  const isVerified = isAdmin || Boolean(user?.tutorProfile?.isApproved);

  const displayName = user?.profile?.firstName
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : sessionUser.name || "Instructor";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--na-gray-50)" }}>
      <Navbar />

      <div style={{ display: "flex", flex: 1, position: "relative" }}>
        {/* Dedicated Tutor Sidebar Navigation */}
        <TutorSidebar
          isVerified={isVerified}
          tutorProfile={user?.tutorProfile}
          userName={displayName}
          userEmail={sessionUser.email}
        />

        {/* Main Content Workspace */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* Top Verification Status Alert for Unverified Tutors */}
          {!isVerified && (
            <div
              style={{
                background: "linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)",
                borderBottom: "1px solid #fde68a",
                padding: "0.85rem 1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.25rem" }}>⚠️</span>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#92400e" }}>
                    Tutor Profile Verification Pending
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "#b45309" }}>
                    Your educator credentials are under administrative review. Once verified, you will immediately unlock the ability to author and create academy courses.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Link
                  href="/tutor/profile"
                  style={{
                    background: "#d97706",
                    color: "#ffffff",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    padding: "0.4rem 0.85rem",
                    borderRadius: 6,
                    textDecoration: "none",
                  }}
                >
                  View Profile
                </Link>
                <Link
                  href="/support"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #d97706",
                    color: "#b45309",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    padding: "0.4rem 0.85rem",
                    borderRadius: 6,
                    textDecoration: "none",
                  }}
                >
                  Contact Support
                </Link>
              </div>
            </div>
          )}

          {/* Page Body */}
          <main style={{ flex: 1, padding: "2rem" }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

