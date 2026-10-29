import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trim() + "…";
}

export function getLevelColor(level: string): string {
  switch (level) {
    case "BEGINNER":
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "INTERMEDIATE":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "ADVANCED":
      return "text-rose-600 bg-rose-50 border-rose-200";
    default:
      return "text-slate-600 bg-slate-50 border-slate-200";
  }
}

export function getLevelLabel(level: string): string {
  return level.charAt(0) + level.slice(1).toLowerCase();
}

/**
 * Returns the public canonical base URL of the deployment.
 * Supports NEXT_PUBLIC_APP_URL, Vercel system environment variables, and local fallback.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
