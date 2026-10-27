"use client";

import { useState } from "react";
import Link from "next/link";
import { CertificateWithDetails } from "@/lib/certificates";

interface CourseEnrollment {
  id: string;
  progress: number;
  status: string;
  course: {
    id: string;
    title: string;
    slug: string;
    level: string;
    estimatedHours: number;
    completionThreshold: number;
    certificateEnabled: boolean;
  };
}

interface CertificatesClientProps {
  initialCertificates: CertificateWithDetails[];
  enrollments: CourseEnrollment[];
  userName: string;
}

export default function CertificatesClient({
  initialCertificates,
  enrollments,
  userName,
}: CertificatesClientProps) {
  const [certificates, setCertificates] = useState<CertificateWithDetails[]>(initialCertificates);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyLink = async (code: string) => {
    const url = `${window.location.origin}/certificates/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/certificates");
      if (res.ok) {
        const data = await res.json();
        if (data.certificates) {
          setCertificates(data.certificates);
        }
      }
    } catch (err) {
      console.error("Failed to sync certificates:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const inProgressCourses = enrollments.filter(
    (e) =>
      e.status !== "COMPLETED" &&
      !certificates.some((c) => c.course.id === e.course.id)
  );

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto" }}>
      {/* ── HEADER & STATS BANNER ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #001830 0%, #002b54 60%, #003e7a 100%)",
          borderRadius: 20,
          padding: "2.5rem 2rem",
          color: "#ffffff",
          marginBottom: "2.5rem",
          boxShadow: "0 10px 30px rgba(0, 24, 48, 0.2)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(255, 255, 255, 0.12)",
              padding: "0.35rem 0.85rem",
              borderRadius: 9999,
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--brand-accent-300, #38bdf8)",
              marginBottom: "1rem",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
            Official Credentials Ledger
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: "1.5rem",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "2.25rem",
                  fontWeight: 900,
                  margin: "0 0 0.5rem 0",
                  letterSpacing: "-0.02em",
                }}
              >
                My Certificates
              </h1>
              <p
                style={{
                  fontSize: "1rem",
                  color: "rgba(255,255,255,0.8)",
                  margin: 0,
                  maxWidth: 580,
                  lineHeight: 1.5,
                }}
              >
                Welcome back, {userName}. Every certificate is cryptographically recorded in the Supabase registry, shareable with employers, and ready for LinkedIn.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {/* Sync / Refresh Button */}
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  color: "#fff",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  borderRadius: 10,
                  padding: "0.7rem 1.25rem",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  cursor: isSyncing ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "all 0.2s ease",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  style={{
                    animation: isSyncing ? "spin 1s linear infinite" : "none",
                  }}
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>{isSyncing ? "Checking courses..." : "Check for Completed Courses"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── EARNED CERTIFICATES SECTION ── */}
      <section style={{ marginBottom: "3.5rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "var(--brand-navy-950, #001830)",
                margin: "0 0 0.25rem 0",
              }}
            >
              Earned Credentials ({certificates.length})
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--na-gray-500, #64748b)",
                margin: 0,
              }}
            >
              Click any certificate to view full verification, print, or share.
            </p>
          </div>
        </div>

        {certificates.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              border: "1.5px dashed var(--na-gray-300, #cbd5e1)",
              padding: "4rem 2rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "var(--na-blue-50, #f0f9ff)",
                color: "var(--brand-accent-600, #0284c7)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1.25rem",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
            </div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--na-gray-900, #0f172a)",
                marginBottom: "0.5rem",
              }}
            >
              No Certificates Earned Yet
            </h3>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "var(--na-gray-500, #64748b)",
                maxWidth: 460,
                margin: "0 auto 1.5rem auto",
                lineHeight: 1.5,
              }}
            >
              Complete 100% of the lessons in any enrolled course to automatically unlock your official verified certificate!
            </p>
            <Link
              href="/courses"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "var(--brand-blue-600, #004b87)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.875rem",
                padding: "0.75rem 1.5rem",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              <span>Explore Course Catalog</span>
              <span>→</span>
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "1.75rem",
            }}
          >
            {certificates.map((cert) => {
              const formattedDate = new Date(cert.issuedAt).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" }
              );
              const shareUrl = `/certificates/${cert.certificateCode}`;

              return (
                <div
                  key={cert.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: 16,
                    border: "1px solid var(--na-gray-200, #e2e8f0)",
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.03)";
                  }}
                >
                  {/* Card Top: Seal & Code */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "1rem",
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #ffd700 0%, #cca01d 100%)",
                          color: "#001830",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 12px rgba(204, 160, 29, 0.3)",
                        }}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="8" r="6" />
                          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                        </svg>
                      </div>

                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontFamily: "monospace",
                          fontWeight: 700,
                          background: "var(--na-gray-100, #f1f5f9)",
                          color: "var(--na-gray-700, #334155)",
                          padding: "0.25rem 0.6rem",
                          borderRadius: 6,
                        }}
                      >
                        {cert.certificateCode}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: 800,
                        color: "var(--na-gray-900, #0f172a)",
                        margin: "0 0 0.5rem 0",
                        lineHeight: 1.35,
                      }}
                    >
                      {cert.course.title}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.75rem",
                        color: "var(--na-gray-500, #64748b)",
                        marginBottom: "1.25rem",
                      }}
                    >
                      <span>Issued {formattedDate}</span>
                      <span>•</span>
                      <span style={{ color: "#16a34a", fontWeight: 700 }}>Verified ✓</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div
                    style={{
                      borderTop: "1px solid var(--na-gray-100, #f1f5f9)",
                      paddingTop: "1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                    }}
                  >
                    <Link
                      href={shareUrl}
                      style={{
                        flex: 1,
                        background: "var(--brand-blue-600, #004b87)",
                        color: "#fff",
                        textAlign: "center",
                        padding: "0.55rem 0.75rem",
                        borderRadius: 8,
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        textDecoration: "none",
                        transition: "background 0.2s ease",
                      }}
                    >
                      View & Print Certificate
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(cert.certificateCode)}
                      title="Copy Public Link"
                      style={{
                        background: copiedCode === cert.certificateCode ? "#f0fdf4" : "var(--na-gray-50, #f8fafc)",
                        color: copiedCode === cert.certificateCode ? "#16a34a" : "var(--na-gray-700, #334155)",
                        border: "1px solid var(--na-gray-200, #e2e8f0)",
                        borderRadius: 8,
                        padding: "0.55rem 0.75rem",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {copiedCode === cert.certificateCode ? "Copied!" : "Share Link"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── IN PROGRESS COURSES (Towards Next Certificate) ── */}
      {inProgressCourses.length > 0 && (
        <section>
          <div style={{ marginBottom: "1.25rem" }}>
            <h2
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "var(--brand-navy-950, #001830)",
                margin: "0 0 0.25rem 0",
              }}
            >
              In Progress ({inProgressCourses.length})
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--na-gray-500, #64748b)",
                margin: 0,
              }}
            >
              Complete remaining lessons to earn your certificate automatically.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {inProgressCourses.map((enr) => {
              const pct = Math.round((enr.progress || 0) * 100);

              return (
                <div
                  key={enr.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: 14,
                    border: "1px solid var(--na-gray-200, #e2e8f0)",
                    padding: "1.25rem",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "var(--na-gray-900, #0f172a)",
                      margin: "0 0 0.5rem 0",
                    }}
                  >
                    {enr.course.title}
                  </h4>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--na-gray-600, #475569)",
                        marginBottom: "0.35rem",
                      }}
                    >
                      <span>Progress</span>
                      <span>{pct}%</span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        background: "var(--na-gray-100, #f1f5f9)",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: "var(--brand-accent-500, #0284c7)",
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  </div>

                  <Link
                    href={`/learn/${enr.course.slug}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      color: "var(--brand-blue-600, #004b87)",
                      textDecoration: "none",
                    }}
                  >
                    <span>Continue Learning</span>
                    <span>→</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
