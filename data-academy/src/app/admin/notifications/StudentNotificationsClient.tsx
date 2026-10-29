"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { AudienceSegment } from "@/lib/notifications";

export interface CourseItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  _count: {
    enrollments: number;
    modules: number;
  };
}

export interface Breakdown {
  totalEnrolled: number;
  activeCount: number;
  completedCount: number;
  stalledCount: number;
  finalLapCount: number;
}

export interface BroadcastLog {
  id: string;
  createdAt: string | Date;
  courseId: string | null;
  title: string;
  message: string;
  type: string;
  audience: string;
  recipientCount: number;
  senderName: string;
  action?: string;
}

export interface TutorItem {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  headline: string;
  courses: string[];
}

export interface StudentRecipient {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  courses: { id: string; title: string; progress: number; status: string }[];
}

export type DispatchMode = "COURSE_BROADCAST" | "SPECIALIZED_STUDENT" | "TUTOR_NOTIFICATION";

interface StudentNotificationsClientProps {
  courses: CourseItem[];
  initialBreakdown: Breakdown;
  initialBroadcasts: BroadcastLog[];
  currentUserRole: string;
  currentUserName: string;
  initialTutors?: TutorItem[];
}

export default function StudentNotificationsClient({
  courses,
  initialBreakdown,
  initialBroadcasts,
  currentUserRole,
  currentUserName,
  initialTutors = [],
}: StudentNotificationsClientProps) {
  const isAdmin = currentUserRole === "ADMIN";
  const isTutor = currentUserRole === "TUTOR";

  // Mode Selection
  const [dispatchMode, setDispatchMode] = useState<DispatchMode>("COURSE_BROADCAST");

  // Course Broadcast State
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses.length > 0 && isTutor ? courses[0].id : "all"
  );
  const [selectedAudience, setSelectedAudience] = useState<AudienceSegment>("ALL");

  // Specialized Student State
  const [students, setStudents] = useState<StudentRecipient[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [specializedType, setSpecializedType] = useState<
    "FEEDBACK" | "MENTOR_NOTE" | "PROGRESS_CHECK" | "DIRECT_MESSAGE"
  >("FEEDBACK");

  // Tutor Notification State (Admin only)
  const [tutors, setTutors] = useState<TutorItem[]>(initialTutors);
  const [tutorScope, setTutorScope] = useState<"ALL" | "INDIVIDUAL">("ALL");
  const [selectedTutorIds, setSelectedTutorIds] = useState<string[]>(
    initialTutors.length > 0 ? [initialTutors[0].id] : []
  );
  const [tutorSearchQuery, setTutorSearchQuery] = useState("");
  const selectedTutorId = selectedTutorIds[0] || "";

  // Common Notification Content State
  const [notificationType, setNotificationType] = useState<string>("ANNOUNCEMENT");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [customLink, setCustomLink] = useState("");
  const [isCustomCta, setIsCustomCta] = useState(false);

  // Pre-configured accessible destinations for Students & Tutors
  const standardStudentLinks = [
    { value: "/dashboard", label: "/dashboard — Student Dashboard (Overview & Analytics)" },
    { value: "/my-learning", label: "/my-learning — Enrolled Courses & Study Queue" },
    { value: "/courses", label: "/courses — Course Catalog & Curriculum Explorer" },
    { value: "/certificates", label: "/certificates — Verified Credentials & Badges" },
    { value: "/paths", label: "/paths — Career Paths & Learning Roadmaps" },
    { value: "/support", label: "/support — Student Help Desk & Ticket Support" },
    { value: "/feedback", label: "/feedback — Course & Platform Feedback" },
    { value: "/profile", label: "/profile — Student Account & Profile Settings" },
  ];

  const standardTutorLinks = [
    { value: "/tutor", label: "/tutor — Faculty Dashboard & Student Review Queue" },
    { value: "/admin/courses", label: "/admin/courses — Course Management Studio" },
    { value: "/admin/courses/new", label: "/admin/courses/new — Create New Academy Course" },
    { value: "/admin/notifications", label: "/admin/notifications — Notification Dispatcher" },
    { value: "/support", label: "/support — Support Desk & Ticket Assistance" },
    { value: "/feedback", label: "/feedback — Faculty Reviews & Testimonials" },
    ...(isAdmin
      ? [
          { value: "/admin/support", label: "/admin/support — Support Ticket Management" },
          { value: "/admin/feedback", label: "/admin/feedback — Feedback & Reviews Moderation" },
          { value: "/admin/users", label: "/admin/users — User Directory & Roles" },
          { value: "/admin/analytics", label: "/admin/analytics — Academy Analytics & Metrics" },
        ]
      : []),
  ];

  const allKnownCtaValues = useMemo(() => {
    const set = new Set<string>();
    standardStudentLinks.forEach((l) => set.add(l.value));
    standardTutorLinks.forEach((l) => set.add(l.value));
    courses.forEach((c) => {
      set.add(`/learn/${c.slug}`);
      set.add(`/courses/${c.slug}`);
    });
    return set;
  }, [courses, isAdmin]);

  // Metrics, State & History
  const [breakdown, setBreakdown] = useState<Breakdown>(initialBreakdown);
  const [broadcasts, setBroadcasts] = useState<BroadcastLog[]>(initialBroadcasts);
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<{
    count: number;
    title: string;
    targetName?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected course object
  const currentCourse = useMemo(() => {
    if (selectedCourseId === "all") return null;
    return courses.find((c) => c.id === selectedCourseId) || null;
  }, [selectedCourseId, courses]);

  // Selected student object
  const currentStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [selectedStudentId, students]);

  // Selected tutors list (Multi-choice)
  const selectedTutors = useMemo(() => {
    return tutors.filter((t) => selectedTutorIds.includes(t.id));
  }, [selectedTutorIds, tutors]);

  // Primary selected tutor object (for previews & single fallbacks)
  const currentTutor = useMemo(() => {
    return selectedTutors[0] || null;
  }, [selectedTutors]);

  // Filtered tutors for search
  const filteredTutors = useMemo(() => {
    if (!tutorSearchQuery.trim()) return tutors;
    const q = tutorSearchQuery.toLowerCase();
    return tutors.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.headline && t.headline.toLowerCase().includes(q))
    );
  }, [tutors, tutorSearchQuery]);

  // Fetch students whenever mode becomes SPECIALIZED_STUDENT or course filter changes
  useEffect(() => {
    if (dispatchMode === "SPECIALIZED_STUDENT") {
      fetchStudents(selectedCourseId, studentSearchQuery);
    }
  }, [dispatchMode, selectedCourseId]);

  const fetchStudents = async (courseId?: string, search?: string) => {
    setIsLoadingStudents(true);
    try {
      const params = new URLSearchParams();
      params.set("scope", "students");
      if (courseId && courseId !== "all") params.set("courseId", courseId);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/notifications/recipients?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.recipients || []);
        if (data.recipients?.length > 0 && !selectedStudentId) {
          setSelectedStudentId(data.recipients[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Handle Course Change
  const handleCourseChange = async (courseId: string) => {
    setSelectedCourseId(courseId);
    setIsLoadingBreakdown(true);
    setSuccessBanner(null);
    setErrorMessage(null);

    if (courseId === "all") {
      setCustomLink("/my-learning");
    } else {
      const found = courses.find((c) => c.id === courseId);
      if (found) {
        setCustomLink(`/learn/${found.slug}`);
      }
    }

    try {
      const res = await fetch(`/api/admin/notifications/broadcast?courseId=${courseId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.breakdown) {
          setBreakdown(data.breakdown);
        }
      }
    } catch (err) {
      console.error("Failed to fetch audience breakdown:", err);
    } finally {
      setIsLoadingBreakdown(false);
    }
  };

  // Mode Switch Handlers
  const handleSwitchMode = (mode: DispatchMode) => {
    setDispatchMode(mode);
    setSuccessBanner(null);
    setErrorMessage(null);
    setIsCustomCta(false);

    if (mode === "COURSE_BROADCAST") {
      setTitle("");
      setMessage("");
      setCustomLink(currentCourse ? `/learn/${currentCourse.slug}` : "/my-learning");
      setNotificationType("ANNOUNCEMENT");
    } else if (mode === "SPECIALIZED_STUDENT") {
      setTitle("");
      setMessage("");
      setCustomLink(currentCourse ? `/learn/${currentCourse.slug}` : "/my-learning");
      setNotificationType("ANNOUNCEMENT");
      setSpecializedType("FEEDBACK");
    } else if (mode === "TUTOR_NOTIFICATION") {
      setTitle("");
      setMessage("");
      setCustomLink("/tutor");
      setNotificationType("ANNOUNCEMENT");
    }
  };

  // Pre-built Quick Templates for Course Broadcast
  const applyCourseTemplate = (templateKey: string) => {
    setIsCustomCta(false);
    const courseName = currentCourse ? currentCourse.title : "your enrolled courses";
    const slug = currentCourse ? currentCourse.slug : "";

    switch (templateKey) {
      case "NEW_MATERIAL":
        setTitle(`📚 New Material & Lessons Added: ${currentCourse ? currentCourse.title : "Course Update"}`);
        setMessage(
          `Fresh interactive modules, coding exercises, and practice questions have just been published for ${courseName}. Explore the new content at your own pace! If you already completed this course, your earned certificate remains 100% verified and permanently valid.`
        );
        setNotificationType("ANNOUNCEMENT");
        setSelectedAudience("ALL");
        setCustomLink(slug ? `/learn/${slug}` : "/my-learning");
        break;

      case "WEEKLY_NUDGE":
        setTitle(`⏰ Keep Up Your Learning Momentum in ${currentCourse ? currentCourse.title : "AI Tech Hub"}`);
        setMessage(
          `Consistency is the secret to mastering data & AI skills! Spend 20 minutes today tackling the next exercise or project milestone in ${courseName}.`
        );
        setNotificationType("SYSTEM");
        setSelectedAudience("ACTIVE");
        setCustomLink(slug ? `/learn/${slug}` : "/my-learning");
        break;

      case "CERTIFICATE_LAP":
        setTitle(`🏆 Final Lap: You're Close to Your Verified Certificate!`);
        setMessage(
          `You have completed the major milestones in ${courseName}. Finish the final assessments today to automatically unlock and claim your official credential for LinkedIn.`
        );
        setNotificationType("COURSE_COMPLETE");
        setSelectedAudience("FINAL_LAP");
        setCustomLink(slug ? `/learn/${slug}` : "/certificates");
        break;

      case "DEADLINE_NOTICE":
        setTitle(`📝 Upcoming Assessment Deadline for ${currentCourse ? currentCourse.title : "Coursework"}`);
        setMessage(
          `Reminder: Your upcoming graded module assessment and lab submissions for ${courseName} are due soon. Review the study resources and submit on time.`
        );
        setNotificationType("DEADLINE");
        setSelectedAudience("ACTIVE");
        setCustomLink(slug ? `/learn/${slug}` : "/my-learning");
        break;

      case "LIVE_WORKSHOP":
        setTitle(`🎙️ Live Instructor Q&A & Hands-on Lab Session`);
        setMessage(
          `Join our faculty for a live interactive workshop on ${courseName}. Bring your questions, code along with mentors, and review real-world industry case studies.`
        );
        setNotificationType("ANNOUNCEMENT");
        setSelectedAudience("ALL");
        setCustomLink("/dashboard");
        break;
    }
  };

  // Pre-built Quick Templates for Specialized Student Notifications
  const applyStudentTemplate = (templateKey: string) => {
    setIsCustomCta(false);
    const studentFirstName = currentStudent?.name.split(" ")[0] || "Student";
    const courseTitle = currentCourse ? currentCourse.title : "your data curriculum";

    switch (templateKey) {
      case "ASSIGNMENT_FEEDBACK":
        setSpecializedType("FEEDBACK");
        setTitle(`🎯 Feedback on Your Recent Coursework: ${courseTitle}`);
        setMessage(
          `Hi ${studentFirstName}, I reviewed your latest lab exercise submission. Excellent attention to data structure and clean querying syntax! I left a few actionable pointers to optimize execution performance.`
        );
        setNotificationType("ASSESSMENT_RESULT");
        setCustomLink("/my-learning");
        break;

      case "MENTOR_CHECKIN":
        setSpecializedType("MENTOR_NOTE");
        setTitle(`👋 1-on-1 Mentorship Check-in: How is Your Progress in ${courseTitle}?`);
        setMessage(
          `Hi ${studentFirstName}, just checking in on your learning journey! If you encounter any sticking points on complex modules or capstone projects, feel free to review the solution walkthroughs or leave a note.`
        );
        setNotificationType("ANNOUNCEMENT");
        setCustomLink("/dashboard");
        break;

      case "STALLED_SUPPORT":
        setSpecializedType("PROGRESS_CHECK");
        setTitle(`💡 Quick Tip to Keep Moving Forward in ${courseTitle}`);
        setMessage(
          `Hi ${studentFirstName}, I noticed you paused on the current module. Don't worry—the upcoming exercise is simpler than it appears once you break it into step-by-step steps. You've got this!`
        );
        setNotificationType("SYSTEM");
        setCustomLink("/my-learning");
        break;

      case "MILESTONE_PRAISE":
        setSpecializedType("FEEDBACK");
        setTitle(`🌟 Fantastic Achievement on Your Course Milestones!`);
        setMessage(
          `Hi ${studentFirstName}, outstanding commitment to your learning! Your consistency across assignments and quiz assessments has been exemplary. Keep up the high standard!`
        );
        setNotificationType("COURSE_COMPLETE");
        setCustomLink("/my-learning");
        break;
    }
  };

  // Pre-built Quick Templates for Tutor Notifications (Admin Only)
  const applyTutorTemplate = (templateKey: string) => {
    setIsCustomCta(false);
    switch (templateKey) {
      case "CURRICULUM_SYNC":
        setTitle(`📚 Curriculum Review & Rubrics Sync`);
        setMessage(
          `Faculty Notice: Please review the updated module rubrics, coding challenge test suites, and syllabus updates for the upcoming learning cycle. Reach out with any adjustments.`
        );
        setNotificationType("ANNOUNCEMENT");
        setCustomLink("/tutor");
        break;

      case "GRADING_SYNC":
        setTitle(`⏰ Student Submissions Pending Review in Instructor Queue`);
        setMessage(
          `Faculty Notice: Several student project submissions and lab assignments have been submitted over the weekend. Please review, provide constructive feedback, and submit grades.`
        );
        setNotificationType("DEADLINE");
        setCustomLink("/tutor");
        break;

      case "ALL_HANDS":
        setTitle(`🎙️ Faculty All-Hands Meeting & Curriculum Sync`);
        setMessage(
          `Faculty Notice: Our quarterly instructor briefing will be held this Friday. We will discuss student retention insights, AI tool integrations, and upcoming certification paths.`
        );
        setNotificationType("ANNOUNCEMENT");
        setCustomLink("/tutor");
        break;

      case "POLICY_UPDATE":
        setTitle(`📋 New Platform Guidelines: Code Sandbox & Auto-Grading Standards`);
        setMessage(
          `Faculty Notice: Enhanced grading guidelines and updated Dockerized Python/SQL execution containers have been deployed across the academy. Please verify your lesson configurations.`
        );
        setNotificationType("SYSTEM");
        setCustomLink("/tutor");
        break;
    }
  };

  // Recipient Count based on active selection
  const estimatedRecipientCount = useMemo(() => {
    if (dispatchMode === "COURSE_BROADCAST") {
      switch (selectedAudience) {
        case "ACTIVE":
          return breakdown.activeCount;
        case "COMPLETED":
          return breakdown.completedCount;
        case "STALLED":
          return breakdown.stalledCount;
        case "FINAL_LAP":
          return breakdown.finalLapCount;
        case "ALL":
        default:
          return breakdown.totalEnrolled;
      }
    } else if (dispatchMode === "SPECIALIZED_STUDENT") {
      return selectedStudentId ? 1 : 0;
    } else if (dispatchMode === "TUTOR_NOTIFICATION") {
      return tutorScope === "ALL" ? tutors.length : selectedTutorIds.length;
    }
    return 0;
  }, [
    dispatchMode,
    selectedAudience,
    breakdown,
    selectedStudentId,
    tutorScope,
    tutors,
    selectedTutorIds,
  ]);

  // Submit Dispatch
  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setErrorMessage("Please enter both a title and message body.");
      return;
    }

    if (dispatchMode === "SPECIALIZED_STUDENT" && !selectedStudentId) {
      setErrorMessage("Please select a student recipient.");
      return;
    }

    if (
      dispatchMode === "TUTOR_NOTIFICATION" &&
      tutorScope === "INDIVIDUAL" &&
      selectedTutorIds.length === 0
    ) {
      setErrorMessage("Please select at least one instructor recipient.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessBanner(null);

    try {
      let payload: any = {
        title: title.trim(),
        message: message.trim(),
        link: customLink.trim() || undefined,
        type: notificationType,
      };

      if (dispatchMode === "COURSE_BROADCAST") {
        payload = {
          ...payload,
          mode: "COURSE_BROADCAST",
          courseId: selectedCourseId,
          audience: selectedAudience,
          includeCompleted: true,
        };
      } else if (dispatchMode === "SPECIALIZED_STUDENT") {
        payload = {
          ...payload,
          mode: "SPECIALIZED_STUDENT",
          studentId: selectedStudentId,
          courseId: selectedCourseId !== "all" ? selectedCourseId : undefined,
          specializedType,
        };
      } else if (dispatchMode === "TUTOR_NOTIFICATION") {
        payload = {
          ...payload,
          mode: tutorScope === "ALL" ? "ALL_TUTORS" : "SELECTED_TUTORS",
          tutorId: tutorScope === "INDIVIDUAL" && selectedTutorIds.length === 1 ? selectedTutorIds[0] : "all",
          tutorIds: tutorScope === "ALL" ? tutors.map((t) => t.id) : selectedTutorIds,
        };
      }

      const res = await fetch("/api/admin/notifications/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch notification.");
      }

      setSuccessBanner({
        count: data.recipientCount,
        title: title.trim(),
        targetName: data.targetName,
      });

      // Prepend to broadcast history
      let audienceDisplay = "ALL";
      if (dispatchMode === "COURSE_BROADCAST") {
        audienceDisplay = selectedAudience;
      } else if (dispatchMode === "SPECIALIZED_STUDENT") {
        audienceDisplay = `Student: ${data.targetName || "1 Student"}`;
      } else if (dispatchMode === "TUTOR_NOTIFICATION") {
        audienceDisplay =
          tutorScope === "ALL"
            ? "All Faculty Instructors"
            : selectedTutorIds.length === 1
            ? `Tutor: ${selectedTutors[0]?.name || data.targetName}`
            : `${selectedTutorIds.length} Selected Instructors`;
      }

      const newLog: BroadcastLog = {
        id: `log-${Date.now()}`,
        createdAt: new Date().toISOString(),
        courseId: selectedCourseId === "all" ? null : selectedCourseId,
        title: title.trim(),
        message: message.trim(),
        type: notificationType,
        audience: audienceDisplay,
        recipientCount: data.recipientCount,
        senderName: currentUserName || (isAdmin ? "Platform Admin" : "Instructor"),
      };
      setBroadcasts((prev) => [newLog, ...prev]);

      // Clear message
      setMessage("");
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while sending.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview Theme Helper
  const getThemePreview = (type: string) => {
    switch (type) {
      case "COURSE_COMPLETE":
      case "CERTIFICATE":
        return {
          iconBg: "linear-gradient(135deg, #004b87 0%, #006fa8 100%)",
          badgeBg: "var(--brand-blue-subtle, #f0f6ff)",
          color: "var(--brand-blue-700, #004074)",
          label: "Credential Earned",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          ),
        };
      case "DEADLINE":
        return {
          iconBg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          badgeBg: "#fffbeb",
          color: "#b45309",
          label: "Deadline Notice",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ),
        };
      case "ASSESSMENT_RESULT":
      case "GRADE":
        return {
          iconBg: "linear-gradient(135deg, #003366 0%, #004b87 100%)",
          badgeBg: "var(--brand-blue-subtle, #f0f6ff)",
          color: "var(--brand-blue-600, #004b87)",
          label: "Coursework & Feedback",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <path d="m9 11 3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          ),
        };
      case "ANNOUNCEMENT":
      default:
        return {
          iconBg: "linear-gradient(135deg, #005a9e 0%, #0088cc 100%)",
          badgeBg: "#e0f2fe",
          color: "var(--brand-accent-500, #006fa8)",
          label:
            dispatchMode === "TUTOR_NOTIFICATION"
              ? "Faculty Notice"
              : dispatchMode === "SPECIALIZED_STUDENT"
              ? "Instructor Note"
              : "Course Update",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          ),
        };
    }
  };

  const previewTheme = getThemePreview(notificationType);

  // Formatted title preview
  const formattedPreviewTitle = useMemo(() => {
    if (!title) {
      if (dispatchMode === "SPECIALIZED_STUDENT") {
        return `💬 [From Instructor ${currentUserName || "Tutor"}] Personalized Coursework Feedback`;
      } else if (dispatchMode === "TUTOR_NOTIFICATION") {
        return `📢 [Faculty Notice] Platform Guidelines & Curriculum Sync`;
      }
      return `📚 New Material & Lessons Added: ${currentCourse ? currentCourse.title : "Course Update"}`;
    }

    if (dispatchMode === "SPECIALIZED_STUDENT") {
      const prefix = isAdmin
        ? "📢 [Admin Message]"
        : `💬 [From Instructor ${currentUserName || "Tutor"}]`;
      if (!title.startsWith("💬") && !title.startsWith("📢")) {
        return `${prefix} ${title}`;
      }
    } else if (dispatchMode === "TUTOR_NOTIFICATION") {
      if (!title.startsWith("📢 [Faculty Notice]")) {
        return `📢 [Faculty Notice] ${title}`;
      }
    }
    return title;
  }, [title, dispatchMode, currentUserName, isAdmin, currentCourse]);

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", paddingBottom: "3rem" }}>
      {/* ── TOP HERO HEADER ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #001830 0%, #002b54 55%, #004b87 100%)",
          borderRadius: 20,
          padding: "2.5rem 2rem",
          color: "#ffffff",
          marginBottom: "2rem",
          boxShadow: "0 10px 30px rgba(0, 24, 48, 0.2)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(255, 255, 255, 0.12)",
              padding: "0.35rem 0.85rem",
              borderRadius: 9999,
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--brand-accent-300, #38bdf8)",
              marginBottom: "1rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Instructional Outreach &amp; Notifications Dispatcher
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: "1.5rem",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "2.125rem",
                  color: "#ffffff",
                  fontWeight: 900,
                  margin: "0 0 0.5rem 0",
                  letterSpacing: "-0.02em",
                }}
              >
                Notifications &amp; Outreach Center
              </h1>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "rgba(255, 255, 255, 0.85)",
                  margin: 0,
                  maxWidth: 680,
                  lineHeight: 1.5,
                }}
              >
                Broadcast curriculum updates, send specialized 1-on-1 feedback to individual students, and dispatch faculty notices to instructors directly to their notification bells.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <Link
                href={isAdmin ? "/admin" : "/tutor"}
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  color: "#fff",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  borderRadius: 10,
                  padding: "0.6rem 1.15rem",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  transition: "all 0.2s ease",
                }}
              >
                <span>&larr; Back to {isAdmin ? "Admin Overview" : "Tutor Portal"}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── SUCCESS BANNER ── */}
      {successBanner && (
        <div
          style={{
            background: "linear-gradient(135deg, var(--brand-blue-subtle, #f0f6ff) 0%, #e0eefe 100%)",
            border: "1px solid var(--brand-accent-200, #bae6fd)",
            borderRadius: 14,
            padding: "1.25rem 1.5rem",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 14px rgba(0, 75, 135, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--brand-blue-600, #004b87) 0%, var(--brand-accent-500, #006fa8) 100%)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--brand-navy-900, #002244)" }}>
                Successfully Dispatched to {successBanner.targetName || `${successBanner.count} Recipient(s)`}!
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--brand-blue-700, #004074)" }}>
                Notification: &ldquo;{successBanner.title}&rdquo; is now delivered in real time.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            style={{
              background: "none",
              border: "none",
              color: "var(--na-gray-500)",
              cursor: "pointer",
              fontSize: "1.25rem",
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* ── ERROR MESSAGE ── */}
      {errorMessage && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #f87171",
            color: "#991b1b",
            borderRadius: 12,
            padding: "1rem 1.25rem",
            marginBottom: "2rem",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* ── DISPATCH MODE TABS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isAdmin ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {/* Mode 1: Course Cohort Broadcast */}
        <button
          type="button"
          onClick={() => handleSwitchMode("COURSE_BROADCAST")}
          style={{
            background: dispatchMode === "COURSE_BROADCAST" ? "#ffffff" : "var(--na-gray-100, #f1f5f9)",
            border: dispatchMode === "COURSE_BROADCAST"
              ? "2px solid var(--brand-blue-600, #004b87)"
              : "1px solid var(--na-gray-300, #cbd5e1)",
            borderRadius: 14,
            padding: "1.25rem 1.5rem",
            textAlign: "left",
            cursor: "pointer",
            boxShadow: dispatchMode === "COURSE_BROADCAST" ? "0 6px 18px rgba(0, 75, 135, 0.12)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                background: dispatchMode === "COURSE_BROADCAST" ? "var(--brand-blue-600, #004b87)" : "#cbd5e1",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </span>
            <span
              style={{
                fontSize: "0.95rem",
                fontWeight: 800,
                color: dispatchMode === "COURSE_BROADCAST" ? "var(--brand-blue-700, #004074)" : "var(--na-gray-800)",
              }}
            >
              Course Broadcast
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--na-gray-600)", lineHeight: 1.45 }}>
            Send announcements, streak nudges, and deadline alerts to enrolled cohorts or alumni.
          </p>
        </button>

        {/* Mode 2: Specialised Student Message */}
        <button
          type="button"
          onClick={() => handleSwitchMode("SPECIALIZED_STUDENT")}
          style={{
            background: dispatchMode === "SPECIALIZED_STUDENT" ? "#ffffff" : "var(--na-gray-100, #f1f5f9)",
            border: dispatchMode === "SPECIALIZED_STUDENT"
              ? "2px solid var(--brand-blue-600, #004b87)"
              : "1px solid var(--na-gray-300, #cbd5e1)",
            borderRadius: 14,
            padding: "1.25rem 1.5rem",
            textAlign: "left",
            cursor: "pointer",
            boxShadow: dispatchMode === "SPECIALIZED_STUDENT" ? "0 6px 18px rgba(0, 75, 135, 0.12)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                background: dispatchMode === "SPECIALIZED_STUDENT" ? "var(--brand-blue-600, #004b87)" : "#cbd5e1",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <span
              style={{
                fontSize: "0.95rem",
                fontWeight: 800,
                color: dispatchMode === "SPECIALIZED_STUDENT" ? "var(--brand-blue-700, #004074)" : "var(--na-gray-800)",
              }}
            >
              Specialised Student Message
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--na-gray-600)", lineHeight: 1.45 }}>
            Send 1-on-1 personalized feedback, assignment guidance, or mentorship check-ins to an individual student.
          </p>
        </button>

        {/* Mode 3: Tutor Notification (Admin Only) */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => handleSwitchMode("TUTOR_NOTIFICATION")}
            style={{
              background: dispatchMode === "TUTOR_NOTIFICATION" ? "#ffffff" : "var(--na-gray-100, #f1f5f9)",
              border: dispatchMode === "TUTOR_NOTIFICATION"
                ? "2px solid var(--brand-blue-600, #004b87)"
                : "1px solid var(--na-gray-300, #cbd5e1)",
              borderRadius: 14,
              padding: "1.25rem 1.5rem",
              textAlign: "left",
              cursor: "pointer",
              boxShadow: dispatchMode === "TUTOR_NOTIFICATION" ? "0 6px 18px rgba(0, 75, 135, 0.12)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "8px",
                  background: dispatchMode === "TUTOR_NOTIFICATION" ? "var(--brand-blue-600, #004b87)" : "#cbd5e1",
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <span
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  color: dispatchMode === "TUTOR_NOTIFICATION" ? "var(--brand-blue-700, #004074)" : "var(--na-gray-800)",
                }}
              >
                Faculty &amp; Tutor Notice
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--na-gray-600)", lineHeight: 1.45 }}>
              Admin dispatch to all instructors or a specific tutor for curriculum syncs and grading deadlines.
            </p>
          </button>
        )}
      </div>

      {/* ── MAIN STUDIO GRID (COMPOSER + LIVE PREVIEW) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 0.9fr",
          gap: "2rem",
          alignItems: "start",
          marginBottom: "3rem",
        }}
      >
        {/* ── LEFT COLUMN: COMPOSER FORM ── */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid var(--na-gray-200, #e2e8f0)",
            padding: "2rem",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ marginBottom: "1.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--na-gray-900, #0f172a)", margin: "0 0 0.25rem" }}>
              {dispatchMode === "COURSE_BROADCAST" && "Compose Course Cohort Broadcast"}
              {dispatchMode === "SPECIALIZED_STUDENT" && "Compose Specialised Student Notification"}
              {dispatchMode === "TUTOR_NOTIFICATION" && "Compose Faculty & Tutor Notification"}
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--na-gray-500, #64748b)", margin: 0 }}>
              {dispatchMode === "COURSE_BROADCAST" && "Select course scope and target audience segments across enrolled learners."}
              {dispatchMode === "SPECIALIZED_STUDENT" && "Select an enrolled student, choose your feedback intent, and write a personalized message."}
              {dispatchMode === "TUTOR_NOTIFICATION" && "Dispatch administrative directives or curriculum notices to faculty members."}
            </p>
          </div>

          <form onSubmit={handleDispatch}>
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ── MODE 1: COURSE BROADCAST FORM CONTROLS ── */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {dispatchMode === "COURSE_BROADCAST" && (
              <>
                {/* 1. Target Course Selector */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      color: "var(--na-gray-800, #1e293b)",
                      marginBottom: "0.45rem",
                    }}
                  >
                    1. Target Course Scope
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.9rem",
                      borderRadius: 10,
                      border: "1px solid var(--na-gray-300, #cbd5e1)",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      background: "#ffffff",
                      color: "#0f172a",
                    }}
                  >
                    {isAdmin && <option value="all">🌐 All Courses (Global Academy Broadcast)</option>}
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c._count.enrollments} enrolled students)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Target Audience Segment Selector */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        color: "var(--na-gray-800, #1e293b)",
                      }}
                    >
                      2. Audience Segment
                    </label>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--brand-blue-600, #004b87)",
                        background: "var(--brand-blue-subtle, #f0f6ff)",
                        padding: "0.15rem 0.55rem",
                        borderRadius: 999,
                        border: "1px solid var(--brand-accent-200, #bae6fd)",
                      }}
                    >
                      {isLoadingBreakdown ? "Calculating..." : `${estimatedRecipientCount} student${estimatedRecipientCount === 1 ? "" : "s"} targeted`}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                      gap: "0.5rem",
                    }}
                  >
                    {[
                      { id: "ALL", label: "All Enrolled", count: breakdown.totalEnrolled, desc: "Active & completed" },
                      { id: "ACTIVE", label: "Active Learners", count: breakdown.activeCount, desc: "In-progress (<100%)" },
                      { id: "COMPLETED", label: "Course Alumni", count: breakdown.completedCount, desc: "Certificates earned" },
                      { id: "FINAL_LAP", label: "Final Lap (≥70%)", count: breakdown.finalLapCount, desc: "Near graduation" },
                      { id: "STALLED", label: "Stalled (<50%)", count: breakdown.stalledCount, desc: "Needs nudge" },
                    ].map((seg) => {
                      const isSelected = selectedAudience === seg.id;
                      return (
                        <button
                          key={seg.id}
                          type="button"
                          onClick={() => setSelectedAudience(seg.id as AudienceSegment)}
                          style={{
                            padding: "0.6rem 0.5rem",
                            borderRadius: 10,
                            border: isSelected
                              ? "2px solid var(--brand-blue-600, #004b87)"
                              : "1px solid var(--na-gray-200, #e2e8f0)",
                            background: isSelected ? "var(--brand-blue-subtle, #f0f6ff)" : "#ffffff",
                            color: isSelected ? "var(--brand-blue-700, #004074)" : "var(--na-gray-700, #334155)",
                            cursor: "pointer",
                            textAlign: "center",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{seg.label}</div>
                          <div
                            style={{
                              fontSize: "1.1rem",
                              fontWeight: 800,
                              color: isSelected ? "var(--brand-blue-600, #004b87)" : "var(--na-gray-900, #0f172a)",
                              margin: "0.15rem 0",
                            }}
                          >
                            {seg.count}
                          </div>
                          <div style={{ fontSize: "0.6875rem", color: "var(--na-gray-500)" }}>{seg.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Quick Templates Strip */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--na-gray-600)",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      marginBottom: "0.45rem",
                    }}
                  >
                    Quick-Fill Broadcast Suggestions:
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {[
                      { key: "NEW_MATERIAL", label: "📚 New Lessons Added" },
                      { key: "WEEKLY_NUDGE", label: "⏰ Weekly Momentum" },
                      { key: "CERTIFICATE_LAP", label: "🏆 Final Lap Certification" },
                      { key: "DEADLINE_NOTICE", label: "📝 Assessment Deadline" },
                      { key: "LIVE_WORKSHOP", label: "🎙️ Live Workshop" },
                    ].map((tmpl) => (
                      <button
                        key={tmpl.key}
                        type="button"
                        onClick={() => applyCourseTemplate(tmpl.key)}
                        style={{
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          borderRadius: 999,
                          padding: "0.3rem 0.75rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#334155",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {tmpl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ── MODE 2: SPECIALISED STUDENT NOTIFICATION CONTROLS ── */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {dispatchMode === "SPECIALIZED_STUDENT" && (
              <>
                {/* Filter by course to easily find students */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      color: "var(--na-gray-800, #1e293b)",
                      marginBottom: "0.45rem",
                    }}
                  >
                    1. Filter by Course (Optional)
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: 10,
                      border: "1px solid var(--na-gray-300, #cbd5e1)",
                      fontSize: "0.875rem",
                      background: "#ffffff",
                    }}
                  >
                    <option value="all">🔍 All Students Across My Courses</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Student Selector */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem" }}>
                    <label
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        color: "var(--na-gray-800, #1e293b)",
                      }}
                    >
                      2. Select Target Student
                    </label>
                    <span style={{ fontSize: "0.75rem", color: "var(--brand-blue-600)", fontWeight: 700 }}>
                      {isLoadingStudents ? "Loading..." : `${students.length} student${students.length === 1 ? "" : "s"} found`}
                    </span>
                  </div>

                  {students.length === 0 ? (
                    <div
                      style={{
                        padding: "1rem",
                        borderRadius: 10,
                        background: "#f8fafc",
                        border: "1px dashed #cbd5e1",
                        fontSize: "0.8125rem",
                        color: "var(--na-gray-600)",
                        textAlign: "center",
                      }}
                    >
                      {isLoadingStudents ? "Fetching students..." : "No students found for this course filter."}
                    </div>
                  ) : (
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem 0.9rem",
                        borderRadius: 10,
                        border: "2px solid var(--brand-accent-300, #7dd3fc)",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        background: "#ffffff",
                        color: "#0f172a",
                      }}
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.email}) — {s.courses.map((c) => `${c.title}: ${Math.round(c.progress)}%`).join(", ") || "Enrolled"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Feedback Intent Selector */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      color: "var(--na-gray-800, #1e293b)",
                      marginBottom: "0.45rem",
                    }}
                  >
                    3. Specialization Intent
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
                    {[
                      { id: "FEEDBACK", label: "🎯 Assignment Feedback" },
                      { id: "MENTOR_NOTE", label: "👋 1-on-1 Mentorship Note" },
                      { id: "PROGRESS_CHECK", label: "💡 Progress & Momentum Check" },
                      { id: "DIRECT_MESSAGE", label: "💬 General Direct Message" },
                    ].map((item) => {
                      const isSelected = specializedType === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSpecializedType(item.id as any)}
                          style={{
                            padding: "0.55rem 0.75rem",
                            borderRadius: 8,
                            border: isSelected
                              ? "2px solid var(--brand-blue-600, #004b87)"
                              : "1px solid var(--na-gray-200, #e2e8f0)",
                            background: isSelected ? "var(--brand-blue-subtle, #f0f6ff)" : "#ffffff",
                            color: isSelected ? "var(--brand-blue-700, #004074)" : "var(--na-gray-700)",
                            fontSize: "0.8125rem",
                            fontWeight: isSelected ? 700 : 500,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Specialized Templates */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--na-gray-600)",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      marginBottom: "0.45rem",
                    }}
                  >
                    Quick Specialized Presets:
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {[
                      { key: "ASSIGNMENT_FEEDBACK", label: "🎯 Assignment Review" },
                      { key: "MENTOR_CHECKIN", label: "👋 Mentorship Check-in" },
                      { key: "STALLED_SUPPORT", label: "💡 Momentum Support" },
                      { key: "MILESTONE_PRAISE", label: "🌟 Milestone Praise" },
                    ].map((tmpl) => (
                      <button
                        key={tmpl.key}
                        type="button"
                        onClick={() => applyStudentTemplate(tmpl.key)}
                        style={{
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          borderRadius: 999,
                          padding: "0.3rem 0.75rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#334155",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {tmpl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ── MODE 3: TUTOR NOTIFICATION CONTROLS (Admin Only) ── */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {dispatchMode === "TUTOR_NOTIFICATION" && isAdmin && (
              <>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      color: "var(--na-gray-800, #1e293b)",
                      marginBottom: "0.45rem",
                    }}
                  >
                    1. Faculty Target Scope
                  </label>
                  <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
                    <button
                      type="button"
                      onClick={() => setTutorScope("ALL")}
                      style={{
                        flex: 1,
                        padding: "0.65rem 1rem",
                        borderRadius: 10,
                        border: tutorScope === "ALL"
                          ? "2px solid var(--brand-blue-600, #004b87)"
                          : "1px solid var(--na-gray-300, #cbd5e1)",
                        background: tutorScope === "ALL" ? "var(--brand-blue-subtle, #f0f6ff)" : "#ffffff",
                        color: tutorScope === "ALL" ? "var(--brand-blue-700, #004074)" : "var(--na-gray-700)",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        cursor: "pointer",
                      }}
                    >
                      📢 All Tutors &amp; Instructors ({tutors.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTutorScope("INDIVIDUAL")}
                      style={{
                        flex: 1,
                        padding: "0.65rem 1rem",
                        borderRadius: 10,
                        border: tutorScope === "INDIVIDUAL"
                          ? "2px solid var(--brand-blue-600, #004b87)"
                          : "1px solid var(--na-gray-300, #cbd5e1)",
                        background: tutorScope === "INDIVIDUAL" ? "var(--brand-blue-subtle, #f0f6ff)" : "#ffffff",
                        color: tutorScope === "INDIVIDUAL" ? "var(--brand-blue-700, #004074)" : "var(--na-gray-700)",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        cursor: "pointer",
                      }}
                    >
                      👥 Specific Instructors ({selectedTutorIds.length})
                    </button>
                  </div>

                  {tutorScope === "INDIVIDUAL" && (
                    <div
                      style={{
                        background: "#ffffff",
                        border: "1px solid var(--na-gray-300, #cbd5e1)",
                        borderRadius: 12,
                        padding: "1rem",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "0.6rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <label
                            style={{
                              fontSize: "0.8125rem",
                              fontWeight: 700,
                              color: "var(--na-gray-800, #1e293b)",
                              margin: 0,
                            }}
                          >
                            Select Instructors:
                          </label>
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              background: selectedTutorIds.length > 0 ? "var(--brand-blue-subtle, #f0f6ff)" : "#f1f5f9",
                              color: selectedTutorIds.length > 0 ? "var(--brand-blue-700, #004074)" : "#64748b",
                              padding: "0.15rem 0.5rem",
                              borderRadius: 999,
                            }}
                          >
                            {selectedTutorIds.length} of {tutors.length} selected
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedTutorIds(tutors.map((t) => t.id))}
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #cbd5e1",
                              borderRadius: 6,
                              padding: "0.25rem 0.55rem",
                              fontSize: "0.725rem",
                              fontWeight: 600,
                              color: "#334155",
                              cursor: "pointer",
                            }}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedTutorIds([])}
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #cbd5e1",
                              borderRadius: 6,
                              padding: "0.25rem 0.55rem",
                              fontSize: "0.725rem",
                              fontWeight: 600,
                              color: "#64748b",
                              cursor: "pointer",
                            }}
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Instructor Search Input */}
                      <div style={{ marginBottom: "0.75rem" }}>
                        <input
                          type="text"
                          placeholder="Search instructors by name, email, or headline..."
                          value={tutorSearchQuery}
                          onChange={(e) => setTutorSearchQuery(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.55rem 0.75rem",
                            borderRadius: 8,
                            border: "1px solid var(--na-gray-300, #cbd5e1)",
                            fontSize: "0.8125rem",
                            background: "#f8fafc",
                          }}
                        />
                      </div>

                      {/* Scrollable Checkbox List */}
                      <div
                        style={{
                          maxHeight: "240px",
                          overflowY: "auto",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.4rem",
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                          padding: "0.5rem",
                          background: "#fafafa",
                        }}
                      >
                        {filteredTutors.length === 0 ? (
                          <div
                            style={{
                              padding: "1.25rem",
                              textAlign: "center",
                              color: "#64748b",
                              fontSize: "0.8125rem",
                            }}
                          >
                            No instructors match &quot;{tutorSearchQuery}&quot;
                          </div>
                        ) : (
                          filteredTutors.map((t) => {
                            const isChecked = selectedTutorIds.includes(t.id);
                            return (
                              <div
                                key={t.id}
                                onClick={() => {
                                  if (isChecked) {
                                    setSelectedTutorIds(selectedTutorIds.filter((id) => id !== t.id));
                                  } else {
                                    setSelectedTutorIds([...selectedTutorIds, t.id]);
                                  }
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.75rem",
                                  padding: "0.55rem 0.75rem",
                                  borderRadius: 8,
                                  border: isChecked
                                    ? "1.5px solid var(--brand-blue-500, #005696)"
                                    : "1px solid #e2e8f0",
                                  background: isChecked ? "#eff6ff" : "#ffffff",
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}} // parent onClick toggles
                                  style={{
                                    width: 16,
                                    height: 16,
                                    cursor: "pointer",
                                    accentColor: "var(--brand-blue-600, #004b87)",
                                  }}
                                />
                                <div
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    background: isChecked ? "var(--brand-blue-600, #004b87)" : "#e2e8f0",
                                    color: isChecked ? "#ffffff" : "#475569",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    fontSize: "0.8125rem",
                                    flexShrink: 0,
                                  }}
                                >
                                  {t.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                                    <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "#0f172a" }}>
                                      {t.name}
                                    </span>
                                    {t.headline && (
                                      <span
                                        style={{
                                          fontSize: "0.6875rem",
                                          fontWeight: 600,
                                          background: "#e0f2fe",
                                          color: "#0369a1",
                                          padding: "0.1rem 0.45rem",
                                          borderRadius: 4,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          maxWidth: "220px",
                                        }}
                                      >
                                        {t.headline}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                    {t.email}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Selected Instructor Tags */}
                      {selectedTutors.length > 0 && (
                        <div style={{ marginTop: "0.75rem" }}>
                          <div
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              color: "var(--na-gray-500)",
                              textTransform: "uppercase",
                              marginBottom: "0.35rem",
                            }}
                          >
                            Selected Recipient{selectedTutors.length === 1 ? "" : "s"}:
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                            {selectedTutors.map((t) => (
                              <span
                                key={t.id}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  background: "#e0f2fe",
                                  color: "#0369a1",
                                  border: "1px solid #bae6fd",
                                  borderRadius: 999,
                                  padding: "0.2rem 0.55rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                }}
                              >
                                <span>{t.name}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTutorIds(selectedTutorIds.filter((id) => id !== t.id));
                                  }}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#0369a1",
                                    cursor: "pointer",
                                    padding: 0,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    fontWeight: 700,
                                    fontSize: "0.85rem",
                                    lineHeight: 1,
                                  }}
                                  title={`Remove ${t.name}`}
                                >
                                  &times;
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Faculty Quick Templates */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--na-gray-600)",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      marginBottom: "0.45rem",
                    }}
                  >
                    Faculty Announcement Templates:
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {[
                      { key: "CURRICULUM_SYNC", label: "📚 Curriculum Review" },
                      { key: "GRADING_SYNC", label: "⏰ Grading Deadline" },
                      { key: "ALL_HANDS", label: "🎙️ Faculty All-Hands" },
                      { key: "POLICY_UPDATE", label: "📋 Platform Guidelines" },
                    ].map((tmpl) => (
                      <button
                        key={tmpl.key}
                        type="button"
                        onClick={() => applyTutorTemplate(tmpl.key)}
                        style={{
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          borderRadius: 999,
                          padding: "0.3rem 0.75rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#334155",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {tmpl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ── COMMON NOTIFICATION FIELDS ── */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            {/* Notification Category */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "var(--na-gray-800, #1e293b)",
                  marginBottom: "0.45rem",
                }}
              >
                Notification Feed Category
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {[
                  { id: "ANNOUNCEMENT", label: "📢 Course / Faculty Update" },
                  { id: "DEADLINE", label: "⏰ Deadline Notice" },
                  { id: "ASSESSMENT_RESULT", label: "🎯 Coursework & Feedback" },
                  { id: "COURSE_COMPLETE", label: "🏆 Credential Opportunity" },
                  { id: "SYSTEM", label: "⚙️ General Notice" },
                ].map((t) => {
                  const isSelected = notificationType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNotificationType(t.id)}
                      style={{
                        padding: "0.45rem 0.85rem",
                        borderRadius: 8,
                        border: isSelected ? "1.5px solid var(--brand-blue-600)" : "1px solid #e2e8f0",
                        background: isSelected ? "var(--brand-blue-subtle, #f0f6ff)" : "#ffffff",
                        color: isSelected ? "var(--brand-blue-700, #004074)" : "#475569",
                        fontSize: "0.8125rem",
                        fontWeight: isSelected ? 700 : 500,
                        cursor: "pointer",
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title & Message Inputs */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-gray-800)" }}>
                  Notification Title
                </label>
                <span style={{ fontSize: "0.6875rem", color: "var(--na-gray-400)" }}>{title.length}/100</span>
              </div>
              <input
                type="text"
                required
                maxLength={100}
                placeholder="e.g. 📚 Great work on your recent PySpark assignment!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.9rem",
                  borderRadius: 10,
                  border: "1px solid var(--na-gray-300, #cbd5e1)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--na-gray-800)" }}>
                  Message Content
                </label>
                <span style={{ fontSize: "0.6875rem", color: "var(--na-gray-400)" }}>{message.length}/500</span>
              </div>
              <textarea
                required
                rows={4}
                maxLength={500}
                placeholder="Provide clear, encouraging context for the recipient. If personalized feedback, mention specific exercises or next steps..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.9rem",
                  borderRadius: 10,
                  border: "1px solid var(--na-gray-300, #cbd5e1)",
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ marginBottom: "1.75rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.4rem",
                }}
              >
                <label
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: "var(--na-gray-800)",
                    margin: 0,
                  }}
                >
                  Call-to-Action Link (Optional)
                </label>
                {customLink && (
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      color: "var(--brand-blue-700, #004074)",
                      background: "var(--brand-blue-subtle, #f0f6ff)",
                      padding: "0.15rem 0.45rem",
                      borderRadius: 4,
                      fontFamily: "monospace",
                    }}
                  >
                    Target: {customLink}
                  </span>
                )}
              </div>

              {/* Accessible Destination Dropdown */}
              <select
                value={
                  isCustomCta
                    ? "custom"
                    : customLink === ""
                    ? ""
                    : allKnownCtaValues.has(customLink)
                    ? customLink
                    : "custom"
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "custom") {
                    setIsCustomCta(true);
                  } else if (val === "") {
                    setIsCustomCta(false);
                    setCustomLink("");
                  } else {
                    setIsCustomCta(false);
                    setCustomLink(val);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.9rem",
                  borderRadius: 10,
                  border: "1px solid var(--na-gray-300, #cbd5e1)",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  background: "#ffffff",
                  color: "#0f172a",
                }}
              >
                <option value="">None (No CTA Button)</option>

                <optgroup label="🎓 Student &amp; Learner Destinations">
                  {standardStudentLinks.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </optgroup>

                {courses.length > 0 && (
                  <optgroup label="📚 Course Interactive Classrooms (Students)">
                    {courses.map((c) => (
                      <option key={`learn-${c.id}`} value={`/learn/${c.slug}`}>
                        /learn/{c.slug} — {c.title}
                      </option>
                    ))}
                  </optgroup>
                )}

                {courses.length > 0 && (
                  <optgroup label="📖 Public Course Syllabus Pages">
                    {courses.map((c) => (
                      <option key={`course-${c.id}`} value={`/courses/${c.slug}`}>
                        /courses/{c.slug} — {c.title}
                      </option>
                    ))}
                  </optgroup>
                )}

                <optgroup label="👨‍🏫 Tutor &amp; Faculty Destinations">
                  {standardTutorLinks.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </optgroup>

                <optgroup label="✏️ Custom Destination">
                  <option value="custom">✏️ Custom URL or Deep Link...</option>
                </optgroup>
              </select>

              {(isCustomCta || (customLink !== "" && !allKnownCtaValues.has(customLink))) && (
                <div style={{ marginTop: "0.6rem" }}>
                  <input
                    type="text"
                    placeholder="Enter relative path (e.g. /learn/python#quiz-2) or full URL"
                    value={customLink}
                    onChange={(e) => setCustomLink(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.9rem",
                      borderRadius: 10,
                      border: "1.5px solid var(--brand-blue-500, #005696)",
                      fontSize: "0.8125rem",
                      fontFamily: "monospace",
                      background: "#ffffff",
                    }}
                  />
                  <p
                    style={{
                      fontSize: "0.725rem",
                      color: "var(--na-gray-500)",
                      margin: "0.3rem 0 0 0",
                    }}
                  >
                    Tip: Enter an internal path starting with <code>/</code> or an external <code>https://</code> URL.
                  </p>
                </div>
              )}
            </div>

            {/* Dispatch Action Button */}
            <button
              type="submit"
              disabled={isSubmitting || estimatedRecipientCount === 0}
              style={{
                width: "100%",
                background:
                  estimatedRecipientCount === 0
                    ? "#94a3b8"
                    : "linear-gradient(135deg, var(--brand-blue-600, #004b87) 0%, var(--brand-accent-500, #006fa8) 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: 10,
                padding: "0.85rem 1.5rem",
                fontSize: "0.9375rem",
                fontWeight: 700,
                cursor: isSubmitting || estimatedRecipientCount === 0 ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(0, 75, 135, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                transition: "all 0.2s ease",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              <span>
                {isSubmitting
                  ? "Dispatching Notification..."
                  : dispatchMode === "SPECIALIZED_STUDENT"
                  ? `Send Specialised Message to ${currentStudent?.name || "Student"}`
                  : dispatchMode === "TUTOR_NOTIFICATION"
                  ? tutorScope === "ALL"
                    ? `Dispatch to All ${tutors.length} Tutors`
                    : selectedTutorIds.length === 1
                    ? `Dispatch to ${selectedTutors[0]?.name || "Instructor"}`
                    : `Dispatch to ${selectedTutorIds.length} Selected Instructors`
                  : `Broadcast to ${estimatedRecipientCount} Student${estimatedRecipientCount === 1 ? "" : "s"}`}
              </span>
            </button>
          </form>
        </div>

        {/* ── RIGHT COLUMN: LIVE NOTIFICATION PREVIEW ── */}
        <div style={{ position: "sticky", top: "calc(var(--topbar-height) + 1rem)" }}>
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid var(--na-gray-200, #e2e8f0)",
              padding: "1.75rem",
              boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--brand-navy-950, #001830)" }}>
                Live Recipient Preview
              </div>
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--brand-blue-600, #004b87)",
                  background: "var(--brand-blue-subtle, #f0f6ff)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: 6,
                }}
              >
                {dispatchMode === "TUTOR_NOTIFICATION"
                  ? "Tutor Notification Bell"
                  : "Student Feed View"}
              </span>
            </div>

            <p style={{ fontSize: "0.75rem", color: "var(--na-gray-500)", margin: "0 0 1rem 0" }}>
              This is how your alert will render in the recipient&apos;s notification drawer and alerts page:
            </p>

            {/* Mocked Notification Card */}
            <div
              style={{
                background: "var(--brand-accent-50, #f8fbff)",
                borderRadius: 14,
                border: "1.5px solid var(--brand-accent-300, #7dd3fc)",
                padding: "1.15rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.85rem",
                boxShadow: "0 4px 12px rgba(0, 75, 135, 0.08)",
              }}
            >
              {/* Category Icon */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: previewTheme.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
              >
                {previewTheme.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    marginBottom: "0.25rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "0.15rem 0.45rem",
                      borderRadius: 6,
                      background: previewTheme.badgeBg,
                      color: previewTheme.color,
                      letterSpacing: "0.03em",
                    }}
                  >
                    {previewTheme.label}
                  </span>

                  <span style={{ fontSize: "0.75rem", color: "var(--na-gray-400)" }}>Just now</span>

                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--brand-blue-600, #004b87)",
                      display: "inline-block",
                    }}
                    title="Unread"
                  />
                </div>

                <h3
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 800,
                    color: "var(--na-gray-900, #0f172a)",
                    margin: "0 0 0.35rem 0",
                    lineHeight: 1.35,
                  }}
                >
                  {formattedPreviewTitle}
                </h3>

                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--na-gray-600, #475569)",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {message ||
                    (dispatchMode === "SPECIALIZED_STUDENT"
                      ? "Great work on your recent modules. I have left specific feedback and study pointers for your capstone project."
                      : dispatchMode === "TUTOR_NOTIFICATION"
                      ? "Faculty update regarding curriculum standards, assignment review queues, and upcoming academic sessions."
                      : "Fresh interactive modules and coding exercises have just been published for this course. Explore the new content at your own pace!")}
                </p>

                <div style={{ marginTop: "0.6rem" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--brand-blue-600, #004b87)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <span>Open &amp; Review</span>
                    <span>&rarr;</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick summary specs */}
            <div
              style={{
                marginTop: "1.25rem",
                paddingTop: "1rem",
                borderTop: "1px solid #f1f5f9",
                fontSize: "0.75rem",
                color: "#64748b",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
              }}
            >
              <div>
                <strong>Target Mode:</strong> {dispatchMode}
              </div>
              <div>
                <strong>Sender:</strong> {currentUserName} ({currentUserRole})
              </div>
              <div>
                <strong>Recipient Reach:</strong> {estimatedRecipientCount}
              </div>
              <div>
                <strong>Target:</strong>{" "}
                {dispatchMode === "SPECIALIZED_STUDENT"
                  ? currentStudent?.name || "1 Student"
                  : dispatchMode === "TUTOR_NOTIFICATION"
                  ? tutorScope === "ALL"
                    ? "All Faculty"
                    : selectedTutorIds.length === 1
                    ? selectedTutors[0]?.name || "1 Tutor"
                    : `${selectedTutorIds.length} Instructors`
                  : currentCourse
                  ? currentCourse.title
                  : "All Courses"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BROADCAST HISTORY & RECENT LOGS ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid var(--na-gray-200, #e2e8f0)",
          padding: "2rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--na-gray-900, #0f172a)", margin: "0 0 0.25rem" }}>
              Dispatch History &amp; Notification Audit Log ({broadcasts.length})
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--na-gray-500, #64748b)", margin: 0 }}>
              Audit trail of broadcasts, specialized student messages, and faculty notices dispatched across the platform.
            </p>
          </div>
        </div>

        {broadcasts.length === 0 ? (
          <div
            style={{
              padding: "3rem 1rem",
              textAlign: "center",
              background: "#f8fafc",
              borderRadius: 12,
              border: "1px dashed #cbd5e1",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--brand-blue-subtle, #f0f6ff)",
                color: "var(--brand-blue-600, #004b87)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "0.75rem",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--na-gray-800)" }}>
              No Notifications Dispatched Yet
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)", margin: "0.25rem 0 0" }}>
              Dispatches to course cohorts, specialized students, and tutors will appear in this history log.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {broadcasts.map((log) => {
              const theme = getThemePreview(log.type);
              const isSpecialized = log.action === "SPECIALIZED_STUDENT_NOTIFICATION" || log.audience.startsWith("Student:");
              const isTutorNotice = log.action === "TUTOR_NOTIFICATION_DISPATCH" || log.audience.startsWith("Tutor:") || log.audience.includes("Instructors");

              return (
                <div
                  key={log.id}
                  style={{
                    border: "1px solid var(--na-gray-200, #e2e8f0)",
                    borderRadius: 12,
                    padding: "1rem 1.25rem",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "1rem",
                    background: "#ffffff",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", flex: 1 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: theme.iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {theme.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            padding: "0.15rem 0.45rem",
                            borderRadius: 6,
                            background: isSpecialized
                              ? "#e0e7ff"
                              : isTutorNotice
                              ? "#fef3c7"
                              : theme.badgeBg,
                            color: isSpecialized
                              ? "#3730a3"
                              : isTutorNotice
                              ? "#92400e"
                              : theme.color,
                            textTransform: "uppercase",
                          }}
                        >
                          {isSpecialized
                            ? "Specialised Message"
                            : isTutorNotice
                            ? "Faculty Notice"
                            : theme.label}
                        </span>

                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            padding: "0.15rem 0.45rem",
                            borderRadius: 6,
                            background: "var(--na-gray-100)",
                            color: "var(--na-gray-700)",
                          }}
                        >
                          Target: {log.audience}
                        </span>

                        <span style={{ fontSize: "0.75rem", color: "var(--na-gray-400)" }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--na-gray-900)" }}>
                        {log.title}
                      </div>

                      <div
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--na-gray-600)",
                          marginTop: "0.2rem",
                          lineHeight: 1.4,
                        }}
                      >
                        {log.message}
                      </div>

                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--na-gray-500)",
                          marginTop: "0.4rem",
                          display: "flex",
                          gap: "1rem",
                        }}
                      >
                        <span>
                          Dispatched by: <strong>{log.senderName}</strong>
                        </span>
                        <span>
                          Recipients: <strong>{log.recipientCount}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
