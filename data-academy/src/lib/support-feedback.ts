import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export interface CreateTicketParams {
  userId: string;
  subject: string;
  category: string;
  description: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  courseId?: string | null;
  courseTitle?: string | null;
}

export interface TicketPayload {
  category: string;
  details: string;
  courseId?: string | null;
  courseTitle?: string | null;
  adminResponse?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
}

/**
 * Creates a new support ticket for a student or tutor
 */
export async function createSupportTicket({
  userId,
  subject,
  category,
  description,
  priority = "NORMAL",
  courseId,
  courseTitle,
}: CreateTicketParams) {
  try {
    // Pack structured ticket metadata into description JSON for robust extensibility
    const structuredDescription = JSON.stringify({
      category,
      details: description.trim(),
      courseId: courseId || null,
      courseTitle: courseTitle || null,
      adminResponse: null,
      resolvedAt: null,
      resolvedBy: null,
    } satisfies TicketPayload);

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject: subject.trim(),
        description: structuredDescription,
        status: "OPEN",
        priority,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
      },
    });

    // Notify user in-app that ticket has been received
    await createNotification({
      userId,
      type: "SYSTEM",
      title: `🎫 Support Ticket Created: ${subject.trim()}`,
      message: `Your request has been logged with ticket ID #${ticket.id.slice(-6).toUpperCase()}. Our support team will review it shortly.`,
      link: "/support",
    });

    return { success: true, ticket };
  } catch (error) {
    console.error("Error creating support ticket:", error);
    return { success: false, error };
  }
}

/**
 * Parses a ticket's description field (supports JSON and legacy text)
 */
export function parseTicketDescription(description: string): TicketPayload {
  try {
    if (description.startsWith("{") && description.endsWith("}")) {
      const parsed = JSON.parse(description);
      return {
        category: parsed.category || "General Support",
        details: parsed.details || description,
        courseId: parsed.courseId || null,
        courseTitle: parsed.courseTitle || null,
        adminResponse: parsed.adminResponse || null,
        resolvedAt: parsed.resolvedAt || null,
        resolvedBy: parsed.resolvedBy || null,
      };
    }
  } catch {
    // fallback
  }

  return {
    category: "General Support",
    details: description,
    courseId: null,
    courseTitle: null,
    adminResponse: null,
    resolvedAt: null,
    resolvedBy: null,
  };
}

/**
 * Retrieves all tickets for a specific user
 */
