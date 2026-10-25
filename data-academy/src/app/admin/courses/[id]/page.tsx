import { prisma } from "@/lib/prisma";
import CourseEditorClient from "./CourseEditorClient";
import Link from "next/link";
import { notFound } from "next/navigation";

export const instant = false;

async function getCourseAndDependencies(courseId: string) {
  const [course, categories, availableTutors] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      include: {
        category: true,
        instructors: {
          include: {
            user: { include: { profile: true } },
            tutor: true,
          },
        },
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    }),
    prisma.courseCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { role: "TUTOR" },
          { role: "ADMIN" },
          { tutorProfile: { isNot: null } },
        ],
      },
      include: {
        profile: true,
        tutorProfile: true,
      },
    }),
  ]);

  return { course, categories, availableTutors };
}

export default async function CourseEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;

  const { course, categories, availableTutors } = await getCourseAndDependencies(id);

  if (!course) {
    notFound();
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Breadcrumbs */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <Link href="/admin" style={{ color: "var(--na-blue-500)", fontSize: "0.875rem", textDecoration: "none" }}>
          Admin
        </Link>
        <span style={{ color: "var(--na-gray-400)" }}>/</span>
        <Link href="/admin/courses" style={{ color: "var(--na-blue-500)", fontSize: "0.875rem", textDecoration: "none" }}>
          Courses
        </Link>
        <span style={{ color: "var(--na-gray-400)" }}>/</span>
        <span style={{ color: "var(--na-gray-600)", fontSize: "0.875rem", maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {course.title}
        </span>
      </div>

      <CourseEditorClient
        initialCourse={course as any}
        categories={categories}
        availableTutors={availableTutors}
        defaultTab={tab || "curriculum"}
      />
    </div>
  );
}
