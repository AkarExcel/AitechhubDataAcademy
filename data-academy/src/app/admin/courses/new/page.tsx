import { prisma } from "@/lib/prisma";
import NewCourseForm from "./NewCourseForm";
import Link from "next/link";

export const instant = false;

async function getCategories() {
  return prisma.courseCategory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export default async function NewCoursePage() {
  const categories = await getCategories();

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <Link href="/admin" style={{ color: "var(--na-blue-500)", fontSize: "0.875rem", textDecoration: "none" }}>
          Admin
        </Link>
        <span style={{ color: "var(--na-gray-400)" }}>/</span>
        <Link href="/admin/courses" style={{ color: "var(--na-blue-500)", fontSize: "0.875rem", textDecoration: "none" }}>
          Courses
        </Link>
        <span style={{ color: "var(--na-gray-400)" }}>/</span>
        <span style={{ color: "var(--na-gray-600)", fontSize: "0.875rem" }}>New</span>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1b2533", marginBottom: "0.25rem" }}>
          Create New Course
        </h1>
        <p style={{ color: "var(--na-gray-600)", fontSize: "0.9375rem" }}>
          Define the curriculum metadata, learning outcomes, and publishing settings.
        </p>
      </div>

      <NewCourseForm categories={categories} />
    </div>
  );
}