export async function getUserSupportTickets(userId: string) {
  try {
    const rawTickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return rawTickets.map((t) => {
      const parsed = parseTicketDescription(t.description);
      return {
        id: t.id,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        category: parsed.category,
        details: parsed.details,
        courseTitle: parsed.courseTitle,
        adminResponse: parsed.adminResponse,
        resolvedAt: parsed.resolvedAt,
        resolvedBy: parsed.resolvedBy,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    });
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    return [];
  }
}

/**
 * Retrieves tickets for admin with filters
 */
export async function getAllSupportTickets({
  status,
  priority,
  role,
  search,
}: {
  status?: string;
  priority?: string;
  role?: string;
  search?: string;
}) {
  try {
    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (priority && priority !== "ALL") {
      where.priority = priority;
    }

    if (role && role !== "ALL") {
      where.user = { role };
    }

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { subject: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { user: { profile: { firstName: { contains: q, mode: "insensitive" } } } },
        { user: { profile: { lastName: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const [tickets, totalCount, openCount, inProgressCount, resolvedCount] =
      await Promise.all([
        prisma.supportTicket.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                profile: { select: { firstName: true, lastName: true, avatar: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        prisma.supportTicket.count(),
        prisma.supportTicket.count({ where: { status: "OPEN" } }),
        prisma.supportTicket.count({ where: { status: "IN_PROGRESS" } }),
        prisma.supportTicket.count({ where: { status: "RESOLVED" } }),
      ]);

    const formatted = tickets.map((t) => {
      const parsed = parseTicketDescription(t.description);
      const submitterName = t.user.profile?.firstName
        ? `${t.user.profile.firstName} ${t.user.profile.lastName || ""}`.trim()
        : t.user.email;

      return {
        id: t.id,
        userId: t.userId,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        category: parsed.category,
        details: parsed.details,
        courseTitle: parsed.courseTitle,
        adminResponse: parsed.adminResponse,
        resolvedAt: parsed.resolvedAt,
        resolvedBy: parsed.resolvedBy,
        submitter: {
          id: t.user.id,
          name: submitterName,
          email: t.user.email,
          role: t.user.role,
          avatar: t.user.profile?.avatar || null,
        },
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    });

    return {
      tickets: formatted,
      stats: {
        totalCount,
        openCount,
        inProgressCount,
        resolvedCount,
        closedCount: totalCount - openCount - inProgressCount - resolvedCount,
      },
    };
  } catch (error) {
    console.error("Error retrieving admin tickets:", error);
    return {
      tickets: [],
      stats: { totalCount: 0, openCount: 0, inProgressCount: 0, resolvedCount: 0, closedCount: 0 },
    };
  }
}

/**
 * Updates a support ticket status, priority, and admin response
 */
export async function updateSupportTicket({
  ticketId,
  status,
  priority,
  adminResponse,
  adminName = "Support Team",
}: {
  ticketId: string;
  status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  adminResponse?: string;
  adminName?: string;
}) {
  try {
    const existing = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: true },
    });

    if (!existing) {
      return { success: false, error: "Ticket not found." };
    }

    const parsed = parseTicketDescription(existing.description);
    if (adminResponse !== undefined) {
      parsed.adminResponse = adminResponse.trim() || null;
    }
    if (status === "RESOLVED" || status === "CLOSED") {
      parsed.resolvedAt = new Date().toISOString();
      parsed.resolvedBy = adminName;
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        description: JSON.stringify(parsed),
        updatedAt: new Date(),
      },
    });

    // Notify student/tutor when an admin responds or resolves the ticket
    if (adminResponse?.trim() || status === "RESOLVED") {
      const statusLabel = status === "RESOLVED" ? "Resolved" : "Updated";
      await createNotification({
        userId: existing.userId,
        type: "SYSTEM",
        title: `🎫 Ticket #${ticketId.slice(-6).toUpperCase()} ${statusLabel}`,
        message: adminResponse?.trim()
          ? `Support response: "${adminResponse.trim().slice(0, 120)}${adminResponse.length > 120 ? "..." : ""}"`
          : `Your support ticket has been marked as ${statusLabel.toLowerCase()} by ${adminName}.`,
        link: "/support",
      });
    }

    return { success: true, ticket: updated };
  } catch (error) {
    console.error("Error updating support ticket:", error);
    return { success: false, error };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ── FEEDBACK ENGINE ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

export interface SubmitFeedbackParams {
  userId: string;
  rating: number; // 1-5
  category: string;
  content: string;
  courseId?: string | null;
  courseTitle?: string | null;
  allowFeatured?: boolean;
  userRole?: string;
  userName?: string;
  userEmail?: string;
}

/**
 * Submits platform or course feedback from a student or tutor
 */
export async function submitFeedback({
  userId,
  rating,
  category,
  content,
  courseId,
  courseTitle,
  allowFeatured = false,
  userRole = "STUDENT",
  userName,
  userEmail,
}: SubmitFeedbackParams) {
  try {
    const feedbackPayload = {
      rating,
      category,
      content: content.trim(),
      courseId: courseId || null,
      courseTitle: courseTitle || null,
      allowFeatured,
      userRole,
      userName: userName || "Academy Member",
      userEmail: userEmail || "",
      status: "SUBMITTED",
      isFeatured: false,
      adminNotes: null,
    };

    // Store in AuditLog for durable event record
    const log = await prisma.auditLog.create({
      data: {
        userId,
        action: "USER_FEEDBACK_SUBMISSION",
        entityType: "Feedback",
        metadata: feedbackPayload,
      },
    });

    // Also notify user that feedback was recorded
    await createNotification({
      userId,
      type: "SYSTEM",
      title: `⭐ Thank You for Your Feedback!`,
      message: `We appreciate your review of ${courseTitle ? `"${courseTitle}"` : "the academy"}. Your feedback helps us continuously improve the curriculum and experience.`,
      link: "/feedback",
    });

    return { success: true, id: log.id };
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return { success: false, error };
  }
}

/**
 * Retrieves feedback submissions by a specific user
 */
export async function getUserFeedback(userId: string) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        userId,
        action: "USER_FEEDBACK_SUBMISSION",
      },
      orderBy: { createdAt: "desc" },
    });

    return logs.map((log) => {
      const meta = (log.metadata as any) || {};
      return {
        id: log.id,
        rating: meta.rating || 5,
        category: meta.category || "General Feedback",
        content: meta.content || "",
        courseTitle: meta.courseTitle || null,
        allowFeatured: meta.allowFeatured ?? false,
        status: meta.status || "SUBMITTED",
        isFeatured: meta.isFeatured ?? false,
        createdAt: log.createdAt,
      };
    });
  } catch (error) {
    console.error("Error fetching user feedback:", error);
    return [];
  }
}

