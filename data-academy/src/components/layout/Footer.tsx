import Link from "next/link";

const footerLinks = {
  Platform: [
    { href: "/courses", label: "Course Catalog" },
    { href: "/paths", label: "Learning Paths" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ],
  Learn: [
    { href: "/paths#data-analytics", label: "Data Analytics" },
    { href: "/paths#data-science", label: "Data Science" },
    { href: "/paths#ai", label: "Artificial Intelligence" },
    { href: "/paths#ml", label: "Machine Learning" },
    { href: "/paths#python", label: "Python Programming" },
    { href: "/paths#sql", label: "SQL & Databases" },
  ],
  Support: [
    { href: "/help", label: "Help Center" },
    { href: "/contact", label: "Support" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--color-neutral-900)",
        color: "var(--color-neutral-400)",
        paddingTop: "4rem",
        paddingBottom: "2rem",
      }}
    >
      <div className="container">
        {/* Top row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: "3rem",
            marginBottom: "3rem",
          }}
        >
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-500))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "1rem",
                }}
              >
                DA
              </div>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "1.125rem", letterSpacing: "-0.03em" }}>
                Data Academy
              </span>
            </div>
            <p style={{ fontSize: "0.875rem", lineHeight: 1.7, marginBottom: "1.5rem", maxWidth: "300px" }}>
              Master Data Science, AI, and Machine Learning through structured courses, 
              hands-on coding exercises, and real-world projects.
            </p>
            {/* Social links */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {["Twitter", "LinkedIn", "GitHub", "YouTube"].map((social) => (
                <a
                  key={social}
                  href="#"
                  aria-label={social}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--radius-md)",
                    background: "rgb(255 255 255 / 0.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-neutral-400)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    transition: "all var(--transition-fast)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-brand-600)";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgb(255 255 255 / 0.07)";
                    e.currentTarget.style.color = "var(--color-neutral-400)";
                  }}
                >
                  {social[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Link groups */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4
                style={{
                  color: "#fff",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {group}
              </h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--color-neutral-400)",
                        textDecoration: "none",
                        transition: "color var(--transition-fast)",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-neutral-400)"; }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid rgb(255 255 255 / 0.08)",
            paddingTop: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <p style={{ fontSize: "0.8125rem" }}>
            © {new Date().getFullYear()} Data Academy. All rights reserved.
          </p>
          <p style={{ fontSize: "0.8125rem" }}>
            Built for learners, by learners.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          footer .container > div:first-child {
            grid-template-columns: 1fr 1fr !important;
            gap: 2rem !important;
          }
        }
        @media (max-width: 600px) {
          footer .container > div:first-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
