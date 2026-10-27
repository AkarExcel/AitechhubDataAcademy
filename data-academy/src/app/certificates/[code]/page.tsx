import { Metadata } from "next";
import Link from "next/link";
import { getCertificateByCode } from "@/lib/certificates";
import { getCertificateTemplate } from "@/lib/certificateTemplate";
import CertificateViewerClient from "./CertificateViewerClient";

export const instant = false;

interface CertificatePageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({
  params,
}: CertificatePageProps): Promise<Metadata> {
  const { code } = await params;
  const certificate = await getCertificateByCode(code);

  if (!certificate) {
    return {
      title: "Certificate Verification | AI Tech Hub Data Academy",
      description: "Verify authentic credentials issued by AI Tech Hub Data Academy.",
    };
  }

  const studentName = certificate.user.profile
    ? `${certificate.user.profile.firstName} ${certificate.user.profile.lastName}`.trim()
    : "Student";

  return {
    title: `${certificate.course.title} Certificate — ${studentName} | AI Tech Hub`,
    description: `Official verified certificate of completion awarded to ${studentName} for mastering ${certificate.course.title}.`,
    openGraph: {
      title: `${studentName} earned ${certificate.course.title} Certificate`,
      description: `Official verifiable credential from AI Tech Hub Data Academy. Credential ID: ${certificate.certificateCode}`,
    },
  };
}

export default async function CertificateDetailPage({
  params,
}: CertificatePageProps) {
  const { code } = await params;
  const certificate = await getCertificateByCode(code);
  const template = await getCertificateTemplate();

  if (!certificate) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--na-gray-50, #f8fafc)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: "100%",
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid var(--na-gray-200, #e2e8f0)",
            padding: "3rem 2rem",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#fee2e2",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem auto",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--na-gray-900, #0f172a)",
              marginBottom: "0.75rem",
            }}
          >
            Certificate Not Found
          </h1>

          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--na-gray-500, #64748b)",
              lineHeight: 1.6,
              marginBottom: "2rem",
            }}
          >
            The credential ID <strong style={{ color: "var(--na-gray-800, #1e293b)" }}>{code}</strong> could not be verified in our records. Please verify that the link or code was copied correctly.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <Link
              href="/"
              style={{
                background: "var(--brand-blue-600, #004b87)",
                color: "#ffffff",
                padding: "0.625rem 1.25rem",
                borderRadius: 8,
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Return Home
            </Link>
            <Link
              href="/certificates"
              style={{
                background: "var(--na-gray-100, #f1f5f9)",
                color: "var(--na-gray-700, #334155)",
                padding: "0.625rem 1.25rem",
                borderRadius: 8,
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              My Certificates
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <CertificateViewerClient certificate={certificate} template={template} />;
}