/**
 * Retrieves all feedback submissions for admin review
 */
export async function getAllFeedback({
  rating,
  category,
  role,
  search,
}: {
  rating?: number;
  category?: string;
  role?: string;
  search?: string;
}) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { action: "USER_FEEDBACK_SUBMISSION" },
      orderBy: { createdAt: "desc" },
      take: 120,
    });

    let items = logs.map((log) => {
      const meta = (log.metadata as any) || {};
      return {
        id: log.id,
        userId: log.userId,
        rating: meta.rating || 5,
        category: meta.category || "General Feedback",
        content: meta.content || "",
        courseId: meta.courseId || null,
        courseTitle: meta.courseTitle || null,
        allowFeatured: meta.allowFeatured ?? false,
        userRole: meta.userRole || "STUDENT",
        userName: meta.userName || "Academy Learner",
        userEmail: meta.userEmail || "",
        status: meta.status || "SUBMITTED",
        isFeatured: meta.isFeatured ?? false,
        adminNotes: meta.adminNotes || null,
        createdAt: log.createdAt,
      };
    });

    // In-memory filtering for JSON metadata fields
    if (rating) {
      items = items.filter((f) => f.rating === Number(rating));
    }
    if (category && category !== "ALL") {
      items = items.filter((f) => f.category === category);
    }
    if (role && role !== "ALL") {
      items = items.filter((f) => f.userRole === role);
    }
    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (f) =>
          f.userName.toLowerCase().includes(q) ||
          f.userEmail.toLowerCase().includes(q) ||
          f.content.toLowerCase().includes(q) ||
          (f.courseTitle && f.courseTitle.toLowerCase().includes(q))
      );
    }

    const totalCount = logs.length;
    const avgRating =
      totalCount > 0
        ? logs.reduce((sum, l) => sum + (((l.metadata as any)?.rating as number) || 5), 0) /
          totalCount
        : 5;
    const fiveStarCount = logs.filter(
      (l) => ((l.metadata as any)?.rating as number) === 5
    ).length;
    const featuredCount = logs.filter(
      (l) => (l.metadata as any)?.isFeatured === true
    ).length;

    return {
      feedback: items,
      stats: {
        totalCount,
        avgRating: Number(avgRating.toFixed(1)),
        fiveStarCount,
        featuredCount,
      },
    };
  } catch (error) {
    console.error("Error retrieving admin feedback:", error);
    return {
      feedback: [],
      stats: { totalCount: 0, avgRating: 5.0, fiveStarCount: 0, featuredCount: 0 },
    };
  }
}

/**
 * Promotes user feedback directly into the public Testimonial table
 */
export async function featureFeedbackAsTestimonial({
  feedbackId,
  studentName,
  role,
  company,
  content,
  rating = 5,
  courseTitle,
}: {
  feedbackId: string;
  studentName: string;
  role?: string;
  company?: string;
  content: string;
  rating?: number;
  courseTitle?: string | null;
}) {
  try {
    // 1. Create or ensure testimonial exists
    const testimonial = await prisma.testimonial.create({
      data: {
        studentName,
        role: role || "Data Academy Student",
        company: company || "Data Practitioner",
        content,
        rating,
        courseTitle: courseTitle || "AI Tech Hub Academy",
        isApproved: true,
        isFeatured: true,
        order: 0,
      },
    });

    // 2. Mark the audit log feedback item as FEATURED
    const log = await prisma.auditLog.findUnique({
      where: { id: feedbackId },
    });

    if (log && log.metadata) {
      const meta = log.metadata as any;
      await prisma.auditLog.update({
        where: { id: feedbackId },
        data: {
          metadata: {
            ...meta,
            status: "FEATURED",
            isFeatured: true,
            testimonialId: testimonial.id,
          },
        },
      });

      // Notify the student that their review was featured
      if (log.userId) {
        await createNotification({
          userId: log.userId,
          type: "ANNOUNCEMENT",
          title: `🌟 Your Feedback is Featured on the Homepage!`,
          message: `Congratulations! Your review for "${courseTitle || "the academy"}" was selected as a featured testimonial. Thank you for inspiring other learners!`,
          link: "/feedback",
        });
      }
    }

    return { success: true, testimonial };
  } catch (error) {
    console.error("Error featuring feedback as testimonial:", error);
    return { success: false, error };
  }
}

