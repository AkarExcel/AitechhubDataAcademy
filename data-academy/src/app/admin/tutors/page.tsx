import { prisma } from "@/lib/prisma";
import TutorsClient from "./TutorsClient";
import Link from "next/link";

export const instant = false;

async function getTutorsData() {
  const [tutors, eligibleUsers] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { role: "TUTOR" },
          { tutorProfile: { isNot: null } },
        ],
      },
      include: {
        profile: true,
        tutorProfile: {
          include: {
            courseInstructors: {
              include: {
                course: {
                  select: { id: true, title: true, slug: true, status: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: {
        role: { not: "TUTOR" },
        tutorProfile: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        profile: {
          select: { firstName: true, lastName: true },
        },
      },
      take: 20,
    }),
  ]);

  return { tutors, eligibleUsers };
}

export default async function AdminTutorsPage() {
  const { tutors, eligibleUsers } = await getTutorsData();

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <Link href="/admin" style={{ color: "var(--na-blue-500)", fontSize: "0.875rem", textDecoration: "none" }}>
          Admin
        </Link>
        <span style={{ color: "var(--na-gray-400)" }}>/</span>
        <span style={{ color: "var(--na-gray-600)", fontSize: "0.875rem" }}>Tutors &amp; Faculty</span>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#1b2533", marginBottom: "0.25rem" }}>
          Tutors &amp; Faculty Management
        </h1>
        <p style={{ color: "var(--na-gray-600)", fontSize: "0.9375rem" }}>
          Review instructor qualifications, approve teaching access, and manage course assignments.
        </p>
      </div>

      <TutorsClient initialTutors={tutors as any} eligibleUsers={eligibleUsers} />
    </div>
  );
}
