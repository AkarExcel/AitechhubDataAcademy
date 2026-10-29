import { prisma } from "@/lib/prisma";
import CourseEditorClient from "@/app/admin/courses/[id]/CourseEditorClient";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireTutor } from "@/lib/permissions";

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

export default async function TutorCourseEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const sessionUser = await requireTutor({
    redirectUrl: "/unauthorized?required=TUTOR",
  });

  const { id } = await params;
  const { tab } = await searchParams;

  const { course, categories, availableTutors } = await getCourseAndDependencies(id);

  if (!course) {
    notFound();
  }

  const isAdmin = sessionUser.role === "ADMIN";
  const isAssignedInstructor = course.instructors.some((inst) => inst.userId === sessionUser.id);

  if (!isAdmin && !isAssignedInstructor) {
    redirect("/tutor/courses");
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* ── BREADCRUMBS ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <Link href="/tutor" style={{ color: "var(--brand-blue-600, #004b87)", fontSize: "0.875rem", textDecoration: "none" }}>
          Faculty Hub
        </Link>
        <span style={{ color: "#94a3b8" }}>/</span>
        <Link href="/tutor/courses" style={{ color: "var(--brand-blue-600, #004b87)", fontSize: "0.875rem", textDecoration: "none" }}>
          Courses
        </Link>
        <span style={{ color: "#94a3b8" }}>/</span>
        <span style={{ color: "#475569", fontSize: "0.875rem", maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {course.title}
        </span>
      </div>

      <CourseEditorClient
        initialCourse={course as any}
        categories={categories}
        availableTutors={availableTutors}
        defaultTab={tab || "curriculum"}
        isAdmin={isAdmin}
      />
    </div>
  );
}
