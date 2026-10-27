"use client";

import { useState } from "react";
import Link from "next/link";
import CertificateDocument, {
  CertificateData,
} from "@/components/certificate/CertificateDocument";
import { CertificateTemplateConfig } from "@/lib/certificateTemplate";

interface CertificateViewerClientProps {
  certificate: {
    id: string;
    certificateCode: string;
    issuedAt: Date | string;
    verificationUrl: string | null;
    course: {
      id: string;
      title: string;
      slug: string;
      shortDescription: string;
      level: string;
      estimatedHours: number;
    };
    user: {
      id: string;
      email: string;
      profile: {
        firstName: string;
        lastName: string;
      } | null;
    };
  };
  template: CertificateTemplateConfig;
}

export default function CertificateViewerClient({
  certificate,
  template,
}: CertificateViewerClientProps) {
  const [copied, setCopied] = useState(false);

  const studentName = certificate.user.profile
    ? `${certificate.user.profile.firstName} ${certificate.user.profile.lastName}`.trim()
    : certificate.user.email.split("@")[0];

  const certData: CertificateData = {
    id: certificate.id,
    certificateCode: certificate.certificateCode,
    issuedAt: certificate.issuedAt,
    verificationUrl: certificate.verificationUrl,
    studentName,
    studentEmail: certificate.user.email,
    courseTitle: certificate.course.title,
    courseLevel: certificate.course.level,
    courseHours: certificate.course.estimatedHours,
  };

  const currentUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://dataacademy.aitechhub.io/certificates/${certificate.certificateCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // LinkedIn Add to Profile URL format
  const linkedInCertUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
    certificate.course.title
  )}&organizationName=${encodeURIComponent(
    "AI Tech Hub Data Academy"
  )}&issueYear=${new Date(certificate.issuedAt).getFullYear()}&issueMonth=${
    new Date(certificate.issuedAt).getMonth() + 1
  }&certUrl=${encodeURIComponent(currentUrl)}&certId=${encodeURIComponent(
    certificate.certificateCode
  )}`;

  const tweetText = `Proud to have completed the "${certificate.course.title}" program and earned my official certificate from AI Tech Hub Data Academy! 🎓🚀 #DataScience #AI #TechCareers`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    tweetText
  )}&url=${encodeURIComponent(currentUrl)}`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Check out my official certificate in ${certificate.course.title} from AI Tech Hub Data Academy: ${currentUrl}`
  )}`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--na-gray-50, #f8fafc)",
        paddingBottom: "5rem",
      }}
    >
      {/* ── TOP ACTION & VERIFICATION BAR (Hidden in print) ── */}
      <div
        className="no-print certificate-toolbar"
        style={{
          background: "var(--brand-navy-950, #001830)",
          color: "#fff",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          padding: "1rem 2rem",
          position: "sticky",
          top: 0,
          zIndex: 40,
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          {/* Brand & Verification Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                textDecoration: "none",
                color: "#fff",
                fontWeight: 800,
                fontSize: "1rem",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #0284c7, #0369a1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "0.875rem",
                }}
              >
                AI
              </div>
              <span>Data Academy</span>
            </Link>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "rgba(34, 197, 94, 0.15)",
                border: "1px solid rgba(34, 197, 94, 0.35)",
                color: "#4ade80",
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "0.3rem 0.75rem",
                borderRadius: "9999px",
                letterSpacing: "0.03em",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Verified Credential</span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: copied ? "rgba(34, 197, 94, 0.2)" : "rgba(255,255,255,0.1)",
                color: copied ? "#4ade80" : "#fff",
                border: copied ? "1px solid #22c55e" : "1px solid rgba(255,255,255,0.18)",
                borderRadius: 8,
                padding: "0.55rem 0.9rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>

            {/* LinkedIn */}
            <a
              href={linkedInCertUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "#0a66c2",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "0.55rem 0.9rem",
                fontSize: "0.8125rem",
                fontWeight: 700,
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
              </svg>
              <span>Add to LinkedIn</span>
            </a>

            {/* Twitter */}
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Share on X"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Share on WhatsApp"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#25D366",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.83a8.19 8.19 0 0 1-5.82 2.41c-1.46 0-2.88-.38-4.14-1.11l-.3-.17-3.12.82.83-3.04-.19-.31a8.188 8.188 0 0 1-1.26-4.43c0-4.54 3.7-8.24 8.24-8.24m-3.55 4.54c-.2 0-.42.01-.62.03-.2.03-.5.14-.76.43-.26.29-1 1-1 2.43 0 1.43 1.03 2.82 1.18 3.02.15.2 2.03 3.19 4.98 4.35.7.28 1.25.44 1.68.57.7.22 1.34.19 1.84.11.56-.08 1.72-.7 1.96-1.38.25-.68.25-1.26.17-1.38-.07-.12-.27-.2-.57-.35-.3-.15-1.72-.85-1.99-.95-.27-.1-.46-.15-.66.15-.2.29-.76.95-.93 1.15-.17.2-.35.22-.65.07-.3-.15-1.28-.47-2.43-1.5-.9-1.81-1.5-1.81-1.72-2.19-.22-.38-.02-.59.13-.74.13-.13.3-.34.45-.51.15-.17.2-.29.3-.49.1-.2.05-.38-.02-.53-.08-.15-.66-1.59-.9-2.18-.24-.58-.48-.5-.66-.51" />
              </svg>
            </a>

            {/* Print / Save PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "0.55rem 1.1rem",
                fontSize: "0.8125rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.35)",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print / Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main style={{ maxWidth: 1140, margin: "2rem auto 0 auto", padding: "0 1.25rem" }}>
        {/* Certificate Render */}
        <div style={{ marginBottom: "2.5rem" }}>
          <CertificateDocument data={certData} template={template} />
        </div>

        {/* ── VERIFICATION & CREDENTIAL REGISTRY DETAILS ── */}
        <div
          className="no-print"
          style={{
            maxWidth: 1040,
            margin: "0 auto",
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid var(--na-gray-200, #e2e8f0)",
            padding: "2rem",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--na-gray-100, #f1f5f9)",
              paddingBottom: "1.25rem",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "var(--brand-navy-950, #001830)",
                  margin: "0 0 0.25rem 0",
                }}
              >
                Official Credential Verification
              </h2>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--na-gray-500, #64748b)",
                  margin: 0,
                }}
              >
                Permanently verified in AI Tech Hub Data Academy database on Supabase.
              </p>
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.4rem 0.9rem",
                borderRadius: 8,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                fontSize: "0.8125rem",
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "inline-block",
                }}
              />
              Active & Valid
            </div>
          </div>

          {/* Details Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: "var(--na-gray-400, #94a3b8)",
                  display: "block",
                  marginBottom: "0.25rem",
                }}
              >
                Recipient Name
              </span>
              <strong style={{ fontSize: "1rem", color: "var(--na-gray-900, #0f172a)" }}>
                {studentName}
              </strong>
            </div>

            <div>
              <span
                style={{
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: "var(--na-gray-400, #94a3b8)",
                  display: "block",
                  marginBottom: "0.25rem",
                }}
              >
                Course Title
              </span>
              <strong style={{ fontSize: "1rem", color: "var(--na-gray-900, #0f172a)" }}>
                {certificate.course.title}
              </strong>
            </div>

            <div>
              <span
                style={{
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: "var(--na-gray-400, #94a3b8)",
                  display: "block",
                  marginBottom: "0.25rem",
                }}
              >
                Credential ID
              </span>
              <span
                style={{
                  fontSize: "0.9375rem",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  color: "var(--brand-accent-600, #0284c7)",
                }}
              >
                {certificate.certificateCode}
              </span>
            </div>

            <div>
              <span
                style={{
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: "var(--na-gray-400, #94a3b8)",
                  display: "block",
                  marginBottom: "0.25rem",
                }}
              >
                Date Issued
              </span>
              <strong style={{ fontSize: "1rem", color: "var(--na-gray-900, #0f172a)" }}>
                {new Date(certificate.issuedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </strong>
            </div>
          </div>

          {/* Verification Statement */}
          <div
            style={{
              marginTop: "2rem",
              padding: "1.25rem",
              borderRadius: 12,
              background: "var(--na-gray-50, #f8fafc)",
              border: "1px solid var(--na-gray-200, #e2e8f0)",
              fontSize: "0.8125rem",
              color: "var(--na-gray-600, #475569)",
              lineHeight: 1.6,
            }}
          >
            <strong>About AI Tech Hub Certification:</strong> This credential confirms that the named recipient has completed comprehensive practical coursework, industry assignments, and knowledge assessments in rigorous data science and AI disciplines adhering to global industry standards.
          </div>
        </div>
      </main>
    </div>
  );
}
