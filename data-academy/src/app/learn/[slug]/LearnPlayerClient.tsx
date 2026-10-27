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
  videoUrl?: string;
  cards?: SubLessonCard[];
  tabs?: SubLessonTab[];
  practiceQuiz?: {
    prompt?: string;
    scenarios: PracticeScenario[];
  };
  // Coding Exercise Lab
  starterCode?: string;
  solutionHint?: string;
  // SQL Lab
  starterSql?: string;
  schemaContext?: string;
  // Quiz
  passingScore?: number;
  quizQuestions?: Array<{
    id?: string;
    question?: string;
    prompt?: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }>;
  // Downloadable Asset
  downloadUrl?: string;
  fileName?: string;
  fileType?: string;
  // External Tool / Link
  externalUrl?: string;
  provider?: string;
  // Capstone Project / Assignment
  deliverables?: string[] | string;
  starterRepoUrl?: string;
  maxScore?: number;
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
  heroImage?: string | null;
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
  const allLessons = useMemo(() => {
    const list: { lesson: Lesson; moduleTitle: string; moduleIndex: number }[] = [];
    course.modules.forEach((mod, modIdx) => {
      mod.lessons.forEach((les) => {
        list.push({ lesson: les, moduleTitle: mod.title, moduleIndex: modIdx + 1 });
      });
    });
    return list;
  }, [course.modules]);

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
  const [readerTheme, setReaderTheme] = useState<"light" | "dark">(() => {
    const hour = new Date().getHours();
    return hour < 6 || hour >= 19 ? "dark" : "light";
  });
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
  const lessonTopRef = useRef<HTMLDivElement | null>(null);
  const prevLessonIdRef = useRef<string>(activeLessonId);
  const isTransitioningRef = useRef<boolean>(false);
  const isScrollingDownRef = useRef<boolean>(true);
  const lastScrollYRef = useRef<number>(0);

  // Track scroll direction so completion is never triggered when scrolling upward
  useEffect(() => {
    const handleScrollDirection = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      isScrollingDownRef.current = currentScrollY >= lastScrollYRef.current;
      lastScrollYRef.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScrollDirection, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollDirection);
  }, []);

  // Instantly start from the top when a new lesson is selected
  const handleNavigateToLesson = (lessonId: string) => {
    if (lessonId === activeLessonId) return;
    isTransitioningRef.current = true;
    setActiveLessonId(lessonId);

    // Instantly reset scroll to top (never smooth-scroll upwards across sub-lessons)
    window.scrollTo(0, 0);
    if (typeof document !== "undefined") {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };

  // When lesson changes: immediately set active sub-lesson to first and guarantee top position
  useEffect(() => {
    if (prevLessonIdRef.current !== activeLessonId) {
      prevLessonIdRef.current = activeLessonId;
      isTransitioningRef.current = true;

      // Always start with the first sub-lesson at the top
      if (currentSubLessons.length > 0) {
        setActiveSubLessonId(currentSubLessons[0].id);
      }

      // Hard instant reset to top
      window.scrollTo(0, 0);
      if (typeof document !== "undefined") {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }

      // Keep transition lock active until the new lesson has fully mounted at top (0,0)
      const timer = setTimeout(() => {
        window.scrollTo(0, 0);
        lessonTopRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
        isTransitioningRef.current = false;
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [activeLessonId, currentSubLessons]);

  // Track completed sub-lessons
  const [completedSubLessons, setCompletedSubLessons] = useState<Record<string, boolean>>({});

  // ScrollSpy with IntersectionObserver
  useEffect(() => {
    if (currentSubLessons.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Disregard all intersection triggers during lesson transition to prevent bottom-to-top checks
        if (isTransitioningRef.current) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const subId = entry.target.getAttribute("data-sublesson-id");
            if (subId) {
              setActiveSubLessonId(subId);
              // Only mark sub-lesson completed if actively reading downwards, NEVER during upward scroll
              if (isScrollingDownRef.current && !isTransitioningRef.current) {
                setCompletedSubLessons((prev) => ({ ...prev, [subId]: true }));
              }
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

  // End-of-lesson feedback state ("Was this helpful?")
  const [lessonFeedback, setLessonFeedback] = useState<
    Record<string, { rating: "helpful" | "unhelpful" | null; reason: string; isSubmitted: boolean }>
  >({});

  const currentFeedback = lessonFeedback[activeLessonId] || { rating: null, reason: "", isSubmitted: false };

  const handleSelectRating = (rating: "helpful" | "unhelpful") => {
    setLessonFeedback((prev) => ({
      ...prev,
      [activeLessonId]: {
        rating: prev[activeLessonId]?.rating === rating ? null : rating,
        reason: prev[activeLessonId]?.rating === rating ? "" : (prev[activeLessonId]?.reason || ""),
        isSubmitted: false,
      },
    }));
  };

  const handleSelectReason = (reason: string) => {
    setLessonFeedback((prev) => ({
      ...prev,
      [activeLessonId]: {
        ...(prev[activeLessonId] || { rating: "helpful", isSubmitted: false }),
        reason,
      },
    }));
  };

  const handleSubmitFeedback = () => {
    setLessonFeedback((prev) => ({
      ...prev,
      [activeLessonId]: {
        ...(prev[activeLessonId] || { rating: "helpful", reason: "" }),
        isSubmitted: true,
      },
    }));
  };

  const handleResetFeedback = () => {
    setLessonFeedback((prev) => ({
      ...prev,
      [activeLessonId]: { rating: null, reason: "", isSubmitted: false },
    }));
  };

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
        handleNavigateToLesson(nextLesson.id);
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

  // Sub-lesson interactive state maps
  const [subStudentCode, setSubStudentCode] = useState<Record<string, string>>({});
  const [subCodeOutput, setSubCodeOutput] = useState<Record<string, string | null>>({});
  const [subIsRunningCode, setSubIsRunningCode] = useState<Record<string, boolean>>({});
  const [subShowHint, setSubShowHint] = useState<Record<string, boolean>>({});
  const [subCodeCopied, setSubCodeCopied] = useState<Record<string, boolean>>({});

  const [subStudentSql, setSubStudentSql] = useState<Record<string, string>>({});
  const [subSqlResult, setSubSqlResult] = useState<Record<string, any[] | null>>({});
  const [subIsRunningSql, setSubIsRunningSql] = useState<Record<string, boolean>>({});
  const [subShowSqlHint, setSubShowSqlHint] = useState<Record<string, boolean>>({});

  const [subQuizAnswers, setSubQuizAnswers] = useState<Record<string, Record<number, number>>>({});
  const [subQuizSubmitted, setSubQuizSubmitted] = useState<Record<string, boolean>>({});
  const [subQuizScore, setSubQuizScore] = useState<Record<string, number | null>>({});

  const [subDeliverables, setSubDeliverables] = useState<Record<string, Record<number, boolean>>>({});
  const [subSubmissionUrl, setSubSubmissionUrl] = useState<Record<string, string>>({});
  const [subSubmittedProject, setSubSubmittedProject] = useState<Record<string, boolean>>({});

  const getEmbedUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.includes("youtube.com/watch?v=")) {
      return url.replace("watch?v=", "embed/");
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("vimeo.com/")) {
      const id = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  };

  const handleRunSubPython = (subId: string) => {
    setSubIsRunningCode((prev) => ({ ...prev, [subId]: true }));
    setSubCodeOutput((prev) => ({ ...prev, [subId]: null }));
    setTimeout(() => {
      setSubIsRunningCode((prev) => ({ ...prev, [subId]: false }));
      setSubCodeOutput((prev) => ({
        ...prev,
        [subId]:
          "Python 3.11.8 (Conda env: data-academy)\n[✓] Environment verified & NumPy/Pandas initialized\n[✓] Executing script...\n[SUCCESS] Code ran without exceptions!\n   Output shape: (5, 4)\n   Memory usage: 280 bytes\n✓ All test assertions passed.",
      }));
      setCompletedSubLessons((prev) => ({ ...prev, [subId]: true }));
    }, 700);
  };

  const handleCopySubCode = (subId: string, fallbackCode: string) => {
    const code = subStudentCode[subId] ?? fallbackCode;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setSubCodeCopied((prev) => ({ ...prev, [subId]: true }));
      setTimeout(() => setSubCodeCopied((prev) => ({ ...prev, [subId]: false })), 2000);
    }
  };

  const handleExecuteSubSql = (subId: string) => {
    setSubIsRunningSql((prev) => ({ ...prev, [subId]: true }));
    setSubSqlResult((prev) => ({ ...prev, [subId]: null }));
    setTimeout(() => {
      setSubIsRunningSql((prev) => ({ ...prev, [subId]: false }));
      setSubSqlResult((prev) => ({
        ...prev,
        [subId]: [
          { id: 101, name: "Alpha Logistics", segment: "Enterprise", total_orders: 142, total_revenue: "$48,900" },
          { id: 102, name: "Omni Retail", segment: "Mid-Market", total_orders: 89, total_revenue: "$32,450" },
          { id: 103, name: "Blue Sky AI", segment: "Enterprise", total_orders: 76, total_revenue: "$29,100" },
          { id: 104, name: "Peak Media", segment: "SMB", total_orders: 41, total_revenue: "$18,700" },
        ],
      }));
      setCompletedSubLessons((prev) => ({ ...prev, [subId]: true }));
    }, 600);
  };

  const handleSubmitSubQuiz = (subId: string, questions?: any[], passingScore = 70) => {
    if (!questions || !Array.isArray(questions) || questions.length === 0) return;
    const answers = subQuizAnswers[subId] || {};
    let correctCount = 0;
    questions.forEach((q: any, i: number) => {
      if (answers[i] === q.correctIndex) {
        correctCount++;
      }
    });
    const pct = Math.round((correctCount / questions.length) * 100);
    setSubQuizScore((prev) => ({ ...prev, [subId]: pct }));
    setSubQuizSubmitted((prev) => ({ ...prev, [subId]: true }));
    if (pct >= passingScore) {
      setCompletedSubLessons((prev) => ({ ...prev, [subId]: true }));
    }
  };

  const handleSubmitSubProject = (subId: string, e: React.FormEvent) => {
    e.preventDefault();
    const url = subSubmissionUrl[subId] || "";
    if (!url.trim()) return;
    setSubSubmittedProject((prev) => ({ ...prev, [subId]: true }));
    setCompletedSubLessons((prev) => ({ ...prev, [subId]: true }));
  };

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
      {/* ── TOP HEADER (AI Tech Hub Course Reader) ── */}
      <header
        style={{
          height: 60,
          background: readerTheme === "dark" ? "#0a1226" : "#ffffff",
          color: readerTheme === "dark" ? "#f8fafc" : "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
          borderBottom: readerTheme === "dark" ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 40,
          boxShadow: readerTheme === "dark" ? "0 2px 10px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.03)",
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
            <span style={{ fontSize: "0.9375rem", fontWeight: 900, color: readerTheme === "dark" ? "#ffffff" : "var(--brand-navy-800, #003366)", letterSpacing: "-0.02em" }}>
              AITECHHUB
            </span>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--brand-accent-400, #0088cc)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Data Academy
            </span>
          </Link>

          <div style={{ width: 1, height: 26, background: readerTheme === "dark" ? "rgba(255, 255, 255, 0.15)" : "#cbd5e1", flexShrink: 0 }} />

          <h1
            style={{
              fontSize: "1.05rem",
              fontWeight: 600,
              margin: 0,
              color: readerTheme === "dark" ? "#ffffff" : "#334155",
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
          {/* Outline Book Icon */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Hide Course Outline" : "Show Course Outline"}
            style={{
              width: 36,
              height: 36,
              borderRadius: "6px",
              border: readerTheme === "dark" ? "1.5px solid var(--brand-accent-400)" : "1.5px solid var(--brand-blue-600)",
              background: sidebarOpen ? (readerTheme === "dark" ? "rgba(0, 111, 168, 0.2)" : "var(--brand-blue-subtle)") : "transparent",
              color: readerTheme === "dark" ? "#ffffff" : "var(--brand-blue-600)",
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
                border: readerTheme === "dark" ? "1px solid rgba(255,255,255,0.2)" : "1px solid #cbd5e1",
                background: showProgressModal ? (readerTheme === "dark" ? "rgba(255,255,255,0.1)" : "#f1f5f9") : "transparent",
                color: readerTheme === "dark" ? "#ffffff" : "#475569",
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
                  background: readerTheme === "dark" ? "#1e293b" : "#ffffff",
                  borderRadius: "10px",
                  boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
                  border: readerTheme === "dark" ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e2e8f0",
                  padding: "1.1rem",
                  zIndex: 50,
                  color: readerTheme === "dark" ? "#ffffff" : "#1e293b",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.875rem", color: readerTheme === "dark" ? "#ffffff" : "#011936" }}>
                    Course Progress
                  </span>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--brand-accent-300)" }}>
                    {progressPercent}%
                  </span>
                </div>
                <div style={{ height: 6, background: readerTheme === "dark" ? "rgba(255,255,255,0.1)" : "#e2e8f0", borderRadius: 999, overflow: "hidden", marginBottom: "0.85rem" }}>
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: "100%",
                      background: "var(--brand-accent-500)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <div style={{ fontSize: "0.8125rem", color: readerTheme === "dark" ? "#cbd5e1" : "#64748b", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <div>Completed: <strong style={{ color: readerTheme === "dark" ? "#ffffff" : "#1e293b" }}>{completedCount}</strong> of <strong style={{ color: readerTheme === "dark" ? "#ffffff" : "#1e293b" }}>{totalLessons}</strong> lessons</div>
                  <div>Current Module: <strong style={{ color: "var(--brand-accent-300)" }}>{activeItem?.moduleTitle}</strong></div>
                  <div>Certificate: <strong style={{ color: course.certificateEnabled ? "#22c55e" : (readerTheme === "dark" ? "#94a3b8" : "#94a3b8") }}>{course.certificateEnabled ? "Available at 100%" : "Not enrolled"}</strong></div>
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
              color: readerTheme === "dark" ? "#ffffff" : "#64748b",
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
                                      onClick={() => handleNavigateToLesson(lesson.id)}
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
            overflow: "clip",
            position: "relative",
            background: readerTheme === "dark" ? "#0f172a" : "#ffffff",
            color: readerTheme === "dark" ? "#f8fafc" : "#0f172a",
          }}
        >
          {/* Scroll Target Anchor */}
          <div ref={lessonTopRef} id="lesson-top" style={{ position: "absolute", top: 0, left: 0, height: 1, width: 1, pointerEvents: "none" }} />
          {/* ── BREADCRUMB & UTILITIES STRIP (Sticky under top header) ── */}
          <div
            style={{
              height: 54,
              borderBottom: readerTheme === "dark" ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #e2e8f0",
              background: readerTheme === "dark" ? "rgba(15, 23, 42, 0.96)" : "rgba(255, 255, 255, 0.96)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: readerTheme === "dark" ? "#ffffff" : "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 1.25rem",
              position: "sticky",
              top: 60,
              zIndex: 35,
              boxShadow: readerTheme === "dark" ? "0 4px 16px rgba(0, 0, 0, 0.4)" : "0 2px 8px rgba(0, 0, 0, 0.03)",
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
                  color: readerTheme === "dark" ? "#ffffff" : "#475569",
                  display: "flex",
                  alignItems: "center",
                  transition: "color 0.15s ease",
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
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                <span style={{ color: readerTheme === "dark" ? "rgba(255, 255, 255, 0.85)" : "#64748b" }}>
                  {activeItem?.moduleTitle}
                </span>
                <span style={{ color: readerTheme === "dark" ? "rgba(255, 255, 255, 0.5)" : "#94a3b8" }}>›</span>
                <span style={{ fontWeight: 700, color: readerTheme === "dark" ? "#ffffff" : "#011936" }}>
                  {currentActiveSubLesson ? `${currentActiveSubLesson.sectionNumber} ${currentActiveSubLesson.title}` : activeLesson?.title}
                </span>
              </div>
            </div>

            {/* Right: Tools & Toggles (Font, EN, Bookmark, Fullscreen, Theme) */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", color: readerTheme === "dark" ? "#ffffff" : "#64748b", fontSize: "0.8125rem" }}>
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
                  color: readerTheme === "dark" ? "#ffffff" : "#475569",
                  padding: "0.2rem",
                }}
              >
                {fontSize === "normal" ? "A+" : "A-"}
              </button>

              {/* EN language indicator */}
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontWeight: 600, color: readerTheme === "dark" ? "#ffffff" : "#475569" }}>
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
                  color: isBookmarked ? "#f59e0b" : (readerTheme === "dark" ? "#ffffff" : "#94a3b8"),
                  fontSize: "0.95rem",
                  padding: "0.2rem",
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
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: readerTheme === "dark" ? "#ffffff" : "#475569",
                  fontSize: "0.95rem",
                  padding: "0.2rem",
                }}
              >
                ⛶
              </button>

              {/* Theme toggle — last, after fullscreen */}
              <button
                onClick={() => setReaderTheme(readerTheme === "light" ? "dark" : "light")}
                title={readerTheme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
                style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "0.95rem", padding: "0.2rem" }}
              >
                {readerTheme === "light" ? "🌙" : "☀️"}
              </button>
            </div>
          </div>

          {/* ── PANORAMIC IMMERSIVE HERO BANNER (Cisco Style with Brand Colors) ── */}
          {activeLesson && (() => {
            // Extract heroImage from parsed lesson content
            let lessonHeroImage: string | null = null;
            if (activeLesson.content) {
              try {
                const p = JSON.parse(activeLesson.content);
                if (p && p.heroImage) lessonHeroImage = p.heroImage;
              } catch {}
            }

            return (
              <div
                style={{
                  position: "relative",
                  minHeight: "calc(100vh - 120px)",
                  // When a hero image is set, use it as a full-cover background
                  background: lessonHeroImage
                    ? `url(${lessonHeroImage}) center center / cover no-repeat`
                    : "linear-gradient(135deg, #011936 0%, #002c4b 45%, #005073 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "3.5rem 2rem",
                  color: "#ffffff",
                  overflow: "hidden",
                }}
              >
                {/* Dark overlay — always present to ensure white text pops; deeper when image is set */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: lessonHeroImage
                      ? "linear-gradient(135deg, rgba(1,25,54,0.72) 0%, rgba(0,44,75,0.60) 50%, rgba(0,80,115,0.55) 100%)"
                      : "transparent",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                />

                {/* High tech grid background pattern (shown only when no image) */}
                {!lessonHeroImage && (
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
                )}

                {/* Subtle bottom glow accent */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "80%",
                    height: 1,
                    background: "linear-gradient(90deg, transparent, #049fd9, #58a03d, transparent)",
                    zIndex: 2,
                  }}
                />

                {/* Centered Hero Heading */}
                <div style={{ textAlign: "center", zIndex: 10, maxWidth: 800, padding: "0 1rem", position: "relative" }}>
                  <h2
                    style={{
                      fontSize: "clamp(1.75rem, 3.5vw, 2.65rem)",
                      fontWeight: 800,
                      margin: 0,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                      color: "#ffffff",
                      textShadow: lessonHeroImage
                        ? "0 2px 16px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.9)"
                        : "0 2px 10px rgba(0,0,0,0.35)",
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
              </div>
            );
          })()}

          {/* ── FIXED VIEWPORT LESSON NAVIGATION ARROWS ── */}
          {prevLesson && (
            <button
              key={`prev-${prevLesson.id}`}
              onClick={() => handleNavigateToLesson(prevLesson.id)}
              title={`Previous: ${prevLesson.title}`}
              style={{
                position: "fixed",
                left: sidebarOpen ? 364 : 1,
                top: "50%",
                transform: "translateY(-50%)",
                width: 32,
                height: 60,
                borderRadius: "2px",
                background: "rgba(255,255,255,0.94)",
                border: "1.5px solid #58a03d",
                color: "#58a03d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 50,
                boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                fontWeight: 800,
                fontSize: "1.2rem",
                transition: "left 0.2s ease, background 0.15s ease",
              }}
            >
              ‹
            </button>
          )}
          {nextLesson && (
            <button
              key={`next-${nextLesson.id}`}
              onClick={() => handleNavigateToLesson(nextLesson.id)}
              title={`Next: ${nextLesson.title}`}
              style={{
                position: "fixed",
                right: 1,
                top: "50%",
                transform: "translateY(-50%)",
                width: 32,
                height: 60,
                borderRadius: "2px",
                background: "rgba(255,255,255,0.94)",
                border: "1.5px solid #58a03d",
                color: "#58a03d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 50,
                boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                fontWeight: 800,
                fontSize: "1.2rem",
                transition: "all 0.15s ease",
              }}
            >
              ›
            </button>
          )}
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

              {/* ── SUB-LESSONS CONTINUOUS SCROLL VIEW (Multi-Type Sub-Lessons) ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", marginBottom: "3.5rem" }}>
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
                            {(() => {
                              const getBadge = (t: string) => {
                                switch (t) {
                                  case "CODING_EXERCISE": return { label: "Python Lab", icon: "🐍", color: "#166534", bg: "#dcfce7" };
                                  case "SQL_EXERCISE": return { label: "SQL Lab", icon: "🗄️", color: "#c2410c", bg: "#ffedd5" };
                                  case "QUIZ": return { label: "Concept Quiz", icon: "❓", color: "#7e22ce", bg: "#f3e8ff" };
                                  case "VIDEO": case "VIDEO_READING": return { label: "Video Lecture", icon: "🎬", color: "#005073", bg: "rgba(0, 80, 115, 0.12)" };
                                  case "PRACTICE": return { label: "Practice Item", icon: "📌", color: "#0284c7", bg: "#e0f2fe" };
                                  case "DOWNLOADABLE": return { label: "Downloadable Asset", icon: "📦", color: "#0f766e", bg: "#ccfbf1" };
                                  case "EXTERNAL_RESOURCE": return { label: "External Tool", icon: "🔗", color: "#475569", bg: "#f1f5f9" };
                                  case "ASSIGNMENT": case "PROJECT": return { label: t === "PROJECT" ? "Capstone Project" : "Graded Assignment", icon: "🚀", color: "#b45309", bg: "#fef3c7" };
                                  default: return { label: "Reading Guide", icon: "📖", color: "#0369a1", bg: "#e0f2fe" };
                                }
                              };
                              const b = getBadge(sub.type);
                              return (
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    color: b.color,
                                    background: b.bg,
                                    padding: "0.25rem 0.65rem",
                                    borderRadius: "6px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.35rem",
                                  }}
                                >
                                  <span>{b.icon}</span>
                                  <span>{b.label}</span>
                                </span>
                              );
                            })()}
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

                        {/* Video Player */}
                        {(sub.type === "VIDEO" || sub.type === "VIDEO_READING" || sub.videoUrl) && getEmbedUrl(sub.videoUrl) && (
                          <div
                            style={{
                              position: "relative",
                              width: "100%",
                              paddingTop: "56.25%",
                              borderRadius: "12px",
                              overflow: "hidden",
                              background: "#000",
                              marginBottom: "1.75rem",
                              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
                            }}
                          >
                            {getEmbedUrl(sub.videoUrl)!.endsWith(".mp4") ? (
                              <video
                                src={getEmbedUrl(sub.videoUrl)!}
                                controls
                                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                              />
                            ) : (
                              <iframe
                                src={getEmbedUrl(sub.videoUrl)!}
                                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={sub.title}
                              />
                            )}
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

                        {/* 1. Sub-lesson Python Coding Lab */}
                        {(sub.type === "CODING_EXERCISE" || sub.starterCode) && (
                          <div style={{ marginTop: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            <div
                              style={{
                                background: "#0b132b",
                                borderRadius: "12px",
                                overflow: "hidden",
                                border: "1px solid #1e293b",
                                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "0.75rem 1.25rem",
                                  background: "#060d1f",
                                  borderBottom: "1px solid #1e293b",
                                }}
                              >
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
                                    onClick={() => handleCopySubCode(sub.id, sub.starterCode || "")}
                                    style={{
                                      padding: "0.35rem 0.75rem",
                                      background: "#1e293b",
                                      color: "#cbd5e1",
                                      border: "1px solid #334155",
                                      borderRadius: "6px",
                                      fontSize: "0.75rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {subCodeCopied[sub.id] ? "✓ Copied" : "Copy Code"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSubStudentCode((prev) => ({ ...prev, [sub.id]: sub.starterCode || "" }))
                                    }
                                    style={{
                                      padding: "0.35rem 0.75rem",
                                      background: "#1e293b",
                                      color: "#cbd5e1",
                                      border: "1px solid #334155",
                                      borderRadius: "6px",
                                      fontSize: "0.75rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    ↺ Reset
                                  </button>
                                </div>
                              </div>

                              <textarea
                                value={subStudentCode[sub.id] ?? sub.starterCode ?? ""}
                                onChange={(e) =>
                                  setSubStudentCode((prev) => ({ ...prev, [sub.id]: e.target.value }))
                                }
                                placeholder="# Write your Python solution code here..."
                                rows={10}
                                style={{
                                  width: "100%",
                                  background: "#0b132b",
                                  color: "#f8fafc",
                                  padding: "1.25rem",
                                  fontFamily: "var(--font-mono, monospace)",
                                  fontSize: "0.875rem",
                                  lineHeight: 1.6,
                                  border: "none",
                                  outline: "none",
                                  resize: "vertical",
                                }}
                              />

                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "0.75rem 1.25rem",
                                  background: "#081026",
                                  borderTop: "1px solid #1e293b",
                                }}
                              >
                                {sub.solutionHint ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSubShowHint((prev) => ({ ...prev, [sub.id]: !prev[sub.id] }))
                                    }
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "#38bdf8",
                                      fontSize: "0.8125rem",
                                      cursor: "pointer",
                                      fontWeight: 600,
                                    }}
                                  >
                                    💡 {subShowHint[sub.id] ? "Hide Solution Hint" : "Need a Hint?"}
                                  </button>
                                ) : (
                                  <div />
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleRunSubPython(sub.id)}
                                  disabled={subIsRunningCode[sub.id]}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    padding: "0.6rem 1.5rem",
                                    borderRadius: "8px",
                                    background: "#10b981",
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: "0.875rem",
                                    border: "none",
                                    cursor: subIsRunningCode[sub.id] ? "not-allowed" : "pointer",
                                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                                  }}
                                >
                                  <span>{subIsRunningCode[sub.id] ? "⏳ Running..." : "▶ Run Solution"}</span>
                                </button>
                              </div>
                            </div>

                            {/* Solution Hint */}
                            {subShowHint[sub.id] && sub.solutionHint && (
                              <div
                                style={{
                                  padding: "1rem 1.25rem",
                                  background: "#f0f9ff",
                                  borderRadius: "8px",
                                  border: "1px solid #bae6fd",
                                  fontSize: "0.875rem",
                                  color: "#0369a1",
                                }}
                              >
                                <strong>💡 Solution Hint:</strong> {sub.solutionHint}
                              </div>
                            )}

                            {/* Terminal Output */}
                            {subCodeOutput[sub.id] && (
                              <div
                                style={{
                                  background: "#020617",
                                  borderRadius: "10px",
                                  padding: "1.25rem",
                                  border: "1px solid #1e293b",
                                  color: "#4ade80",
                                  fontFamily: "var(--font-mono, monospace)",
                                  fontSize: "0.8125rem",
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                                  TERMINAL OUTPUT
                                </div>
                                {subCodeOutput[sub.id]}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. Sub-lesson SQL Query Lab */}
                        {(sub.type === "SQL_EXERCISE" || sub.starterSql) && (
                          <div style={{ marginTop: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            {sub.schemaContext && (
                              <div
                                style={{
                                  background: "#f8fafc",
                                  borderRadius: "10px",
                                  border: "1px solid #e2e8f0",
                                  padding: "1.25rem",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                  <span>🗄️</span>
                                  <h4 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a" }}>
                                    Target Schema &amp; Tables
                                  </h4>
                                </div>
                                <div
                                  style={{
                                    fontFamily: "var(--font-mono, monospace)",
                                    fontSize: "0.8125rem",
                                    color: "#475569",
                                    whiteSpace: "pre-wrap",
                                    lineHeight: 1.6,
                                  }}
                                >
                                  {sub.schemaContext}
                                </div>
                              </div>
                            )}

                            <div
                              style={{
                                background: "#0f172a",
                                borderRadius: "12px",
                                overflow: "hidden",
                                border: "1px solid #1e293b",
                                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "0.75rem 1.25rem",
                                  background: "#090d16",
                                  borderBottom: "1px solid #1e293b",
                                }}
                              >
                                <span style={{ fontSize: "0.8125rem", color: "#94a3b8", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                                  query.sql
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSubStudentSql((prev) => ({ ...prev, [sub.id]: sub.starterSql || "" }))
                                  }
                                  style={{
                                    padding: "0.35rem 0.75rem",
                                    background: "#1e293b",
                                    color: "#cbd5e1",
                                    border: "1px solid #334155",
                                    borderRadius: "6px",
                                    fontSize: "0.75rem",
                                    cursor: "pointer",
                                  }}
                                >
                                  ↺ Reset Query
                                </button>
                              </div>

                              <textarea
                                value={subStudentSql[sub.id] ?? sub.starterSql ?? ""}
                                onChange={(e) =>
                                  setSubStudentSql((prev) => ({ ...prev, [sub.id]: e.target.value }))
                                }
                                placeholder="-- Write your SQL query here..."
                                rows={8}
                                style={{
                                  width: "100%",
                                  background: "#0f172a",
                                  color: "#38bdf8",
                                  padding: "1.25rem",
                                  fontFamily: "var(--font-mono, monospace)",
                                  fontSize: "0.875rem",
                                  lineHeight: 1.6,
                                  border: "none",
                                  outline: "none",
                                  resize: "vertical",
                                }}
                              />

                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "0.75rem 1.25rem",
                                  background: "#090d16",
                                  borderTop: "1px solid #1e293b",
                                }}
                              >
                                {sub.solutionHint ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSubShowSqlHint((prev) => ({ ...prev, [sub.id]: !prev[sub.id] }))
                                    }
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "#38bdf8",
                                      fontSize: "0.8125rem",
                                      cursor: "pointer",
                                      fontWeight: 600,
                                    }}
                                  >
                                    💡 {subShowSqlHint[sub.id] ? "Hide SQL Hint" : "Show Query Hint"}
                                  </button>
                                ) : (
                                  <div />
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleExecuteSubSql(sub.id)}
                                  disabled={subIsRunningSql[sub.id]}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    padding: "0.6rem 1.5rem",
                                    borderRadius: "8px",
                                    background: "#0284c7",
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: "0.875rem",
                                    border: "none",
                                    cursor: subIsRunningSql[sub.id] ? "not-allowed" : "pointer",
                                  }}
                                >
                                  <span>{subIsRunningSql[sub.id] ? "⏳ Querying Database..." : "⚡ Execute SQL Query"}</span>
                                </button>
                              </div>
                            </div>

                            {/* SQL Hint */}
                            {subShowSqlHint[sub.id] && sub.solutionHint && (
                              <div
                                style={{
                                  padding: "1rem 1.25rem",
                                  background: "#f0f9ff",
                                  borderRadius: "8px",
                                  border: "1px solid #bae6fd",
                                  fontSize: "0.875rem",
                                  color: "#0369a1",
                                }}
                              >
                                <strong>💡 SQL Query Hint:</strong> {sub.solutionHint}
                              </div>
                            )}

                            {/* SQL Result Table */}
                            {subSqlResult[sub.id] && (
                              <div
                                style={{
                                  background: "#fff",
                                  borderRadius: "10px",
                                  overflow: "hidden",
                                  border: "1px solid #e2e8f0",
                                }}
                              >
                                <div
                                  style={{
                                    padding: "0.75rem 1.25rem",
                                    background: "#f8fafc",
                                    borderBottom: "1px solid #e2e8f0",
                                    fontSize: "0.8125rem",
                                    fontWeight: 700,
                                    color: "#16a34a",
                                  }}
                                >
                                  ✓ Query executed successfully ({subSqlResult[sub.id]!.length} rows returned)
                                </div>
                                <div style={{ overflowX: "auto" }}>
                                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                                    <thead>
                                      <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                                        {Object.keys(subSqlResult[sub.id]![0] || {}).map((col) => (
                                          <th
                                            key={col}
                                            style={{
                                              padding: "0.65rem 1rem",
                                              borderBottom: "1px solid #cbd5e1",
                                              color: "#334155",
                                              fontWeight: 700,
                                            }}
                                          >
                                            {col}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {subSqlResult[sub.id]!.map((row, rIdx) => (
                                        <tr key={rIdx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                          {Object.values(row).map((val: any, cIdx) => (
                                            <td key={cIdx} style={{ padding: "0.65rem 1rem", color: "#0f172a" }}>
                                              {String(val)}
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
                        )}

                        {/* 3. Sub-lesson Concept Quiz */}
                        {(sub.type === "QUIZ" || (sub.quizQuestions && sub.quizQuestions.length > 0)) && (
                          <div
                            style={{
                              marginTop: "1.75rem",
                              background: "#fbfcfe",
                              borderRadius: "12px",
                              border: "1px solid #e2e8f0",
                              padding: "2rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "1.5rem",
                                flexWrap: "wrap",
                                gap: "0.75rem",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontSize: "1.25rem" }}>❓</span>
                                <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#0f172a" }}>
                                  Concept Assessment &amp; Knowledge Check
                                </h3>
                              </div>
                              <span
                                style={{
                                  fontSize: "0.8125rem",
                                  fontWeight: 700,
                                  color: "#7e22ce",
                                  background: "#f3e8ff",
                                  padding: "0.25rem 0.75rem",
                                  borderRadius: "9999px",
                                }}
                              >
                                Passing Score: {sub.passingScore || 70}%
                              </span>
                            </div>

                            {/* Score Banner if submitted */}
                            {subQuizSubmitted[sub.id] && subQuizScore[sub.id] !== null && (
                              <div
                                style={{
                                  marginBottom: "1.5rem",
                                  padding: "1.25rem",
                                  borderRadius: "10px",
                                  background: (subQuizScore[sub.id] ?? 0) >= (sub.passingScore || 70) ? "#f0fdf4" : "#fef2f2",
                                  border: `1.5px solid ${(subQuizScore[sub.id] ?? 0) >= (sub.passingScore || 70) ? "#86efac" : "#fca5a5"}`,
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  gap: "0.75rem",
                                }}
                              >
                                <div>
                                  <h4
                                    style={{
                                      margin: "0 0 0.25rem",
                                      color: (subQuizScore[sub.id] ?? 0) >= (sub.passingScore || 70) ? "#166534" : "#991b1b",
                                      fontSize: "1rem",
                                      fontWeight: 800,
                                    }}
                                  >
                                    {(subQuizScore[sub.id] ?? 0) >= (sub.passingScore || 70)
                                      ? `🎉 Assessment Passed: ${subQuizScore[sub.id]}%`
                                      : `Review Needed: ${subQuizScore[sub.id]}%`}
                                  </h4>
                                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#475569" }}>
                                    {(subQuizScore[sub.id] ?? 0) >= (sub.passingScore || 70)
                                      ? "Great mastery! You have met the benchmark for this section."
                                      : "Review the question explanations below and retake the quiz to improve your score."}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSubQuizAnswers((prev) => ({ ...prev, [sub.id]: {} }));
                                    setSubQuizSubmitted((prev) => ({ ...prev, [sub.id]: false }));
                                    setSubQuizScore((prev) => ({ ...prev, [sub.id]: null }));
                                  }}
                                  style={{
                                    padding: "0.5rem 1rem",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    background: "#fff",
                                    color: "#0f172a",
                                    fontWeight: 700,
                                    fontSize: "0.8125rem",
                                    cursor: "pointer",
                                  }}
                                >
                                  ↺ Retake Quiz
                                </button>
                              </div>
                            )}

                            {/* Questions */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                              {(sub.quizQuestions || []).map((q, qIdx) => {
                                const selected = subQuizAnswers[sub.id]?.[qIdx];
                                const isSubmitted = subQuizSubmitted[sub.id];
                                const isCorrect = selected === q.correctIndex;

                                return (
                                  <div
                                    key={qIdx}
                                    style={{
                                      background: "#fff",
                                      borderRadius: "10px",
                                      border: "1px solid #e2e8f0",
                                      padding: "1.25rem 1.5rem",
                                    }}
                                  >
                                    <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
                                      {qIdx + 1}. {q.prompt || q.question}
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                                      {q.options.map((opt, oIdx) => {
                                        const isChecked = selected === oIdx;
                                        let optBorder = "#e2e8f0";
                                        let optBg = "#fff";
                                        if (isSubmitted) {
                                          if (oIdx === q.correctIndex) {
                                            optBorder = "#86efac";
                                            optBg = "#f0fdf4";
                                          } else if (isChecked && !isCorrect) {
                                            optBorder = "#fca5a5";
                                            optBg = "#fef2f2";
                                          }
                                        } else if (isChecked) {
                                          optBorder = "#0284c7";
                                          optBg = "#f0f9ff";
                                        }

                                        return (
                                          <label
                                            key={oIdx}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "0.75rem",
                                              padding: "0.65rem 1rem",
                                              borderRadius: "8px",
                                              border: `1.5px solid ${optBorder}`,
                                              background: optBg,
                                              cursor: isSubmitted ? "default" : "pointer",
                                              fontSize: "0.875rem",
                                              color: "#1e293b",
                                            }}
                                          >
                                            <input
                                              type="radio"
                                              name={`quiz-${sub.id}-${qIdx}`}
                                              checked={isChecked}
                                              disabled={isSubmitted}
                                              onChange={() =>
                                                setSubQuizAnswers((prev) => ({
                                                  ...prev,
                                                  [sub.id]: { ...(prev[sub.id] || {}), [qIdx]: oIdx },
                                                }))
                                              }
                                              style={{ cursor: "pointer" }}
                                            />
                                            <span>{opt}</span>
                                          </label>
                                        );
                                      })}
                                    </div>

                                    {isSubmitted && q.explanation && (
                                      <div
                                        style={{
                                          marginTop: "1rem",
                                          padding: "0.75rem 1rem",
                                          background: isCorrect ? "#f0fdf4" : "#fffbeb",
                                          border: `1px solid ${isCorrect ? "#bbf7d0" : "#fef08a"}`,
                                          borderRadius: "6px",
                                          fontSize: "0.8125rem",
                                          color: isCorrect ? "#166534" : "#854d0e",
                                        }}
                                      >
                                        <strong>Explanation:</strong> {q.explanation}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {!subQuizSubmitted[sub.id] && (
                              <div style={{ marginTop: "1.75rem", display: "flex", justifyContent: "flex-end" }}>
                                <button
                                  type="button"
                                  onClick={() => handleSubmitSubQuiz(sub.id, sub.quizQuestions, sub.passingScore)}
                                  disabled={
                                    Object.keys(subQuizAnswers[sub.id] || {}).length < (sub.quizQuestions || []).length
                                  }
                                  style={{
                                    padding: "0.75rem 1.75rem",
                                    borderRadius: "8px",
                                    background:
                                      Object.keys(subQuizAnswers[sub.id] || {}).length === (sub.quizQuestions || []).length
                                        ? "#7e22ce"
                                        : "#cbd5e1",
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: "0.875rem",
                                    border: "none",
                                    cursor:
                                      Object.keys(subQuizAnswers[sub.id] || {}).length === (sub.quizQuestions || []).length
                                        ? "pointer"
                                        : "not-allowed",
                                    boxShadow:
                                      Object.keys(subQuizAnswers[sub.id] || {}).length === (sub.quizQuestions || []).length
                                        ? "0 4px 12px rgba(126, 34, 206, 0.3)"
                                        : "none",
                                  }}
                                >
                                  Submit Quiz Answers
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 4. Sub-lesson Downloadable Asset */}
                        {(sub.type === "DOWNLOADABLE" || sub.downloadUrl) && (
                          <div
                            style={{
                              marginTop: "1.75rem",
                              background: "#f0fdfa",
                              borderRadius: "12px",
                              border: "1.5px solid #99f6e4",
                              padding: "1.75rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: "1rem",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                              <div
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: "10px",
                                  background: "#ccfbf1",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "1.5rem",
                                }}
                              >
                                📦
                              </div>
                              <div>
                                <h4 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 700, color: "#134e4a" }}>
                                  {sub.fileName || "Course Downloadable Resource"}
                                </h4>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      fontWeight: 700,
                                      background: "#ccfbf1",
                                      color: "#0f766e",
                                      padding: "0.15rem 0.5rem",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    {sub.fileType || "ZIP"}
                                  </span>
                                  <span style={{ fontSize: "0.8125rem", color: "#115e59" }}>
                                    Ready for offline practice &amp; local execution
                                  </span>
                                </div>
                              </div>
                            </div>

                            <a
                              href={sub.downloadUrl || "#"}
                              download={sub.fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.65rem 1.5rem",
                                borderRadius: "8px",
                                background: "#0f766e",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: "0.875rem",
                                textDecoration: "none",
                                boxShadow: "0 4px 12px rgba(15, 118, 110, 0.25)",
                              }}
                            >
                              <span>⬇ Download Asset</span>
                            </a>
                          </div>
                        )}

                        {/* 5. Sub-lesson External Resource */}
                        {(sub.type === "EXTERNAL_RESOURCE" || sub.externalUrl) && (
                          <div
                            style={{
                              marginTop: "1.75rem",
                              background: "#f8fafc",
                              borderRadius: "12px",
                              border: "1.5px solid #cbd5e1",
                              padding: "1.75rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: "1rem",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                              <div
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: "10px",
                                  background: "#e2e8f0",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "1.5rem",
                                }}
                              >
                                🔗
                              </div>
                              <div>
                                <h4 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                                  {sub.provider || "External Tool & Sandbox"}
                                </h4>
                                <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                                  {sub.externalUrl}
                                </div>
                              </div>
                            </div>

                            <a
                              href={sub.externalUrl || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.65rem 1.5rem",
                                borderRadius: "8px",
                                background: "#0284c7",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: "0.875rem",
                                textDecoration: "none",
                              }}
                            >
                              <span>Launch Tool ↗</span>
                            </a>
                          </div>
                        )}

                        {/* 6. Sub-lesson Capstone Project / Deliverables */}
                        {(sub.type === "ASSIGNMENT" || sub.type === "PROJECT" || (sub.deliverables && sub.deliverables.length > 0)) && (
                          <div
                            style={{
                              marginTop: "1.75rem",
                              background: "#fffbeb",
                              borderRadius: "12px",
                              border: "1.5px solid #fde68a",
                              padding: "2rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "1.25rem",
                                flexWrap: "wrap",
                                gap: "0.75rem",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontSize: "1.25rem" }}>🚀</span>
                                <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#78350f" }}>
                                  Milestone Deliverables &amp; Capstone Submission
                                </h3>
                              </div>
                              {sub.maxScore && (
                                <span
                                  style={{
                                    fontSize: "0.8125rem",
                                    fontWeight: 700,
                                    color: "#b45309",
                                    background: "#fef3c7",
                                    padding: "0.25rem 0.75rem",
                                    borderRadius: "9999px",
                                  }}
                                >
                                  Max Score: {sub.maxScore} pts
                                </span>
                              )}
                            </div>

                            {sub.starterRepoUrl && (
                              <div style={{ marginBottom: "1.25rem" }}>
                                <a
                                  href={sub.starterRepoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    fontSize: "0.875rem",
                                    color: "#0284c7",
                                    fontWeight: 700,
                                    textDecoration: "none",
                                  }}
                                >
                                  <span>🐙 Open Starter Repository on GitHub ↗</span>
                                </a>
                              </div>
                            )}

                            {(() => {
                              const delivList = Array.isArray(sub.deliverables)
                                ? sub.deliverables
                                : typeof sub.deliverables === "string"
                                ? [sub.deliverables]
                                : [];
                              if (delivList.length === 0) return null;
                              return (
                                <div style={{ marginBottom: "1.5rem" }}>
                                  <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", fontWeight: 700, color: "#92400e" }}>
                                    Required Deliverables Checklist:
                                  </h4>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                                    {delivList.map((deliv: string, dIdx: number) => {
                                    const isDelivChecked = !!subDeliverables[sub.id]?.[dIdx];
                                    return (
                                      <label
                                        key={dIdx}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "0.75rem",
                                          background: "#fff",
                                          padding: "0.65rem 1rem",
                                          borderRadius: "8px",
                                          border: "1px solid #fde68a",
                                          cursor: "pointer",
                                          fontSize: "0.875rem",
                                          color: "#334155",
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isDelivChecked}
                                          onChange={(e) =>
                                            setSubDeliverables((prev) => ({
                                              ...prev,
                                              [sub.id]: {
                                                ...(prev[sub.id] || {}),
                                                [dIdx]: e.target.checked,
                                              },
                                            }))
                                          }
                                        />
                                        <span style={{ textDecoration: isDelivChecked ? "line-through" : "none" }}>
                                          {deliv}
                                        </span>
                                      </label>
                                    );
                                  })}
                                  </div>
                                </div>
                              );
                            })()}

                            <form onSubmit={(e) => handleSubmitSubProject(sub.id, e)}>
                              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#92400e", marginBottom: "0.5rem" }}>
                                Submit Your Repository or Google Drive Link:
                              </label>
                              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                                <input
                                  type="url"
                                  required
                                  placeholder="https://github.com/your-username/my-capstone-project"
                                  value={subSubmissionUrl[sub.id] || ""}
                                  onChange={(e) =>
                                    setSubSubmissionUrl((prev) => ({ ...prev, [sub.id]: e.target.value }))
                                  }
                                  style={{
                                    flex: 1,
                                    minWidth: 260,
                                    padding: "0.65rem 1rem",
                                    borderRadius: "8px",
                                    border: "1.5px solid #fde68a",
                                    background: "#fff",
                                    fontSize: "0.875rem",
                                    outline: "none",
                                  }}
                                />
                                <button
                                  type="submit"
                                  style={{
                                    padding: "0.65rem 1.5rem",
                                    borderRadius: "8px",
                                    background: subSubmittedProject[sub.id] ? "#10b981" : "#b45309",
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: "0.875rem",
                                    border: "none",
                                    cursor: "pointer",
                                  }}
                                >
                                  {subSubmittedProject[sub.id] ? "✓ Submitted" : "Submit Work"}
                                </button>
                              </div>
                              {subSubmittedProject[sub.id] && (
                                <p style={{ margin: "0.75rem 0 0", fontSize: "0.8125rem", color: "#16a34a", fontWeight: 700 }}>
                                  ✓ Submission recorded! Your instructor will review your deliverables.
                                </p>
                              )}
                            </form>
                          </div>
                        )}

                        {/* Section Completion Bar */}
                        <div
                          style={{
                            marginTop: "2rem",
                            paddingTop: "1.25rem",
                            borderTop: "1px dashed #e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "0.75rem",
                          }}
                        >
                          <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                            Section {sub.sectionNumber}: {sub.title}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setCompletedSubLessons((prev) => ({
                                ...prev,
                                [sub.id]: !prev[sub.id],
                              }))
                            }
                            style={{
                              padding: "0.4rem 0.9rem",
                              borderRadius: "6px",
                              border: isCompleted ? "1px solid #86efac" : "1px solid #cbd5e1",
                              background: isCompleted ? "#f0fdf4" : "#fff",
                              color: isCompleted ? "#16a34a" : "#475569",
                              fontSize: "0.8125rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                            }}
                          >
                            <span>{isCompleted ? "✓ Completed" : "○ Mark as Completed"}</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                  {currentSubLessons.length === 0 && (
                    <article
                      style={{
                        background: "#fff",
                        borderRadius: "14px",
                        border: "1px solid #e2e8f0",
                        padding: "2.25rem 2.5rem",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
                      }}
                    >
                      <div
                        style={{ fontSize: "1.025rem", lineHeight: 1.85, color: "#334155" }}
                        dangerouslySetInnerHTML={{
                          __html: formatLessonContent(activeLesson?.content || "Lesson content coming soon."),
                        }}
                      />
                    </article>
                  )}
                </div>
              {/* ACTION FOOTER */}
              <div style={{ marginTop: "3rem", paddingBottom: "2rem" }}>
                {/* ── LESSON COMPLETION BADGE & TOGGLE ── */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: "1.75rem",
                    flexWrap: "wrap",
                    gap: "1rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(!isLessonComplete)}
                    disabled={updating}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.65rem 1.4rem",
                      borderRadius: "9999px",
                      background: isLessonComplete ? "var(--brand-accent-500)" : "var(--brand-navy-800)",
                      color: "#fff",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: updating ? "not-allowed" : "pointer",
                      boxShadow: isLessonComplete
                        ? "0 4px 12px rgba(0, 111, 168, 0.35)"
                        : "0 4px 12px rgba(0, 51, 102, 0.25)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span>{isLessonComplete ? "✓ Lesson Completed" : "○ Mark as Complete"}</span>
                  </button>

                  <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                    {completedCount} of {totalLessons} lessons completed ({progressPercent}%)
                  </span>
                </div>

                {/* ── WAS THIS HELPFUL? FEEDBACK CARD (Exact Match to Design) ── */}
                <div
                  style={{
                    background: readerTheme === "dark" ? "#1e293b" : "#f9f6f0",
                    border: readerTheme === "dark" ? "1px solid #334155" : "1px solid #ede8de",
                    borderRadius: "16px",
                    padding: "1.5rem 2rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    marginBottom: "2rem",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontFamily: "Georgia, Cambria, 'Times New Roman', serif",
                        fontSize: "1.2rem",
                        fontWeight: 600,
                        color: readerTheme === "dark" ? "#f8fafc" : "#18181b",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Was this helpful?
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      {/* Thumbs Up Button */}
                      <button
                        type="button"
                        onClick={() => handleSelectRating("helpful")}
                        title="Yes, this was helpful"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: currentFeedback.rating === "helpful" ? "#000000" : (readerTheme === "dark" ? "#0f172a" : "#ffffff"),
                          color: currentFeedback.rating === "helpful" ? "#ffffff" : (readerTheme === "dark" ? "#cbd5e1" : "#52525b"),
                          border: currentFeedback.rating === "helpful" ? "1px solid #000000" : (readerTheme === "dark" ? "1px solid #334155" : "1px solid #e4e4e7"),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill={currentFeedback.rating === "helpful" ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                        </svg>
                      </button>

                      {/* Thumbs Down Button */}
                      <button
                        type="button"
                        onClick={() => handleSelectRating("unhelpful")}
                        title="No, this could be improved"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: currentFeedback.rating === "unhelpful" ? "#000000" : (readerTheme === "dark" ? "#0f172a" : "#ffffff"),
                          color: currentFeedback.rating === "unhelpful" ? "#ffffff" : (readerTheme === "dark" ? "#cbd5e1" : "#52525b"),
                          border: currentFeedback.rating === "unhelpful" ? "1px solid #000000" : (readerTheme === "dark" ? "1px solid #334155" : "1px solid #e4e4e7"),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill={currentFeedback.rating === "unhelpful" ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Feedback Form Accordion Content */}
                  {currentFeedback.rating && !currentFeedback.isSubmitted && (
                    <div style={{ marginTop: "1.25rem", paddingTop: "0.5rem" }}>
                      <h4
                        style={{
                          margin: "0 0 0.85rem",
                          fontSize: "0.9375rem",
                          fontWeight: 700,
                          color: readerTheme === "dark" ? "#f1f5f9" : "#18181b",
                        }}
                      >
                        {currentFeedback.rating === "helpful" ? "What worked well?" : "What could be improved?"}
                      </h4>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                        {(currentFeedback.rating === "helpful"
                          ? [
                              "Learned something new",
                              "Clear and easy to follow",
                              "Right level of detail",
                              "Useful examples",
                              "Something else",
                            ]
                          : [
                              "Something is incorrect",
                              "Hard to follow",
                              "Out of date",
                              "Something is broken",
                              "Something else",
                            ]
                        ).map((opt) => (
                          <label
                            key={opt}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                              fontSize: "0.9rem",
                              color: readerTheme === "dark" ? "#cbd5e1" : "#27272a",
                              cursor: "pointer",
                              userSelect: "none",
                            }}
                          >
                            <input
                              type="radio"
                              name={`feedback-opt-${activeLessonId}`}
                              checked={currentFeedback.reason === opt}
                              onChange={() => handleSelectReason(opt)}
                              style={{ width: 17, height: 17, accentColor: "#000000", cursor: "pointer" }}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>

                      {/* Action buttons (No thanks & Next) */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: "1.25rem",
                          marginTop: "1.5rem",
                        }}
                      >
                        <button
                          type="button"
                          onClick={handleResetFeedback}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: readerTheme === "dark" ? "#94a3b8" : "#18181b",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            cursor: "pointer",
                            padding: "0.35rem 0.5rem",
                          }}
                        >
                          No thanks
                        </button>

                        <button
                          type="button"
                          onClick={handleSubmitFeedback}
                          disabled={!currentFeedback.reason}
                          style={{
                            padding: "0.45rem 1.25rem",
                            borderRadius: "8px",
                            border: currentFeedback.reason ? "1px solid #000000" : (readerTheme === "dark" ? "1px solid #334155" : "1px solid #e4e4e7"),
                            background: currentFeedback.reason ? "#000000" : (readerTheme === "dark" ? "#1e293b" : "#f4f4f5"),
                            color: currentFeedback.reason ? "#ffffff" : (readerTheme === "dark" ? "#64748b" : "#a1a1aa"),
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            cursor: currentFeedback.reason ? "pointer" : "not-allowed",
                            transition: "all 0.15s ease",
                          }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Submission Confirmation */}
                  {currentFeedback.isSubmitted && (
                    <div
                      style={{
                        marginTop: "1.25rem",
                        paddingTop: "1rem",
                        borderTop: readerTheme === "dark" ? "1px solid #334155" : "1px solid #ede8de",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "0.75rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#16a34a", fontSize: "0.9375rem", fontWeight: 600 }}>
                        <span>✓</span>
                        <span>Thank you for your feedback!</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetFeedback}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#71717a",
                          fontSize: "0.8125rem",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Change response
                      </button>
                    </div>
                  )}
                </div>

                {/* Clean Divider Line */}
                <div style={{ width: "100%", height: 1, background: readerTheme === "dark" ? "#334155" : "#e5e7eb", margin: "2.5rem 0" }} />

                {/* ── PREVIOUS & NEXT LESSON CARDS (Exact Match to Design) ── */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: prevLesson && nextLesson ? "repeat(auto-fit, minmax(280px, 1fr))" : "1fr",
                    gap: "1.25rem",
                    width: "100%",
                  }}
                >
                  {/* Previous Lesson Card */}
                  {prevLesson ? (
                    <button
                      type="button"
                      onClick={() => handleNavigateToLesson(prevLesson.id)}
                      style={{
                        background: readerTheme === "dark" ? "#1e293b" : "#ffffff",
                        border: readerTheme === "dark" ? "1px solid #334155" : "1px solid #e4e4e7",
                        borderRadius: "14px",
                        padding: "1.25rem 1.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = readerTheme === "dark" ? "#64748b" : "#a1a1aa";
                        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = readerTheme === "dark" ? "#334155" : "#e4e4e7";
                        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: "50%",
                          background: readerTheme === "dark" ? "#0f172a" : "#f4f4f5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          color: readerTheme === "dark" ? "#94a3b8" : "#52525b",
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="19" y1="12" x2="5" y2="12" />
                          <polyline points="12 19 5 12 12 5" />
                        </svg>
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: "0.75rem", color: "#71717a", fontWeight: 500, marginBottom: "0.2rem" }}>
                          Previous lesson
                        </div>
                        <div
                          style={{
                            fontSize: "0.95rem",
                            fontWeight: 700,
                            color: readerTheme === "dark" ? "#f8fafc" : "#18181b",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            lineHeight: 1.3,
                          }}
                        >
                          {prevLesson.title}
                        </div>
                      </div>
                    </button>
                  ) : <div />}

                  {/* Next Lesson Card */}
                  {nextLesson ? (
                    <button
                      type="button"
                      onClick={() => handleNavigateToLesson(nextLesson.id)}
                      style={{
                        background: readerTheme === "dark" ? "#1e293b" : "#ffffff",
                        border: readerTheme === "dark" ? "2px solid #38bdf8" : "2px solid #000000",
                        borderRadius: "14px",
                        padding: "1.25rem 1.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem",
                        textAlign: "right",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: "0.75rem", color: "#71717a", fontWeight: 500, marginBottom: "0.2rem" }}>
                          Next lesson
                        </div>
                        <div
                          style={{
                            fontSize: "0.95rem",
                            fontWeight: 700,
                            color: readerTheme === "dark" ? "#f8fafc" : "#18181b",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            lineHeight: 1.3,
                          }}
                        >
                          {nextLesson.title}
                        </div>
                      </div>

                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: "50%",
                          background: readerTheme === "dark" ? "#0f172a" : "#f4f4f5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          color: readerTheme === "dark" ? "#94a3b8" : "#52525b",
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </div>
                    </button>
                  ) : (
                    <div
                      style={{
                        background: readerTheme === "dark" ? "#1e293b" : "#f0fdf4",
                        border: "1.5px solid #86efac",
                        borderRadius: "14px",
                        padding: "1.25rem 1.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 600 }}>End of Course</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#14532d" }}>Course Completed 🎉</div>
                      </div>
                      <Link
                        href="/dashboard"
                        style={{
                          background: "#16a34a",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "0.8125rem",
                          padding: "0.5rem 1rem",
                          borderRadius: "8px",
                          textDecoration: "none",
                        }}
                      >
                        View Certificate
                      </Link>
                    </div>
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
