import Navbar from "@/components/layout/Navbar";
import { requireRole } from "@/lib/permissions";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Allow both ADMIN and TUTOR roles into the management interface
  const sessionUser = await requireRole(["TUTOR", "ADMIN"], {
    redirectUrl: "/unauthorized?required=TUTOR,ADMIN",
  });

  const isAdmin = sessionUser.role === "ADMIN";

  const adminNav = [
    ...(isAdmin
      ? [
          {
            href: "/admin",
            label: "Admin Overview",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            ),
          },
        ]
      : [
          {
            href: "/tutor",
            label: "Tutor Dashboard",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            ),
          },
        ]),
    {
      href: "/admin/courses",
      label: "Course Management",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      href: "/admin/courses/new",
      label: "Create New Course",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
    ...(isAdmin
      ? [
          {
            href: "/admin/tutors",
            label: "Tutors & Instructors",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            ),
          },
          {
            href: "/admin/testimonials",
            label: "Testimonials",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <line x1="9" y1="10" x2="15" y2="10" />
              </svg>
            ),
          },
        ]
      : []),
    {
      href: "/courses",
      label: "Public Catalog",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
    },
    {
      href: "/dashboard",
      label: "Student View",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <Navbar />
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "var(--na-gray-50)",
          paddingTop: "calc(var(--topbar-height) + var(--announce-height))",
        }}
      >
        {/* Admin / Tutor Sidebar */}
        <aside
          style={{
            position: "sticky",
            top: "calc(var(--topbar-height) + var(--announce-height))",
            height: "calc(100vh - var(--topbar-height) - var(--announce-height))",
            width: 250,
            flexShrink: 0,
            background: "var(--na-navy-900)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Header Badge */}
          <div style={{ padding: "1.25rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "6px",
                  background: isAdmin ? "linear-gradient(135deg, #0284c7, #0369a1)" : "linear-gradient(135deg, #6abf4b, #166534)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.8125rem", letterSpacing: "0.06em", textTransform: "uppercase", display: "block" }}>
                  {isAdmin ? "Admin Console" : "Instructor Hub"}
                </span>
                <span style={{ color: "var(--na-blue-400)", fontSize: "0.6875rem" }}>
                  {isAdmin ? "Course Operations" : "Curriculum & Lessons"}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: "1rem 0.625rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "var(--radius-md)",
                  color: "rgba(255,255,255,0.75)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "all var(--transition-fast)",
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Admin Role Footnote */}
          <div style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "0.6875rem", color: "var(--na-gray-400)" }}>
            Logged in as <strong style={{ color: "#fff" }}>Platform Admin</strong>
          </div>
        </aside>

        {/* Main Workspace */}
        <main style={{ flex: 1, padding: "2.5rem 2rem", overflowX: "hidden" }}>
          {children}
        </main>
      </div>
    </>
  );
}
