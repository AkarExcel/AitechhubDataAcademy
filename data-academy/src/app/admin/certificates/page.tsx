import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCertificateTemplate } from "@/lib/certificateTemplate";
import AdminCertificatesClient from "./AdminCertificatesClient";

export const instant = false;

export const metadata = {
  title: "Certificate Management | Admin Console",
  description: "Customize certificate templates, inspect credentials, and manage issuances.",
};

export default async function AdminCertificatesPage() {
  await requireRole(["ADMIN", "TUTOR"], {
    redirectUrl: "/unauthorized?required=ADMIN",
  });

  const [template, certificates, courses, students] = await Promise.all([
    getCertificateTemplate(),
    prisma.certificate.findMany({
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.course.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const studentOptions = students.map((s) => ({
    id: s.id,
    email: s.email,
    name: s.profile
      ? `${s.profile.firstName} ${s.profile.lastName}`.trim()
      : s.email.split("@")[0],
  }));

  return (
    <AdminCertificatesClient
      initialTemplate={template}
      initialCertificates={certificates}
      courses={courses}
      students={studentOptions}
    />
  );
}
