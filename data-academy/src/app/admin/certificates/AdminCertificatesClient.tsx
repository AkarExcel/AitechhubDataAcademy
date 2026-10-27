"use client";

import { useState } from "react";
import Link from "next/link";
import CertificateDocument, {
  CertificateData,
} from "@/components/certificate/CertificateDocument";
import {
  CertificateTemplateConfig,
  CertificateTemplateStyle,
  TEMPLATE_PRESETS,
  DEFAULT_CERTIFICATE_TEMPLATE,
} from "@/lib/certificateTemplate";

interface IssuedCertificate {
  id: string;
  certificateCode: string;
  issuedAt: string | Date;
  course: {
    id: string;
    title: string;
    slug: string;
  };
  user: {
    id: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    } | null;
  };
}

interface CourseOption {
  id: string;
  title: string;
}

interface StudentOption {
  id: string;
  email: string;
  name: string;
}

interface AdminCertificatesClientProps {
  initialTemplate: CertificateTemplateConfig;
  initialCertificates: IssuedCertificate[];
  courses: CourseOption[];
  students: StudentOption[];
}

export default function AdminCertificatesClient({
  initialTemplate,
  initialCertificates,
  courses,
  students,
}: AdminCertificatesClientProps) {
  const [activeTab, setActiveTab] = useState<"template" | "ledger">("template");
  const [template, setTemplate] = useState<CertificateTemplateConfig>(initialTemplate);
  const [certificates, setCertificates] = useState<IssuedCertificate[]>(initialCertificates);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Manual Issuance State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueUserId, setIssueUserId] = useState(students[0]?.id || "");
  const [issueCourseId, setIssueCourseId] = useState(courses[0]?.id || "");
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueMessage, setIssueMessage] = useState<string | null>(null);

  // Search filter for ledger
  const [searchQuery, setSearchQuery] = useState("");

  // Preview dummy student
  const previewData: CertificateData = {
    certificateCode: "AIT-2026-DEMO88",
    issuedAt: new Date(),
    studentName: "Ada Nere",
    courseTitle: "Data Science Foundations",
    courseLevel: "BEGINNER",
    courseHours: 35,
  };

  const handleApplyPreset = (styleKey: CertificateTemplateStyle) => {
    const preset = TEMPLATE_PRESETS[styleKey];
    if (preset) {
      setTemplate((prev) => ({
        ...prev,
        ...preset,
        style: styleKey,
      }));
    }
  };

  const handleSaveTemplate = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const res = await fetch("/api/admin/certificates/template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save template.");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Error saving template.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm("Reset certificate template to default settings?")) {
      setTemplate(DEFAULT_CERTIFICATE_TEMPLATE);
    }
  };

  const handleManualIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueUserId || !issueCourseId) return;

    setIsIssuing(true);
    setIssueMessage(null);

    try {
      const res = await fetch("/api/admin/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: issueUserId,
          courseId: issueCourseId,
          force: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to issue certificate.");
      }

      setIssueMessage("Certificate generated successfully!");
      if (data.certificate) {
        setCertificates((prev) => [data.certificate, ...prev]);
      }
      setTimeout(() => {
        setShowIssueModal(false);
        setIssueMessage(null);
      }, 1500);
    } catch (err: unknown) {
      setIssueMessage(err instanceof Error ? err.message : "Issuance failed.");
    } finally {
      setIsIssuing(false);
    }
  };

  const filteredCertificates = certificates.filter((cert) => {
    const sName = cert.user.profile
      ? `${cert.user.profile.firstName} ${cert.user.profile.lastName}`
      : "";
    const term = searchQuery.toLowerCase();
    return (
      cert.certificateCode.toLowerCase().includes(term) ||
      cert.user.email.toLowerCase().includes(term) ||
      cert.course.title.toLowerCase().includes(term) ||
      sName.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {/* ── HEADER & NAV TABS ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 900,
              color: "var(--brand-navy-950, #001830)",
              margin: "0 0 0.25rem 0",
            }}
          >
            Certificate & Credential Management
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--na-gray-500, #64748b)",
              margin: 0,
            }}
          >
            Customize certificate branding, change styles, and inspect the registry on Supabase.
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: "inline-flex",
            background: "var(--na-gray-200, #e2e8f0)",
            padding: "0.25rem",
            borderRadius: 10,
            gap: "0.25rem",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("template")}
            style={{
              background: activeTab === "template" ? "#ffffff" : "transparent",
              color: activeTab === "template" ? "var(--brand-blue-600, #004b87)" : "var(--na-gray-600, #475569)",
              border: "none",
              padding: "0.55rem 1.25rem",
              borderRadius: 8,
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: activeTab === "template" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span>Certificate Template Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ledger")}
            style={{
              background: activeTab === "ledger" ? "#ffffff" : "transparent",
              color: activeTab === "ledger" ? "var(--brand-blue-600, #004b87)" : "var(--na-gray-600, #475569)",
              border: "none",
              padding: "0.55rem 1.25rem",
              borderRadius: 8,
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: activeTab === "ledger" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
            <span>Issued Registry ({certificates.length})</span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* ── TAB 1: TEMPLATE STUDIO (SPLIT SCREEN CONTROLS & LIVE PREVIEW) ── */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === "template" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(380px, 480px) 1fr",
            gap: "2rem",
            alignItems: "start",
          }}
        >
          {/* LEFT: TEMPLATE CUSTOMIZER CONTROLS */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid var(--na-gray-200, #e2e8f0)",
              padding: "1.75rem",
              boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
              maxHeight: "calc(100vh - 180px)",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid var(--na-gray-100, #f1f5f9)",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 800, margin: "0 0 0.2rem 0" }}>
                  Template Settings
                </h2>
                <span style={{ fontSize: "0.75rem", color: "var(--na-gray-500, #64748b)" }}>
                  Changes update the live preview immediately
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  style={{
                    background: "transparent",
                    color: "var(--na-gray-600, #475569)",
                    border: "1px solid var(--na-gray-300, #cbd5e1)",
                    borderRadius: 6,
                    padding: "0.4rem 0.75rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={isSaving}
                  style={{
                    background: "var(--brand-blue-600, #004b87)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 6,
                    padding: "0.4rem 1rem",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: isSaving ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 6px rgba(0, 75, 135, 0.25)",
                  }}
                >
                  {isSaving ? "Saving..." : "Save Template"}
                </button>
              </div>
            </div>

            {/* Notifications */}
            {saveSuccess && (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #86efac",
                  color: "#166534",
                  padding: "0.65rem 1rem",
                  borderRadius: 8,
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  marginBottom: "1.25rem",
                }}
              >
                ✓ Template successfully saved to Supabase!
              </div>
            )}
            {saveError && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fca5a5",
                  color: "#991b1b",
                  padding: "0.65rem 1rem",
                  borderRadius: 8,
                  fontSize: "0.8125rem",
                  marginBottom: "1.25rem",
                }}
              >
                ⚠ {saveError}
              </div>
            )}

            {/* 1. PRESET STYLES */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "var(--na-gray-500, #64748b)",
                  marginBottom: "0.65rem",
                  letterSpacing: "0.05em",
                }}
              >
                1. Select Style Preset
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.65rem",
                }}
              >
                {(
                  Object.keys(TEMPLATE_PRESETS) as CertificateTemplateStyle[]
                ).map((key) => {
                  const preset = TEMPLATE_PRESETS[key];
                  const isSelected = template.style === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleApplyPreset(key)}
                      style={{
                        textAlign: "left",
                        padding: "0.75rem",
                        borderRadius: 10,
                        border: isSelected
                          ? "2px solid var(--brand-blue-600, #004b87)"
                          : "1px solid var(--na-gray-200, #e2e8f0)",
                        background: isSelected
                          ? "var(--brand-accent-50, #f0f9ff)"
                          : "#ffffff",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: 700,
                          color: isSelected
                            ? "var(--brand-blue-600, #004b87)"
                            : "var(--na-gray-800, #1e293b)",
                          marginBottom: "0.2rem",
                        }}
                      >
                        {preset.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.6875rem",
                          color: "var(--na-gray-500, #64748b)",
                          lineHeight: 1.3,
                        }}
                      >
                        {preset.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. ACADEMY BRANDING */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "var(--na-gray-500, #64748b)",
                  marginBottom: "0.65rem",
                  letterSpacing: "0.05em",
                }}
              >
                2. Academy Branding
              </label>

              <div style={{ marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--na-gray-700)" }}>
                  Academy Name
                </span>
                <input
                  type="text"
                  value={template.academyName}
                  onChange={(e) =>
                    setTemplate({ ...template, academyName: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: 8,
                    border: "1px solid var(--na-gray-300, #cbd5e1)",
                    fontSize: "0.8125rem",
                    marginTop: "0.25rem",
                  }}
                />
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--na-gray-700)" }}>
                  Academy Tagline / Sub-header
                </span>
                <input
                  type="text"
                  value={template.academyTagline}
                  onChange={(e) =>
                    setTemplate({ ...template, academyTagline: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: 8,
                    border: "1px solid var(--na-gray-300, #cbd5e1)",
                    fontSize: "0.8125rem",
                    marginTop: "0.25rem",
                  }}
                />
              </div>
            </div>

            {/* 3. CERTIFICATE HEADLINES & STATEMENT */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "var(--na-gray-500, #64748b)",
                  marginBottom: "0.65rem",
                  letterSpacing: "0.05em",
                }}
              >
                3. Certificate Wording
              </label>

              <div style={{ marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--na-gray-700)" }}>
                  Headline Title
                </span>
                <input
                  type="text"
                  value={template.title}
                  onChange={(e) =>
                    setTemplate({ ...template, title: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: 8,
                    border: "1px solid var(--na-gray-300, #cbd5e1)",
                    fontSize: "0.8125rem",
                    marginTop: "0.25rem",
                  }}
                />
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--na-gray-700)" }}>
                  Presented Subtitle
                </span>
                <input
                  type="text"
                  value={template.subtitle}
                  onChange={(e) =>
                    setTemplate({ ...template, subtitle: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: 8,
                    border: "1px solid var(--na-gray-300, #cbd5e1)",
                    fontSize: "0.8125rem",
                    marginTop: "0.25rem",
                  }}
                />
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--na-gray-700)" }}>
                  Body Achievement Statement
                </span>
                <textarea
                  rows={3}
                  value={template.bodyStatement}
                  onChange={(e) =>
                    setTemplate({ ...template, bodyStatement: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: 8,
                    border: "1px solid var(--na-gray-300, #cbd5e1)",
                    fontSize: "0.8125rem",
                    marginTop: "0.25rem",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>

            {/* 4. SIGNATORIES */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "var(--na-gray-500, #64748b)",
                  marginBottom: "0.65rem",
                  letterSpacing: "0.05em",
                }}
              >
                4. Signatories
              </label>

              {/* Signatory 1 */}
              <div
                style={{
                  background: "var(--na-gray-50, #f8fafc)",
                  padding: "0.75rem",
                  borderRadius: 8,
                  marginBottom: "0.75rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--na-gray-600)",
                    display: "block",
                    marginBottom: "0.4rem",
                  }}
                >
                  Primary Signatory (Left)
                </span>
                <input
                  type="text"
                  placeholder="Signatory Name"
                  value={template.primarySignatoryName}
                  onChange={(e) =>
                    setTemplate({
                      ...template,
                      primarySignatoryName: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    borderRadius: 6,
                    border: "1px solid var(--na-gray-300)",
                    fontSize: "0.8125rem",
                    marginBottom: "0.4rem",
                  }}
                />
                <input
                  type="text"
                  placeholder="Signatory Title"
                  value={template.primarySignatoryTitle}
                  onChange={(e) =>
                    setTemplate({
                      ...template,
                      primarySignatoryTitle: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    borderRadius: 6,
                    border: "1px solid var(--na-gray-300)",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>

              {/* Signatory 2 */}
              <div
                style={{
                  background: "var(--na-gray-50, #f8fafc)",
                  padding: "0.75rem",
                  borderRadius: 8,
                }}
              >
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--na-gray-600)",
                    display: "block",
                    marginBottom: "0.4rem",
                  }}
                >
                  Secondary Signatory (Right)
                </span>
                <input
                  type="text"
                  placeholder="Signatory Name"
                  value={template.secondarySignatoryName}
                  onChange={(e) =>
                    setTemplate({
                      ...template,
                      secondarySignatoryName: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    borderRadius: 6,
                    border: "1px solid var(--na-gray-300)",
                    fontSize: "0.8125rem",
                    marginBottom: "0.4rem",
                  }}
                />
                <input
                  type="text"
                  placeholder="Signatory Title"
                  value={template.secondarySignatoryTitle}
                  onChange={(e) =>
                    setTemplate({
                      ...template,
                      secondarySignatoryTitle: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    borderRadius: 6,
                    border: "1px solid var(--na-gray-300)",
                    fontSize: "0.8125rem",
                  }}
                />
              </div>
            </div>

            {/* 5. SECURITY & BADGES */}
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "var(--na-gray-500, #64748b)",
                  marginBottom: "0.65rem",
                  letterSpacing: "0.05em",
                }}
              >
                5. Security & Verification Options
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={template.showQrCode}
                    onChange={(e) =>
                      setTemplate({ ...template, showQrCode: e.target.checked })
                    }
                  />
                  <span>Show Verifiable QR Code</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={template.showWatermark}
                    onChange={(e) =>
                      setTemplate({ ...template, showWatermark: e.target.checked })
                    }
                  />
                  <span>Show Watermark Crest Emblem</span>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT: LIVE INTERACTIVE PREVIEW */}
          <div
            style={{
              position: "sticky",
              top: "calc(var(--topbar-height) + 1.5rem)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#22c55e",
                    display: "inline-block",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: "var(--na-gray-700, #334155)",
                  }}
                >
                  Live Interactive Preview
                </span>
              </div>

              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--na-gray-500, #64748b)",
                }}
              >
                Preset: <strong>{template.style}</strong>
              </span>
            </div>

            {/* Scaled Preview Frame */}
            <div
              style={{
                background: "var(--na-gray-200, #e2e8f0)",
                padding: "1rem",
                borderRadius: 16,
                boxShadow: "inset 0 2px 6px rgba(0,0,0,0.06)",
              }}
            >
              <CertificateDocument
                data={previewData}
                template={template}
                isPreview={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* ── TAB 2: ISSUED CERTIFICATES REGISTRY ── */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === "ledger" && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid var(--na-gray-200, #e2e8f0)",
            padding: "1.75rem",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          {/* Action & Search Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            {/* Search Input */}
            <div style={{ position: "relative", minWidth: 280, flex: 1, maxWidth: 400 }}>
              <input
                type="text"
                placeholder="Search by code, student, or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.9rem",
                  borderRadius: 8,
                  border: "1px solid var(--na-gray-300, #cbd5e1)",
                  fontSize: "0.875rem",
                }}
              />
            </div>

            {/* Manual Issue Button */}
            <button
              type="button"
              onClick={() => setShowIssueModal(true)}
              style={{
                background: "var(--brand-blue-600, #004b87)",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "0.65rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span>Issue Certificate</span>
            </button>
          </div>

          {/* Table */}
          {filteredCertificates.length === 0 ? (
            <div
              style={{
                padding: "3rem 1rem",
                textAlign: "center",
                color: "var(--na-gray-500, #64748b)",
                fontSize: "0.875rem",
              }}
            >
              No certificates match your query.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.875rem",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid var(--na-gray-200, #e2e8f0)",
                      color: "var(--na-gray-500, #64748b)",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    <th style={{ padding: "0.75rem 1rem" }}>Credential Code</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Student</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Course</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Date Issued</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertificates.map((cert) => {
                    const studentName = cert.user.profile
                      ? `${cert.user.profile.firstName} ${cert.user.profile.lastName}`
                      : cert.user.email.split("@")[0];

                    return (
                      <tr
                        key={cert.id}
                        style={{
                          borderBottom: "1px solid var(--na-gray-100, #f1f5f9)",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "var(--na-gray-50, #f8fafc)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "1rem" }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 700,
                              background: "var(--na-gray-100, #f1f5f9)",
                              color: "var(--brand-accent-600, #0284c7)",
                              padding: "0.2rem 0.5rem",
                              borderRadius: 4,
                            }}
                          >
                            {cert.certificateCode}
                          </span>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <strong style={{ color: "var(--na-gray-900, #0f172a)", display: "block" }}>
                            {studentName}
                          </strong>
                          <span style={{ fontSize: "0.75rem", color: "var(--na-gray-500, #64748b)" }}>
                            {cert.user.email}
                          </span>
                        </td>
                        <td style={{ padding: "1rem", fontWeight: 600, color: "var(--na-gray-800)" }}>
                          {cert.course.title}
                        </td>
                        <td style={{ padding: "1rem", color: "var(--na-gray-600, #475569)" }}>
                          {new Date(cert.issuedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td style={{ padding: "1rem", textAlign: "right" }}>
                          <Link
                            href={`/certificates/${cert.certificateCode}`}
                            target="_blank"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              background: "var(--brand-accent-50, #f0f9ff)",
                              color: "var(--brand-accent-700, #0369a1)",
                              border: "1px solid var(--brand-accent-200, #bae6fd)",
                              borderRadius: 6,
                              padding: "0.35rem 0.75rem",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              textDecoration: "none",
                            }}
                          >
                            <span>View Public</span>
                            <span>↗</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* ── MANUAL ISSUANCE MODAL ── */}
      {/* ────────────────────────────────────────────────────────── */}
      {showIssueModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              maxWidth: 480,
              width: "100%",
              padding: "2rem",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 0.5rem 0" }}>
              Manually Issue Certificate
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--na-gray-500)", marginBottom: "1.5rem" }}>
              Issue an authentic certificate for any enrolled student.
            </p>

            {issueMessage && (
              <div
                style={{
                  background: issueMessage.includes("success") ? "#f0fdf4" : "#fef2f2",
                  color: issueMessage.includes("success") ? "#166534" : "#991b1b",
                  border: issueMessage.includes("success") ? "1px solid #86efac" : "1px solid #fca5a5",
                  padding: "0.6rem 0.85rem",
                  borderRadius: 8,
                  fontSize: "0.8125rem",
                  marginBottom: "1rem",
                }}
              >
                {issueMessage}
              </div>
            )}

            <form onSubmit={handleManualIssue}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                  Select Student
                </label>
                <select
                  value={issueUserId}
                  onChange={(e) => setIssueUserId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    borderRadius: 8,
                    border: "1px solid var(--na-gray-300)",
                    fontSize: "0.875rem",
                  }}
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                  Select Course
                </label>
                <select
                  value={issueCourseId}
                  onChange={(e) => setIssueCourseId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    borderRadius: 8,
                    border: "1px solid var(--na-gray-300)",
                    fontSize: "0.875rem",
                  }}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  style={{
                    background: "var(--na-gray-100)",
                    border: "none",
                    borderRadius: 8,
                    padding: "0.6rem 1rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isIssuing}
                  style={{
                    background: "var(--brand-blue-600, #004b87)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 8,
                    padding: "0.6rem 1.25rem",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    cursor: isIssuing ? "not-allowed" : "pointer",
                  }}
                >
                  {isIssuing ? "Issuing..." : "Generate Certificate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
