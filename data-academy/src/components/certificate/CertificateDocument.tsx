"use client";

import React from "react";
import { CertificateTemplateConfig } from "@/lib/certificateTemplate";
import CertificateQrCode from "./CertificateQrCode";

export interface CertificateData {
  id?: string;
  certificateCode: string;
  issuedAt: string | Date;
  verificationUrl?: string | null;
  studentName: string;
  studentEmail?: string;
  courseTitle: string;
  courseLevel?: string;
  courseHours?: number;
  instructorName?: string;
}

interface CertificateDocumentProps {
  data: CertificateData;
  template: CertificateTemplateConfig;
  className?: string;
  isPreview?: boolean;
}

export default function CertificateDocument({
  data,
  template,
  className = "",
  isPreview = false,
}: CertificateDocumentProps) {
  const formattedDate = new Date(data.issuedAt || Date.now()).toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/certificates/${data.certificateCode}`
      : `https://dataacademy.aitechhub.io/certificates/${data.certificateCode}`;

  const style = template.style || "CLASSIC_GOLD";

  // ── Style Theme Definitions ──
  const getThemeStyles = () => {
    switch (style) {
      case "MODERN_CYBER":
        return {
          wrapperBg: "linear-gradient(145deg, #070d18 0%, #0d172c 50%, #081120 100%)",
          cardBg: "radial-gradient(ellipse at 50% 30%, rgba(6, 182, 212, 0.08) 0%, rgba(13, 23, 44, 0.95) 70%)",
          outerBorder: "1.5px solid rgba(6, 182, 212, 0.4)",
          innerBorder: "1px dashed rgba(6, 182, 212, 0.25)",
          cornerColor: "#06b6d4",
          primaryText: "#f1f5f9",
          secondaryText: "#94a3b8",
          nameColor: "#38bdf8",
          courseColor: "#22d3ee",
          accentColor: template.accentColorSecondary || "#06b6d4",
          sealBg: "linear-gradient(135deg, #0891b2 0%, #0284c7 100%)",
          sealText: "#ffffff",
          fontFamily: "'Inter', -apple-system, sans-serif",
          isDark: true,
        };
      case "MINIMAL_IVORY":
        return {
          wrapperBg: "#f8f7f4",
          cardBg: "#fcfbf9",
          outerBorder: "2px solid #27272a",
          innerBorder: "1px solid #71717a",
          cornerColor: "#27272a",
          primaryText: "#18181b",
          secondaryText: "#52525b",
          nameColor: "#09090b",
          courseColor: "#18181b",
          accentColor: template.accentColor || "#18181b",
          sealBg: "linear-gradient(135deg, #3f3f46 0%, #18181b 100%)",
          sealText: "#ffffff",
          fontFamily: "'Georgia', 'Playfair Display', serif",
          isDark: false,
        };
      case "EMERALD_ACADEMIC":
        return {
          wrapperBg: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
          cardBg: "radial-gradient(circle at 50% 35%, #fcfbf7 0%, #f7f4ea 100%)",
          outerBorder: "4px double #d97706",
          innerBorder: "1.5px solid #059669",
          cornerColor: "#d97706",
          primaryText: "#064e3b",
          secondaryText: "#4b5563",
          nameColor: "#064e3b",
          courseColor: "#b45309",
          accentColor: "#d97706",
          sealBg: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
          sealText: "#ffffff",
          fontFamily: "'Georgia', 'Times New Roman', serif",
          isDark: false,
        };
      case "CLASSIC_GOLD":
      default:
        return {
          wrapperBg: "linear-gradient(135deg, #001830 0%, #002b54 50%, #001830 100%)",
          cardBg: "radial-gradient(ellipse at 50% 30%, #ffffff 0%, #faf8f2 100%)",
          outerBorder: "3px solid #b38938",
          innerBorder: "1px solid rgba(179, 137, 56, 0.45)",
          cornerColor: "#b38938",
          primaryText: "#001830",
          secondaryText: "#475569",
          nameColor: "#001e3d",
          courseColor: "#004b87",
          accentColor: template.accentColorSecondary || "#b38938",
          sealBg: "radial-gradient(circle at 35% 35%, #ffd700 0%, #cca01d 55%, #997300 100%)",
          sealText: "#001830",
          fontFamily: "'Georgia', 'Times New Roman', serif",
          isDark: false,
        };
    }
  };

  const theme = getThemeStyles();

  return (
    <div
      className={`certificate-root-container ${className}`}
      style={{
        width: "100%",
        maxWidth: 1040,
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* ── CERTIFICATE FRAME CANVAS ── */}
      <div
        id="certificate-print-area"
        style={{
          width: "100%",
          aspectRatio: "1.414 / 1", // Standard Landscape Certificate Ratio
          minHeight: isPreview ? 460 : 660,
          background: theme.cardBg,
          color: theme.primaryText,
          position: "relative",
          padding: isPreview ? "1.5rem" : "2.5rem 3.5rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: isPreview
            ? "0 10px 25px rgba(0,0,0,0.15)"
            : "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.06)",
          borderRadius: 12,
          overflow: "hidden",
          boxSizing: "border-box",
          fontFamily: theme.fontFamily,
          border: theme.outerBorder,
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {/* Background Watermark Pattern */}
        {template.showWatermark && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              opacity: theme.isDark ? 0.04 : 0.035,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <svg width="450" height="450" viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 5 L60 35 L92 35 L66 54 L76 85 L50 67 L24 85 L34 54 L8 35 L40 35 Z" />
            </svg>
          </div>
        )}

        {/* Ornate Inner Double Frame */}
        <div
          style={{
            position: "absolute",
            inset: isPreview ? "10px" : "18px",
            border: theme.innerBorder,
            pointerEvents: "none",
            borderRadius: 6,
            zIndex: 2,
          }}
        />

        {/* Decorative Corner Ornaments (SVG) */}
        <svg
          style={{
            position: "absolute",
            top: isPreview ? 10 : 18,
            left: isPreview ? 10 : 18,
            width: isPreview ? 36 : 56,
            height: isPreview ? 36 : 56,
            color: theme.cornerColor,
            pointerEvents: "none",
            zIndex: 3,
          }}
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
        >
          <path d="M5 45 C5 22 22 5 45 5 M5 5 L5 25 M5 5 L25 5 M18 18 L18 35 M18 18 L35 18" />
        </svg>

        <svg
          style={{
            position: "absolute",
            top: isPreview ? 10 : 18,
            right: isPreview ? 10 : 18,
            width: isPreview ? 36 : 56,
            height: isPreview ? 36 : 56,
            color: theme.cornerColor,
            pointerEvents: "none",
            zIndex: 3,
            transform: "scaleX(-1)",
          }}
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
        >
          <path d="M5 45 C5 22 22 5 45 5 M5 5 L5 25 M5 5 L25 5 M18 18 L18 35 M18 18 L35 18" />
        </svg>

        <svg
          style={{
            position: "absolute",
            bottom: isPreview ? 10 : 18,
            left: isPreview ? 10 : 18,
            width: isPreview ? 36 : 56,
            height: isPreview ? 36 : 56,
            color: theme.cornerColor,
            pointerEvents: "none",
            zIndex: 3,
            transform: "scaleY(-1)",
          }}
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
        >
          <path d="M5 45 C5 22 22 5 45 5 M5 5 L5 25 M5 5 L25 5 M18 18 L18 35 M18 18 L35 18" />
        </svg>

        <svg
          style={{
            position: "absolute",
            bottom: isPreview ? 10 : 18,
            right: isPreview ? 10 : 18,
            width: isPreview ? 36 : 56,
            height: isPreview ? 36 : 56,
            color: theme.cornerColor,
            pointerEvents: "none",
            zIndex: 3,
            transform: "scale(-1, -1)",
          }}
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
        >
          <path d="M5 45 C5 22 22 5 45 5 M5 5 L5 25 M5 5 L25 5 M18 18 L18 35 M18 18 L35 18" />
        </svg>

        {/* ── 1. HEADER SECTION: ACADEMY LOGO & INSIGNIA ── */}
        <div
          style={{
            textAlign: "center",
            position: "relative",
            zIndex: 5,
            paddingTop: isPreview ? "0.25rem" : "0.5rem",
          }}
        >
          {/* Academy Crest / Emblem */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: isPreview ? 38 : 52,
              height: isPreview ? 38 : 52,
              borderRadius: "50%",
              background: theme.isDark ? "rgba(6, 182, 212, 0.15)" : "rgba(0, 75, 135, 0.08)",
              border: `1.5px solid ${theme.cornerColor}`,
              color: theme.cornerColor,
              marginBottom: isPreview ? "0.35rem" : "0.6rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <svg
              width={isPreview ? 22 : 28}
              height={isPreview ? 22 : 28}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>

          {/* Academy Title */}
          <div
            style={{
              fontSize: isPreview ? "0.75rem" : "0.95rem",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: theme.accentColor,
              marginBottom: "0.2rem",
            }}
          >
            {template.academyName}
          </div>

          {/* Academy Tagline */}
          <div
            style={{
              fontSize: isPreview ? "0.6rem" : "0.75rem",
              letterSpacing: "0.1em",
              color: theme.secondaryText,
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            {template.academyTagline}
          </div>

          {/* Accent Ribbon Separator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              margin: isPreview ? "0.5rem auto" : "0.85rem auto 0.4rem auto",
              maxWidth: 320,
            }}
          >
            <div
              style={{
                height: 1,
                flex: 1,
                background: `linear-gradient(90deg, transparent, ${theme.cornerColor})`,
              }}
            />
            <span style={{ color: theme.cornerColor, fontSize: "0.75rem" }}>✦</span>
            <div
              style={{
                height: 1,
                flex: 1,
                background: `linear-gradient(90deg, ${theme.cornerColor}, transparent)`,
              }}
            />
          </div>
        </div>

        {/* ── 2. BODY CONTENT: RECIPIENT & TITLE ── */}
        <div
          style={{
            textAlign: "center",
            position: "relative",
            zIndex: 5,
            padding: isPreview ? "0.25rem 1rem" : "0.5rem 2rem",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Certificate Headline */}
          <h1
            style={{
              fontSize: isPreview ? "1.25rem" : "2rem",
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              margin: "0 0 0.4rem 0",
              color: theme.primaryText,
              fontFamily: "'Playfair Display', 'Cinzel', 'Georgia', serif",
            }}
          >
            {template.title}
          </h1>

          {/* Subtitle / Presented To */}
          <p
            style={{
              fontSize: isPreview ? "0.75rem" : "0.95rem",
              fontStyle: "italic",
              color: theme.secondaryText,
              margin: "0 0 0.5rem 0",
            }}
          >
            {template.subtitle}
          </p>

          {/* Recipient Student Name */}
          <div
            style={{
              fontSize: isPreview ? "1.5rem" : "2.6rem",
              fontWeight: 800,
              color: theme.nameColor,
              letterSpacing: "0.04em",
              padding: isPreview ? "0.2rem 0" : "0.4rem 0",
              borderBottom: `2px solid ${theme.cornerColor}`,
              display: "inline-block",
              margin: "0 auto",
              minWidth: isPreview ? "220px" : "360px",
              maxWidth: "90%",
              textShadow: theme.isDark ? "0 0 20px rgba(6, 182, 212, 0.4)" : "none",
            }}
          >
            {data.studentName || "Student Name"}
          </div>

          {/* Body Statement */}
          <p
            style={{
              fontSize: isPreview ? "0.6875rem" : "0.875rem",
              color: theme.secondaryText,
              maxWidth: 620,
              margin: isPreview ? "0.5rem auto 0.35rem auto" : "0.9rem auto 0.6rem auto",
              lineHeight: 1.5,
            }}
          >
            {template.bodyStatement}
          </p>

          {/* Course Title */}
          <div
            style={{
              fontSize: isPreview ? "1rem" : "1.6rem",
              fontWeight: 800,
              color: theme.courseColor,
              letterSpacing: "0.02em",
              margin: "0 0 0.2rem 0",
            }}
          >
            {data.courseTitle}
          </div>

          {/* Course Details Tag (Hours / Level) */}
          {(data.courseHours || data.courseLevel) && (
            <div
              style={{
                fontSize: isPreview ? "0.65rem" : "0.75rem",
                color: theme.secondaryText,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              {[
                data.courseLevel && `${data.courseLevel} Track`,
                data.courseHours && `${data.courseHours} Academic Hours`,
              ]
                .filter(Boolean)
                .join(" • ")}
            </div>
          )}
        </div>

        {/* ── 3. FOOTER SECTION: SIGNATURES, SEAL & QR VERIFICATION ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "flex-end",
            gap: "1.5rem",
            position: "relative",
            zIndex: 5,
            paddingTop: isPreview ? "0.5rem" : "1rem",
            borderTop: `1px solid ${theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
          }}
        >
          {/* Left Signatory */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "'Brush Script MT', 'Dancing Script', 'Caveat', cursive",
                fontSize: isPreview ? "1.1rem" : "1.7rem",
                color: theme.primaryText,
                marginBottom: "0.2rem",
                fontStyle: "italic",
                minHeight: isPreview ? 26 : 38,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
              }}
            >
              {template.primarySignatorySignature || template.primarySignatoryName}
            </div>
            <div
              style={{
                height: 1.5,
                width: isPreview ? 110 : 170,
                background: theme.cornerColor,
                margin: "0 auto 0.35rem auto",
              }}
            />
            <div
              style={{
                fontSize: isPreview ? "0.6875rem" : "0.85rem",
                fontWeight: 700,
                color: theme.primaryText,
              }}
            >
              {template.primarySignatoryName}
            </div>
            <div
              style={{
                fontSize: isPreview ? "0.58rem" : "0.7rem",
                color: theme.secondaryText,
              }}
            >
              {template.primarySignatoryTitle}
            </div>
          </div>

          {/* Center Official Foil / Embossed Wax Seal */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 0.5rem",
            }}
          >
            <div
              style={{
                width: isPreview ? 64 : 88,
                height: isPreview ? 64 : 88,
                borderRadius: "50%",
                background: theme.sealBg,
                color: theme.sealText,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                position: "relative",
                boxShadow: "0 6px 18px rgba(0,0,0,0.22), inset 0 2px 4px rgba(255,255,255,0.4)",
                border: `2px dashed ${theme.cornerColor}`,
                padding: "0.3rem",
              }}
            >
              <svg
                width={isPreview ? 18 : 26}
                height={isPreview ? 18 : 26}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span
                style={{
                  fontSize: isPreview ? "0.45rem" : "0.55rem",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginTop: 2,
                  lineHeight: 1.1,
                }}
              >
                VERIFIED
              </span>
              <span
                style={{
                  fontSize: isPreview ? "0.4rem" : "0.48rem",
                  letterSpacing: "0.06em",
                  opacity: 0.85,
                }}
              >
                OFFICIAL SEED
              </span>
            </div>
          </div>

          {/* Right Signatory */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "'Brush Script MT', 'Dancing Script', 'Caveat', cursive",
                fontSize: isPreview ? "1.1rem" : "1.7rem",
                color: theme.primaryText,
                marginBottom: "0.2rem",
                fontStyle: "italic",
                minHeight: isPreview ? 26 : 38,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
              }}
            >
              {template.secondarySignatorySignature || template.secondarySignatoryName}
            </div>
            <div
              style={{
                height: 1.5,
                width: isPreview ? 110 : 170,
                background: theme.cornerColor,
                margin: "0 auto 0.35rem auto",
              }}
            />
            <div
              style={{
                fontSize: isPreview ? "0.6875rem" : "0.85rem",
                fontWeight: 700,
                color: theme.primaryText,
              }}
            >
              {template.secondarySignatoryName}
            </div>
            <div
              style={{
                fontSize: isPreview ? "0.58rem" : "0.7rem",
                color: theme.secondaryText,
              }}
            >
              {template.secondarySignatoryTitle}
            </div>
          </div>
        </div>

        {/* ── 4. METADATA STRIP: DATE, CERTIFICATE CODE & QR VERIFICATION ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 5,
            marginTop: isPreview ? "0.5rem" : "0.85rem",
            fontSize: isPreview ? "0.6rem" : "0.72rem",
            color: theme.secondaryText,
          }}
        >
          {/* Issue Date */}
          <div>
            <strong style={{ color: theme.primaryText }}>Issued:</strong>{" "}
            {formattedDate}
          </div>

          {/* Certificate Code */}
          <div>
            <strong style={{ color: theme.primaryText }}>Credential ID:</strong>{" "}
            <span
              style={{
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: theme.accentColor,
              }}
            >
              {data.certificateCode}
            </span>
          </div>

          {/* Verification QR Box */}
          {template.showQrCode && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CertificateQrCode url={verifyUrl} size={isPreview ? 36 : 46} />
              <div style={{ textAlign: "left", lineHeight: 1.15 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: isPreview ? "0.5rem" : "0.6rem",
                    fontWeight: 700,
                    color: theme.primaryText,
                    textTransform: "uppercase",
                  }}
                >
                  Scan to Verify
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: isPreview ? "0.45rem" : "0.55rem",
                    opacity: 0.8,
                  }}
                >
                  ai-tech-hub.verify
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
