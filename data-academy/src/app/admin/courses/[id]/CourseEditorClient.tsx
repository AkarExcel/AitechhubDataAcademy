"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Lesson {
  id: string;
  title: string;
  type: string;
  order: number;
  isRequired: boolean;
  isPreview: boolean;
  estimatedMinutes: number;
  videoUrl: string | null;
  content: string | null;
  learningObjectives: string[];
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
}

interface Instructor {
  id: string;
  userId: string;
  isPrimary: boolean;
  user: {
    email: string;
    profile: { firstName: string; lastName: string } | null;
  };
  tutor: {
    headline: string | null;
  } | null;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  coverImage: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedHours: number;
  isFree: boolean;
  price: number;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  modules: Module[];
  instructors: Instructor[];
  learningOutcomes: string[];
  certificateEnabled: boolean;
}

export const LESSON_TYPES = [
  {
    type: "READING",
    label: "Reading Guide",
    icon: "📖",
    color: "#0284c7",
    bg: "#e0f2fe",
    desc: "Conceptual text, tutorials, and math notes",
  },
  {
    type: "VIDEO",
    label: "Video Lecture",
    icon: "🎬",
    color: "#005073",
    bg: "rgba(0, 80, 115, 0.12)",
    desc: "Streaming video lecture (YouTube, Vimeo, MP4)",
  },
  {
    type: "VIDEO_READING",
    label: "Video + Reading",
    icon: "🎥",
    color: "#0369a1",
    bg: "#e0f2fe",
    desc: "Video walkthrough paired with written notes",
  },
  {
    type: "CODING_EXERCISE",
    label: "Python Coding Lab",
    icon: "🐍",
    color: "#166534",
    bg: "#dcfce7",
    desc: "Interactive Python code challenge with starter script",
  },
  {
    type: "SQL_EXERCISE",
    label: "SQL Query Lab",
    icon: "🗄️",
    color: "#c2410c",
    bg: "#ffedd5",
    desc: "Database query challenge with schema & starter SQL",
  },
  {
    type: "QUIZ",
    label: "Concept Quiz",
    icon: "❓",
    color: "#7e22ce",
    bg: "#f3e8ff",
    desc: "Multiple-choice questions with answer keys",
  },
  {
    type: "ASSIGNMENT",
    label: "Graded Assignment",
    icon: "📝",
    color: "#b45309",
    bg: "#fef3c7",
    desc: "Problem set with deliverables and grading rubric",
  },
  {
    type: "PROJECT",
    label: "Practical Project",
    icon: "🚀",
    color: "#4338ca",
    bg: "#e0e7ff",
    desc: "Portfolio capstone project with GitHub template",
  },
  {
    type: "DOWNLOADABLE",
    label: "Downloadable Asset",
    icon: "📦",
    color: "#0f766e",
    bg: "#ccfbf1",
    desc: "Dataset CSV, Jupyter Notebook (.ipynb), or PDF slides",
  },
  {
    type: "EXTERNAL_RESOURCE",
    label: "External Tool",
    icon: "🔗",
    color: "#475569",
    bg: "#f1f5f9",
    desc: "Google Colab, Kaggle, GitHub, or documentation link",
  },
] as const;

