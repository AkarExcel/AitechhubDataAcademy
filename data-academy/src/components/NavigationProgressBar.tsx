"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Turn off loading once route changes
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  // Intercept click on internal links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");

      // Only trigger for internal navigations
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("#") &&
        targetAttr !== "_blank" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        // Only trigger if going to a different URL
        const currentUrl = window.location.pathname + window.location.search;
        if (href !== currentUrl) {
          setLoading(true);
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!loading) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 99999,
        background: "rgba(4, 159, 217, 0.2)",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          background: "linear-gradient(90deg, #003366 0%, #004b87 40%, #006fa8 75%, #38bdf8 100%)",
          boxShadow: "0 0 10px #006fa8, 0 0 5px #38bdf8",
          animation: "topProgressPulse 1.8s ease-in-out infinite",
        }}
      />
    </div>
  );
}
