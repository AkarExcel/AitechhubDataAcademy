import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import AdminPathsClient from "./AdminPathsClient";

export const instant = false;

async function getPathsAdminData() {
  const [paths, allCourses] = await Promise.all([
    prisma.learningPath.findMany({
      orderBy: { order: "asc" },
      include: {
        courses: {
          orderBy: { order: "asc" },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                level: true,
                estimatedHours: true,
                coverImage: true,
                status: true,
              },
            },
          },
        },
      },
    }),
    prisma.course.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        level: true,
        estimatedHours: true,
        status: true,
      },
    }),
  ]);

  return { paths, allCourses };
}

export default async function AdminPathsPage() {
  await requireAdmin({ redirectUrl: "/unauthorized" });
  const { paths, allCourses } = await getPathsAdminData();

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <AdminPathsClient initialPaths={paths as any} allCourses={allCourses} />
    </div>
  );
}
