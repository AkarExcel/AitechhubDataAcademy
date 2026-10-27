"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const categories = [
  { name: "Data Science", slug: "data-science", desc: "Machine learning, statistical modeling & big data" },
  { name: "Data Analytics", slug: "data-analytics", desc: "Data exploration, Tableau, Power BI & storytelling" },
  { name: "Artificial Intelligence", slug: "ai-ml", desc: "Deep learning, NLP, computer vision & GenAI" },
  { name: "Python Programming", slug: "python", desc: "Core Python, scripting, automation & pandas" },
  { name: "SQL & Databases", slug: "sql-databases", desc: "Database querying, architecture & data warehousing" },
  { name: "Business Intelligence", slug: "bi-visualization", desc: "KPI dashboards, reporting & analytics strategy" },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [announceDismissed, setAnnounceDismissed] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchAudience, setSearchAudience] = useState("Learner");

  const pathname = usePathname();
  const router = useRouter();

  const exploreRef = useRef<HTMLDivElement>(null);
  const profileDrawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close explore dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exploreRef.current && !exploreRef.current.contains(event.target as Node)) {
        setExploreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close drawer on escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setProfileDrawerOpen(false);
        setExploreOpen(false);
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (profileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [profileDrawerOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setExploreOpen(false);
    }
  };

  const isLoggedIn = mounted && status === "authenticated" && Boolean(session?.user);
  const showBanner = isLoggedIn && !announceDismissed;
  const navTop = showBanner ? 44 : 0;

  // Sync nav offset with root CSS variable
  useEffect(() => {
    const offset = showBanner
      ? "calc(var(--topbar-height) + var(--announce-height))"
      : "var(--topbar-height)";
    document.documentElement.style.setProperty("--nav-offset", offset);
  }, [showBanner]);

  const userName = session?.user?.name || "Student";
  const firstName = userName ? userName.split(" ")[0] : "Student";
  const rawRole = ((session?.user as { role?: string })?.role || "STUDENT").toUpperCase();
  const userRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();

  return (
    <>
      {/* ─── NETACAD "UPDATES" TOP BANNER (Logged-in learners only) ── */}
      {showBanner && (
        <div
          className="updates-topbar"
          style={{
            height: "var(--announce-height)",
            background: "linear-gradient(90deg, #013725 0%, #034f35 50%, #023d29 100%)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 1.5rem",
            fontSize: "0.8125rem",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 60,
          }}
        >
          {/* Left: Updates Title & Message */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <span style={{ fontWeight: 800, fontSize: "0.875rem", letterSpacing: "0.02em", color: "#fff" }}>
              Updates
            </span>
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.8125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Reminder: Check your profile name before course completion. Make sure it matches how you want it to appear on your certificate.
            </span>
          </div>

          {/* Right: Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
            <Link
              href="/dashboard"
              style={{
                display: "inline-block",
                padding: "0.2rem 0.85rem",
                borderRadius: "9999px",
                border: "1px solid rgba(255, 255, 255, 0.5)",
                color: "#fff",
                fontSize: "0.75rem",
                fontWeight: 600,
                textDecoration: "none",
                background: "rgba(255, 255, 255, 0.08)",
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            >
              Read more
            </Link>

            {/* Pagination Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "rgba(255,255,255,0.75)", fontSize: "0.75rem" }}>
              <span style={{ cursor: "pointer", opacity: 0.6 }}>&lt;</span>
              <span style={{ fontWeight: 600 }}>1/1</span>
              <span style={{ cursor: "pointer", opacity: 0.6 }}>&gt;</span>
            </div>

            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.2)" }} />

            {/* Close Button */}
            <button
              onClick={() => setAnnounceDismissed(true)}
              aria-label="Dismiss banner"
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.8)",
                cursor: "pointer",
                padding: "0.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 2l10 10M12 2L2 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ─── MAIN NETACAD NAVBAR ──────────────────────────────── */}
      <header
        style={{
          position: "fixed",
          top: navTop,
          left: 0,
          right: 0,
          zIndex: 50,
          height: "var(--topbar-height)",
          background: "#fff",
          borderBottom: "1px solid var(--na-gray-200)",
          boxShadow: scrolled ? "0 2px 12px rgba(1, 25, 54, 0.08)" : "none",
          transition: "all var(--transition-base)",
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            padding: "0 1.5rem",
            display: "flex",
            alignItems: "center",
            height: "100%",
            gap: "0.85rem",
          }}
        >
          {/* Brand Logo - Official AI Tech Hub Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              textDecoration: "none",
              flexShrink: 0,
              paddingRight: "0.5rem",
            }}
          >
            <img
              src="/images/logo.png"
              alt="AI Tech Hub"
              style={{
                height: 38,
                width: "auto",
                objectFit: "contain",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 900,
                  color: "var(--brand-navy-800)",
                  letterSpacing: "-0.02em",
                }}
              >
                AI Tech Hub
              </div>
              <div
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  color: "var(--brand-accent-500)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Data Academy
              </div>
            </div>
          </Link>

          {/* ─── EXPLORE BUTTON & DROPDOWN ──────────────────────── */}
          <div ref={exploreRef} style={{ position: "relative" }}>
            <button
              onClick={() => setExploreOpen(!exploreOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.4rem 0.75rem",
                borderRadius: "4px",
                border: "1.5px solid #1e293b",
                background: exploreOpen ? "var(--na-gray-50)" : "#fff",
                color: "#1e293b",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
              aria-label="Explore catalog"
              aria-expanded={exploreOpen}
            >
              {/* 3x3 Squares Grid Icon matching screenshot */}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="3.2" height="3.2" rx="0.5" />
                <rect x="6.4" y="1" width="3.2" height="3.2" rx="0.5" />
                <rect x="11.8" y="1" width="3.2" height="3.2" rx="0.5" />
                <rect x="1" y="6.4" width="3.2" height="3.2" rx="0.5" />
                <rect x="6.4" y="6.4" width="3.2" height="3.2" rx="0.5" />
                <rect x="11.8" y="6.4" width="3.2" height="3.2" rx="0.5" />
                <rect x="1" y="11.8" width="3.2" height="3.2" rx="0.5" />
                <rect x="6.4" y="11.8" width="3.2" height="3.2" rx="0.5" />
                <rect x="11.8" y="11.8" width="3.2" height="3.2" rx="0.5" />
              </svg>
              <span>Explore</span>
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: exploreOpen ? "rotate(180deg)" : "none",
                  transition: "transform var(--transition-fast)",
                }}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {/* Explore Mega Menu Dropdown */}
            {exploreOpen && (
              <div
                className="animate-slide-down"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  width: 380,
                  background: "#fff",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--na-gray-200)",
                  boxShadow: "0 12px 30px rgba(1, 25, 54, 0.12)",
                  padding: "0.875rem",
                  zIndex: 100,
                }}
              >
                <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--na-gray-500)", marginBottom: "0.5rem", padding: "0 0.5rem" }}>
                  Subject Areas
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/courses?category=${cat.slug}`}
                      onClick={() => setExploreOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                        padding: "0.5rem 0.625rem",
                        borderRadius: "var(--radius-sm)",
                        textDecoration: "none",
                        transition: "background var(--transition-fast)",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--na-gray-50)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--na-blue-400)", marginTop: "0.45rem", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--na-gray-900)" }}>{cat.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--na-gray-500)", lineHeight: 1.4 }}>{cat.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div style={{ marginTop: "0.625rem", paddingTop: "0.625rem", borderTop: "1px solid var(--na-gray-100)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Link
                    href="/courses"
                    onClick={() => setExploreOpen(false)}
                    style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-blue-500)", textDecoration: "none" }}
                  >
                    View All Courses →
                  </Link>
                  <Link
                    href="/paths"
                    onClick={() => setExploreOpen(false)}
                    style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-green-600)", textDecoration: "none" }}
                  >
                    Career Paths →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ─── VERTICAL DIVIDER (Screenshot match) ────────────── */}
          <div style={{ width: 1, height: 26, background: "var(--na-gray-300)" }} className="desktop-only" />

          {/* ─── SEARCH INPUT WITH AUDIENCE DROPDOWN ────────────── */}
          <form
            onSubmit={handleSearchSubmit}
            className="navbar-search"
            style={{
              display: "flex",
              alignItems: "center",
              flex: 1,
              maxWidth: 420,
              height: 38,
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              background: "#fff",
              overflow: "hidden",
              transition: "border-color var(--transition-fast)",
            }}
          >
            <div style={{ paddingLeft: "0.65rem", paddingRight: "0.35rem", color: "#64748b", display: "flex", alignItems: "center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for courses, articles and re..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                padding: "0 0.5rem",
                fontSize: "0.8125rem",
                fontFamily: "var(--font-sans)",
                color: "#1e293b",
                background: "transparent",
              }}
            />
            {/* Audience dropdown inside search bar with custom SVG chevron */}
            <div style={{ borderLeft: "1px solid #e2e8f0", padding: "0 0.5rem", display: "flex", alignItems: "center", position: "relative" }}>
              <select
                value={searchAudience}
                onChange={(e) => setSearchAudience(e.target.value)}
                aria-label="Filter audience"
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "#475569",
                  background: "transparent",
                  cursor: "pointer",
                  paddingRight: "1.1rem",
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
              >
                <option value="Learner">Learner</option>
                <option value="Educator">Educator</option>
                <option value="All">All</option>
              </select>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ position: "absolute", right: "0.45rem", pointerEvents: "none" }}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </form>

          {/* ─── RIGHT CONTROLS ───────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginLeft: "auto", flexShrink: 0 }}>
            {isLoggedIn ? (
              /* ── Logged In Controls (Screenshot 2 / Authenticated) ── */
              <>
                <Link
                  href="/dashboard"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: pathname === "/dashboard" ? "var(--na-blue-500)" : "#1e293b",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                  className="desktop-only"
                >
                  My Learning
                </Link>

                <div style={{ width: 1, height: 16, background: "#cbd5e1" }} className="desktop-only" />

                {/* Language Selector */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#1e293b", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", userSelect: "none" }}
                  className="desktop-only"
                  title="Language: English"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span>EN</span>
                </div>

                <div style={{ width: 1, height: 16, background: "#cbd5e1" }} className="desktop-only" />

                {/* Help / Support Icon */}
                <Link
                  href="/contact"
                  style={{ color: "#1e293b", display: "flex", alignItems: "center" }}
                  title="Support & Help"
                  className="desktop-only"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </Link>

                <div style={{ width: 1, height: 16, background: "#cbd5e1" }} className="desktop-only" />

                {/* Notification Bell */}
                <Link
                  href="/dashboard"
                  style={{ color: "#1e293b", position: "relative", display: "flex", alignItems: "center" }}
                  title="Notifications"
                  className="desktop-only"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <span style={{ position: "absolute", top: -2, right: -2, width: 7, height: 7, borderRadius: "50%", background: "var(--na-green-400)" }} />
                </Link>

                {/* User Profile Trigger Button */}
                <button
                  onClick={() => setProfileDrawerOpen(!profileDrawerOpen)}
                  aria-label="User profile menu"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    padding: "0.35rem 0.75rem",
                    border: profileDrawerOpen ? "2px solid #005073" : "1.5px solid var(--na-gray-300)",
                    borderRadius: "var(--radius-sm)",
                    background: profileDrawerOpen ? "var(--na-gray-50)" : "#fff",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                  title="Click to view profile & options"
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: "1.5px solid var(--na-gray-500)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--na-gray-600)",
                      background: "var(--na-gray-100)",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div style={{ textAlign: "left", lineHeight: 1.15 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--na-navy-900)" }}>
                      {firstName}
                    </div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--na-green-600)", fontWeight: 600 }}>
                      {userRole}
                    </div>
                  </div>
                </button>
              </>
            ) : (
              /* ── Unauthenticated Controls (Exact Match to User's Uploaded Image) ── */
              <>
                <Link
                  href="/register?role=tutor"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#1e293b",
                    textDecoration: "none",
                    transition: "color var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--na-blue-500)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#1e293b"; }}
                  className="desktop-only"
                >
                  Teach
                </Link>

                <div style={{ width: 1, height: 16, background: "#cbd5e1" }} className="desktop-only" />

                <Link
                  href="/contact?type=partner"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#1e293b",
                    textDecoration: "none",
                    transition: "color var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--na-blue-500)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#1e293b"; }}
                  className="desktop-only"
                >
                  Partner
                </Link>

                <div style={{ width: 1, height: 16, background: "#cbd5e1" }} className="desktop-only" />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    color: "#1e293b",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  className="desktop-only"
                  title="Language: English"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span>EN</span>
                </div>

                <div style={{ width: 1, height: 16, background: "#cbd5e1" }} className="desktop-only" />

                <Link
                  href="/contact"
                  style={{
                    color: "#1e293b",
                    display: "flex",
                    alignItems: "center",
                    transition: "color var(--transition-fast)",
                  }}
                  title="Support & Help"
                  className="desktop-only"
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--na-blue-500)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#1e293b"; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </Link>

                <div style={{ width: 1, height: 16, background: "#cbd5e1" }} className="desktop-only" />

                {/* Login Button (Outline Pill/Rect) */}
                <Link
                  href="/login"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.38rem 1.15rem",
                    borderRadius: "4px",
                    border: "1.5px solid #1e293b",
                    background: "#fff",
                    color: "#1e293b",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all var(--transition-fast)",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                >
                  Login
                </Link>

                {/* Sign up Button (Filled Cisco Green) */}
                <Link
                  href="/register"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.38rem 1.15rem",
                    borderRadius: "4px",
                    border: "1.5px solid #5eb839",
                    background: "#5eb839",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    transition: "all var(--transition-fast)",
                    whiteSpace: "nowrap",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#52a331";
                    e.currentTarget.style.borderColor = "#52a331";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#5eb839";
                    e.currentTarget.style.borderColor = "#5eb839";
                  }}
                >
                  Sign up
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="mobile-menu-btn"
              aria-label="Toggle menu"
              style={{
                display: "none",
                padding: "0.4375rem",
                borderRadius: "var(--radius-md)",
                border: "1.5px solid var(--na-gray-200)",
                background: "transparent",
                cursor: "pointer",
                color: "var(--na-gray-600)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileOpen ? (
                  <path d="M15 5L5 15M5 5l10 10" />
                ) : (
                  <path d="M3 6h14M3 10h14M3 14h14" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* ─── MOBILE SEARCH & MENU ───────────────────────────── */}
        {mobileOpen && (
          <div
            className="animate-slide-down"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#fff",
              borderBottom: "1px solid var(--na-gray-200)",
              padding: "1.25rem 1.5rem",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link
                href="/courses"
                onClick={() => setMobileOpen(false)}
                style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--na-gray-800)", textDecoration: "none" }}
              >
                All Courses
              </Link>
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--na-gray-800)", textDecoration: "none" }}
                  >
                    My Learning
                  </Link>
                  <Link
                    href="/paths"
                    onClick={() => setMobileOpen(false)}
                    style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--na-gray-800)", textDecoration: "none" }}
                  >
                    Learning Paths
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register?role=tutor"
                    onClick={() => setMobileOpen(false)}
                    style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--na-gray-800)", textDecoration: "none" }}
                  >
                    Teach
                  </Link>
                  <Link
                    href="/contact?type=partner"
                    onClick={() => setMobileOpen(false)}
                    style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--na-gray-800)", textDecoration: "none" }}
                  >
                    Partner
                  </Link>
                </>
              )}
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--na-gray-800)", textDecoration: "none" }}
              >
                Support &amp; Help
              </Link>
              {!isLoggedIn && (
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", paddingTop: "0.75rem", borderTop: "1px solid var(--na-gray-200)" }}>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "0.5rem 1rem",
                      borderRadius: "4px",
                      border: "1.5px solid #1e293b",
                      color: "#1e293b",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      textDecoration: "none",
                    }}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "0.5rem 1rem",
                      borderRadius: "4px",
                      background: "#5eb839",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      textDecoration: "none",
                    }}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ─── PROFILE SLIDE-OVER DRAWER (From Screenshots 1 & 2) ─── */}
      {profileDrawerOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            onClick={() => setProfileDrawerOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(1, 25, 54, 0.4)",
              backdropFilter: "blur(2px)",
              zIndex: 90,
              animation: "fade-in 0.2s ease forwards",
            }}
          />

          {/* Drawer Container */}
          <div
            ref={profileDrawerRef}
            className="animate-slide-right"
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              maxWidth: 380,
              background: "#fff",
              zIndex: 100,
              boxShadow: "-8px 0 32px rgba(1, 25, 54, 0.2)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }}
          >
            {/* Drawer Header (Screenshot 2) */}
            <div
              style={{
                padding: "1.5rem 1.5rem 1.25rem",
                borderBottom: "1px solid var(--na-gray-200)",
                background: "var(--na-gray-50)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                {/* User Avatar Circle */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "var(--na-gray-200)",
                    color: "var(--na-gray-600)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.0625rem", color: "var(--na-gray-900)" }}>
                    {userName}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--na-green-600)", fontWeight: 600 }}>
                    {userRole}
                  </div>
                </div>
              </div>

              {/* Green Pill Logout Button */}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.4rem 0.875rem",
                  borderRadius: "9999px",
                  background: "var(--na-green-400)",
                  border: "none",
                  color: "#fff",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background var(--transition-fast)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--na-green-500)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--na-green-400)"; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
              </button>
            </div>

            {/* Drawer Body (Screenshots 1 & 2) */}
            <div style={{ padding: "1.25rem 1.5rem", flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* SECTION: Dashboard */}
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--na-navy-900)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                  <span>Dashboard</span>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setProfileDrawerOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.625rem 0",
                    color: "var(--na-gray-700)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  <span>My Learning</span>
                  <span style={{ color: "var(--na-green-500)", fontWeight: 700 }}>&gt;</span>
                </Link>
                {(rawRole === "TUTOR" || rawRole === "ADMIN") && (
                  <Link
                    href="/tutor"
                    onClick={() => setProfileDrawerOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.625rem 0",
                      color: "var(--na-green-600)",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    <span>Instructor Portal</span>
                    <span style={{ color: "var(--na-green-500)", fontWeight: 700 }}>&gt;</span>
                  </Link>
                )}
                {rawRole === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setProfileDrawerOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.625rem 0",
                      color: "var(--na-blue-500)",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    <span>Admin Control Center</span>
                    <span style={{ color: "var(--na-green-500)", fontWeight: 700 }}>&gt;</span>
                  </Link>
                )}
              </div>

              {/* SECTION: News */}
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--na-navy-900)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                    <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z" />
                  </svg>
                  <span>News</span>
                </div>
                <Link
                  href="/courses"
                  onClick={() => setProfileDrawerOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.625rem 0",
                    color: "var(--na-gray-700)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  <span>For Learners</span>
                  <span style={{ color: "var(--na-green-500)", fontWeight: 700 }}>&gt;</span>
                </Link>
              </div>

              {/* SECTION: Profile (Screenshot 1 & 2) */}
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--na-navy-900)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Profile</span>
                </div>

                {[
                  { label: "Update Profile", href: "/dashboard" },
                  { label: "Badges & Certificates", href: "/certificates" },
                  { label: "Discounts", href: "/courses" },
                  { label: "Learning History", href: "/dashboard" },
                  { label: "Transcript", href: "/dashboard" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setProfileDrawerOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.5rem 0",
                      color: "var(--na-gray-700)",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      textDecoration: "none",
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ color: "var(--na-green-500)", fontWeight: 700 }}>&gt;</span>
                  </Link>
                ))}
              </div>

              {/* SECTION: Language (Screenshot 1) */}
              <div style={{ borderTop: "1px solid var(--na-gray-200)", paddingTop: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 800, color: "var(--na-navy-900)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <span>Language</span>
                  </div>
                  <span style={{ fontSize: "0.8125rem", color: "var(--na-gray-600)" }}>English (English)</span>
                </div>
              </div>

              {/* SECTION: Support (Screenshot 1) */}
              <div style={{ borderTop: "1px solid var(--na-gray-200)", paddingTop: "1rem" }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--na-navy-900)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>Support</span>
                </div>
                {[
                  { label: "Support", href: "/contact" },
                  { label: "Feedback", href: "/contact" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setProfileDrawerOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.5rem 0",
                      color: "var(--na-gray-700)",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      textDecoration: "none",
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ color: "var(--na-green-500)", fontWeight: 700 }}>&gt;</span>
                  </Link>
                ))}
              </div>

              {/* Bottom Logout Button (Screenshot 1) */}
              <div style={{ marginTop: "auto", paddingTop: "1.5rem" }}>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  style={{
                    width: "100%",
                    padding: "0.625rem 1rem",
                    borderRadius: "9999px",
                    border: "1.5px solid var(--na-green-500)",
                    background: "#fff",
                    color: "var(--na-green-600)",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--na-green-500)";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.color = "var(--na-green-600)";
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 900px) {
          .navbar-search { display: none !important; }
        }
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
