"use client";

import { useState } from "react";
import { useSession } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface EnrollButtonProps {
  courseId: string;
  courseSlug: string;
  isEnrolled: boolean;
  isFree?: boolean;
  price?: number;
  variant?: "hero" | "sidebar";
}

export default function EnrollButton({
  courseId,
  courseSlug,
  isEnrolled,
  isFree = true,
  price = 0,
  variant = "hero",
}: EnrollButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnroll = async () => {
    if (status === "unauthenticated" || !session?.user) {
      router.push(`/login?callbackUrl=/courses/${courseSlug}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to enroll. Please try again.");
      }

      // Successful enrollment - redirect straight to the learning player!
      router.push(`/learn/${courseSlug}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setLoading(false);
    }
  };

  if (isEnrolled) {
    if (variant === "sidebar") {
      return (
        <div>
          <Link
            href={`/learn/${courseSlug}`}
            className="btn btn-green"
            style={{
              width: "100%",
              textAlign: "center",
              padding: "0.75rem",
              borderRadius: "9999px",
              fontWeight: 700,
              display: "block",
              textDecoration: "none",
            }}
          >
            ✓ Continue Learning →
          </Link>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--na-green-600)",
              textAlign: "center",
              marginTop: "0.5rem",
              fontWeight: 600,
            }}
          >
            You are enrolled in this course
          </div>
        </div>
      );
    }

    return (
      <Link
        href={`/learn/${courseSlug}`}
        className="btn btn-green"
        style={{
          padding: "0.75rem 2rem",
          borderRadius: "9999px",
          fontWeight: 700,
          fontSize: "1rem",
          boxShadow: "0 4px 14px rgba(106, 191, 75, 0.35)",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <span>✓ Continue Learning</span>
        <span>→</span>
      </Link>
    );
  }

  // Not enrolled yet
  if (variant === "sidebar") {
    return (
      <div>
        <button
          onClick={handleEnroll}
          disabled={loading}
          className="btn btn-green"
          style={{
            width: "100%",
            textAlign: "center",
            padding: "0.75rem",
            borderRadius: "9999px",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            border: "none",
            boxShadow: "0 4px 12px rgba(106, 191, 75, 0.3)",
          }}
        >
          {loading ? "Enrolling..." : isFree ? "Enroll in Course (Free)" : `Enroll for $${price}`}
        </button>
        {error && (
          <div style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.5rem", textAlign: "center" }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleEnroll}
        disabled={loading}
        className="btn btn-green"
        style={{
          padding: "0.75rem 2rem",
          borderRadius: "9999px",
          fontWeight: 700,
          fontSize: "1rem",
          boxShadow: "0 4px 14px rgba(106, 191, 75, 0.35)",
          cursor: loading ? "not-allowed" : "pointer",
          border: "none",
        }}
      >
        {loading ? "Enrolling..." : "Start Learning Now"}
      </button>
      {error && (
        <div style={{ color: "#fca5a5", fontSize: "0.8125rem", marginTop: "0.5rem" }}>
          {error}
        </div>
      )}
    </div>
  );
}
