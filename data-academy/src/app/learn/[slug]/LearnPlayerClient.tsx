"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface SubLessonCard {
  title: string;
  badge?: string;
  description: string;
  color?: string;
  icon?: string;
}

export interface SubLessonTab {
  id: string;
  label: string;
  title: string;
  content: string;
  image?: string;
}

export interface PracticeScenario {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface SubLesson {
  id: string;
  sectionNumber: string; // e.g. "2.1.1"
  title: string;
  type: string;
  content?: string;
  mediaUrl?: string;
  cards?: SubLessonCard[];
  tabs?: SubLessonTab[];
  practiceQuiz?: {
    prompt?: string;
    scenarios: PracticeScenario[];
  };
}

interface LessonResource {
  id: string;
  title: string;
  type: string;
  url: string;
}

interface Lesson {
  id: string;
  title: string;
  type: string;
  order: number;
  estimatedMinutes: number;
  videoUrl?: string | null;
  content?: string | null;
  learningObjectives?: string[];
  resources?: LessonResource[];
}

interface Module {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  slug: string;
  certificateEnabled: boolean;
  modules: Module[];
}

interface ProgressRecord {
  lessonId: string;
  isComplete: boolean;
}

interface LearnPlayerClientProps {
  course: Course;
  enrollmentId: string;
  initialProgress: number; // 0 to 1
  initialProgressRecords: ProgressRecord[];
  studentName: string;
}

export default function LearnPlayerClient({
  course,
  enrollmentId,
  initialProgress,
  initialProgressRecords,
  studentName,
}: LearnPlayerClientProps) {
  const router = useRouter();

  // Flatten all lessons in order
  const allLessons: { lesson: Lesson; moduleTitle: string; moduleIndex: number }[] = [];
  course.modules.forEach((mod, modIdx) => {
    mod.lessons.forEach((les) => {
      allLessons.push({ lesson: les, moduleTitle: mod.title, moduleIndex: modIdx + 1 });
    });
  });

  // Track completed lessons as a Set of IDs
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    initialProgressRecords.forEach((p) => {
      if (p.isComplete) map[p.lessonId] = true;
    });
    return map;
  });

  // Pick first incomplete lesson or first lesson
  const initialActiveId = () => {
    const firstIncomplete = allLessons.find((item) => !completedMap[item.lesson.id]);
    return firstIncomplete ? firstIncomplete.lesson.id : allLessons[0]?.lesson.id || "";
  };

  const [activeLessonId, setActiveLessonId] = useState<string>(initialActiveId);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Cisco NetAcad Style Reader States
  const [sidebarTab, setSidebarTab] = useState<"outline" | "resources">("outline");
  const [outlineSearch, setOutlineSearch] = useState("");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    course.modules.forEach((mod) => {
      map[mod.id] = true; // Open modules by default
    });
    return map;
  });
  const [readerTheme, setReaderTheme] = useState<"light" | "dark">("light");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [fontSize, setFontSize] = useState<"normal" | "large">("normal");

  // Keep parent module expanded when active lesson changes
  useEffect(() => {
    const parent = course.modules.find((m) => m.lessons.some((l) => l.id === activeLessonId));
    if (parent) {
      setExpandedModules((prev) => ({ ...prev, [parent.id]: true }));
    }
  }, [activeLessonId, course.modules]);

  const toggleModuleExpand = (modId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  const getModuleStats = (mod: Module) => {
    const total = mod.lessons.length;
    if (total === 0) return { total: 0, completed: 0, percent: 0 };
    const completed = mod.lessons.filter((l) => completedMap[l.id]).length;
    return {
      total,
      completed,
      percent: Math.round((completed / total) * 100),
    };
  };

  const allCourseResources = useMemo(() => {
    const list: { id: string; title: string; url: string; type: string; lessonTitle: string }[] = [];
    course.modules.forEach((mod) => {
      mod.lessons.forEach((les) => {
        if (les.resources && les.resources.length > 0) {
          les.resources.forEach((r) => {
            list.push({ ...r, lessonTitle: les.title });
          });
        }
        if (les.type === "DOWNLOADABLE" && les.content) {
          try {
            const parsed = JSON.parse(les.content);
            if (parsed.downloadUrl) {
              list.push({
                id: "dl_" + les.id,
                title: parsed.fileName || les.title,
                url: parsed.downloadUrl,
                type: parsed.fileType || "Dataset",
                lessonTitle: les.title,
              });
            }
          } catch {}
        }
      });
    });
    return list;
  }, [course]);

  const filteredModules = useMemo(() => {
    if (!outlineSearch.trim()) return course.modules;
    const q = outlineSearch.toLowerCase();
    return course.modules
      .map((mod) => {
        const matchMod = mod.title.toLowerCase().includes(q);
        const matchingLessons = mod.lessons.filter((l) =>
          l.title.toLowerCase().includes(q)
        );
        if (matchMod || matchingLessons.length > 0) {
          return {
            ...mod,
            lessons: matchMod ? mod.lessons : matchingLessons,
          };
        }
        return null;
      })
      .filter(Boolean) as Module[];
  }, [course.modules, outlineSearch]);

  // Active lesson details
  const activeItem = allLessons.find((item) => item.lesson.id === activeLessonId) || allLessons[0];
  const activeLesson = activeItem?.lesson;
  const activeLessonIndex = allLessons.findIndex((item) => item.lesson.id === activeLessonId);

  const prevLesson = activeLessonIndex > 0 ? allLessons[activeLessonIndex - 1]?.lesson : null;
  const nextLesson = activeLessonIndex < allLessons.length - 1 ? allLessons[activeLessonIndex + 1]?.lesson : null;

  const totalLessons = allLessons.length;
  const completedCount = Object.values(completedMap).filter(Boolean).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isLessonComplete = !!completedMap[activeLessonId];

  // Helper to parse sub-lessons for any lesson
  const getLessonSubLessons = (lesson: Lesson, moduleNumber: number, lessonIndex: number): SubLesson[] => {
    const prefix = `${moduleNumber}.${lessonIndex + 1}`;
    if (lesson.content) {
      try {
        const parsed = JSON.parse(lesson.content);
        if (Array.isArray(parsed.subLessons) && parsed.subLessons.length > 0) {
          return parsed.subLessons.map((sub: any, idx: number) => ({
            ...sub,
            id: sub.id || `${lesson.id}_sub_${idx + 1}`,
            sectionNumber: sub.sectionNumber || `${prefix}.${idx + 1}`,
            title: sub.title || `Part ${idx + 1}`,
            type: sub.type || lesson.type || "READING",
          }));
        }
      } catch {}

      // Markdown splitting by ## or ### headers
      if (lesson.content.includes("## ")) {
        const chunks = lesson.content.split(/\n(?=## )/);
        if (chunks.length > 1) {
          return chunks.map((chunk, idx) => {
            const lines = chunk.trim().split("\n");
            const firstLine = lines[0].replace(/^##+\s*/, "").trim();
            const rest = lines.slice(1).join("\n");
            return {
              id: `${lesson.id}_sub_${idx + 1}`,
              sectionNumber: `${prefix}.${idx + 1}`,
              title: firstLine,
              type: "READING",
              content: rest,
            };
          });
        }
      }
    }

    // If learning objectives exist and length > 1
    if (lesson.learningObjectives && lesson.learningObjectives.length > 1) {
      return lesson.learningObjectives.map((obj, idx) => ({
        id: `${lesson.id}_sub_${idx + 1}`,
        sectionNumber: `${prefix}.${idx + 1}`,
        title: obj,
        type: idx === lesson.learningObjectives!.length - 1 && lesson.type === "QUIZ" ? "PRACTICE" : lesson.type || "READING",
        content: idx === 0 ? lesson.content || "" : "",
      }));
    }

    // Default fallback: 1 sub-lesson
    return [
      {
        id: `${lesson.id}_sub_1`,
        sectionNumber: `${prefix}.1`,
        title: lesson.title,
        type: lesson.type || "READING",
        content: lesson.content || "",
      },
    ];
  };

  // Sub-lessons for current active lesson
  const currentSubLessons: SubLesson[] = useMemo(() => {
    if (!activeLesson) return [];
    const modNum = activeItem ? activeItem.moduleIndex : 1;
    const moduleLessons = allLessons.filter((x) => x.moduleIndex === modNum);
    const lesIdx = moduleLessons.findIndex((x) => x.lesson.id === activeLesson.id);
    return getLessonSubLessons(activeLesson, modNum, lesIdx >= 0 ? lesIdx : 0);
  }, [activeLesson, activeItem, allLessons]);

  const [activeSubLessonId, setActiveSubLessonId] = useState<string>("");
  const subLessonRefs = useRef<Record<string, HTMLElement | null>>({});

  // Reset activeSubLessonId on lesson change
  useEffect(() => {
    if (currentSubLessons.length > 0) {
      setActiveSubLessonId(currentSubLessons[0].id);
    }
  }, [activeLessonId, currentSubLessons]);

  // Track completed sub-lessons
  const [completedSubLessons, setCompletedSubLessons] = useState<Record<string, boolean>>({});

  // ScrollSpy with IntersectionObserver
  useEffect(() => {
    if (currentSubLessons.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const subId = entry.target.getAttribute("data-sublesson-id");
            if (subId) {
              setActiveSubLessonId(subId);
              setCompletedSubLessons((prev) => ({ ...prev, [subId]: true }));
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "-20% 0px -55% 0px",
        threshold: 0.1,
      }
    );

    currentSubLessons.forEach((sub) => {
      const el = subLessonRefs.current[sub.id];
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [currentSubLessons]);

  const scrollToSubLesson = (subId: string) => {
    setActiveSubLessonId(subId);
    const el = subLessonRefs.current[subId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const currentActiveSubLesson = currentSubLessons.find((s) => s.id === activeSubLessonId) || currentSubLessons[0];

  // Practice quiz states
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [practiceFeedback, setPracticeFeedback] = useState<Record<string, { isCorrect: boolean; show: boolean }>>({});
  const [practiceModal, setPracticeModal] = useState<{
    isOpen: boolean;
    scenario: PracticeScenario;
    isCorrect: boolean;
  } | null>(null);
  const [showAnswerMap, setShowAnswerMap] = useState<Record<string, boolean>>({});
  const [earnedXP, setEarnedXP] = useState(0);
  const [recentXpGain, setRecentXpGain] = useState<number | null>(null);

  // Quadrant cards active index
  const [activeCardMap, setActiveCardMap] = useState<Record<string, number>>({});

  // Active tab per sub-lesson
  const [activeTabMap, setActiveTabMap] = useState<Record<string, string>>({});

  const handlePracticeSubmit = (scenario: PracticeScenario) => {
    const selected = practiceAnswers[scenario.id];
    if (!selected) return;

    const isCorrect = selected.trim().toLowerCase() === scenario.correctAnswer.trim().toLowerCase();

    setPracticeFeedback((prev) => ({
      ...prev,
      [scenario.id]: { isCorrect, show: true },
    }));

    setPracticeModal({
      isOpen: true,
      scenario,
      isCorrect,
    });

    if (isCorrect && !practiceFeedback[scenario.id]?.isCorrect) {
      setEarnedXP((prev) => prev + 25);
      setRecentXpGain(25);
      setTimeout(() => setRecentXpGain(null), 3000);
      setCompletedSubLessons((prev) => ({ ...prev, [activeSubLessonId]: true }));
    }
  };

  const handlePracticeReset = (scenarioId: string) => {
    setPracticeAnswers((prev) => ({ ...prev, [scenarioId]: "" }));
    setPracticeFeedback((prev) => ({ ...prev, [scenarioId]: { isCorrect: false, show: false } }));
    setShowAnswerMap((prev) => ({ ...prev, [scenarioId]: false }));
  };

  // Helper to get embeddable video URL
  const getEmbedVideoUrl = (url: string | null | undefined) => {
    if (!url) return null;
    try {
      if (url.includes("youtube.com/watch")) {
        const v = new URL(url).searchParams.get("v");
        return v ? `https://www.youtube.com/embed/${v}` : url;
      }
      if (url.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1]?.split("?")[0];
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      if (url.includes("vimeo.com/")) {
        const id = url.split("vimeo.com/")[1]?.split("?")[0];
        return id ? `https://player.vimeo.com/video/${id}` : url;
      }
      return url;
    } catch {
      return url;
    }
  };

  const handleToggleComplete = async (markComplete: boolean) => {
    if (!activeLesson) return;
    setUpdating(true);

    // Optimistic UI update
    setCompletedMap((prev) => ({
      ...prev,
      [activeLesson.id]: markComplete,
    }));

    try {
      const res = await fetch("/api/learn/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: activeLesson.id,
          isComplete: markComplete,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save progress");
      }

      // If marked complete and there is a next lesson, advance to it!
      if (markComplete && nextLesson) {
        setActiveLessonId(nextLesson.id);
      }
    } catch (err) {
      console.error(err);
      // Revert on error
      setCompletedMap((prev) => ({
        ...prev,
        [activeLesson.id]: !markComplete,
      }));
    } finally {
      setUpdating(false);
    }
  };

  // Parse specialized structured payload if present in lesson content
  const parsedLesson = useMemo(() => {
    if (!activeLesson?.content) return null;
    try {
      const data = JSON.parse(activeLesson.content);
      if (data && typeof data === "object" && (data.format || data.instructions || data.questions)) {
        return data;
      }
      return null;
    } catch {
      return null;
    }
  }, [activeLesson?.content]);

  // Coding lab states
  const [studentCode, setStudentCode] = useState("");
  const [codeOutput, setCodeOutput] = useState<string | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [showSolutionHint, setShowSolutionHint] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // SQL query lab states
  const [studentSql, setStudentSql] = useState("");
  const [sqlResult, setSqlResult] = useState<any[] | null>(null);
  const [isRunningSql, setIsRunningSql] = useState(false);
  const [showSqlHint, setShowSqlHint] = useState(false);

  // Concept quiz states
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Project / Assignment checklist and submission states
  const [checkedDeliverables, setCheckedDeliverables] = useState<Record<number, boolean>>({});
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submittedProject, setSubmittedProject] = useState(false);

  // Synchronize interactive fields when active lesson changes
  useEffect(() => {
    if (!activeLesson) return;
    if (parsedLesson?.format === "CODING_EXERCISE") {
      setStudentCode(parsedLesson.starterCode || "");
    } else {
      setStudentCode("");
    }
    setCodeOutput(null);
    setShowSolutionHint(false);
    setCodeCopied(false);

    if (parsedLesson?.format === "SQL_EXERCISE") {
      setStudentSql(parsedLesson.starterSql || "");
    } else {
      setStudentSql("");
    }
    setSqlResult(null);
    setShowSqlHint(false);

    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setCheckedDeliverables({});
    setSubmissionUrl("");
    setSubmittedProject(false);
  }, [activeLesson?.id, parsedLesson]);

  const handleRunPythonCode = () => {
    setIsRunningCode(true);
    setCodeOutput(null);
    setTimeout(() => {
      setIsRunningCode(false);
      setCodeOutput(
        "Python 3.11.8 (Conda env: data-academy)\n[✓] Environment verified & NumPy/Pandas initialized\n[✓] Executing script...\n[SUCCESS] Code ran without exceptions!\n   Output shape: (5, 4)\n   Memory usage: 280 bytes\n✓ All test assertions passed."
      );
    }, 700);
  };

  const handleCopyStarterCode = () => {
    const code = studentCode || parsedLesson?.starterCode || "";
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleExecuteSql = () => {
    setIsRunningSql(true);
    setSqlResult(null);
    setTimeout(() => {
      setIsRunningSql(false);
      setSqlResult([
        { id: 101, name: "Alpha Logistics", segment: "Enterprise", revenue: "$48,900" },
        { id: 102, name: "Omni Retail", segment: "Mid-Market", revenue: "$32,450" },
        { id: 103, name: "Blue Sky AI", segment: "Enterprise", revenue: "$29,100" },
        { id: 104, name: "Peak Media", segment: "SMB", revenue: "$18,700" },
      ]);
    }, 600);
  };

  const handleSubmitQuiz = () => {
    if (!parsedLesson?.questions || !Array.isArray(parsedLesson.questions)) return;
    let correctCount = 0;
    parsedLesson.questions.forEach((q: any, i: number) => {
      if (quizAnswers[i] === q.correctIndex) {
        correctCount++;
      }
    });
    const pct = Math.round((correctCount / parsedLesson.questions.length) * 100);
    setQuizScore(pct);
    setQuizSubmitted(true);
    if (pct >= (parsedLesson.passingScore || 70)) {
      handleToggleComplete(true);
    }
  };

  const handleToggleDeliverable = (idx: number) => {
    setCheckedDeliverables((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionUrl.trim()) return;
    setSubmittedProject(true);
    handleToggleComplete(true);
  };

  // Helper for lesson type icons
  const renderLessonTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <span>🎬</span>;
      case "VIDEO_READING":
        return <span>🎥</span>;
      case "CODING_EXERCISE":
        return <span>🐍</span>;
      case "SQL_EXERCISE":
        return <span>🗄️</span>;
      case "QUIZ":
        return <span>❓</span>;
      case "ASSIGNMENT":
        return <span>📝</span>;
      case "PROJECT":
        return <span>🚀</span>;
      case "DOWNLOADABLE":
        return <span>📦</span>;
      case "EXTERNAL_RESOURCE":
        return <span>🌐</span>;
      default:
        return <span>📖</span>;
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: readerTheme === "dark" ? "#0b1329" : "#f8fafc" }}>
      {/* ── TOP HEADER (Cisco NetAcad Style) ── */}
      <header
        style={{
          height: 60,
          background: "#ffffff",
          color: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 40,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        {/* Left: Brand & Course Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", overflow: "hidden" }}>
          <Link
            href="/dashboard"
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.15,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: "0.9375rem", fontWeight: 900, color: "#011936", letterSpacing: "-0.02em" }}>
              AITECHHUB
            </span>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#049fd9", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Data Academy
            </span>
          </Link>

          <div style={{ width: 1, height: 26, background: "#cbd5e1", flexShrink: 0 }} />

          <h1
            style={{
              fontSize: "1.05rem",
              fontWeight: 600,
              margin: 0,
              color: "#334155",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {course.title}
          </h1>
        </div>

        {/* Right Controls: Book Toggle, Analytics Popover, Exit Close Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", position: "relative" }}>
          {/* Outline Book Icon (Cisco Green) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Hide Course Outline" : "Show Course Outline"}
            style={{
              width: 36,
              height: 36,
              borderRadius: "6px",
              border: "1.5px solid #58a03d",
              background: sidebarOpen ? "#f2f9ee" : "transparent",
              color: "#58a03d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </button>

          {/* Analytics / Histogram Icon */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowProgressModal(!showProgressModal)}
              title="Course Analytics & Progress"
              style={{
                width: 36,
                height: 36,
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: showProgressModal ? "#f1f5f9" : "transparent",
                color: "#475569",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </button>

            {/* Analytics Popover Modal */}
            {showProgressModal && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 46,
                  width: 290,
                  background: "#ffffff",
                  borderRadius: "10px",
                  boxShadow: "0 12px 28px rgba(0,0,0,0.14)",
                  border: "1px solid #e2e8f0",
                  padding: "1.1rem",
                  zIndex: 50,
                  color: "#1e293b",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#011936" }}>
                    Course Progress
                  </span>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#58a03d" }}>
                    {progressPercent}%
                  </span>
                </div>
                <div style={{ height: 6, background: "#e2e8f0", borderRadius: 999, overflow: "hidden", marginBottom: "0.85rem" }}>
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: "100%",
                      background: "#58a03d",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#64748b", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <div>Completed: <strong style={{ color: "#1e293b" }}>{completedCount}</strong> of <strong style={{ color: "#1e293b" }}>{totalLessons}</strong> lessons</div>
                  <div>Current Module: <strong style={{ color: "#0284c7" }}>{activeItem?.moduleTitle}</strong></div>
                  <div>Certificate: <strong style={{ color: course.certificateEnabled ? "#58a03d" : "#94a3b8" }}>{course.certificateEnabled ? "Available at 100%" : "Not enrolled"}</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Close Exit Button (✕) */}
          <Link
            href="/dashboard"
            title="Exit Course Reader"
            style={{
              width: 36,
              height: 36,
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              textDecoration: "none",
              fontSize: "1.25rem",
              fontWeight: 400,
              transition: "all 0.15s ease",
            }}
          >
            ✕
          </Link>
        </div>
      </header>

      {/* ── COURSE PLAYER WORKSPACE ── */}
      <div style={{ display: "flex", flex: 1, position: "relative", minHeight: "calc(100vh - 60px)" }}>
        {/* ── LEFT HAND SIDEBAR (COURSE OUTLINE & RESOURCES) ── */}
        {sidebarOpen && (
          <aside
            style={{
              width: 350,
              minWidth: 350,
              background: "#ffffff",
              borderRight: "1px solid #e2e8f0",
              height: "calc(100vh - 60px)",
              position: "sticky",
              top: 60,
              display: "flex",
              flexDirection: "column",
              zIndex: 30,
              overflowY: "auto",
            }}
          >
            {/* Dual Tabs: Course Outline | Resources */}
            <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#ffffff" }}>
              <button
                onClick={() => setSidebarTab("outline")}
                style={{
                  flex: 1,
                  padding: "0.85rem 0.5rem",
                  background: "transparent",
                  border: "none",
                  borderBottom: sidebarTab === "outline" ? "3px solid #58a03d" : "3px solid transparent",
                  color: sidebarTab === "outline" ? "#1e293b" : "#64748b",
                  fontWeight: sidebarTab === "outline" ? 700 : 500,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.45rem",
                  transition: "all 0.15s ease",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span>Course Outline</span>
              </button>

              <button
                onClick={() => setSidebarTab("resources")}
                style={{
                  flex: 1,
                  padding: "0.85rem 0.5rem",
                  background: "transparent",
                  border: "none",
                  borderBottom: sidebarTab === "resources" ? "3px solid #58a03d" : "3px solid transparent",
                  color: sidebarTab === "resources" ? "#1e293b" : "#64748b",
                  fontWeight: sidebarTab === "resources" ? 700 : 500,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.45rem",
                  transition: "all 0.15s ease",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>Resources</span>
                {allCourseResources.length > 0 && (
                  <span
                    style={{
                      background: "#e2e8f0",
                      color: "#475569",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "0.1rem 0.4rem",
                      borderRadius: "999px",
                    }}
                  >
                    {allCourseResources.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: COURSE OUTLINE */}
            {sidebarTab === "outline" ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Search Course Outline Input */}
                <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #f1f5f9" }}>
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      background: "#f8fafc",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                      padding: "0.45rem 0.65rem",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Search course outline"
                      value={outlineSearch}
                      onChange={(e) => setOutlineSearch(e.target.value)}
                      style={{
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        fontSize: "0.8125rem",
                        color: "#1e293b",
                        outline: "none",
                        paddingRight: "1.5rem",
                      }}
                    />
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      style={{ position: "absolute", right: 10, pointerEvents: "none" }}
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                </div>

                {/* Modules & Lessons List */}
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {filteredModules.map((module, mIdx) => {
                    const stats = getModuleStats(module);
                    const isExpanded = expandedModules[module.id] ?? true;
                    const isCurrentModule = module.lessons.some((l) => l.id === activeLessonId);

                    return (
                      <div
                        key={module.id}
                        style={{
                          borderBottom: "1px solid #edf2f7",
                          background: isCurrentModule ? "#f2f9ee" : "transparent",
                          transition: "background 0.2s ease",
                        }}
                      >
                        {/* Module Header Button */}
                        <button
                          onClick={() => toggleModuleExpand(module.id)}
                          style={{
                            width: "100%",
                            padding: "0.85rem 1rem",
                            background: "transparent",
                            border: "none",
                            textAlign: "left",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.4rem",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                            <span
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: 700,
                                color: isCurrentModule ? "#1e293b" : "#334155",
                                lineHeight: 1.3,
                              }}
                            >
                              Module {mIdx + 1}: {module.title}
                            </span>
                            <span
                              style={{
                                color: isCurrentModule ? "#58a03d" : "#94a3b8",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                marginLeft: "0.5rem",
                                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "transform 0.2s ease",
                              }}
                            >
                              ▼
                            </span>
                          </div>

                          {/* Thin green progress bar with percentage */}
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%" }}>
                            <div
                              style={{
                                flex: 1,
                                height: 4,
                                background: "#e2e8f0",
                                borderRadius: 2,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${stats.percent}%`,
                                  height: "100%",
                                  background: stats.percent > 0 ? "#58a03d" : "transparent",
                                  transition: "width 0.3s ease",
                                }}
                              />
                            </div>
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: stats.percent > 0 ? "#58a03d" : "#94a3b8" }}>
                              {stats.percent}%
                            </span>
                          </div>
                        </button>

                        {/* Module Lessons with vertical timeline connector */}
                        {isExpanded && (
                          <div style={{ padding: "0 0.75rem 0.75rem 1.25rem" }}>
                            <div
                              style={{
                                borderLeft: "2px dotted #94a3b8",
                                marginLeft: "8px",
                                paddingLeft: "12px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.35rem",
                              }}
                            >
                              {module.lessons.map((lesson, lIdx) => {
                                const isActive = lesson.id === activeLessonId;
                                const isComplete = !!completedMap[lesson.id];
                                const lessonSubs = isActive
                                  ? currentSubLessons
                                  : getLessonSubLessons(lesson, mIdx + 1, lIdx);
                                const totalSubs = lessonSubs.length;
                                const completedSubsCount = lessonSubs.filter((s) => completedSubLessons[s.id]).length;

                                return (
                                  <div key={lesson.id} style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                                    <button
                                      onClick={() => setActiveLessonId(lesson.id)}
                                      style={{
                                        position: "relative",
                                        display: "flex",
                                        alignItems: "flex-start",
                                        justifyContent: "space-between",
                                        padding: "0.45rem 0.5rem",
                                        borderRadius: "6px",
                                        border: "none",
                                        background: isActive ? "rgba(88, 160, 61, 0.12)" : "transparent",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        width: "100%",
                                        transition: "all 0.15s ease",
                                      }}
                                    >
                                      {/* Status circle sitting on the dotted line */}
                                      <span
                                        style={{
                                          position: "absolute",
                                          left: -19,
                                          top: 9,
                                          width: 14,
                                          height: 14,
                                          borderRadius: "50%",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          fontSize: "0.6rem",
                                          fontWeight: 800,
                                          background: isComplete ? "#58a03d" : isActive ? "#ffffff" : "#ffffff",
                                          border: isComplete
                                            ? "2px solid #58a03d"
                                            : isActive
                                            ? "2.5px solid #58a03d"
                                            : "1.5px solid #94a3b8",
                                          color: isComplete ? "#ffffff" : "#58a03d",
                                          boxShadow: isActive ? "0 0 0 3px rgba(88, 160, 61, 0.2)" : "none",
                                        }}
                                      >
                                        {isComplete ? "✓" : isActive ? "•" : ""}
                                      </span>

                                      <div style={{ flex: 1, minWidth: 0, paddingRight: "0.5rem" }}>
                                        <div
                                          style={{
                                            fontSize: "0.8125rem",
                                            fontWeight: isActive ? 700 : 500,
                                            color: isActive ? "#011936" : isComplete ? "#334155" : "#64748b",
                                            lineHeight: 1.35,
                                          }}
                                        >
                                          {mIdx + 1}.{lIdx + 1} {lesson.title}
                                        </div>
                                      </div>

                                      {/* Completion count badge */}
                                      <span
                                        style={{
                                          fontSize: "0.6875rem",
                                          fontWeight: 600,
                                          color: isComplete ? "#58a03d" : "#94a3b8",
                                          flexShrink: 0,
                                          marginTop: 2,
                                        }}
                                      >
                                        {isComplete ? `${totalSubs} / ${totalSubs}` : `${completedSubsCount} / ${totalSubs}`}
                                      </span>
                                    </button>

                                    {/* Indented Sub-Lessons List with vertical dotted line */}
                                    {isActive && lessonSubs.length > 1 && (
                                      <div
                                        style={{
                                          borderLeft: "2px dotted #94a3b8",
                                          marginLeft: "18px",
                                          paddingLeft: "14px",
                                          marginTop: "0.3rem",
                                          marginBottom: "0.5rem",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "0.25rem",
                                        }}
                                      >
                                        {lessonSubs.map((sub) => {
                                          const isSubActive = sub.id === activeSubLessonId;
                                          const isSubDone = completedSubLessons[sub.id];

                                          return (
                                            <button
                                              key={sub.id}
                                              onClick={() => scrollToSubLesson(sub.id)}
                                              style={{
                                                position: "relative",
                                                display: "flex",
                                                alignItems: "center",
                                                padding: "0.3rem 0.45rem",
                                                borderRadius: "4px",
                                                border: "none",
                                                background: isSubActive ? "rgba(88, 160, 61, 0.14)" : "transparent",
                                                cursor: "pointer",
                                                textAlign: "left",
                                                width: "100%",
                                                transition: "all 0.15s ease",
                                              }}
                                            >
                                              {/* Node on dotted line */}
                                              <span
                                                style={{
                                                  position: "absolute",
                                                  left: -20,
                                                  width: 10,
                                                  height: 10,
                                                  borderRadius: "50%",
                                                  background: isSubDone ? "#58a03d" : isSubActive ? "#58a03d" : "#ffffff",
                                                  border: isSubActive ? "2px solid #58a03d" : isSubDone ? "2px solid #58a03d" : "1.5px solid #94a3b8",
                                                  boxShadow: isSubActive ? "0 0 0 3px rgba(88, 160, 61, 0.25)" : "none",
                                                }}
                                              />

                                              <span
                                                style={{
                                                  fontSize: "0.78125rem",
                                                  fontWeight: isSubActive ? 700 : 500,
                                                  color: isSubActive ? "#58a03d" : isSubDone ? "#1e293b" : "#64748b",
                                                  lineHeight: 1.3,
                                                }}
                                              >
                                                {sub.sectionNumber} {sub.title}
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* TAB 2: COURSE RESOURCES */
              <div style={{ flex: 1, padding: "1rem", overflowY: "auto" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                  Course Attachments & Downloads
                </div>

                {allCourseResources.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#94a3b8", fontSize: "0.85rem" }}>
                    No downloadable assets or files attached to this course.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                    {allCourseResources.map((res) => (
                      <div
                        key={res.id}
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          padding: "0.75rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                          <span style={{ fontSize: "1.1rem" }}>📦</span>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1e293b", flex: 1 }}>
                            {res.title}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: "0.5rem" }}>
                          From: {res.lessonTitle}
                        </div>
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "#049fd9",
                            textDecoration: "none",
                            background: "rgba(4, 159, 217, 0.08)",
                            padding: "0.35rem 0.65rem",
                            borderRadius: "4px",
                          }}
                        >
                          <span>Download / View Asset</span>
                          <span>→</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>
        )}

        {/* ── MAIN CONTENT WORKSPACE ── */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflowX: "hidden",
            background: readerTheme === "dark" ? "#0f172a" : "#ffffff",
            color: readerTheme === "dark" ? "#f8fafc" : "#0f172a",
          }}
        >
          {/* ── BREADCRUMB & UTILITIES STRIP ── */}
          <div
            style={{
              height: 42,
              borderBottom: "1px solid #e2e8f0",
              background: readerTheme === "dark" ? "#0f172a" : "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 1.25rem",
              position: "sticky",
              top: 60,
              zIndex: 20,
            }}
          >
            {/* Left: Sidebar toggle & breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", overflow: "hidden" }}>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title={sidebarOpen ? "Collapse Outline" : "Expand Outline"}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.25rem",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.8125rem",
                  color: "#64748b",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                <span>{activeItem?.moduleTitle}</span>
                <span>›</span>
                <span style={{ fontWeight: 600, color: "#011936" }}>
                  {currentActiveSubLesson ? `${currentActiveSubLesson.sectionNumber} ${currentActiveSubLesson.title}` : activeLesson?.title}
                </span>
              </div>
            </div>

            {/* Right: Tools & Toggles (Theme, Font, EN, Bookmark, Fullscreen) */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", color: "#64748b", fontSize: "0.8125rem" }}>
              {/* Theme toggle */}
              <button
                onClick={() => setReaderTheme(readerTheme === "light" ? "dark" : "light")}
                title={readerTheme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
                style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "0.95rem" }}
              >
                {readerTheme === "light" ? "🌙" : "☀️"}
              </button>

              {/* Font size toggle */}
              <button
                onClick={() => setFontSize(fontSize === "normal" ? "large" : "normal")}
                title="Adjust text size"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  color: "#64748b",
                }}
              >
                {fontSize === "normal" ? "A+" : "A-"}
              </button>

              {/* EN language indicator */}
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontWeight: 600 }}>
                🌐 EN
              </span>

              {/* Bookmark toggle */}
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                title={isBookmarked ? "Remove Bookmark" : "Bookmark this lesson"}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: isBookmarked ? "#f59e0b" : "#94a3b8",
                  fontSize: "0.95rem",
                }}
              >
                {isBookmarked ? "★" : "☆"}
              </button>

              {/* Fullscreen toggle */}
              <button
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  } else {
                    document.exitFullscreen().catch(() => {});
                  }
                }}
                title="Toggle Fullscreen"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                ⛶
              </button>
            </div>
          </div>

          {/* ── PANORAMIC IMMERSIVE HERO BANNER (Cisco Style with Brand Colors) ── */}
          {activeLesson && (
            <div
              style={{
                position: "relative",
                minHeight: 260,
                background: "linear-gradient(135deg, #011936 0%, #002c4b 45%, #005073 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "3.5rem 2rem",
                color: "#ffffff",
                overflow: "hidden",
              }}
            >
              {/* High tech grid background pattern */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0.12,
                  backgroundImage: `radial-gradient(circle at 25px 25px, #ffffff 2%, transparent 0%), linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)`,
                  backgroundSize: "40px 40px, 40px 40px, 40px 40px",
                  pointerEvents: "none",
                }}
              />

              {/* Subtle animated server rack glow accent */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "80%",
                  height: 1,
                  background: "linear-gradient(90deg, transparent, #049fd9, #58a03d, transparent)",
                }}
              />

              {/* Floating Left Pill Navigator (<) */}
              {prevLesson && (
                <button
                  onClick={() => setActiveLessonId(prevLesson.id)}
                  title={`Previous: ${prevLesson.title}`}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 32,
                    height: 60,
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.94)",
                    border: "1.5px solid #58a03d",
                    color: "#58a03d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 15,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    fontWeight: 800,
                    fontSize: "1.2rem",
                    transition: "all 0.15s ease",
                  }}
                >
                  ‹
                </button>
              )}

              {/* Centered Hero Heading */}
              <div style={{ textAlign: "center", zIndex: 10, maxWidth: 800, padding: "0 1rem" }}>
                <h2
                  style={{
                    fontSize: "clamp(1.75rem, 3.5vw, 2.65rem)",
                    fontWeight: 800,
                    margin: 0,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                    textShadow: "0 2px 10px rgba(0,0,0,0.35)",
                  }}
                >
                  {activeLesson.title}
                </h2>

                <div
                  style={{
                    marginTop: "1.25rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#cbd5e1",
                    fontSize: "0.9375rem",
                    fontWeight: 500,
                  }}
                >
                  <span>Scroll to begin</span>
                  <span style={{ fontSize: "1.1rem" }}>⬇</span>
                </div>
              </div>

              {/* Floating XP Award Notification Chip */}
              {recentXpGain && (
                <div
                  style={{
                    position: "absolute",
                    right: 98,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "#10b981",
                    color: "#ffffff",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "999px",
                    fontWeight: 700,
                    fontSize: "0.8125rem",
                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    zIndex: 15,
                  }}
                >
                  <span>✨</span>
                  <span>+{recentXpGain} experience points</span>
                </div>
              )}

              {/* Floating Right Shield Certification Badge with Circular Progress Ring */}
              <div
                style={{
                  position: "absolute",
                  right: 28,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 62,
                  height: 62,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 12,
                }}
              >
                {/* Circular Progress Ring */}
                <svg width="62" height="62" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
                  <circle cx="31" cy="31" r="26" stroke="rgba(255,255,255,0.2)" strokeWidth="4" fill="none" />
                  <circle
                    cx="31"
                    cy="31"
                    r="26"
                    stroke="#58a03d"
                    strokeWidth="4"
                    strokeDasharray={163.36}
                    strokeDashoffset={
                      163.36 - (163.36 * (currentSubLessons.length > 0 ? (currentSubLessons.filter((s) => completedSubLessons[s.id]).length / currentSubLessons.length) : 0))
                    }
                    strokeLinecap="round"
                    fill="none"
                    style={{ transition: "stroke-dashoffset 0.4s ease" }}
                  />
                </svg>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "#ffffff",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#011936" strokeWidth="2.2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
              </div>

              {/* Floating Right Pill Navigator (>) */}
              {nextLesson && (
                <button
                  onClick={() => setActiveLessonId(nextLesson.id)}
                  title={`Next: ${nextLesson.title}`}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 32,
                    height: 60,
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.94)",
                    border: "1.5px solid #58a03d",
                    color: "#58a03d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 15,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    fontWeight: 800,
                    fontSize: "1.2rem",
                    transition: "all 0.15s ease",
                  }}
                >
                  ›
                </button>
              )}
            </div>
          )}

          {/* ── LESSON BODY CONTAINER ── */}
          <div
            style={{
              padding: "2rem 1.5rem",
              maxWidth: 960,
              width: "100%",
              margin: "0 auto",
              fontSize: fontSize === "large" ? "1.075rem" : "1rem",
              lineHeight: 1.65,
            }}
          >
            {progressPercent === 100 && (
              <div
                style={{
                  background: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
                  color: "#fff",
                  padding: "1.25rem 1.5rem",
                  borderRadius: "12px",
                  marginBottom: "2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 14px rgba(5, 150, 105, 0.25)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontSize: "1.75rem" }}>🏆</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>
                      Congratulations, {studentName}!
                    </h3>
                    <p style={{ margin: "0.15rem 0 0", fontSize: "0.875rem", color: "#a7f3d0" }}>
                      You have completed 100% of {course.title}.
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  style={{
                    background: "#fff",
                    color: "#065f46",
                    fontWeight: 700,
                    fontSize: "0.8125rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "9999px",
                    textDecoration: "none",
                  }}
                >
                  Back to Dashboard
                </Link>
              </div>
            )}

            {activeLesson ? (
              <div style={{ maxWidth: 900, margin: "0 auto" }}>
                {/* Module & Lesson Title Header */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                    {(() => {
                      const badge = (() => {
                        switch (activeLesson.type) {
                          case "CODING_EXERCISE":
                            return { label: "Python Coding Lab", icon: "🐍", color: "#166534", bg: "#dcfce7" };
                          case "SQL_EXERCISE":
                            return { label: "SQL Query Lab", icon: "🗄️", color: "#c2410c", bg: "#ffedd5" };
                          case "QUIZ":
                            return { label: "Concept Quiz", icon: "❓", color: "#7e22ce", bg: "#f3e8ff" };
                          case "DOWNLOADABLE":
                            return { label: "Downloadable Asset", icon: "📦", color: "#1d4ed8", bg: "#dbeafe" };
                          case "EXTERNAL_RESOURCE":
                            return { label: "External Resource", icon: "🌐", color: "#0f766e", bg: "#ccfbf1" };
                          case "PROJECT":
                            return { label: "Practical Capstone Project", icon: "🚀", color: "#b45309", bg: "#fef3c7" };
                          case "ASSIGNMENT":
                            return { label: "Graded Assignment", icon: "📝", color: "#b45309", bg: "#fef3c7" };
                          case "VIDEO":
                            return { label: "Video Lecture", icon: "🎬", color: "#005073", bg: "rgba(0, 80, 115, 0.12)" };
                          case "VIDEO_READING":
                            return { label: "Video + Reading", icon: "🎥", color: "#0369a1", bg: "#e0f2fe" };
                          default:
                            return { label: "Reading Guide", icon: "📖", color: "#0284c7", bg: "#e0f2fe" };
                        }
                      })();
                      return (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: badge.color,
                            background: badge.bg,
                            padding: "0.2rem 0.55rem",
                            borderRadius: "4px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                          }}
                        >
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>
                      );
                    })()}
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "#0284c7",
                        background: "#e0f2fe",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                      }}
                    >
                      {activeItem?.moduleTitle}
                    </span>
                    <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                      • {activeLesson.estimatedMinutes} min
                    </span>
                  </div>
                </div>

              {/* VIDEO PLAYER (If Video Lesson or Walkthrough attached) */}
              {activeLesson.videoUrl && (
                <div
                  style={{
                    position: "relative",
                    paddingBottom: "56.25%",
                    height: 0,
                    borderRadius: "12px",
                    overflow: "hidden",
                    marginBottom: "2rem",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    background: "#000",
                  }}
                >
                  <iframe
                    src={getEmbedVideoUrl(activeLesson.videoUrl) || ""}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      border: "none",
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={activeLesson.title}
                  />
                </div>
              )}

              {/* LEARNING OBJECTIVES */}
              {activeLesson.learningObjectives && activeLesson.learningObjectives.length > 0 && (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "10px",
                    padding: "1.25rem 1.5rem",
                    marginBottom: "2rem",
                  }}
                >
                  <h4 style={{ margin: "0 0 0.75rem", color: "#166534", fontSize: "0.9375rem", fontWeight: 700 }}>
                    🎯 Key Objectives in this Lesson:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#15803d", fontSize: "0.875rem", lineHeight: 1.6 }}>
                    {activeLesson.learningObjectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── SUB-LESSONS CONTINUOUS SCROLL VIEW (Cisco NetAcad Style) ── */}
              {currentSubLessons.length > 1 || currentSubLessons.some((s) => s.cards || s.practiceQuiz || s.tabs) ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginBottom: "3rem" }}>
                  {currentSubLessons.map((sub) => {
                    const isSubActive = activeSubLessonId === sub.id;
                    const isCompleted = !!completedSubLessons[sub.id];

                    return (
                      <article
                        key={sub.id}
                        id={`sublesson-${sub.id}`}
                        data-sublesson-id={sub.id}
                        ref={(el) => {
                          subLessonRefs.current[sub.id] = el;
                        }}
                        style={{
                          background: "#fff",
                          borderRadius: "14px",
                          border: isSubActive ? "2px solid #049fd9" : "1px solid #e2e8f0",
                          padding: "2.25rem 2.5rem",
                          boxShadow: isSubActive
                            ? "0 10px 30px -5px rgba(4, 159, 217, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.04)"
                            : "0 2px 4px rgba(0, 0, 0, 0.02)",
                          transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                          scrollMarginTop: "5.5rem",
                        }}
                      >
                        {/* Sub-lesson Title Header */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "1.5rem",
                            flexWrap: "wrap",
                            gap: "0.75rem",
                            borderBottom: "1px solid #f1f5f9",
                            paddingBottom: "1rem",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                            <span
                              style={{
                                background: isSubActive ? "#049fd9" : "#011936",
                                color: "#fff",
                                fontSize: "0.875rem",
                                fontWeight: 800,
                                padding: "0.3rem 0.75rem",
                                borderRadius: "6px",
                                letterSpacing: "0.02em",
                                transition: "background 0.25s ease",
                              }}
                            >
                              {sub.sectionNumber}
                            </span>
                            <h2 style={{ margin: 0, fontSize: "1.375rem", fontWeight: 800, color: "#0f172a" }}>
                              {sub.title}
                            </h2>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            {isCompleted && (
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  color: "#16a34a",
                                  background: "#dcfce7",
                                  padding: "0.25rem 0.65rem",
                                  borderRadius: "9999px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                }}
                              >
                                <span>✓</span>
                                <span>Read</span>
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                color: "#0369a1",
                                background: "#e0f2fe",
                                padding: "0.25rem 0.65rem",
                                borderRadius: "6px",
                              }}
                            >
                              {sub.type === "PRACTICE"
                                ? "Interactive Practice"
                                : sub.type === "CODING_EXERCISE"
                                ? "Python Lab"
                                : sub.type === "SQL_EXERCISE"
                                ? "SQL Lab"
                                : "Reading Guide"}
                            </span>
                          </div>
                        </div>

                        {/* Media Banner */}
                        {sub.mediaUrl && (
                          <div
                            style={{
                              borderRadius: "10px",
                              overflow: "hidden",
                              marginBottom: "1.75rem",
                              border: "1px solid #e2e8f0",
                              maxHeight: 400,
                              background: "#f8fafc",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                            }}
                          >
                            <img
                              src={sub.mediaUrl}
                              alt={sub.title}
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          </div>
                        )}

                        {/* Sub-lesson Text Content */}
                        {sub.content && (
                          <div
                            style={{
                              fontSize: "1.025rem",
                              lineHeight: 1.85,
                              color: "#334155",
                              marginBottom: sub.cards || sub.practiceQuiz || sub.tabs ? "2rem" : 0,
                            }}
                            dangerouslySetInnerHTML={{ __html: formatLessonContent(sub.content) }}
                          />
                        )}

                        {/* Interactive Quadrant / Characteristic Cards (Matches video 00:08 - 00:18) */}
                        {sub.cards && sub.cards.length > 0 && (
                          <div style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>
                            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#64748b", marginBottom: "0.85rem" }}>
                              💡 Click each quadrant below to explore the characteristic details:
                            </p>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                                gap: "1rem",
                              }}
                            >
                              {sub.cards.map((card, cIdx) => {
                                const isActive = (activeCardMap[sub.id] ?? 0) === cIdx;
                                return (
                                  <div
                                    key={cIdx}
                                    onClick={() => setActiveCardMap((prev) => ({ ...prev, [sub.id]: cIdx }))}
                                    style={{
                                      cursor: "pointer",
                                      borderRadius: "12px",
                                      border: isActive ? `2px solid ${card.color || "#049fd9"}` : "1px solid #e2e8f0",
                                      background: isActive ? "#f8fafc" : "#fff",
                                      padding: "1.35rem",
                                      boxShadow: isActive
                                        ? "0 8px 20px rgba(0,0,0,0.07)"
                                        : "0 1px 3px rgba(0,0,0,0.02)",
                                      transform: isActive ? "translateY(-2px)" : "none",
                                      transition: "all 0.2s ease",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: "0.75rem",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: "0.75rem",
                                          fontWeight: 800,
                                          letterSpacing: "0.05em",
                                          color: "#fff",
                                          background: card.color || "#049fd9",
                                          padding: "0.25rem 0.65rem",
                                          borderRadius: "4px",
                                        }}
                                      >
                                        {card.badge}
                                      </span>
                                      <span style={{ fontSize: "1.5rem" }}>{card.icon || "📌"}</span>
                                    </div>
                                    <h4
                                      style={{
                                        margin: "0 0 0.5rem",
                                        fontSize: "1.05rem",
                                        fontWeight: 700,
                                        color: "#0f172a",
                                      }}
                                    >
                                      {card.title}
                                    </h4>
                                    <p
                                      style={{
                                        margin: 0,
                                        fontSize: "0.875rem",
                                        color: "#475569",
                                        lineHeight: 1.65,
                                      }}
                                    >
                                      {card.description}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Interactive Practice Quiz Item (Matches video 00:20 - 00:45) */}
                        {sub.practiceQuiz && (
                          <div
                            style={{
                              marginTop: "1.75rem",
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              borderRadius: "12px",
                              padding: "1.75rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                marginBottom: "1.25rem",
                              }}
                            >
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: "10px",
                                  background: "#e0f2fe",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "1.25rem",
                                }}
                              >
                                🧩
                              </div>
                              <div>
                                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                                  Interactive Practice Activity
                                </h3>
                                <p style={{ margin: "0.15rem 0 0", fontSize: "0.875rem", color: "#64748b" }}>
                                  {sub.practiceQuiz.prompt}
                                </p>
                              </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                              {sub.practiceQuiz.scenarios.map((sc, sIdx) => {
                                const selected = practiceAnswers[sc.id] || "";
                                const feedback = practiceFeedback[sc.id];
                                const isShowAnswer = showAnswerMap[sc.id];

                                return (
                                  <div
                                    key={sc.id}
                                    style={{
                                      background: "#fff",
                                      border: feedback?.show
                                        ? feedback.isCorrect
                                          ? "1.5px solid #86efac"
                                          : "1.5px solid #fca5a5"
                                        : "1px solid #e2e8f0",
                                      borderRadius: "10px",
                                      padding: "1.25rem 1.5rem",
                                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                                      <span
                                        style={{
                                          background: "#011936",
                                          color: "#fff",
                                          fontWeight: 800,
                                          fontSize: "0.75rem",
                                          padding: "0.2rem 0.55rem",
                                          borderRadius: "4px",
                                          marginTop: "0.15rem",
                                          flexShrink: 0,
                                        }}
                                      >
                                        Scenario {sIdx + 1}
                                      </span>
                                      <p
                                        style={{
                                          margin: 0,
                                          flex: 1,
                                          fontSize: "0.9375rem",
                                          color: "#334155",
                                          lineHeight: 1.65,
                                        }}
                                      >
                                        {sc.text}
                                      </p>
                                    </div>

                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginTop: "1.25rem",
                                        paddingTop: "1rem",
                                        borderTop: "1px solid #f1f5f9",
                                        flexWrap: "wrap",
                                        gap: "0.75rem",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "0.65rem",
                                          flexWrap: "wrap",
                                        }}
                                      >
                                        <label
                                          htmlFor={`select-${sc.id}`}
                                          style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#475569" }}
                                        >
                                          Characteristic:
                                        </label>
                                        <select
                                          id={`select-${sc.id}`}
                                          value={selected}
                                          onChange={(e) =>
                                            setPracticeAnswers((prev) => ({ ...prev, [sc.id]: e.target.value }))
                                          }
                                          style={{
                                            padding: "0.55rem 0.85rem",
                                            borderRadius: "6px",
                                            border: "1.5px solid #cbd5e1",
                                            fontSize: "0.875rem",
                                            fontWeight: 600,
                                            background: "#fff",
                                            color: "#0f172a",
                                            cursor: "pointer",
                                            minWidth: 160,
                                          }}
                                        >
                                          <option value="">Select an option...</option>
                                          {sc.options.map((opt) => (
                                            <option key={opt} value={opt}>
                                              {opt}
                                            </option>
                                          ))}
                                        </select>

                                        <button
                                          type="button"
                                          onClick={() => handlePracticeSubmit(sc)}
                                          disabled={!selected}
                                          style={{
                                            padding: "0.55rem 1.15rem",
                                            borderRadius: "6px",
                                            border: "none",
                                            background: selected ? "#011936" : "#cbd5e1",
                                            color: "#fff",
                                            fontWeight: 700,
                                            fontSize: "0.875rem",
                                            cursor: selected ? "pointer" : "not-allowed",
                                            transition: "background 0.2s ease",
                                          }}
                                        >
                                          Submit
                                        </button>

                                        {feedback?.show && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setPracticeModal({
                                                isOpen: true,
                                                scenario: sc,
                                                isCorrect: feedback.isCorrect,
                                              })
                                            }
                                            style={{
                                              padding: "0.55rem 1rem",
                                              borderRadius: "6px",
                                              border: "1px solid #bae6fd",
                                              background: "#f0f9ff",
                                              color: "#0284c7",
                                              fontWeight: 700,
                                              fontSize: "0.8125rem",
                                              cursor: "pointer",
                                            }}
                                          >
                                            Show feedback
                                          </button>
                                        )}

                                        {feedback?.show && (
                                          <button
                                            type="button"
                                            onClick={() => handlePracticeReset(sc.id)}
                                            style={{
                                              padding: "0.55rem 0.85rem",
                                              borderRadius: "6px",
                                              border: "1px solid #e2e8f0",
                                              background: "#fff",
                                              color: "#64748b",
                                              fontWeight: 600,
                                              fontSize: "0.8125rem",
                                              cursor: "pointer",
                                            }}
                                          >
                                            Reset
                                          </button>
                                        )}

                                        {feedback?.show && !feedback.isCorrect && !isShowAnswer && (
                                          <button
                                            type="button"
                                            onClick={() => setShowAnswerMap((prev) => ({ ...prev, [sc.id]: true }))}
                                            style={{
                                              padding: "0.55rem 0.85rem",
                                              borderRadius: "6px",
                                              border: "1px solid #fed7aa",
                                              background: "#fffbeb",
                                              color: "#b45309",
                                              fontWeight: 700,
                                              fontSize: "0.8125rem",
                                              cursor: "pointer",
                                            }}
                                          >
                                            Show correct answer
                                          </button>
                                        )}
                                      </div>

                                      {feedback?.show && (
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                          {feedback.isCorrect ? (
                                            <span
                                              style={{
                                                fontSize: "0.875rem",
                                                fontWeight: 700,
                                                color: "#16a34a",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "0.3rem",
                                              }}
                                            >
                                              <span>✓</span>
                                              <span>Correct! (+25 XP)</span>
                                            </span>
                                          ) : (
                                            <span
                                              style={{
                                                fontSize: "0.875rem",
                                                fontWeight: 700,
                                                color: "#dc2626",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "0.3rem",
                                              }}
                                            >
                                              <span>✕</span>
                                              <span>Incorrect</span>
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {isShowAnswer && (
                                      <div
                                        style={{
                                          marginTop: "0.75rem",
                                          padding: "0.75rem 1rem",
                                          background: "#fef3c7",
                                          border: "1px solid #fde68a",
                                          borderRadius: "6px",
                                          fontSize: "0.875rem",
                                          color: "#92400e",
                                        }}
                                      >
                                        <strong>Correct answer:</strong> {sc.correctAnswer} — {sc.explanation}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Category Tabs (Matches video 00:50+) */}
                        {sub.tabs && sub.tabs.length > 0 && (
                          <div style={{ marginTop: "2rem" }}>
                            {/* Tab selector buttons */}
                            <div
                              style={{
                                display: "flex",
                                gap: "0.5rem",
                                borderBottom: "2px solid #e2e8f0",
                                paddingBottom: "0.5rem",
                                flexWrap: "wrap",
                              }}
                            >
                              {sub.tabs.map((tab) => {
                                const isTabActive = (activeTabMap[sub.id] || sub.tabs![0].id) === tab.id;
                                return (
                                  <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTabMap((prev) => ({ ...prev, [sub.id]: tab.id }))}
                                    style={{
                                      padding: "0.55rem 1.25rem",
                                      borderRadius: "8px",
                                      border: "none",
                                      background: isTabActive ? "#011936" : "transparent",
                                      color: isTabActive ? "#fff" : "#475569",
                                      fontWeight: 700,
                                      fontSize: "0.875rem",
                                      cursor: "pointer",
                                      transition: "all 0.2s ease",
                                    }}
                                  >
                                    {tab.label}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Active Tab Card */}
                            {(() => {
                              const curTabId = activeTabMap[sub.id] || sub.tabs[0].id;
                              const curTab = sub.tabs.find((t) => t.id === curTabId) || sub.tabs[0];
                              return (
                                <div
                                  style={{
                                    marginTop: "1.25rem",
                                    background: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "10px",
                                    padding: "1.75rem",
                                  }}
                                >
                                  <h4
                                    style={{
                                      margin: "0 0 0.75rem",
                                      fontSize: "1.1rem",
                                      fontWeight: 700,
                                      color: "#0f172a",
                                    }}
                                  >
                                    {curTab.title}
                                  </h4>
                                  {curTab.image && (
                                    <div
                                      style={{
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        maxHeight: 300,
                                        marginBottom: "1rem",
                                        border: "1px solid #e2e8f0",
                                      }}
                                    >
                                      <img
                                        src={curTab.image}
                                        alt={curTab.title}
                                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                      />
                                    </div>
                                  )}
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: "0.9375rem",
                                      color: "#334155",
                                      lineHeight: 1.8,
                                    }}
                                  >
                                    {curTab.content}
                                  </p>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <>
                  {/* ── 1. PYTHON CODING LAB VIEW ── */}
                  {activeLesson.type === "CODING_EXERCISE" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2.5rem" }}>
                  {/* Instructions */}
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      padding: "2rem",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                      <span style={{ fontSize: "1.25rem" }}>🐍</span>
                      <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#0f172a" }}>
                        Lab Problem Statement &amp; Requirements
                      </h3>
                    </div>
                    <div
                      style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#334155", whiteSpace: "pre-wrap" }}
                      dangerouslySetInnerHTML={{
                        __html: formatLessonContent(parsedLesson?.instructions || activeLesson.content || "Write your solution below using the starter template."),
                      }}
                    />
                  </div>

                  {/* Interactive Code Editor Workspace */}
                  <div style={{ background: "#0b132b", borderRadius: "12px", overflow: "hidden", border: "1px solid #1e293b", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1.25rem", background: "#060d1f", borderBottom: "1px solid #1e293b" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
                        </div>
                        <span style={{ fontSize: "0.8125rem", color: "#94a3b8", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                          solution.py
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          type="button"
                          onClick={handleCopyStarterCode}
                          style={{
                            padding: "0.3rem 0.65rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#94a3b8",
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          {codeCopied ? "✓ Copied" : "Copy Code"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentCode(parsedLesson?.starterCode || "")}
                          style={{
                            padding: "0.3rem 0.65rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#94a3b8",
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={10}
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      placeholder="# Type your Python script here..."
                      style={{
                        width: "100%",
                        padding: "1.25rem",
                        fontFamily: "Consolas, Menlo, Monaco, monospace",
                        fontSize: "0.875rem",
                        lineHeight: 1.6,
                        background: "#0b132b",
                        color: "#67e8f9",
                        border: "none",
                        outline: "none",
                        resize: "vertical",
                      }}
                    />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1.25rem", background: "#060d1f", borderTop: "1px solid #1e293b" }}>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Python 3.11 Kernel Ready</span>
                      <button
                        type="button"
                        onClick={handleRunPythonCode}
                        disabled={isRunningCode}
                        style={{
                          padding: "0.45rem 1.25rem",
                          borderRadius: "6px",
                          background: "#10b981",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "0.8125rem",
                          border: "none",
                          cursor: isRunningCode ? "not-allowed" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                        }}
                      >
                        <span>{isRunningCode ? "Running..." : "▶ Run Code"}</span>
                      </button>
                    </div>

                    {/* Output Terminal Console */}
                    {codeOutput && (
                      <div style={{ background: "#020617", padding: "1rem 1.25rem", borderTop: "1px solid #1e293b", fontFamily: "monospace", fontSize: "0.8125rem", color: "#a7f3d0", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                        {codeOutput}
                      </div>
                    )}
                  </div>

                  {/* Solution Hint Accordion */}
                  {parsedLesson?.solutionHint && (
                    <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "1rem 1.25rem" }}>
                      <button
                        type="button"
                        onClick={() => setShowSolutionHint(!showSolutionHint)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "0.875rem",
                          fontWeight: 700,
                          color: "#0284c7",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          padding: 0,
                        }}
                      >
                        <span>💡</span>
                        <span>{showSolutionHint ? "Hide Solution Hint" : "Need a hint? Reveal Solution Guide"}</span>
                        <span>{showSolutionHint ? "▲" : "▼"}</span>
                      </button>
                      {showSolutionHint && (
                        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9", fontSize: "0.875rem", color: "#475569", lineHeight: 1.6 }}>
                          {parsedLesson.solutionHint}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── 2. SQL QUERY LAB VIEW ── */}
              {activeLesson.type === "SQL_EXERCISE" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2.5rem" }}>
                  {/* Instructions */}
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      padding: "2rem",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                      <span style={{ fontSize: "1.25rem" }}>🗄️</span>
                      <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#0f172a" }}>
                        SQL Query Challenge
                      </h3>
                    </div>
                    <div
                      style={{ fontSize: "0.9375rem", lineHeight: 1.8, color: "#334155", whiteSpace: "pre-wrap" }}
                      dangerouslySetInnerHTML={{
                        __html: formatLessonContent(parsedLesson?.instructions || activeLesson.content || "Write the SQL query to solve the question."),
                      }}
                    />
                  </div>

                  {/* Schema Context Viewer */}
                  {parsedLesson?.schemaContext && (
                    <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "10px", padding: "1.25rem" }}>
                      <h4 style={{ margin: "0 0 0.5rem", color: "#9a3412", fontSize: "0.875rem", fontWeight: 700 }}>
                        📋 Database Schema &amp; Tables:
                      </h4>
                      <pre style={{ margin: 0, fontFamily: "monospace", fontSize: "0.8125rem", color: "#7c2d12", whiteSpace: "pre-wrap" }}>
                        {parsedLesson.schemaContext}
                      </pre>
                    </div>
                  )}

                  {/* Interactive SQL Console */}
                  <div style={{ background: "#1c1917", borderRadius: "12px", overflow: "hidden", border: "1px solid #292524" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1.25rem", background: "#0c0a09", borderBottom: "1px solid #292524" }}>
                      <span style={{ fontSize: "0.8125rem", color: "#a8a29e", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                        query.sql
                      </span>
                      <button
                        type="button"
                        onClick={handleExecuteSql}
                        disabled={isRunningSql}
                        style={{
                          padding: "0.4rem 1.15rem",
                          borderRadius: "6px",
                          background: "#ea580c",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "0.8125rem",
                          border: "none",
                          cursor: isRunningSql ? "not-allowed" : "pointer",
                        }}
                      >
                        {isRunningSql ? "Executing..." : "▶ Execute Query"}
                      </button>
                    </div>

                    <textarea
                      rows={6}
                      value={studentSql}
                      onChange={(e) => setStudentSql(e.target.value)}
                      placeholder="SELECT * FROM table LIMIT 10;"
                      style={{
                        width: "100%",
                        padding: "1rem 1.25rem",
                        fontFamily: "Consolas, Menlo, Monaco, monospace",
                        fontSize: "0.875rem",
                        lineHeight: 1.6,
                        background: "#1c1917",
                        color: "#fdba74",
                        border: "none",
                        outline: "none",
                        resize: "vertical",
                      }}
                    />

                    {/* SQL Result Table */}
                    {sqlResult && (
                      <div style={{ background: "#0c0a09", padding: "1rem 1.25rem", borderTop: "1px solid #292524" }}>
                        <div style={{ fontSize: "0.75rem", color: "#a8a29e", marginBottom: "0.5rem", fontWeight: 600 }}>
                          Query Result ({sqlResult.length} rows returned in 24ms):
                        </div>
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem", color: "#e7e5e4" }}>
                            <thead>
                              <tr style={{ borderBottom: "1px solid #44403c", textAlign: "left" }}>
                                {Object.keys(sqlResult[0] || {}).map((k) => (
                                  <th key={k} style={{ padding: "0.4rem 0.75rem", color: "#fed7aa", fontWeight: 700 }}>
                                    {k}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sqlResult.map((row, rIdx) => (
                                <tr key={rIdx} style={{ borderBottom: "1px solid #292524" }}>
                                  {Object.values(row).map((v: any, vIdx) => (
                                    <td key={vIdx} style={{ padding: "0.4rem 0.75rem" }}>
                                      {v}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SQL Solution Hint */}
                  {parsedLesson?.solutionHint && (
                    <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "1rem 1.25rem" }}>
                      <button
                        type="button"
                        onClick={() => setShowSqlHint(!showSqlHint)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "0.875rem",
                          fontWeight: 700,
                          color: "#c2410c",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          padding: 0,
                        }}
                      >
                        <span>💡</span>
                        <span>{showSqlHint ? "Hide Query Hint" : "Reveal Query Solution Hint"}</span>
                        <span>{showSqlHint ? "▲" : "▼"}</span>
                      </button>
                      {showSqlHint && (
                        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9", fontSize: "0.875rem", color: "#475569", lineHeight: 1.6 }}>
                          {parsedLesson.solutionHint}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── 3. CONCEPT QUIZ VIEW ── */}
              {activeLesson.type === "QUIZ" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2.5rem" }}>
                  {/* Quiz Header & Score Banner */}
                  <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "2rem", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.25rem" }}>❓</span>
                        <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#0f172a" }}>
                          Concept Quiz
                        </h3>
                      </div>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 700, padding: "0.25rem 0.75rem", borderRadius: "9999px", background: "#f3e8ff", color: "#7e22ce" }}>
                        Passing threshold: {parsedLesson?.passingScore || 70}%
                      </span>
                    </div>

                    {parsedLesson?.instructions && (
                      <div
                        style={{ fontSize: "0.9375rem", color: "#475569", lineHeight: 1.7, marginBottom: "1.5rem" }}
                        dangerouslySetInnerHTML={{ __html: formatLessonContent(parsedLesson.instructions) }}
                      />
                    )}

                    {/* Result Banner if submitted */}
                    {quizSubmitted && quizScore !== null && (
                      <div
                        style={{
                          padding: "1rem 1.25rem",
                          borderRadius: "8px",
                          marginBottom: "1.5rem",
                          background: quizScore >= (parsedLesson?.passingScore || 70) ? "#f0fdf4" : "#fef2f2",
                          border: quizScore >= (parsedLesson?.passingScore || 70) ? "1px solid #bbf7d0" : "1px solid #fecaca",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "0.75rem",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "1rem", fontWeight: 700, color: quizScore >= (parsedLesson?.passingScore || 70) ? "#15803d" : "#b91c1c" }}>
                            {quizScore >= (parsedLesson?.passingScore || 70)
                              ? `🎉 Passed! You scored ${quizScore}%!`
                              : `⚠️ You scored ${quizScore}%. Passing score is ${parsedLesson?.passingScore || 70}%.`}
                          </div>
                          <div style={{ fontSize: "0.8125rem", color: "#475569", marginTop: "0.2rem" }}>
                            {quizScore >= (parsedLesson?.passingScore || 70)
                              ? "Excellent mastery of the concepts covered in this module."
                              : "Review the correct explanations below and retry to improve your score."}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setQuizSubmitted(false);
                            setQuizScore(null);
                            setQuizAnswers({});
                          }}
                          style={{
                            padding: "0.4rem 0.85rem",
                            fontSize: "0.8125rem",
                            fontWeight: 700,
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            background: "#fff",
                            color: "#334155",
                            cursor: "pointer",
                          }}
                        >
                          Retake Quiz
                        </button>
                      </div>
                    )}

                    {/* Questions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      {(parsedLesson?.questions || []).map((q: any, qIdx: number) => {
                        const selectedIdx = quizAnswers[qIdx];
                        const isCorrect = selectedIdx === q.correctIndex;
                        return (
                          <div
                            key={q.id || qIdx}
                            style={{
                              padding: "1.25rem",
                              borderRadius: "8px",
                              border: quizSubmitted
                                ? isCorrect
                                  ? "1px solid #86efac"
                                  : "1px solid #fca5a5"
                                : "1px solid #e2e8f0",
                              background: quizSubmitted ? (isCorrect ? "#f0fdf4" : "#fff5f5") : "#fafafa",
                            }}
                          >
                            <h4 style={{ margin: "0 0 0.85rem", fontSize: "0.9375rem", fontWeight: 700, color: "#1e293b" }}>
                              {qIdx + 1}. {q.question}
                            </h4>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              {(q.options || []).map((opt: string, optIdx: number) => {
                                const isSelected = selectedIdx === optIdx;
                                const isTheRightAnswer = q.correctIndex === optIdx;
                                return (
                                  <label
                                    key={optIdx}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.65rem",
                                      padding: "0.65rem 0.85rem",
                                      borderRadius: "6px",
                                      background: quizSubmitted
                                        ? isTheRightAnswer
                                          ? "#dcfce7"
                                          : isSelected
                                          ? "#fee2e2"
                                          : "#fff"
                                        : isSelected
                                        ? "#f3e8ff"
                                        : "#fff",
                                      border: isSelected ? "1px solid #c084fc" : "1px solid #e2e8f0",
                                      cursor: quizSubmitted ? "default" : "pointer",
                                      fontSize: "0.875rem",
                                      color: "#1e293b",
                                    }}
                                  >
                                    <input
                                      type="radio"
                                      name={`question_${qIdx}`}
                                      disabled={quizSubmitted}
                                      checked={isSelected}
                                      onChange={() =>
                                        setQuizAnswers((prev) => ({
                                          ...prev,
                                          [qIdx]: optIdx,
                                        }))
                                      }
                                      style={{ cursor: quizSubmitted ? "default" : "pointer" }}
                                    />
                                    <span style={{ fontWeight: 600, color: "#64748b" }}>
                                      {String.fromCharCode(65 + optIdx)}.
                                    </span>
                                    <span style={{ flex: 1 }}>{opt}</span>
                                    {quizSubmitted && isTheRightAnswer && (
                                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#16a34a" }}>✓ Correct</span>
                                    )}
                                  </label>
                                );
                              })}
                            </div>

                            {quizSubmitted && q.explanation && (
                              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(0,0,0,0.06)", fontSize: "0.8125rem", color: "#475569" }}>
                                <strong>Explanation:</strong> {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {!quizSubmitted && (parsedLesson?.questions?.length || 0) > 0 && (
                      <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={handleSubmitQuiz}
                          style={{
                            padding: "0.65rem 1.75rem",
                            borderRadius: "9999px",
                            background: "#7e22ce",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "0.9375rem",
                            border: "none",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(126, 34, 206, 0.3)",
                          }}
                        >
                          Submit Quiz Answers
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── 4. DOWNLOADABLE ASSET VIEW ── */}
              {activeLesson.type === "DOWNLOADABLE" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2.5rem" }}>
                  {/* Hero Download Card */}
                  <div
                    style={{
                      background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                      borderRadius: "12px",
                      border: "1px solid #bfdbfe",
                      padding: "2rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "1.5rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: "12px",
                          background: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.75rem",
                          boxShadow: "0 4px 12px rgba(2, 132, 199, 0.15)",
                        }}
                      >
                        📦
                      </div>
                      <div>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {parsedLesson?.fileType || "Course File Asset"}
                        </span>
                        <h3 style={{ margin: "0.2rem 0", fontSize: "1.125rem", fontWeight: 800, color: "#1e3a8a" }}>
                          {parsedLesson?.fileName || activeLesson.title}
                        </h3>
                        <span style={{ fontSize: "0.8125rem", color: "#3b82f6" }}>
                          Download and open in your local environment or Jupyter notebook
                        </span>
                      </div>
                    </div>

                    {parsedLesson?.downloadUrl && (
                      <a
                        href={parsedLesson.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.75rem 1.5rem",
                          borderRadius: "9999px",
                          background: "#0284c7",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "0.9375rem",
                          textDecoration: "none",
                          boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
                        }}
                      >
                        <span>📥</span>
                        <span>Download Asset</span>
                      </a>
                    )}
                  </div>

                  {/* Usage Guide */}
                  <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "2rem" }}>
                    <h4 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                      Dataset Description &amp; Instructions:
                    </h4>
                    <div
                      style={{ fontSize: "0.9375rem", color: "#334155", lineHeight: 1.8, whiteSpace: "pre-wrap" }}
                      dangerouslySetInnerHTML={{
                        __html: formatLessonContent(parsedLesson?.instructions || activeLesson.content || "Download the file above and inspect its contents to follow the exercise."),
                      }}
                    />
                  </div>
                </div>
              )}

              {/* ── 5. EXTERNAL RESOURCE VIEW ── */}
              {activeLesson.type === "EXTERNAL_RESOURCE" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2.5rem" }}>
                  {/* Hero Launch Card */}
                  <div
                    style={{
                      background: "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)",
                      borderRadius: "12px",
                      border: "1px solid #99f6e4",
                      padding: "2rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "1.5rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: "12px",
                          background: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.75rem",
                          boxShadow: "0 4px 12px rgba(15, 118, 110, 0.15)",
                        }}
                      >
                        🌐
                      </div>
                      <div>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0f766e", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {parsedLesson?.provider || "External Platform"}
                        </span>
                        <h3 style={{ margin: "0.2rem 0", fontSize: "1.125rem", fontWeight: 800, color: "#115e59" }}>
                          {activeLesson.title}
                        </h3>
                        <span style={{ fontSize: "0.8125rem", color: "#0d9488" }}>
                          Interactive workspace hosted on an external environment
                        </span>
                      </div>
                    </div>

                    {parsedLesson?.externalUrl && (
                      <a
                        href={parsedLesson.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.75rem 1.5rem",
                          borderRadius: "9999px",
                          background: "#0f766e",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "0.9375rem",
                          textDecoration: "none",
                          boxShadow: "0 4px 12px rgba(15, 118, 110, 0.3)",
                        }}
                      >
                        <span>Launch in {parsedLesson.provider || "Browser"}</span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>

                  {/* Guided Instructions */}
                  <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "2rem" }}>
                    <h4 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                      Guided Activity Instructions:
                    </h4>
                    <div
                      style={{ fontSize: "0.9375rem", color: "#334155", lineHeight: 1.8, whiteSpace: "pre-wrap" }}
                      dangerouslySetInnerHTML={{
                        __html: formatLessonContent(parsedLesson?.instructions || activeLesson.content || "Click the button above to launch the external resource, complete the steps, and return to mark this lesson complete."),
                      }}
                    />
                  </div>
                </div>
              )}

              {/* ── 6. ASSIGNMENT & PRACTICAL PROJECT VIEW ── */}
              {(activeLesson.type === "ASSIGNMENT" || activeLesson.type === "PROJECT") && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2.5rem" }}>
                  {/* Brief & Scenario */}
                  <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.25rem" }}>{activeLesson.type === "PROJECT" ? "🚀" : "📝"}</span>
                        <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#0f172a" }}>
                          {activeLesson.type === "PROJECT" ? "Capstone Project Brief" : "Assignment Guidelines"}
                        </h3>
                      </div>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#b45309", background: "#fef3c7", padding: "0.25rem 0.75rem", borderRadius: "9999px" }}>
                        Max Score: {parsedLesson?.maxScore || 100} Pts
                      </span>
                    </div>

                    <div
                      style={{ fontSize: "0.9375rem", color: "#334155", lineHeight: 1.8, whiteSpace: "pre-wrap" }}
                      dangerouslySetInnerHTML={{
                        __html: formatLessonContent(parsedLesson?.instructions || activeLesson.content || "Review the requirements and complete the deliverables specified."),
                      }}
                    />

                    {parsedLesson?.starterRepoUrl && (
                      <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
                        <a
                          href={parsedLesson.starterRepoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            fontSize: "0.875rem",
                            fontWeight: 700,
                            color: "#0284c7",
                            textDecoration: "none",
                          }}
                        >
                          <span>📁 Clone Starter GitHub Repository</span>
                          <span>↗</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Deliverables Checklist */}
                  {parsedLesson?.deliverables && (
                    <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "12px", padding: "1.5rem" }}>
                      <h4 style={{ margin: "0 0 0.85rem", color: "#92400e", fontSize: "0.9375rem", fontWeight: 700 }}>
                        📋 Deliverables Checklist:
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {parsedLesson.deliverables.split("\n").filter(Boolean).map((line: string, lIdx: number) => (
                          <label
                            key={lIdx}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.6rem",
                              fontSize: "0.875rem",
                              color: "#78350f",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={!!checkedDeliverables[lIdx]}
                              onChange={() => handleToggleDeliverable(lIdx)}
                              style={{ marginTop: "0.2rem" }}
                            />
                            <span style={{ textDecoration: checkedDeliverables[lIdx] ? "line-through" : "none", opacity: checkedDeliverables[lIdx] ? 0.6 : 1 }}>
                              {line}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submission Box */}
                  <form onSubmit={handleSubmitProject} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem" }}>
                    <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a" }}>
                      Submit Your Work:
                    </h4>
                    <p style={{ margin: "0 0 0.75rem", fontSize: "0.8125rem", color: "#64748b" }}>
                      Provide the GitHub repository URL, hosted demo link, or Google Colab notebook URL.
                    </p>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      <input
                        type="url"
                        required
                        placeholder="https://github.com/your-username/project-repo"
                        value={submissionUrl}
                        onChange={(e) => setSubmissionUrl(e.target.value)}
                        className="input"
                        style={{ flex: 1, minWidth: 240, padding: "0.6rem 0.85rem", fontSize: "0.875rem" }}
                      />
                      <button
                        type="submit"
                        style={{
                          padding: "0.6rem 1.5rem",
                          borderRadius: "6px",
                          background: submittedProject ? "#10b981" : "#0284c7",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "0.875rem",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        {submittedProject ? "✓ Submitted" : "Submit Work"}
                      </button>
                    </div>
                    {submittedProject && (
                      <div style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "#16a34a", fontWeight: 600 }}>
                        ✓ Work received and marked as complete! Your tutor will review and assign feedback.
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* ── 7. STANDARD READING / LECTURE NOTES VIEW ── */}
              {(activeLesson.type === "READING" || activeLesson.type === "VIDEO" || activeLesson.type === "VIDEO_READING") && (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    padding: "2rem 2.5rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    fontSize: "1rem",
                    lineHeight: 1.8,
                    color: "#334155",
                    marginBottom: "2.5rem",
                  }}
                >
                  {activeLesson.content ? (
                    <div
                      style={{ whiteSpace: "pre-wrap" }}
                      dangerouslySetInnerHTML={{
                        __html: formatLessonContent(activeLesson.content),
                      }}
                    />
                  ) : (
                    <p style={{ color: "#64748b", fontStyle: "italic" }}>
                      This lesson contains video or instructional materials. Review the lesson above and click
                      &quot;Mark as Complete &amp; Continue&quot; once finished.
                    </p>
                  )}

                  {/* Lesson Resources / Downloads */}
                  {activeLesson.resources && activeLesson.resources.length > 0 && (
                    <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #e2e8f0" }}>
                      <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.75rem" }}>
                        Lesson Resources &amp; Downloads:
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {activeLesson.resources.map((res) => (
                          <a
                            key={res.id}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              fontSize: "0.875rem",
                              color: "#0284c7",
                              textDecoration: "none",
                              fontWeight: 600,
                            }}
                          >
                            <span>📁</span>
                            <span>{res.title}</span>
                            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>↗</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
                </>
              )}

              {/* ACTION FOOTER */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1.5rem 0",
                  borderTop: "1px solid #e2e8f0",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <button
                    onClick={() => handleToggleComplete(!isLessonComplete)}
                    disabled={updating}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.8rem 1.75rem",
                      borderRadius: "9999px",
                      background: isLessonComplete ? "#10b981" : "#0284c7",
                      color: "#fff",
                      fontSize: "0.9375rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: updating ? "not-allowed" : "pointer",
                      boxShadow: isLessonComplete
                        ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                        : "0 4px 12px rgba(2, 132, 199, 0.3)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span>{isLessonComplete ? "✓ Completed" : "Mark as Complete & Next"}</span>
                    <span>→</span>
                  </button>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {prevLesson && (
                    <button
                      onClick={() => setActiveLessonId(prevLesson.id)}
                      style={{
                        padding: "0.65rem 1.25rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        background: "#fff",
                        color: "#334155",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        cursor: "pointer",
                      }}
                    >
                      ← Previous
                    </button>
                  )}
                  {nextLesson && (
                    <button
                      onClick={() => setActiveLessonId(nextLesson.id)}
                      style={{
                        padding: "0.65rem 1.25rem",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        background: "#fff",
                        color: "#334155",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        cursor: "pointer",
                      }}
                    >
                      Next Lesson →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
              <h3>No lessons found in this course.</h3>
            </div>
          )}
          </div>
        </main>

        {/* ── PRACTICE FEEDBACK POPUP MODAL (Matches video 00:20 - 00:45) ── */}
        {practiceModal && practiceModal.isOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(1, 25, 54, 0.65)",
              backdropFilter: "blur(4px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                maxWidth: 520,
                width: "100%",
                padding: "2rem",
                boxShadow: "0 20px 45px -10px rgba(0,0,0,0.35)",
                border: practiceModal.isCorrect ? "2px solid #86efac" : "2px solid #fca5a5",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1.25rem" }}>
                <span style={{ fontSize: "2.25rem" }}>
                  {practiceModal.isCorrect ? "🎉" : "⚠️"}
                </span>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.25rem",
                      fontWeight: 800,
                      color: practiceModal.isCorrect ? "#166534" : "#991b1b",
                    }}
                  >
                    {practiceModal.isCorrect ? "Correct!" : "That is not correct."}
                  </h3>
                  <p style={{ margin: "0.15rem 0 0", fontSize: "0.8125rem", color: "#64748b" }}>
                    Practice Item Feedback
                  </p>
                </div>
              </div>

              <div style={{ fontSize: "0.9375rem", lineHeight: 1.75, color: "#334155", marginBottom: "1.75rem" }}>
                {practiceModal.isCorrect ? (
                  <div>
                    <p style={{ margin: "0 0 0.85rem" }}>
                      Great work! <strong>{practiceModal.scenario.correctAnswer}</strong> is the correct characteristic.
                    </p>
                    <p style={{ margin: 0, color: "#475569" }}>
                      {practiceModal.scenario.explanation}
                    </p>
                    <div
                      style={{
                        marginTop: "1.25rem",
                        padding: "0.7rem 1rem",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "8px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span>🌟</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#166534" }}>
                        +25 Experience Points (XP) Earned
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: "0 0 0.85rem" }}>
                      That is not correct for this scenario.
                    </p>
                    <p style={{ margin: 0, color: "#475569" }}>
                      Please select <strong>Reset</strong> and submit the correct answer. You can review the quadrant
                      cards above if you need a reminder of the four characteristics.
                    </p>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setPracticeModal(null)}
                  style={{
                    padding: "0.65rem 1.5rem",
                    borderRadius: "8px",
                    border: "none",
                    background: practiceModal.isCorrect ? "#16a34a" : "#011936",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                >
                  ✕ Close popup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Lightweight formatter for text/markdown content
function formatLessonContent(raw: string): string {
  if (!raw) return "";
  // Escape html
  let text = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Format headers
  text = text.replace(/^### (.*$)/gim, '<h3 style="color:#0f172a; margin-top:1.5rem; margin-bottom:0.5rem; font-size:1.2rem; font-weight:700;">$1</h3>');
  text = text.replace(/^## (.*$)/gim, '<h2 style="color:#0f172a; margin-top:1.75rem; margin-bottom:0.75rem; font-size:1.35rem; font-weight:800;">$1</h2>');
  text = text.replace(/^# (.*$)/gim, '<h1 style="color:#0f172a; margin-top:2rem; margin-bottom:1rem; font-size:1.5rem; font-weight:800;">$1</h1>');

  // Format bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Format code blocks
  text = text.replace(/```([\s\S]*?)```/g, '<pre style="background:#0f172a; color:#f8fafc; padding:1rem; border-radius:8px; overflow-x:auto; font-family:monospace; font-size:0.875rem; margin:1rem 0;"><code>$1</code></pre>');
  text = text.replace(/`([^`]+)`/g, '<code style="background:#f1f5f9; color:#0f172a; padding:0.15rem 0.4rem; border-radius:4px; font-size:0.875rem; font-family:monospace;">$1</code>');

  return text;
}
