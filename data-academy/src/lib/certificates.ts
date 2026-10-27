import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface CertificateWithDetails {
  id: string;
  certificateCode: string;
  issuedAt: Date;
  verificationUrl: string | null;
  course: {
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    level: string;
    estimatedHours: number;
    certificateEnabled: boolean;
  };
  user: {
    id: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar: string | null;
    } | null;
  };
}

/**
 * Generates an official, human-readable verification certificate code
 * Format: AIT-2026-XXXXXXXX (uppercase alphanumeric)
 */
export function generateCertificateCode(): string {
  const year = new Date().getFullYear();
  const randomChars = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();
  return `AIT-${year}-${randomChars}`;
}

/**
 * Checks if a student is eligible and automatically generates their certificate in Supabase
 * If a certificate already exists, returns the existing record.
 */
export async function autoGenerateCertificate(
  userId: string,
  courseId: string,
  force = false
) {
  try {
    // 1. Check if certificate already exists
    const existing = await prisma.certificate.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            shortDescription: true,
            level: true,
            estimatedHours: true,
            certificateEnabled: true,
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
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (existing) {
      return existing;
    }

    // 2. Check enrollment and course completion eligibility
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        course: true,
      },
    });

    if (!enrollment) {
      return null;
    }

    const course = enrollment.course;
    const threshold = course.completionThreshold || 0.8;
    const isCompleted =
      enrollment.status === "COMPLETED" ||
      (enrollment.progress !== null && enrollment.progress >= threshold);

    if (!isCompleted && !force) {
      return null;
    }

    // 3. Generate unique certificate code
    let certificateCode = generateCertificateCode();
    let collision = await prisma.certificate.findUnique({
      where: { certificateCode },
    });
    while (collision) {
      certificateCode = generateCertificateCode();
      collision = await prisma.certificate.findUnique({
        where: { certificateCode },
      });
    }

    // 4. Create the Certificate record in Supabase
    const certificate = await prisma.certificate.create({
      data: {
        userId,
        courseId,
        certificateCode,
        verificationUrl: `/certificates/${certificateCode}`,
        issuedAt: enrollment.completedAt || new Date(),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            shortDescription: true,
            level: true,
            estimatedHours: true,
            certificateEnabled: true,
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
                avatar: true,
              },
            },
          },
        },
      },
    });

    // 5. Send automated notification to the student
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: "CERTIFICATE",
          title: "🎉 Certificate Earned!",
          message: `Congratulations! You have successfully completed "${course.title}". Your official certificate is now ready to view, share, and verify.`,
          link: `/certificates/${certificateCode}`,
        },
      });
    } catch (notifErr) {
      console.warn("Could not create certificate notification:", notifErr);
    }

    return certificate;
  } catch (error) {
    console.error("Error generating certificate:", error);
    throw error;
  }
}

/**
 * Automatically inspects all student enrollments and generates certificates
 * for any course that has reached completion but lacks a certificate.
 */
export async function syncStudentCertificates(userId: string) {
  try {
    // 1. Fetch completed enrollments for this user
    const completedEnrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        OR: [
          { status: "COMPLETED" },
          { progress: { gte: 0.8 } },
        ],
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            completionThreshold: true,
            certificateEnabled: true,
          },
        },
      },
    });

    // 2. For each, generate certificate if missing
    for (const enr of completedEnrollments) {
      const threshold = enr.course.completionThreshold || 0.8;
      if (enr.status === "COMPLETED" || enr.progress >= threshold) {
        await autoGenerateCertificate(userId, enr.courseId);
      }
    }

    // 3. Return all certificates for this user
    const certificates = await prisma.certificate.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            shortDescription: true,
            level: true,
            estimatedHours: true,
            certificateEnabled: true,
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
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    return certificates;
  } catch (error) {
    console.error("Error syncing student certificates:", error);
    return [];
  }
}

/**
 * Fetch certificate by public code or ID for public verification and display
 */
export async function getCertificateByCode(code: string) {
  try {
    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [{ certificateCode: code }, { id: code }],
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            shortDescription: true,
            level: true,
            estimatedHours: true,
            certificateEnabled: true,
            instructors: {
              where: { isPrimary: true },
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
              take: 1,
            },
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
                avatar: true,
              },
            },
          },
        },
      },
    });

    return cert;
  } catch (error) {
    console.error("Error retrieving certificate by code:", error);
    return null;
  }
}
