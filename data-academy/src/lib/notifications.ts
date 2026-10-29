import { prisma } from "@/lib/prisma";

export type NotificationCategory =
  | "ALL"
  | "UNREAD"
  | "COURSE_UPDATE"
  | "COURSEWORK"
  | "CERTIFICATE"
  | "SPECIALIZED";

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

export interface SpecializedStudentNotificationParams {
  studentId: string;
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
  senderId?: string;
  senderName?: string;
  senderRole?: "ADMIN" | "TUTOR" | string;
  courseId?: string;
  specializedType?: "FEEDBACK" | "MENTOR_NOTE" | "PROGRESS_CHECK" | "DIRECT_MESSAGE";
}

export interface TutorNotificationParams {
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
  senderId?: string;
  senderName?: string;
  tutorId?: string; // specific tutor ID, or 'all' for all tutors
  tutorIds?: string[]; // multiple specific tutor IDs (multi-choice)
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
 * Dispatches a specialized individual notification to a student from a Tutor or Admin
 */
export async function sendSpecializedStudentNotification({
  studentId,
  title,
  message,
  link,
  type = "ANNOUNCEMENT",
  senderId,
  senderName,
  senderRole = "TUTOR",
  courseId,
  specializedType = "DIRECT_MESSAGE",
}: SpecializedStudentNotificationParams) {
  try {
    // 1. Fetch student info for verification and audit
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        email: true,
        role: true,
        profile: { select: { firstName: true, lastName: true } },
      },
    });

    if (!student) {
      return { success: false, error: "Student not found." };
    }

    const studentFullName = student.profile?.firstName
      ? `${student.profile.firstName} ${student.profile.lastName || ""}`.trim()
      : student.email;

    // 2. Format title with sender attribution if not already present
    let formattedTitle = title.trim();
    const prefix =
      senderRole === "ADMIN"
        ? "📢 [Admin Message]"
        : `💬 [From Instructor ${senderName || "Tutor"}]`;

    if (!formattedTitle.startsWith("💬") && !formattedTitle.startsWith("📢")) {
      formattedTitle = `${prefix} ${formattedTitle}`;
    }

    // 3. Create single targeted notification
    const notification = await prisma.notification.create({
      data: {
        userId: studentId,
        type,
        title: formattedTitle,
        message: message.trim(),
        link: link || null,
        isRead: false,
      },
    });

    // 4. Log in AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          userId: senderId || null,
          action: "SPECIALIZED_STUDENT_NOTIFICATION",
          entityType: "User",
          entityId: studentId,
          metadata: {
            title: formattedTitle,
            message: message.trim(),
            link: link || null,
            type,
            specializedType,
            recipientName: studentFullName,
            recipientEmail: student.email,
            senderName,
            senderRole,
            courseId: courseId || null,
            recipientCount: 1,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Could not log specialized notification audit:", auditErr);
    }

    return {
      success: true,
      notification,
      studentName: studentFullName,
      studentEmail: student.email,
    };
  } catch (error) {
    console.error("Error sending specialized student notification:", error);
    return { success: false, error };
  }
}

/**
 * Dispatches a notification from Admin to Tutors / Instructors (all or specific)
 */
