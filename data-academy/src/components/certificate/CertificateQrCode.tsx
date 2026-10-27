"use client";

import { useEffect, useState } from "react";

interface CertificateQrCodeProps {
  url: string;
  size?: number;
  className?: string;
}

export default function CertificateQrCode({
  url,
  size = 96,
  className,
}: CertificateQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function generate() {
      try {
        // Try dynamic import of qrcode if installed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const QRCode = (await import("qrcode" as any)).default || (await import("qrcode" as any));
        if (QRCode && QRCode.toDataURL) {
          const res = await QRCode.toDataURL(url, {
            margin: 1,
            width: size * 2,
            color: {
              dark: "#0f172a",
              light: "#ffffff",
            },
          });
          if (isMounted) setDataUrl(res);
          return;
        }
      } catch {
        // Fallback to Google Chart API / QR public proxy if client side
        if (isMounted) {
          setDataUrl(
            `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&data=${encodeURIComponent(
              url
            )}&margin=1`
          );
        }
      }
    }

    generate();

    return () => {
      isMounted = false;
    };
  }, [url, size]);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        background: "#ffffff",
        padding: 4,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
      title={`Verify at: ${url}`}
    >
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt="Verification QR Code"
          width={size - 8}
          height={size - 8}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      ) : (
        <svg
          width={size - 12}
          height={size - 12}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#475569"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 19v2h2v-2zM19 14h2v2h-2z" />
        </svg>
      )}
    </div>
  );
}
