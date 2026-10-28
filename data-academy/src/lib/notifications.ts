import { prisma } from "@/lib/prisma";

export type NotificationCategory =
  | "ALL"
  | "UNREAD"
  | "COURSE_UPDATE"
  | "COURSEWORK"
  | "CERTIFICATE";

export interface CreateNotificationParams {
  userId: string;
  type:
    | "ENROLLMENT"
    | "ANNOUNCEMENT"
    | "DEADLINE"
    | "GRADE"
    | "ASSESSMENT_RESULT"
    | "COURSE_COMPLETE"
    | "CERTIFICATE"
    | "SYSTEM";
  title: string;
  message: string;
  link?: string | null;
}

export type AudienceSegment =
  | "ALL"
  | "ACTIVE"
  | "COMPLETED"
  | "STALLED"
  | "FINAL_LAP";

export interface CourseBroadcastParams {
  courseId: string;
  title: string;
  message: string;
  link?: string | null;
  type?:
    | "ANNOUNCEMENT"
    | "SYSTEM"
    | "DEADLINE"
    | "GRADE"
    | "ASSESSMENT_RESULT"
    | "COURSE_COMPLETE"
    | "CERTIFICATE";
  includeCompleted?: boolean;
  audience?: AudienceSegment;
  senderId?: string;
}

/**
 * Creates a single notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
        isRead: false,
      },
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

/**
 * Broadcasts an update/reminder notification to enrolled students with audience segmentation.
 * CRITICAL RULE: Informs students of updates and allows targeting alumni without affecting
 * or invalidating existing certificates.
 */
export async function notifyCourseStudents({
  courseId,
  title,
  message,
  link,
  type = "ANNOUNCEMENT",
  includeCompleted = true,
  audience = "ALL",
  senderId,
}: CourseBroadcastParams) {
  try {
    // 1. Build where query based on audience segment
    const where: any = {};
    if (courseId !== "all") {
      where.courseId = courseId;
    }

    switch (audience) {
      case "ACTIVE":
        where.status = "ACTIVE";
        where.progress = { lt: 100 };
        break;
      case "COMPLETED":
        where.OR = [{ status: "COMPLETED" }, { progress: { gte: 100 } }];
        break;
      case "STALLED":
        where.status = "ACTIVE";
        where.progress = { lt: 50 };
        break;
      case "FINAL_LAP":
        where.status = "ACTIVE";
        where.progress = { gte: 70, lt: 100 };
        break;
      case "ALL":
      default:
        if (!includeCompleted) {
          where.status = "ACTIVE";
        }
        break;
    }

    // 2. Fetch target enrollments
    const enrollments = await prisma.enrollment.findMany({
      where,
      select: {
        userId: true,
        status: true,
        progress: true,
      },
    });

    if (!enrollments.length) {
      return { count: 0, totalEnrolled: 0 };
    }

    // 3. Deduplicate user IDs so multiple course enrollments don't produce duplicate notifications in global sends
    const uniqueUserIds = Array.from(new Set(enrollments.map((e) => e.userId)));

    // 4. Prepare notifications batch
    const notificationsData = uniqueUserIds.map((userId) => ({
      userId,
      type,
      title,
      message,
      link: link || null,
      isRead: false,
    }));

    // 5. Batch create notifications
    const result = await prisma.notification.createMany({
      data: notificationsData,
    });

    // 6. Record in AuditLog for broadcast tracking
    try {
      await prisma.auditLog.create({
        data: {
          userId: senderId || null,
          action: "COURSE_REMINDER_BROADCAST",
          entityType: "Course",
          entityId: courseId === "all" ? null : courseId,
          metadata: {
            title,
            message,
            link,
            type,
            audience,
            recipientCount: result.count,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Could not log broadcast audit:", auditErr);
    }

    return { count: result.count, totalEnrolled: uniqueUserIds.length };
  } catch (error) {
    console.error("Error broadcasting course notification to students:", error);
    return { count: 0, error };
  }
}

/**
 * Retrieves audience breakdown for a course (or all courses)
 */
export async function getCourseAudienceBreakdown(courseId?: string) {
  try {
    const where: any = {};
    if (courseId && courseId !== "all") {
      where.courseId = courseId;
    }

    const [totalEnrolled, activeCount, completedCount, stalledCount, finalLapCount] =
      await Promise.all([
        prisma.enrollment.count({ where }),
        prisma.enrollment.count({
          where: { ...where, status: "ACTIVE", progress: { lt: 100 } },
        }),
        prisma.enrollment.count({
          where: {
            ...where,
            OR: [{ status: "COMPLETED" }, { progress: { gte: 100 } }],
          },
        }),
        prisma.enrollment.count({
          where: { ...where, status: "ACTIVE", progress: { lt: 50 } },
        }),
        prisma.enrollment.count({
          where: { ...where, status: "ACTIVE", progress: { gte: 70, lt: 100 } },
        }),
      ]);

    return {
      totalEnrolled,
      activeCount,
      completedCount,
      stalledCount,
      finalLapCount,
    };
  } catch (err) {
    console.error("Error calculating audience breakdown:", err);
    return {
      totalEnrolled: 0,
      activeCount: 0,
      completedCount: 0,
      stalledCount: 0,
      finalLapCount: 0,
    };
  }
}

/**
 * Retrieves recent reminder broadcasts
 */
export async function getRecentBroadcasts(limit = 10) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { action: "COURSE_REMINDER_BROADCAST" },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
      },
    });

    return logs.map((log) => {
      const meta = (log.metadata as any) || {};
      return {
        id: log.id,
        createdAt: log.createdAt,
        courseId: log.entityId,
        title: meta.title || "Course Update Reminder",
        message: meta.message || "",
        type: meta.type || "ANNOUNCEMENT",
        audience: meta.audience || "ALL",
        recipientCount: meta.recipientCount || 0,
        senderName: log.user?.profile?.firstName
          ? `${log.user.profile.firstName} ${log.user.profile.lastName || ""}`.trim()
          : log.user?.email || "System Admin",
      };
    });
  } catch (err) {
    console.error("Error fetching recent broadcasts:", err);
    return [];
  }
}