export async function sendTutorNotification({
  title,
  message,
  link,
  type = "ANNOUNCEMENT",
  senderId,
  senderName,
  tutorId,
  tutorIds,
}: TutorNotificationParams) {
  try {
    let targetTutors: { id: string; email: string; name?: string }[] = [];

    // 1. Multiple specific tutors
    if (tutorIds && tutorIds.length > 0) {
      const selected = await prisma.user.findMany({
        where: { id: { in: tutorIds }, isActive: true },
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      });

      targetTutors = selected.map((t) => ({
        id: t.id,
        email: t.email,
        name: t.profile?.firstName
          ? `${t.profile.firstName} ${t.profile.lastName || ""}`.trim()
          : t.email,
      }));
    } else if (tutorId && tutorId !== "all") {
      // 2. Single specific tutor
      const tutor = await prisma.user.findUnique({
        where: { id: tutorId },
        select: {
          id: true,
          email: true,
          role: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      });

      if (!tutor) {
        return { count: 0, error: "Target tutor not found." };
      }

      targetTutors = [
        {
          id: tutor.id,
          email: tutor.email,
          name: tutor.profile?.firstName
            ? `${tutor.profile.firstName} ${tutor.profile.lastName || ""}`.trim()
            : tutor.email,
        },
      ];
    } else {
      // 3. All active tutors
      const tutors = await prisma.user.findMany({
        where: {
          OR: [{ role: "TUTOR" }, { tutorProfile: { isNot: null } }],
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      });

      targetTutors = tutors.map((t) => ({
        id: t.id,
        email: t.email,
        name: t.profile?.firstName
          ? `${t.profile.firstName} ${t.profile.lastName || ""}`.trim()
          : t.email,
      }));
    }

    if (!targetTutors.length) {
      return { count: 0, totalTargeted: 0 };
    }

    let formattedTitle = title.trim();
    if (!formattedTitle.startsWith("📢 [Faculty Notice]")) {
      formattedTitle = `📢 [Faculty Notice] ${formattedTitle}`;
    }

    const notificationsData = targetTutors.map((t) => ({
      userId: t.id,
      type,
      title: formattedTitle,
      message: message.trim(),
      link: link || null,
      isRead: false,
    }));

    const result = await prisma.notification.createMany({
      data: notificationsData,
    });

    const isSingle = targetTutors.length === 1;
    const targetDisplayName = isSingle
      ? targetTutors[0].name
      : targetTutors.length < (tutorId === "all" ? 999 : targetTutors.length + 1) && (tutorIds && tutorIds.length > 0)
      ? `${targetTutors.length} Selected Instructors`
      : "All Faculty Tutors";

    try {
      await prisma.auditLog.create({
        data: {
          userId: senderId || null,
          action: "TUTOR_NOTIFICATION_DISPATCH",
          entityType: "Tutors",
          entityId: isSingle ? targetTutors[0].id : null,
          metadata: {
            title: formattedTitle,
            message: message.trim(),
            link: link || null,
            type,
            recipientCount: result.count,
            tutorName: targetDisplayName,
            senderName: senderName || "Platform Administrator",
            audience: isSingle
              ? `Tutor: ${targetTutors[0].name}`
              : tutorIds && tutorIds.length > 0
              ? `${targetTutors.length} Selected Instructors`
              : "ALL_TUTORS",
          },
        },
      });
    } catch (auditErr) {
      console.warn("Could not log tutor notification audit:", auditErr);
    }

    return {
      count: result.count,
      totalTargeted: targetTutors.length,
      targetName: targetDisplayName,
    };
  } catch (error) {
    console.error("Error sending tutor notification:", error);
    return { count: 0, error };
  }
}

/**
 * Retrieves recent reminder and specialized broadcasts
 */
export async function getRecentBroadcasts(limit = 15) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            "COURSE_REMINDER_BROADCAST",
            "SPECIALIZED_STUDENT_NOTIFICATION",
            "TUTOR_NOTIFICATION_DISPATCH",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
      },
    });

    return logs.map((log) => {
      const meta = (log.metadata as any) || {};
      let audienceDisplay = meta.audience || "ALL";

      if (log.action === "SPECIALIZED_STUDENT_NOTIFICATION") {
        audienceDisplay = meta.recipientName ? `Student: ${meta.recipientName}` : "Specialized Student";
      } else if (log.action === "TUTOR_NOTIFICATION_DISPATCH") {
        audienceDisplay = meta.tutorName ? `Tutor: ${meta.tutorName}` : "All Instructors";
      }

      return {
        id: log.id,
        createdAt: log.createdAt,
        courseId: log.entityId,
        title: meta.title || "Notification Dispatch",
        message: meta.message || "",
        type: meta.type || "ANNOUNCEMENT",
        audience: audienceDisplay,
        recipientCount: meta.recipientCount ?? 1,
        senderName: log.user?.profile?.firstName
          ? `${log.user.profile.firstName} ${log.user.profile.lastName || ""}`.trim()
          : log.user?.email || meta.senderName || "System Admin",
        action: log.action,
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
    } else if (category === "SPECIALIZED") {
      where.OR = [
        { title: { contains: "[" } },
        { message: { contains: "Instructor" } },
        { message: { contains: "Tutor" } },
        { title: { contains: "💬" } },
        { title: { contains: "📢" } },
      ];
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
