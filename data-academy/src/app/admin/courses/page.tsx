import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CourseListClient from "./CourseListClient";

export const instant = false;

async function getCoursesData() {
  const [courses, categories] = await Promise.all([
    prisma.course.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        category: true,
        instructors: {
          include: {
            user: { include: { profile: true } },
          },
        },
        _count: {
          select: {
            modules: true,
            enrollments: true,
          },
        },
      },
    }),
    prisma.courseCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return { courses, categories };
}

export default async function AdminCoursesPage() {
  const { courses, categories } = await getCoursesData();

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Top Header */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/admin" style={{ color: "var(--na-blue-500)", fontSize: "0.875rem", textDecoration: "none" }}>
              Admin
            </Link>
            <span style={{ color: "var(--na-gray-400)" }}>/</span>
            <span style={{ color: "var(--na-gray-600)", fontSize: "0.875rem" }}>Courses</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1b2533" }}>
            Course Management
          </h1>
        </div>

        <Link
          href="/admin/courses/new"
          className="btn btn-green"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.25rem",
            borderRadius: "9999px",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create New Course
        </Link>
      </div>

      <CourseListClient initialCourses={courses} categories={categories} />
    </div>
  );
}