/**
 * Sends a coursework notification to a student (quiz, assignment, grade, exercise)
 */
export async function notifyStudentCoursework({
  userId,
  courseTitle,
  lessonTitle,
  lessonType,
  lessonId,
  courseSlug,
}: {
  userId: string;
  courseTitle: string;
  lessonTitle: string;
  lessonType: string;
  lessonId: string;
  courseSlug: string;
}) {
  const typeLabel = lessonType.toLowerCase().replace(/_/g, " ");

  const title = `🎯 Coursework Completed: ${lessonTitle}`;
  const message = `You successfully completed the ${typeLabel} in "${courseTitle}". Your progress has been updated!`;
  const link = `/learn/${courseSlug}?lessonId=${lessonId}`;

  return await createNotification({
    userId,
    type: "ASSESSMENT_RESULT",
    title,
    message,
    link,
  });
}

/**
 * Retrieves all notifications for a student with category filtering
 */
export async function getStudentNotifications(
  userId: string,
  category: NotificationCategory = "ALL"
) {
  try {
    const where: any = { userId };

    if (category === "UNREAD") {
      where.isRead = false;
    } else if (category === "COURSE_UPDATE") {
      where.type = { in: ["ANNOUNCEMENT", "SYSTEM"] };
    } else if (category === "COURSEWORK") {
      where.type = { in: ["GRADE", "ASSESSMENT_RESULT", "DEADLINE"] };
    } else if (category === "CERTIFICATE") {
      where.type = { in: ["CERTIFICATE", "COURSE_COMPLETE"] };
    }

    const [notifications, unreadCount, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
      prisma.notification.count({
        where: { userId },
      }),
    ]);

    return {
      notifications,
      unreadCount,
      totalCount,
    };
  } catch (error) {
    console.error("Error fetching student notifications:", error);
    return {
      notifications: [],
      unreadCount: 0,
      totalCount: 0,
    };
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationRead(notificationId: string, userId: string) {
  try {
    return await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  } catch (error) {
    console.error("Error marking notification read:", error);
    return null;
  }
}

/**
 * Mark all notifications for a user as read
 */
export async function markAllNotificationsRead(userId: string) {
  try {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  } catch (error) {
    console.error("Error marking all notifications read:", error);
    return null;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: string) {
  try {
    return await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return null;
  }
}