export default function CourseEditorClient({
  initialCourse,
  categories,
  availableTutors,
  defaultTab,
  isAdmin = true,
}: {
  initialCourse: Course;
  categories: Array<{ id: string; name: string }>;
  availableTutors: Array<{
    id: string;
    email: string;
    role: string;
    profile: { firstName: string; lastName: string } | null;
    tutorProfile: { headline: string | null } | null;
  }>;
  defaultTab: string;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [course, setCourse] = useState<Course>(initialCourse);
  const [activeTab, setActiveTab] = useState<"curriculum" | "details" | "instructors">(
    defaultTab === "details" || defaultTab === "instructors" ? defaultTab : "curriculum"
  );

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Module modal state
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDesc, setModuleDesc] = useState("");
  const [moduleLoading, setModuleLoading] = useState(false);

  // Lesson modal state
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [targetModuleId, setTargetModuleId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState<string>("READING");
  const [lessonMinutes, setLessonMinutes] = useState(15);
  const [lessonVideo, setLessonVideo] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonPreview, setLessonPreview] = useState(false);
  const [lessonHeroImage, setLessonHeroImage] = useState("");
  const [lessonLoading, setLessonLoading] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState<"write" | "preview">("write");

  // Specialized Lesson Type Fields
  const [starterCode, setStarterCode] = useState("");
  const [solutionHint, setSolutionHint] = useState("");
  const [starterSql, setStarterSql] = useState("");
  const [schemaContext, setSchemaContext] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("CSV Dataset");
  const [externalUrl, setExternalUrl] = useState("");
  const [provider, setProvider] = useState("Google Colab");
  const [deliverables, setDeliverables] = useState("");
  const [starterRepoUrl, setStarterRepoUrl] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [passingScore, setPassingScore] = useState(70);
  const [quizQuestions, setQuizQuestions] = useState<
    Array<{ id: string; question: string; options: string[]; correctIndex: number; explanation: string }>
  >([
    {
      id: "q1",
      question: "",
      options: ["", "", "", ""],
      correctIndex: 0,
      explanation: "",
    },
  ]);

  // Sub-Lessons State (Cisco NetAcad Continuous Style)
  const [subLessons, setSubLessons] = useState<
    Array<{
      id: string;
      sectionNumber: string;
      title: string;
      type: string;
      content: string;
      mediaUrl?: string;
      videoUrl?: string;
      starterCode?: string;
      solutionHint?: string;
      starterSql?: string;
      schemaContext?: string;
      downloadUrl?: string;
      fileName?: string;
      fileType?: string;
      externalUrl?: string;
      provider?: string;
      starterRepoUrl?: string;
      maxScore?: number;
      cards?: any[];
      practiceQuiz?: any;
      tabs?: any[];
      quizQuestions?: any[];
      deliverables?: any;
    }>
  >([]);
  const [editingSubIndex, setEditingSubIndex] = useState<number | null>(null);

  // Instructor assignment state
  const [selectedTutorId, setSelectedTutorId] = useState(availableTutors[0]?.id || "");
  const [assignLoading, setAssignLoading] = useState(false);

  // Course Details Form State
  const [editTitle, setEditTitle] = useState(course.title);
  const [editSlug, setEditSlug] = useState(course.slug);
  const [editCategoryId, setEditCategoryId] = useState(course.categoryId || "");
  const [editLevel, setEditLevel] = useState(course.level);
  const [editHours, setEditHours] = useState(course.estimatedHours);
  const [editShortDesc, setEditShortDesc] = useState(course.shortDescription);
  const [editFullDesc, setEditFullDesc] = useState(course.fullDescription);
  const [editCoverImage, setEditCoverImage] = useState(course.coverImage || "");
  const [savingDetails, setSavingDetails] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // ── TOGGLE PUBLISH ───────────────────────────────────────
  const handleTogglePublish = async () => {
    setIsPublishing(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/courses/${course.id}/publish`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error || "Failed to toggle status.", type: "error" });
      } else {
        setCourse((prev) => ({ ...prev, status: data.status }));
        setMessage({ text: data.message, type: "success" });
        router.refresh();
      }
    } catch {
      setMessage({ text: "Network error occurred.", type: "error" });
    } finally {
      setIsPublishing(false);
    }
  };

  // ── MODULE HANDLERS ──────────────────────────────────────
  const handleOpenAddModule = () => {
    setEditingModuleId(null);
    setModuleTitle("");
    setModuleDesc("");
    setShowModuleModal(true);
  };

  const handleOpenEditModule = (m: Module) => {
    setEditingModuleId(m.id);
    setModuleTitle(m.title);
    setModuleDesc(m.description || "");
    setShowModuleModal(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;

    setModuleLoading(true);
    setMessage(null);

    try {
      if (editingModuleId) {
        // UPDATE existing module
        const res = await fetch(`/api/admin/modules/${editingModuleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: moduleTitle.trim(),
            description: moduleDesc.trim() || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setMessage({ text: data.error || "Failed to update module.", type: "error" });
        } else {
          setCourse((prev) => ({
            ...prev,
            modules: prev.modules.map((m) =>
              m.id === editingModuleId
                ? { ...m, title: moduleTitle.trim(), description: moduleDesc.trim() || null }
                : m
            ),
          }));
          setShowModuleModal(false);
          setMessage({ text: "Module updated successfully.", type: "success" });
        }
      } else {
        // CREATE new module
        const res = await fetch(`/api/admin/courses/${course.id}/modules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: moduleTitle.trim(),
            description: moduleDesc.trim() || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setMessage({ text: data.error || "Failed to create module.", type: "error" });
        } else {
          setCourse((prev) => ({
            ...prev,
            modules: [...prev.modules, { ...data.module, lessons: [] }],
          }));
          setShowModuleModal(false);
          setModuleTitle("");
          setModuleDesc("");
          setMessage({ text: "Module added to curriculum.", type: "success" });
        }
      }
    } catch {
      setMessage({ text: "Network error saving module.", type: "error" });
    } finally {
      setModuleLoading(false);
    }
  };

  // ── DELETE MODULE ────────────────────────────────────────
  const handleDeleteModule = async (moduleId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete module "${title}" and all its lessons?`)) return;

    try {
      const res = await fetch(`/api/admin/modules/${moduleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCourse((prev) => ({
          ...prev,
          modules: prev.modules.filter((m) => m.id !== moduleId),
        }));
        setMessage({ text: "Module deleted.", type: "success" });
      }
    } catch {
      setMessage({ text: "Failed to delete module.", type: "error" });
    }
  };

  // ── LESSON HANDLERS ──────────────────────────────────────
  const handleOpenAddLesson = (moduleId: string, initialType: string = "READING") => {
    setEditingLessonId(null);
    setTargetModuleId(moduleId);
    setLessonTitle("");
    setLessonType(initialType);
    setLessonMinutes(initialType === "PROJECT" ? 180 : initialType === "ASSIGNMENT" ? 60 : 15);
    setLessonVideo("");
    setLessonContent("");
    setLessonPreview(false);
    setActiveContentTab("write");

    // Initialize specialized type defaults
    setStarterCode(
      initialType === "CODING_EXERCISE"
        ? `# Python Coding Lab\nimport pandas as pd\nimport numpy as np\n\ndef solution(df):\n    # TODO: Implement your solution here\n    pass\n`
        : ""
    );
    setSolutionHint("");
    setStarterSql(
      initialType === "SQL_EXERCISE"
        ? `-- Write your SQL query below\nSELECT *\nFROM dataset\nLIMIT 10;\n`
        : ""
    );
    setSchemaContext("");
    setDownloadUrl("");
    setFileName("");
    setFileType("CSV Dataset");
    setExternalUrl("");
    setProvider("Google Colab");
    setDeliverables(
      initialType === "PROJECT" || initialType === "ASSIGNMENT"
        ? "1. Cleaned Data Pipeline script / Notebook\n2. Model Evaluation Report\n3. GitHub Repository link\n"
        : ""
    );
    setStarterRepoUrl("");
    setMaxScore(100);
    setPassingScore(70);
    setQuizQuestions([
      {
        id: "q1",
        question: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        explanation: "",
      },
    ]);

    setSubLessons([]);
    setEditingSubIndex(null);
    setLessonHeroImage("");

    setShowLessonModal(true);
  };

  const handleOpenEditLesson = (moduleId: string, lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setTargetModuleId(moduleId);
    setLessonTitle(lesson.title);
    const lType = lesson.type || "READING";
    setLessonType(lType);
    setLessonMinutes(lesson.estimatedMinutes || 15);
    setLessonVideo(lesson.videoUrl || "");
    setLessonPreview(lesson.isPreview || false);
    setActiveContentTab("write");

    // Reset defaults before parsing
    setStarterCode("");
    setSolutionHint("");
    setStarterSql("");
    setSchemaContext("");
    setDownloadUrl("");
    setFileName("");
    setFileType("CSV Dataset");
    setExternalUrl("");
    setProvider("Google Colab");
    setDeliverables("");
    setStarterRepoUrl("");
    setMaxScore(100);
    setPassingScore(70);
    setQuizQuestions([
      {
        id: "q1",
        question: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        explanation: "",
      },
    ]);
    setLessonHeroImage("");

    if (lesson.content) {
      try {
        const parsed = JSON.parse(lesson.content);
        if (parsed && typeof parsed === "object" && (parsed.format || parsed.instructions || parsed.questions || parsed.subLessons)) {
          setLessonContent(parsed.instructions || "");
          if (Array.isArray(parsed.subLessons)) {
            setSubLessons(parsed.subLessons);
          } else {
            setSubLessons([]);
          }
          if (parsed.heroImage) setLessonHeroImage(parsed.heroImage); else setLessonHeroImage("");
          if (parsed.starterCode) setStarterCode(parsed.starterCode);
          if (parsed.solutionHint) setSolutionHint(parsed.solutionHint);
          if (parsed.starterSql) setStarterSql(parsed.starterSql);
          if (parsed.schemaContext) setSchemaContext(parsed.schemaContext);
          if (parsed.downloadUrl) setDownloadUrl(parsed.downloadUrl);
          if (parsed.fileName) setFileName(parsed.fileName);
          if (parsed.fileType) setFileType(parsed.fileType);
          if (parsed.externalUrl) setExternalUrl(parsed.externalUrl);
          if (parsed.provider) setProvider(parsed.provider);
          if (parsed.deliverables) setDeliverables(parsed.deliverables);
          if (parsed.starterRepoUrl) setStarterRepoUrl(parsed.starterRepoUrl);
          if (parsed.maxScore) setMaxScore(parsed.maxScore);
          if (parsed.passingScore) setPassingScore(parsed.passingScore);
          if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            setQuizQuestions(parsed.questions);
          }
        } else {
          setLessonContent(lesson.content);
          setSubLessons([]);
        }
      } catch {
        setLessonContent(lesson.content);
        setSubLessons([]);
      }
    } else {
      setLessonContent("");
      setSubLessons([]);
    }
    setEditingSubIndex(null);

    setShowLessonModal(true);
  };

  const handleSelectLessonType = (type: string) => {
    setLessonType(type);
    if (type === "CODING_EXERCISE" && !starterCode) {
      setStarterCode(`# Python Coding Challenge\nimport pandas as pd\nimport numpy as np\n\ndef solution(df):\n    # TODO: Implement your solution here\n    pass\n`);
    }
    if (type === "SQL_EXERCISE" && !starterSql) {
      setStarterSql(`-- Write your SQL query below\nSELECT * FROM customers LIMIT 10;\n`);
    }
    if (type === "SQL_EXERCISE" && !schemaContext) {
      setSchemaContext(`-- Database Schema:\nCREATE TABLE customers (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(100),\n  email VARCHAR(100),\n  created_at TIMESTAMP\n);`);
    }
    if ((type === "ASSIGNMENT" || type === "PROJECT") && !deliverables) {
      setDeliverables(`1. Python data pipeline script or notebook (.ipynb)\n2. Summary insights report (PDF or markdown)\n3. GitHub repository link`);
    }
    if (type === "DOWNLOADABLE" && !fileType) {
      setFileType("CSV Dataset");
    }
    if (type === "EXTERNAL_RESOURCE" && !provider) {
      setProvider("Google Colab");
    }
  };

  const handleAddQuizQuestion = () => {
    setQuizQuestions((prev) => [
      ...prev,
      {
        id: "q_" + Date.now(),
        question: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        explanation: "",
      },
    ]);
  };

  const handleRemoveQuizQuestion = (qIdx: number) => {
    if (quizQuestions.length <= 1) return;
    setQuizQuestions((prev) => prev.filter((_, i) => i !== qIdx));
  };

  const handleUpdateQuestion = (qIdx: number, field: string, val: any) => {
    setQuizQuestions((prev) => {
      const updated = [...prev];
      updated[qIdx] = { ...updated[qIdx], [field]: val };
      return updated;
    });
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    setQuizQuestions((prev) => {
      const updated = [...prev];
      const newOptions = [...updated[qIdx].options];
      newOptions[optIdx] = val;
      updated[qIdx] = { ...updated[qIdx], options: newOptions };
      return updated;
    });
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return;

    setLessonLoading(true);
    setMessage(null);

    // Build specialized payload according to lessonType
    let finalContent = lessonContent.trim() || null;
    let finalVideoUrl = lessonVideo.trim() || null;

    if (lessonType === "READING") {
      finalVideoUrl = null;
    } else if (lessonType === "CODING_EXERCISE") {
      finalContent = JSON.stringify({
        format: "CODING_EXERCISE",
        instructions: lessonContent.trim(),
        starterCode: starterCode.trim(),
        solutionHint: solutionHint.trim(),
      });
    } else if (lessonType === "SQL_EXERCISE") {
      finalContent = JSON.stringify({
        format: "SQL_EXERCISE",
        instructions: lessonContent.trim(),
        starterSql: starterSql.trim(),
        schemaContext: schemaContext.trim(),
        solutionHint: solutionHint.trim(),
      });
    } else if (lessonType === "QUIZ") {
      finalVideoUrl = null;
      const validQuestions = quizQuestions.filter((q) => q.question.trim().length > 0);
      finalContent = JSON.stringify({
        format: "QUIZ",
        instructions: lessonContent.trim(),
        passingScore: Number(passingScore) || 70,
        questions: validQuestions.length > 0 ? validQuestions : quizQuestions,
      });
    } else if (lessonType === "DOWNLOADABLE") {
      finalVideoUrl = null;
      finalContent = JSON.stringify({
        format: "DOWNLOADABLE",
        instructions: lessonContent.trim(),
        downloadUrl: downloadUrl.trim(),
        fileName: fileName.trim() || lessonTitle.trim(),
        fileType,
      });
    } else if (lessonType === "EXTERNAL_RESOURCE") {
      finalVideoUrl = null;
      finalContent = JSON.stringify({
        format: "EXTERNAL_RESOURCE",
        instructions: lessonContent.trim(),
        externalUrl: externalUrl.trim(),
        provider,
      });
    } else if (lessonType === "ASSIGNMENT" || lessonType === "PROJECT") {
      finalContent = JSON.stringify({
        format: lessonType,
        instructions: lessonContent.trim(),
        deliverables: deliverables.trim(),
        starterRepoUrl: starterRepoUrl.trim(),
        maxScore: Number(maxScore) || 100,
      });
    }

    // If sub-lessons are present, serialize as continuous NETACAD_LESSON
    if (subLessons.length > 0) {
      finalContent = JSON.stringify({
        format: "NETACAD_LESSON",
        instructions: lessonContent.trim(),
        heroImage: lessonHeroImage.trim() || undefined,
        subLessons: subLessons,
      });
    } else if (lessonHeroImage.trim() && finalContent) {
      // Inject heroImage into existing JSON payload if not using sub-lessons
      try {
        const existing = JSON.parse(finalContent);
        existing.heroImage = lessonHeroImage.trim();
        finalContent = JSON.stringify(existing);
      } catch {
        // If not JSON (plain text), wrap it
        finalContent = JSON.stringify({
          format: "READING",
          instructions: finalContent,
          heroImage: lessonHeroImage.trim(),
        });
      }
    } else if (lessonHeroImage.trim() && !finalContent) {
      finalContent = JSON.stringify({
        format: "READING",
        heroImage: lessonHeroImage.trim(),
      });
    }

    try {
      if (editingLessonId) {
        // UPDATE existing lesson
        const res = await fetch(`/api/admin/lessons/${editingLessonId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: lessonTitle.trim(),
            type: lessonType,
            estimatedMinutes: Number(lessonMinutes),
            videoUrl: finalVideoUrl,
            content: finalContent,
            isPreview: lessonPreview,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setMessage({ text: data.error || "Failed to update lesson.", type: "error" });
        } else {
          setCourse((prev) => ({
            ...prev,
            modules: prev.modules.map((m) =>
              m.id === targetModuleId
                ? {
                    ...m,
                    lessons: m.lessons.map((l) =>
                      l.id === editingLessonId ? { ...l, ...data.lesson } : l
                    ),
                  }
                : m
            ),
          }));
          setShowLessonModal(false);
          setMessage({ text: "Lesson and content updated successfully.", type: "success" });
        }
      } else {
        // CREATE new lesson
        if (!targetModuleId) return;
        const res = await fetch(`/api/admin/modules/${targetModuleId}/lessons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: lessonTitle.trim(),
            type: lessonType,
            estimatedMinutes: Number(lessonMinutes),
            videoUrl: finalVideoUrl,
            content: finalContent,
            isPreview: lessonPreview,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setMessage({ text: data.error || "Failed to create lesson.", type: "error" });
        } else {
          setCourse((prev) => ({
            ...prev,
            modules: prev.modules.map((m) =>
              m.id === targetModuleId ? { ...m, lessons: [...m.lessons, data.lesson] } : m
            ),
          }));
          setShowLessonModal(false);
          setLessonTitle("");
          setLessonVideo("");
          setLessonContent("");
          setMessage({ text: "Lesson created successfully.", type: "success" });
        }
      }
    } catch {
      setMessage({ text: "Failed to save lesson.", type: "error" });
    } finally {
      setLessonLoading(false);
    }
  };

  // ── DELETE LESSON ────────────────────────────────────────
  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;

    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCourse((prev) => ({
          ...prev,
          modules: prev.modules.map((m) =>
            m.id === moduleId
              ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
              : m
          ),
        }));
        setMessage({ text: "Lesson deleted.", type: "success" });
      }
    } catch {
      setMessage({ text: "Failed to delete lesson.", type: "error" });
    }
  };

  // ── ASSIGN INSTRUCTOR ────────────────────────────────────
  const handleAssignInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTutorId) return;

    setAssignLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/courses/${course.id}/instructors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedTutorId,
          isPrimary: course.instructors.length === 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error || "Failed to assign instructor.", type: "error" });
      } else {
        setCourse((prev) => ({
          ...prev,
          instructors: [...prev.instructors.filter((i) => i.userId !== selectedTutorId), data.assignment],
        }));
        setMessage({ text: "Instructor assigned to course.", type: "success" });
      }
    } catch {
      setMessage({ text: "Network error assigning instructor.", type: "error" });
    } finally {
      setAssignLoading(false);
    }
  };

  // ── REMOVE INSTRUCTOR ────────────────────────────────────
  const handleRemoveInstructor = async (userId: string) => {
    if (!confirm("Remove this instructor from the course?")) return;

    try {
      const res = await fetch(`/api/admin/courses/${course.id}/instructors?userId=${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCourse((prev) => ({
          ...prev,
          instructors: prev.instructors.filter((i) => i.userId !== userId),
        }));
        setMessage({ text: "Instructor removed.", type: "success" });
      }
    } catch {
      setMessage({ text: "Failed to remove instructor.", type: "error" });
    }
  };

  // ── SAVE COURSE DETAILS ──────────────────────────────────
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          slug: editSlug,
          categoryId: editCategoryId || null,
          level: editLevel,
          estimatedHours: Number(editHours),
          shortDescription: editShortDesc,
          fullDescription: editFullDesc,
          coverImage: editCoverImage || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error || "Failed to save details.", type: "error" });
      } else {
        setCourse((prev) => ({ ...prev, ...data.course }));
        setMessage({ text: "Course details saved successfully.", type: "success" });
      }
    } catch {
      setMessage({ text: "Network error saving details.", type: "error" });
    } finally {
      setSavingDetails(false);
    }
  };

  // ── UPLOAD IMAGE ─────────────────────────────────────────
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error || "Upload failed.", type: "error" });
      } else {
        setEditCoverImage(data.url);
        setMessage({ text: "Cover image uploaded.", type: "success" });
      }
    } catch {
      setMessage({ text: "Upload network error.", type: "error" });
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div>
      {/* Top Banner Alert */}
      {message && (
        <div
          style={{
            padding: "0.875rem 1rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem",
            background: message.type === "success" ? "var(--na-green-50)" : "#fef2f2",
            border: `1px solid ${message.type === "success" ? "var(--na-green-200)" : "#fca5a5"}`,
            color: message.type === "success" ? "#166534" : "#991b1b",
            fontSize: "0.875rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Course Title Header & Publication Controls */}
      <div
        className="card"
        style={{
          padding: "1.5rem 1.75rem",
          marginBottom: "1.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: "8px",
              background: "linear-gradient(135deg, var(--na-navy-800), var(--na-blue-600))",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {course.coverImage ? (
              <img src={course.coverImage} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ color: "#fff", fontWeight: 700 }}>{course.title.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1b2533", margin: 0 }}>
                {course.title}
              </h1>
              <span className={`badge ${course.status === "PUBLISHED" ? "badge-green" : "badge-amber"}`}>
                {course.status}
              </span>
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)" }}>
              Slug: <strong style={{ color: "var(--na-gray-700)" }}>/{course.slug}</strong> &bull; Category:{" "}
              {course.category?.name || "Unassigned"}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link
            href={`/courses/${course.slug}`}
            target="_blank"
            className="btn btn-secondary"
            style={{ fontSize: "0.875rem" }}
          >
            Preview Course
          </Link>

          {isAdmin ? (
            <button
              onClick={handleTogglePublish}
              disabled={isPublishing}
              className={`btn ${course.status === "PUBLISHED" ? "btn-secondary" : "btn-green"}`}
              style={{
                fontSize: "0.875rem",
                fontWeight: 700,
                padding: "0.5rem 1.25rem",
                borderRadius: "9999px",
              }}
            >
              {isPublishing
                ? "Updating…"
                : course.status === "PUBLISHED"
                ? "Revert to Draft"
                : "Publish Course"}
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.45rem 1rem",
                borderRadius: "9999px",
                background: course.status === "PUBLISHED" ? "#ecfdf5" : "#fef3c7",
                border: course.status === "PUBLISHED" ? "1px solid #a7f3d0" : "1px solid #fde68a",
                color: course.status === "PUBLISHED" ? "#065f46" : "#92400e",
                fontSize: "0.8125rem",
                fontWeight: 700,
              }}
              title={
                course.status === "PUBLISHED"
                  ? "This course is published and visible in the public student catalog."
                  : "Course draft. Only academy administrators can publish courses to the catalog."
              }
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                {course.status === "PUBLISHED" ? (
                  <polyline points="20 6 9 17 4 12" />
                ) : (
                  <>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </>
                )}
              </svg>
              <span>{course.status === "PUBLISHED" ? "Published (Live)" : "Draft (Pending Admin Publishing)"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--na-gray-200)",
          marginBottom: "1.75rem",
          gap: "1.5rem",
        }}
      >
        <button
          onClick={() => setActiveTab("curriculum")}
          style={{
            background: "none",
            border: "none",
            padding: "0.75rem 0.25rem",
            fontSize: "0.9375rem",
            fontWeight: activeTab === "curriculum" ? 700 : 500,
            color: activeTab === "curriculum" ? "var(--na-blue-600)" : "var(--na-gray-600)",
            borderBottom: activeTab === "curriculum" ? "2px solid var(--na-blue-600)" : "2px solid transparent",
            cursor: "pointer",
          }}
        >
          Curriculum Builder ({course.modules.length} Modules)
        </button>

        <button
          onClick={() => setActiveTab("details")}
          style={{
            background: "none",
            border: "none",
            padding: "0.75rem 0.25rem",
            fontSize: "0.9375rem",
            fontWeight: activeTab === "details" ? 700 : 500,
            color: activeTab === "details" ? "var(--na-blue-600)" : "var(--na-gray-600)",
            borderBottom: activeTab === "details" ? "2px solid var(--na-blue-600)" : "2px solid transparent",
            cursor: "pointer",
          }}
        >
          Course Details &amp; Media
        </button>

        <button
          onClick={() => setActiveTab("instructors")}
          style={{
            background: "none",
            border: "none",
            padding: "0.75rem 0.25rem",
            fontSize: "0.9375rem",
            fontWeight: activeTab === "instructors" ? 700 : 500,
            color: activeTab === "instructors" ? "var(--na-blue-600)" : "var(--na-gray-600)",
            borderBottom: activeTab === "instructors" ? "2px solid var(--na-blue-600)" : "2px solid transparent",
            cursor: "pointer",
          }}
        >
          Instructors ({course.instructors.length})
        </button>
      </div>

      {/* ── TAB 1: CURRICULUM BUILDER ───────────────────────── */}
      {activeTab === "curriculum" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1b2533" }}>
                Curriculum Structure
              </h2>
              <p style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)" }}>
                Organize your course into chronological modules and interactive lessons.
              </p>
            </div>

            <button
              onClick={handleOpenAddModule}
              className="btn btn-green"
              style={{
                fontSize: "0.875rem",
                padding: "0.5rem 1rem",
                borderRadius: "9999px",
                fontWeight: 600,
              }}
            >
              + Add Module
            </button>
          </div>

          {/* Modules List */}
          {course.modules.length === 0 ? (
            <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--na-gray-500)" }}>
              No modules created yet. Click <strong>+ Add Module</strong> above to start building the curriculum.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {course.modules.map((m, mIdx) => (
                <div key={m.id} className="card" style={{ padding: "1.5rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      borderBottom: "1px solid var(--na-gray-100)",
                      paddingBottom: "1rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.5rem",
                            background: "var(--na-navy-800)",
                            color: "#fff",
                            borderRadius: "4px",
                          }}
                        >
                          Module {mIdx + 1}
                        </span>
                        <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#1b2533", margin: 0 }}>
                          {m.title}
                        </h3>
                      </div>
                      {m.description && (
                        <p style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)", marginTop: "0.25rem" }}>
                          {m.description}
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <button
                        onClick={() => handleOpenEditModule(m)}
                        className="btn btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit Module
                      </button>

                      <button
                        onClick={() => handleOpenAddLesson(m.id)}
                        className="btn btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem" }}
                      >
                        + Add Lesson
                      </button>

                      <button
                        onClick={() => handleDeleteModule(m.id, m.title)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#e11d48",
                          cursor: "pointer",
                          padding: "0.35rem",
                        }}
                        title="Delete Module"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Lessons list in module */}
                  {m.lessons.length === 0 ? (
                    <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.8125rem", color: "var(--na-gray-400)", background: "var(--na-gray-50)", borderRadius: "var(--radius-sm)" }}>
                      No lessons in this module yet. Click &quot;+ Add Lesson&quot; to add content.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {m.lessons.map((lesson, lIdx) => (
                        <div
                          key={lesson.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.75rem 1rem",
                            background: "var(--na-gray-50)",
                            border: "1px solid var(--na-gray-200)",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--na-gray-400)", fontWeight: 600 }}>
                              {mIdx + 1}.{lIdx + 1}
                            </span>
                            {(() => {
                              const meta = LESSON_TYPES.find((t) => t.type === lesson.type) || {
                                label: lesson.type,
                                icon: "📄",
                                color: "var(--na-blue-600)",
                                bg: "rgba(4, 159, 217, 0.12)",
                              };
                              return (
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    padding: "0.15rem 0.5rem",
                                    background: meta.bg,
                                    color: meta.color,
                                    fontWeight: 700,
                                    borderRadius: "4px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.3rem",
                                  }}
                                >
                                  <span>{meta.icon}</span>
                                  <span>{meta.label}</span>
                                </span>
                              );
                            })()}
                            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1b2533" }}>
                              {lesson.title}
                            </span>
                            {lesson.videoUrl && (
                              <span style={{ fontSize: "0.6875rem", padding: "0.12rem 0.4rem", background: "rgba(4, 159, 217, 0.15)", color: "var(--na-blue-700)", borderRadius: "4px", fontWeight: 600 }}>
                                ▶ Video Attached
                              </span>
                            )}
                            {lesson.content && (
                              <span style={{ fontSize: "0.6875rem", padding: "0.12rem 0.4rem", background: "#e2e8f0", color: "#334155", borderRadius: "4px", fontWeight: 600 }}>
                                📄 Content Written
                              </span>
                            )}
                            {lesson.isPreview && (
                              <span style={{ fontSize: "0.6875rem", padding: "0.12rem 0.4rem", background: "var(--na-green-100)", color: "var(--na-green-700)", borderRadius: "4px", fontWeight: 600 }}>
                                Free Preview
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--na-gray-500)", marginRight: "0.25rem" }}>
                              {lesson.estimatedMinutes} min
                            </span>
                            <button
                              onClick={() => handleOpenEditLesson(m.id, lesson)}
                              className="btn btn-secondary"
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.3rem 0.65rem",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                color: "var(--na-blue-700)",
                                borderColor: "var(--na-blue-200)",
                                background: "#f0f9ff",
                                fontWeight: 600,
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Edit Lesson
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(m.id, lesson.id)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#e11d48",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                padding: "0.3rem 0.5rem",
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: COURSE DETAILS & MEDIA ──────────────────── */}
      {activeTab === "details" && (
        <form onSubmit={handleSaveDetails} className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
              Course Title
            </label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="input"
              style={{ width: "100%", padding: "0.625rem 0.875rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
              Slug
            </label>
            <input
              type="text"
              required
              value={editSlug}
              onChange={(e) => setEditSlug(e.target.value)}
              className="input"
              style={{ width: "100%", padding: "0.625rem 0.875rem" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                Category
              </label>
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="input"
                style={{ width: "100%", padding: "0.625rem 0.875rem", background: "#fff" }}
              >
                <option value="">Unassigned</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                Difficulty Level
              </label>
              <select
                value={editLevel}
                onChange={(e) => setEditLevel(e.target.value as any)}
                className="input"
                style={{ width: "100%", padding: "0.625rem 0.875rem", background: "#fff" }}
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
              Cover Image
            </label>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div
                style={{
                  width: 120,
                  height: 75,
                  borderRadius: "6px",
                  background: "var(--na-gray-100)",
                  overflow: "hidden",
                  border: "1px solid var(--na-gray-300)",
                }}
              >
                {editCoverImage ? (
                  <img src={editCoverImage} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: "var(--na-gray-400)" }}>No cover</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingImage}
                  style={{ marginBottom: "0.35rem", fontSize: "0.8125rem" }}
                />
                <input
                  type="url"
                  placeholder="Or enter image URL"
                  value={editCoverImage}
                  onChange={(e) => setEditCoverImage(e.target.value)}
                  className="input"
                  style={{ width: "100%", padding: "0.45rem 0.75rem", fontSize: "0.8125rem" }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
              Short Description
            </label>
            <textarea
              rows={2}
              value={editShortDesc}
              onChange={(e) => setEditShortDesc(e.target.value)}
              className="input"
              style={{ width: "100%", padding: "0.625rem 0.875rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
              Full Description (Markdown)
            </label>
            <textarea
              rows={6}
              value={editFullDesc}
              onChange={(e) => setEditFullDesc(e.target.value)}
              className="input"
              style={{ width: "100%", padding: "0.625rem 0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={savingDetails}
              className="btn btn-green"
              style={{ padding: "0.65rem 1.75rem", borderRadius: "9999px", fontWeight: 700 }}
            >
              {savingDetails ? "Saving…" : "Save Course Details"}
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 3: INSTRUCTORS & TUTOR ASSIGNMENT ──────────── */}
      {activeTab === "instructors" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Assigned Instructors */}
          <div className="card" style={{ padding: "1.75rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1b2533", marginBottom: "1rem" }}>
              Assigned Instructors
            </h2>

            {course.instructors.length === 0 ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--na-gray-500)", fontSize: "0.875rem" }}>
                No instructors assigned yet. Use the assignment panel below to assign a faculty member.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {course.instructors.map((inst) => (
                  <div
                    key={inst.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.875rem 1rem",
                      border: "1px solid var(--na-gray-200)",
                      borderRadius: "var(--radius-md)",
                      background: "var(--na-gray-50)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: 600, color: "#1b2533" }}>
                          {inst.user.profile?.firstName} {inst.user.profile?.lastName}
                        </span>
                        {inst.isPrimary && (
                          <span style={{ fontSize: "0.6875rem", padding: "0.15rem 0.5rem", background: "var(--na-green-100)", color: "var(--na-green-800)", fontWeight: 700, borderRadius: "4px" }}>
                            Primary Instructor
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--na-gray-500)" }}>
                        {inst.tutor?.headline || inst.user.email}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveInstructor(inst.userId)}
                      style={{ background: "none", border: "none", color: "#e11d48", cursor: "pointer", fontSize: "0.8125rem" }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign New Instructor */}
          <form onSubmit={handleAssignInstructor} className="card" style={{ padding: "1.75rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1b2533", marginBottom: "0.5rem" }}>
              Assign Instructor to Course
            </h2>
            <p style={{ fontSize: "0.84375rem", color: "var(--na-gray-500)", marginBottom: "1.25rem" }}>
              Select from approved faculty members and tutors.
            </p>

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <select
                value={selectedTutorId}
                onChange={(e) => setSelectedTutorId(e.target.value)}
                className="input"
                style={{ flex: 1, padding: "0.625rem 0.875rem", background: "#fff" }}
              >
                {availableTutors.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.profile?.firstName} {t.profile?.lastName} ({t.email}) &bull; {t.role}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={assignLoading || !selectedTutorId}
                className="btn btn-green"
                style={{ padding: "0.625rem 1.25rem", borderRadius: "9999px", fontWeight: 600 }}
              >
                {assignLoading ? "Assigning…" : "Assign to Course"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: ADD / EDIT MODULE ───────────────────────── */}
      {showModuleModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backdropFilter: "blur(2px)",
          }}
        >
          <div className="card" style={{ width: "100%", maxWidth: 480, padding: "2rem", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1b2533", margin: 0 }}>
                {editingModuleId ? "Edit Curriculum Module" : "Add Curriculum Module"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModuleModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "var(--na-gray-400)" }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveModule} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                  Module Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exploratory Data Analysis & Statistics"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="input"
                  style={{ width: "100%", padding: "0.625rem 0.875rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                  Description (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of concepts and techniques covered in this module."
                  value={moduleDesc}
                  onChange={(e) => setModuleDesc(e.target.value)}
                  className="input"
                  style={{ width: "100%", padding: "0.625rem 0.875rem" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowModuleModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={moduleLoading} className="btn btn-green">
                  {moduleLoading ? "Saving…" : editingModuleId ? "Save Changes" : "Add Module"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD / EDIT LESSON ─────────────────────────── */}
      {showLessonModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backdropFilter: "blur(2px)",
          }}
        >
          <div className="card" style={{ width: "100%", maxWidth: 780, padding: "2rem", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", borderBottom: "1px solid var(--na-gray-200)", paddingBottom: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.25rem" }}>
                    {LESSON_TYPES.find((t) => t.type === lessonType)?.icon || "📖"}
                  </span>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1b2533", margin: 0 }}>
                    {editingLessonId ? "Edit Lesson & Content" : "Add Lesson to Curriculum"}
                  </h3>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)", margin: "0.25rem 0 0" }}>
                  Select the instructional format and provide dedicated content for your students.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLessonModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--na-gray-400)", lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveLesson} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* ── 1. FORMAT SELECTOR GRID ── */}
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--na-gray-600)", marginBottom: "0.5rem" }}>
                  Select Lesson Format
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(135px, 1fr))",
                    gap: "0.5rem",
                  }}
                >
                  {LESSON_TYPES.map((t) => {
                    const isSelected = lessonType === t.type;
                    return (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => handleSelectLessonType(t.type)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0.625rem 0.5rem",
                          borderRadius: "8px",
                          border: isSelected ? `2px solid ${t.color}` : "1px solid var(--na-gray-200)",
                          background: isSelected ? t.bg : "#fff",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          textAlign: "center",
                          boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                        }}
                      >
                        <span style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{t.icon}</span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: isSelected ? 700 : 600,
                            color: isSelected ? t.color : "#1e293b",
                            lineHeight: 1.2,
                          }}
                        >
                          {t.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {/* Active format hint */}
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    background: "var(--na-gray-50)",
                    border: "1px solid var(--na-gray-200)",
                    fontSize: "0.75rem",
                    color: "var(--na-gray-600)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>Format Info:</span>
                  <span>{LESSON_TYPES.find((t) => t.type === lessonType)?.desc}</span>
                </div>
              </div>

              {/* ── 2. GENERAL INFO (TITLE & DURATION) ── */}
              <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                    Lesson Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Exploratory Data Analysis with Pandas"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="input"
                    style={{ width: "100%", padding: "0.625rem 0.875rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                    Est. Minutes
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    value={lessonMinutes}
                    onChange={(e) => setLessonMinutes(Number(e.target.value))}
                    className="input"
                    style={{ width: "100%", padding: "0.625rem 0.875rem" }}
                  />
                </div>
              </div>

              {/* ── 3. HERO BANNER IMAGE (Optional) ── */}
              <div
                style={{
                  background: "linear-gradient(135deg, #011936 0%, #002c4b 100%)",
                  borderRadius: "10px",
                  padding: "1rem",
                  border: "1px solid #0284c7",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>🖼️</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#ffffff" }}>
                      Hero Banner Image <span style={{ fontWeight: 400, color: "#94a3b8", fontSize: "0.8rem" }}>(Optional)</span>
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.15rem" }}>
                      Full-screen image displayed behind the lesson title. A dark overlay is applied automatically so white text always pops.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  {/* Preview thumbnail */}
                  {lessonHeroImage ? (
                    <div
                      style={{
                        width: 100,
                        height: 60,
                        borderRadius: "6px",
                        overflow: "hidden",
                        flexShrink: 0,
                        border: "1.5px solid rgba(255,255,255,0.2)",
                        position: "relative",
                      }}
                    >
                      <img
                        src={lessonHeroImage}
                        alt="Hero preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      {/* Dark overlay preview */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(1,25,54,0.6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span style={{ fontSize: "0.6rem", color: "#ffffff", fontWeight: 700, textAlign: "center", padding: "0 4px" }}>
                          Preview
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: 100,
                        height: 60,
                        borderRadius: "6px",
                        border: "1.5px dashed rgba(255,255,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        color: "#64748b",
                        fontSize: "0.65rem",
                        textAlign: "center",
                      }}
                    >
                      No image set
                    </div>
                  )}

                  <div style={{ flex: 1 }}>
                    <input
                      type="url"
                      placeholder="https://example.com/hero-image.jpg"
                      value={lessonHeroImage}
                      onChange={(e) => setLessonHeroImage(e.target.value)}
                      className="input"
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.875rem",
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "#f1f5f9",
                        borderRadius: "6px",
                        fontSize: "0.8125rem",
                      }}
                    />
                    {lessonHeroImage && (
                      <button
                        type="button"
                        onClick={() => setLessonHeroImage("")}
                        style={{
                          marginTop: "0.4rem",
                          background: "transparent",
                          border: "none",
                          color: "#f87171",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          padding: 0,
                        }}
                      >
                        ✕ Remove image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── 4. CONDITIONAL FIELDS PER LESSON TYPE ── */}

              {/* VIDEO URL: Shown for VIDEO, VIDEO_READING, or optional for CODING/SQL/PROJECT */}

              {(lessonType === "VIDEO" || lessonType === "VIDEO_READING" || lessonType === "CODING_EXERCISE" || lessonType === "SQL_EXERCISE" || lessonType === "PROJECT" || lessonType === "ASSIGNMENT") && (
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                    Video URL {lessonType === "VIDEO" ? "*" : "(Optional Walkthrough / Lecture)"}
                  </label>
                  <input
                    type="url"
                    required={lessonType === "VIDEO"}
                    placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/... or MP4 link"
                    value={lessonVideo}
                    onChange={(e) => setLessonVideo(e.target.value)}
                    className="input"
                    style={{ width: "100%", padding: "0.625rem 0.875rem" }}
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--na-gray-500)", marginTop: "0.2rem", display: "block" }}>
                    Accepts standard YouTube links, Vimeo video URLs, or direct MP4 stream addresses.
                  </span>
                </div>
              )}

              {/* CODING LAB SPECIALIZED FIELDS */}
              {lessonType === "CODING_EXERCISE" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1rem" }}>🐍</span>
                    <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#0f172a" }}>
                      Python Coding Lab Configuration
                    </h4>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                      Starter Python Code (Monospace Editor)
                    </label>
                    <textarea
                      rows={6}
                      value={starterCode}
                      onChange={(e) => setStarterCode(e.target.value)}
                      placeholder="# Python starter template for students&#10;import pandas as pd&#10;&#10;def solution(df):&#10;    # Your code here&#10;    pass"
                      className="input"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.8125rem",
                        lineHeight: 1.5,
                        background: "#0f172a",
                        color: "#a5f3fc",
                        borderRadius: "6px",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                      Solution Hint &amp; Expected Output (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={solutionHint}
                      onChange={(e) => setSolutionHint(e.target.value)}
                      placeholder="e.g. Remember to handle NaN values with df.fillna(df.mean()). Expected output should be a grouped DataFrame with 5 rows."
                      className="input"
                      style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.8125rem" }}
                    />
                  </div>
                </div>
              )}

              {/* SQL QUERY LAB SPECIALIZED FIELDS */}
              {lessonType === "SQL_EXERCISE" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", background: "#fff7ed", padding: "1rem", borderRadius: "8px", border: "1px solid #fed7aa" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1rem" }}>🗄️</span>
                    <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#9a3412" }}>
                      SQL Query Lab Configuration
                    </h4>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#431407", marginBottom: "0.35rem" }}>
                      Database Schema Context / Tables Description
                    </label>
                    <textarea
                      rows={3}
                      value={schemaContext}
                      onChange={(e) => setSchemaContext(e.target.value)}
                      placeholder="-- Schema description or CREATE TABLE ddl&#10;TABLE sales (id INT, product_id INT, customer_id INT, amount NUMERIC, created_at TIMESTAMP)"
                      className="input"
                      style={{
                        width: "100%",
                        padding: "0.625rem",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.8125rem",
                        background: "#fff",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#431407", marginBottom: "0.35rem" }}>
                      Starter SQL Query
                    </label>
                    <textarea
                      rows={4}
                      value={starterSql}
                      onChange={(e) => setStarterSql(e.target.value)}
                      placeholder="-- Write your SQL query below&#10;SELECT * FROM sales LIMIT 10;"
                      className="input"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.8125rem",
                        background: "#1c1917",
                        color: "#fdba74",
                        borderRadius: "6px",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#431407", marginBottom: "0.35rem" }}>
                      Solution Hint &amp; Expected Results
                    </label>
                    <textarea
                      rows={2}
                      value={solutionHint}
                      onChange={(e) => setSolutionHint(e.target.value)}
                      placeholder="e.g. Use GROUP BY customer_id and HAVING SUM(amount) > 1000 ORDER BY total DESC."
                      className="input"
                      style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.8125rem", background: "#fff" }}
                    />
                  </div>
                </div>
              )}

              {/* CONCEPT QUIZ BUILDER */}
              {lessonType === "QUIZ" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", background: "#faf5ff", padding: "1.25rem", borderRadius: "8px", border: "1px solid #e9d5ff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "1.125rem" }}>❓</span>
                      <h4 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700, color: "#6b21a8" }}>
                        Interactive Quiz Questions Builder ({quizQuestions.length} Questions)
                      </h4>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#6b21a8" }}>Passing Score:</label>
                      <input
                        type="number"
                        min="10"
                        max="100"
                        value={passingScore}
                        onChange={(e) => setPassingScore(Number(e.target.value))}
                        className="input"
                        style={{ width: 75, padding: "0.35rem 0.5rem", fontSize: "0.8125rem", textAlign: "center", background: "#fff" }}
                      />
                      <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#6b21a8" }}>%</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {quizQuestions.map((q, qIdx) => (
                      <div
                        key={q.id || qIdx}
                        style={{
                          background: "#fff",
                          border: "1px solid #d8b4fe",
                          borderRadius: "8px",
                          padding: "1rem",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#7e22ce" }}>
                            Question {qIdx + 1}
                          </span>
                          {quizQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveQuizQuestion(qIdx)}
                              style={{ background: "none", border: "none", color: "#e11d48", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                            >
                              ✕ Remove
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          required
                          placeholder="e.g. What is the default join type in SQL when typing JOIN?"
                          value={q.question}
                          onChange={(e) => handleUpdateQuestion(qIdx, "question", e.target.value)}
                          className="input"
                          style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.875rem", marginBottom: "0.75rem" }}
                        />

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.75rem" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>
                            Select the radio button next to the correct answer:
                          </span>
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <input
                                type="radio"
                                name={`correct_${qIdx}`}
                                checked={q.correctIndex === optIdx}
                                onChange={() => handleUpdateQuestion(qIdx, "correctIndex", optIdx)}
                                style={{ cursor: "pointer", width: 16, height: 16 }}
                              />
                              <input
                                type="text"
                                required
                                placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                value={opt}
                                onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                                className="input"
                                style={{
                                  flex: 1,
                                  padding: "0.4rem 0.65rem",
                                  fontSize: "0.8125rem",
                                  background: q.correctIndex === optIdx ? "#f3e8ff" : "#fff",
                                  border: q.correctIndex === optIdx ? "1px solid #c084fc" : "1px solid var(--na-gray-300)",
                                }}
                              />
                            </div>
                          ))}
                        </div>

                        <input
                          type="text"
                          placeholder="Explanation for learners upon completing the quiz (optional)"
                          value={q.explanation || ""}
                          onChange={(e) => handleUpdateQuestion(qIdx, "explanation", e.target.value)}
                          className="input"
                          style={{ width: "100%", padding: "0.4rem 0.65rem", fontSize: "0.75rem", background: "#f8fafc" }}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddQuizQuestion}
                    style={{
                      padding: "0.6rem 1rem",
                      borderRadius: "6px",
                      background: "#fff",
                      border: "1px dashed #a855f7",
                      color: "#7e22ce",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <span>+ Add Another Question</span>
                  </button>
                </div>
              )}

              {/* DOWNLOADABLE ASSET SPECIALIZED FIELDS */}
              {lessonType === "DOWNLOADABLE" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", background: "#eff6ff", padding: "1rem", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1rem" }}>📦</span>
                    <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#1e40af" }}>
                      Downloadable File Configuration
                    </h4>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#1e3a8a", marginBottom: "0.35rem" }}>
                        File Display Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. retail_transactions_2024.csv"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        className="input"
                        style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.8125rem", background: "#fff" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#1e3a8a", marginBottom: "0.35rem" }}>
                        Asset Format
                      </label>
                      <select
                        value={fileType}
                        onChange={(e) => setFileType(e.target.value)}
                        className="input"
                        style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.8125rem", background: "#fff" }}
                      >
                        <option value="CSV Dataset">CSV Dataset (.csv)</option>
                        <option value="Excel Spreadsheet">Excel Spreadsheet (.xlsx)</option>
                        <option value="Jupyter Notebook">Jupyter Notebook (.ipynb)</option>
                        <option value="PDF Cheatsheet">PDF Guide / Cheatsheet (.pdf)</option>
                        <option value="ZIP Archive">ZIP Code Archive (.zip)</option>
                        <option value="Python Script">Python Script (.py)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#1e3a8a", marginBottom: "0.35rem" }}>
                      Download URL *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://storage.googleapis.com/... or Google Drive link or raw GitHub file"
                      value={downloadUrl}
                      onChange={(e) => setDownloadUrl(e.target.value)}
                      className="input"
                      style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.8125rem", background: "#fff" }}
                    />
                  </div>
                </div>
              )}

              {/* EXTERNAL RESOURCE SPECIALIZED FIELDS */}
              {lessonType === "EXTERNAL_RESOURCE" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", background: "#f0fdfa", padding: "1rem", borderRadius: "8px", border: "1px solid #99f6e4" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1rem" }}>🌐</span>
                    <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#0f766e" }}>
                      External Tool &amp; Resource Configuration
                    </h4>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#115e59", marginBottom: "0.35rem" }}>
                        Provider
                      </label>
                      <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        className="input"
                        style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.8125rem", background: "#fff" }}
                      >
                        <option value="Google Colab">Google Colab</option>
                        <option value="Kaggle">Kaggle Notebook / Dataset</option>
                        <option value="GitHub">GitHub Repository</option>
                        <option value="Official Docs">Official Documentation</option>
                        <option value="Interactive Playground">Interactive Playground</option>
                        <option value="External Tool">External Tool / Article</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#115e59", marginBottom: "0.35rem" }}>
                        External Resource URL *
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://colab.research.google.com/... or https://kaggle.com/..."
                        value={externalUrl}
                        onChange={(e) => setExternalUrl(e.target.value)}
                        className="input"
                        style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.8125rem", background: "#fff" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ASSIGNMENT & PROJECT SPECIALIZED FIELDS */}
              {(lessonType === "ASSIGNMENT" || lessonType === "PROJECT") && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", background: "#fffbeb", padding: "1rem", borderRadius: "8px", border: "1px solid #fde68a" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1rem" }}>{lessonType === "PROJECT" ? "🚀" : "📝"}</span>
                    <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#92400e" }}>
                      {lessonType === "PROJECT" ? "Practical Capstone Project Setup" : "Graded Assignment Setup"}
                    </h4>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#78350f", marginBottom: "0.35rem" }}>
                        Starter GitHub Repository (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/..."
                        value={starterRepoUrl}
                        onChange={(e) => setStarterRepoUrl(e.target.value)}
                        className="input"
                        style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.8125rem", background: "#fff" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#78350f", marginBottom: "0.35rem" }}>
                        Max Score / Points
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="1000"
                        value={maxScore}
                        onChange={(e) => setMaxScore(Number(e.target.value))}
                        className="input"
                        style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.8125rem", background: "#fff" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#78350f", marginBottom: "0.35rem" }}>
                      Expected Deliverables Checklist
                    </label>
                    <textarea
                      rows={3}
                      value={deliverables}
                      onChange={(e) => setDeliverables(e.target.value)}
                      placeholder="1. Cleaned dataset and data dictionary&#10;2. Python Jupyter Notebook (.ipynb)&#10;3. Executive presentation deck or PDF"
                      className="input"
                      style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.8125rem", background: "#fff" }}
                    />
                  </div>
                </div>
              )}

              {/* ── 4. MARKDOWN CONTENT / INSTRUCTIONS WITH WRITE / PREVIEW TABS ── */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)" }}>
                    {lessonType === "READING"
                      ? "Reading Guide Content & Lecture Notes *"
                      : lessonType === "VIDEO"
                      ? "Lecture Notes & Key Takeaways (Optional)"
                      : lessonType === "CODING_EXERCISE" || lessonType === "SQL_EXERCISE"
                      ? "Challenge Instructions & Prompt *"
                      : lessonType === "QUIZ"
                      ? "Quiz Overview & Guidelines"
                      : lessonType === "DOWNLOADABLE"
                      ? "File Description & Usage Instructions"
                      : lessonType === "EXTERNAL_RESOURCE"
                      ? "Guided Instructions for this External Tool *"
                      : "Project Scenario & Submission Instructions *"}
                  </label>
                  <div style={{ display: "flex", gap: "0.25rem", background: "var(--na-gray-100)", padding: "2px", borderRadius: 4 }}>
                    <button
                      type="button"
                      onClick={() => setActiveContentTab("write")}
                      style={{
                        padding: "0.2rem 0.5rem",
                        fontSize: "0.75rem",
                        fontWeight: activeContentTab === "write" ? 700 : 500,
                        background: activeContentTab === "write" ? "#fff" : "transparent",
                        border: "none",
                        borderRadius: 3,
                        cursor: "pointer",
                      }}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveContentTab("preview")}
                      style={{
                        padding: "0.2rem 0.5rem",
                        fontSize: "0.75rem",
                        fontWeight: activeContentTab === "preview" ? 700 : 500,
                        background: activeContentTab === "preview" ? "#fff" : "transparent",
                        border: "none",
                        borderRadius: 3,
                        cursor: "pointer",
                      }}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {activeContentTab === "write" ? (
                  <>
                    <div style={{ display: "flex", gap: "0.35rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => setLessonContent((c) => c + "\n## Section Title\n")}
                        style={{ fontSize: "0.6875rem", padding: "0.2rem 0.45rem", background: "var(--na-gray-100)", border: "1px solid var(--na-gray-300)", borderRadius: 3, cursor: "pointer" }}
                      >
                        + Heading
                      </button>
                      <button
                        type="button"
                        onClick={() => setLessonContent((c) => c + " **bold text** ")}
                        style={{ fontSize: "0.6875rem", padding: "0.2rem 0.45rem", background: "var(--na-gray-100)", border: "1px solid var(--na-gray-300)", borderRadius: 3, cursor: "pointer" }}
                      >
                        + Bold
                      </button>
                      <button
                        type="button"
                        onClick={() => setLessonContent((c) => c + "\n```python\n# Sample code\nimport pandas as pd\n```\n")}
                        style={{ fontSize: "0.6875rem", padding: "0.2rem 0.45rem", background: "var(--na-gray-100)", border: "1px solid var(--na-gray-300)", borderRadius: 3, cursor: "pointer" }}
                      >
                        + Code
                      </button>
                      <button
                        type="button"
                        onClick={() => setLessonContent((c) => c + "\n- Key requirement\n- Next step\n")}
                        style={{ fontSize: "0.6875rem", padding: "0.2rem 0.45rem", background: "var(--na-gray-100)", border: "1px solid var(--na-gray-300)", borderRadius: 3, cursor: "pointer" }}
                      >
                        + Bullets
                      </button>
                      <button
                        type="button"
                        onClick={() => setLessonContent((c) => c + "\n| Column 1 | Column 2 |\n| --- | --- |\n| Value A | Value B |\n")}
                        style={{ fontSize: "0.6875rem", padding: "0.2rem 0.45rem", background: "var(--na-gray-100)", border: "1px solid var(--na-gray-300)", borderRadius: 3, cursor: "pointer" }}
                      >
                        + Table
                      </button>
                    </div>
                    <textarea
                      rows={7}
                      placeholder="Explain concepts, walk through steps, or provide detailed requirements. Formatted markdown will be rendered directly in the learner classroom."
                      value={lessonContent}
                      onChange={(e) => setLessonContent(e.target.value)}
                      className="input"
                      style={{ width: "100%", padding: "0.625rem 0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", lineHeight: 1.55 }}
                    />
                  </>
                ) : (
                  <div
                    style={{
                      minHeight: 160,
                      maxHeight: 260,
                      overflowY: "auto",
                      padding: "1rem",
                      background: "var(--na-gray-50)",
                      border: "1px solid var(--na-gray-200)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.875rem",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {lessonContent ? (
                      lessonContent
                    ) : (
                      <span style={{ color: "var(--na-gray-400)" }}>No instructions entered yet. Switch back to Write mode to type.</span>
                    )}
                  </div>
                )}
              </div>

              {/* ── SUB-LESSONS CONTINUOUS SECTIONS (Cisco NetAcad Style) ── */}
              <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "1.1rem" }}>📑</span>
                      <h4 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a" }}>
                        Continuous Sub-Lessons ({subLessons.length})
                      </h4>
                    </div>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "#64748b" }}>
                      Multi-section scrolling flow with live scrollspy (e.g. 2.1.1, 2.1.2, 2.1.3, practice scenarios).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = subLessons.length + 1;
                      const newSub = {
                        id: `sub_${Date.now()}`,
                        sectionNumber: `${subLessons.length > 0 ? subLessons[0].sectionNumber.split(".").slice(0, 2).join(".") || "1.1" : "1.1"}.${nextIdx}`,
                        title: `Sub-Lesson ${nextIdx}`,
                        type: "READING",
                        content: "",
                      };
                      setSubLessons((prev) => [...prev, newSub]);
                      setEditingSubIndex(subLessons.length);
                    }}
                    style={{
                      padding: "0.4rem 0.85rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: "#011936",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <span>+</span>
                    <span>Add Sub-Lesson</span>
                  </button>
                </div>

                {subLessons.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "#64748b", fontStyle: "italic" }}>
                    Currently a single lesson. Click &quot;+ Add Sub-Lesson&quot; above to convert this into a multi-part continuous scroll lesson.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {subLessons.map((sub, sIdx) => {
                      const isEditingThis = editingSubIndex === sIdx;
                      return (
                        <div
                          key={sub.id || sIdx}
                          style={{
                            background: "#fff",
                            border: isEditingThis ? "1.5px solid #049fd9" : "1px solid #cbd5e1",
                            borderRadius: "8px",
                            padding: "0.85rem 1rem",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ fontWeight: 800, fontSize: "0.75rem", color: "#011936", background: "#f1f5f9", padding: "0.15rem 0.45rem", borderRadius: "4px" }}>
                                {sub.sectionNumber || `${sIdx + 1}`}
                              </span>
                              <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1e293b" }}>
                                {sub.title || `Sub-Lesson ${sIdx + 1}`}
                              </span>
                              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#0369a1", background: "#e0f2fe", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
                                {sub.type}
                              </span>
                            </div>

                            <div style={{ display: "flex", gap: "0.4rem" }}>
                              <button
                                type="button"
                                onClick={() => setEditingSubIndex(isEditingThis ? null : sIdx)}
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  color: isEditingThis ? "#0284c7" : "#475569",
                                  background: isEditingThis ? "#e0f2fe" : "#f1f5f9",
                                  border: "none",
                                  padding: "0.25rem 0.6rem",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                }}
                              >
                                {isEditingThis ? "Done" : "Edit"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSubLessons((prev) => prev.filter((_, i) => i !== sIdx));
                                  if (editingSubIndex === sIdx) setEditingSubIndex(null);
                                }}
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  color: "#dc2626",
                                  background: "#fee2e2",
                                  border: "none",
                                  padding: "0.25rem 0.6rem",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          {isEditingThis && (
                            <div style={{ marginTop: "0.85rem", paddingTop: "0.85rem", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 140px", gap: "0.5rem" }}>
                                <div>
                                  <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.2rem" }}>Section #</label>
                                  <input
                                    type="text"
                                    value={sub.sectionNumber}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setSubLessons((prev) => {
                                        const copy = [...prev];
                                        copy[sIdx] = { ...copy[sIdx], sectionNumber: val };
                                        return copy;
                                      });
                                    }}
                                    className="input"
                                    style={{ width: "100%", padding: "0.4rem 0.5rem", fontSize: "0.8125rem" }}
                                  />
                                </div>

                                <div>
                                  <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.2rem" }}>Sub-Lesson Title</label>
                                  <input
                                    type="text"
                                    value={sub.title}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setSubLessons((prev) => {
                                        const copy = [...prev];
                                        copy[sIdx] = { ...copy[sIdx], title: val };
                                        return copy;
                                      });
                                    }}
                                    className="input"
                                    style={{ width: "100%", padding: "0.4rem 0.5rem", fontSize: "0.8125rem" }}
                                  />
                                </div>

                                <div>
                                  <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.2rem" }}>Type</label>
                                  <select
                                    value={sub.type}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setSubLessons((prev) => {
                                        const copy = [...prev];
                                        copy[sIdx] = { ...copy[sIdx], type: val };
                                        return copy;
                                      });
                                    }}
                                    style={{ width: "100%", padding: "0.4rem 0.5rem", fontSize: "0.8125rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                                  >
                                    <option value="READING">Reading Guide</option>
                                    <option value="VIDEO">Video Lecture</option>
                                    <option value="PRACTICE">Practice Scenario</option>
                                    <option value="CODING_EXERCISE">Python Coding Lab</option>
                                    <option value="SQL_EXERCISE">SQL Query Lab</option>
                                    <option value="QUIZ">Concept Quiz</option>
                                    <option value="DOWNLOADABLE">Downloadable Asset</option>
                                    <option value="EXTERNAL_RESOURCE">External Tool</option>
                                    <option value="PROJECT">Capstone Project</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.2rem" }}>Media Banner / Illustration URL (optional)</label>
                                <input
                                  type="url"
                                  placeholder="https://images.unsplash.com/..."
                                  value={sub.mediaUrl || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSubLessons((prev) => {
                                      const copy = [...prev];
                                      copy[sIdx] = { ...copy[sIdx], mediaUrl: val || undefined };
                                      return copy;
                                    });
                                  }}
                                  className="input"
                                  style={{ width: "100%", padding: "0.4rem 0.5rem", fontSize: "0.8125rem" }}
                                />
                              </div>

                              {/* Specialized fields per sub-lesson type */}
                              {(sub.type === "VIDEO" || sub.type === "VIDEO_READING") && (
                                <div>
                                  <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.2rem" }}>Video URL (YouTube or Vimeo)</label>
                                  <input
                                    type="url"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    value={sub.videoUrl || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setSubLessons((prev) => {
                                        const copy = [...prev];
                                        copy[sIdx] = { ...copy[sIdx], videoUrl: val || undefined };
                                        return copy;
                                      });
                                    }}
                                    className="input"
                                    style={{ width: "100%", padding: "0.4rem 0.5rem", fontSize: "0.8125rem" }}
                                  />
                                </div>
                              )}

                              {sub.type === "CODING_EXERCISE" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                  <div>
                                    <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.2rem" }}>Python Starter Code</label>
                                    <textarea
                                      rows={4}
                                      value={sub.starterCode || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSubLessons((prev) => {
                                          const copy = [...prev];
                                          copy[sIdx] = { ...copy[sIdx], starterCode: val };
                                          return copy;
                                        });
                                      }}
                                      className="input"
                                      placeholder="import numpy as np..."
                                      style={{ width: "100%", padding: "0.4rem 0.5rem", fontSize: "0.8125rem", fontFamily: "var(--font-mono)" }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.2rem" }}>Solution Hint (optional)</label>
                                    <input
                                      type="text"
                                      value={sub.solutionHint || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSubLessons((prev) => {
                                          const copy = [...prev];
                                          copy[sIdx] = { ...copy[sIdx], solutionHint: val };
                                          return copy;
                                        });
                                      }}
                                      className="input"
                                      placeholder="Consider using np.mean() along axis 0"
                                      style={{ width: "100%", padding: "0.4rem 0.5rem", fontSize: "0.8125rem" }}
                                    />
                                  </div>
                                </div>
                              )}

                              {sub.type === "SQL_EXERCISE" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                  <div>
                                    <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.2rem" }}>Target Schema Context</label>
                                    <textarea
                                      rows={2}
                                      value={sub.schemaContext || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSubLessons((prev) => {
                                          const copy = [...prev];
                                          copy[sIdx] = { ...copy[sIdx], schemaContext: val };
                                          return copy;
                                        });
                                      }}
                                      className="input"
                                      placeholder="orders(id, customer_id, amount, status)"
                                      style={{ width: "100%", padding: "0.4rem 0.5rem", fontSize: "0.8125rem", fontFamily: "var(--font-mono)" }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.2rem" }}>SQL Starter Query</label>
                                    <textarea
                                      rows={3}
                                      value={sub.starterSql || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSubLessons((prev) => {
                                          const copy = [...prev];
                                          copy[sIdx] = { ...copy[sIdx], starterSql: val };
                                          return copy;
                                        });
                                      }}
                                      className="input"
                                      placeholder="SELECT * FROM orders WHERE..."
                                      style={{ width: "100%", padding: "0.4rem 0.5rem", fontSize: "0.8125rem", fontFamily: "var(--font-mono)" }}
                                    />
                                  </div>
                                </div>
                              )}

                              {sub.type === "DOWNLOADABLE" && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "0.5rem" }}>
                                  <div>
                                    <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.2rem" }}>Download URL / Asset Path</label>
                                    <input
                                      type="text"
                                      value={sub.downloadUrl || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSubLessons((prev) => {
                                          const copy = [...prev];
                                          copy[sIdx] = { ...copy[sIdx], downloadUrl: val };
                                          return copy;
                                        });
                                      }}
                                      className="input"
                                      placeholder="/datasets/orders_data.zip"
                                      style={{ width: "100%", padding: "0.4rem 0.5rem", fontSize: "0.8125rem" }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.2rem" }}>File Name</label>
                                    <input
                                      type="text"
                                      value={sub.fileName || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSubLessons((prev) => {
                                          const copy = [...prev];
                                          copy[sIdx] = { ...copy[sIdx], fileName: val };
                                          return copy;
                                        });
                                      }}
                                      className="input"
                                      placeholder="dataset.zip"
                                      style={{ width: "100%", padding: "0.4rem 0.5rem", fontSize: "0.8125rem" }}
                                    />
                                  </div>
                                </div>
                              )}

                              {sub.type === "EXTERNAL_RESOURCE" && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: "0.5rem" }}>
                                  <div>
                                    <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.2rem" }}>External Tool URL</label>
                                    <input
                                      type="url"
                                      value={sub.externalUrl || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSubLessons((prev) => {
                                          const copy = [...prev];
                                          copy[sIdx] = { ...copy[sIdx], externalUrl: val };
                                          return copy;
                                        });
                                      }}
                                      className="input"
                                      placeholder="https://colab.research.google.com"
                                      style={{ width: "100%", padding: "0.4rem 0.5rem", fontSize: "0.8125rem" }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.2rem" }}>Provider Name</label>
                                    <input
                                      type="text"
                                      value={sub.provider || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSubLessons((prev) => {
                                          const copy = [...prev];
                                          copy[sIdx] = { ...copy[sIdx], provider: val };
                                          return copy;
                                        });
                                      }}
                                      className="input"
                                      placeholder="Google Colab"
                                      style={{ width: "100%", padding: "0.4rem 0.5rem", fontSize: "0.8125rem" }}
                                    />
                                  </div>
                                </div>
                              )}

                              {(sub.type === "PROJECT" || sub.type === "ASSIGNMENT") && (
                                <div>
                                  <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.2rem" }}>Starter Repo URL (optional)</label>
                                  <input
                                    type="url"
                                    value={sub.starterRepoUrl || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setSubLessons((prev) => {
                                        const copy = [...prev];
                                        copy[sIdx] = { ...copy[sIdx], starterRepoUrl: val };
                                        return copy;
                                      });
                                    }}
                                    className="input"
                                    placeholder="https://github.com/aitechhub/capstone-starter"
                                    style={{ width: "100%", padding: "0.4rem 0.5rem", fontSize: "0.8125rem" }}
                                  />
                                </div>
                              )}

                              <div>
                                <label style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.2rem" }}>Sub-Lesson Content (Markdown)</label>
                                <textarea
                                  rows={4}
                                  value={sub.content}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSubLessons((prev) => {
                                      const copy = [...prev];
                                      copy[sIdx] = { ...copy[sIdx], content: val };
                                      return copy;
                                    });
                                  }}
                                  className="input"
                                  placeholder="Enter instructional text, concepts, or instructions for this sub-lesson..."
                                  style={{ width: "100%", padding: "0.4rem 0.5rem", fontSize: "0.8125rem", fontFamily: "var(--font-mono)" }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Free preview toggle */}
              <div style={{ background: "var(--na-gray-50)", padding: "0.75rem 1rem", borderRadius: "6px", border: "1px solid var(--na-gray-200)" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", fontSize: "0.875rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={lessonPreview}
                    onChange={(e) => setLessonPreview(e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>Allow Free Preview</span>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "var(--na-gray-500)" }}>
                      Prospective learners can access this lesson before purchasing or enrolling in the course.
                    </span>
                  </div>
                </label>
              </div>

              {/* Modal Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid var(--na-gray-200)" }}>
                <button type="button" onClick={() => setShowLessonModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={lessonLoading} className="btn btn-green" style={{ minWidth: 140 }}>
                  {lessonLoading ? "Saving…" : editingLessonId ? "Save Changes" : "Create Lesson"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
