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

export default function CourseEditorClient({
  initialCourse,
  categories,
  availableTutors,
  defaultTab,
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
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDesc, setModuleDesc] = useState("");
  const [moduleLoading, setModuleLoading] = useState(false);

  // Lesson modal state
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState("READING");
  const [lessonMinutes, setLessonMinutes] = useState(15);
  const [lessonVideo, setLessonVideo] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonPreview, setLessonPreview] = useState(false);
  const [lessonLoading, setLessonLoading] = useState(false);

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

  // ── ADD MODULE ───────────────────────────────────────────
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;

    setModuleLoading(true);
    setMessage(null);

    try {
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
    } catch {
      setMessage({ text: "Network error creating module.", type: "error" });
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

  // ── ADD LESSON ───────────────────────────────────────────
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetModuleId || !lessonTitle.trim()) return;

    setLessonLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/modules/${targetModuleId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lessonTitle.trim(),
          type: lessonType,
          estimatedMinutes: Number(lessonMinutes),
          videoUrl: lessonVideo.trim() || null,
          content: lessonContent.trim() || null,
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
    } catch {
      setMessage({ text: "Failed to create lesson.", type: "error" });
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
              onClick={() => setShowModuleModal(true)}
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
                        onClick={() => {
                          setTargetModuleId(m.id);
                          setShowLessonModal(true);
                        }}
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
                            padding: "0.65rem 0.875rem",
                            background: "var(--na-gray-50)",
                            border: "1px solid var(--na-gray-200)",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--na-gray-400)", fontWeight: 600 }}>
                              {mIdx + 1}.{lIdx + 1}
                            </span>
                            <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.4rem", background: "rgba(4, 159, 217, 0.12)", color: "var(--na-blue-600)", fontWeight: 700, borderRadius: "4px" }}>
                              {lesson.type}
                            </span>
                            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1b2533" }}>
                              {lesson.title}
                            </span>
                            {lesson.isPreview && (
                              <span style={{ fontSize: "0.6875rem", padding: "0.1rem 0.35rem", background: "var(--na-green-100)", color: "var(--na-green-700)", borderRadius: "4px" }}>
                                Free Preview
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--na-gray-500)" }}>
                              {lesson.estimatedMinutes} min
                            </span>
                            <button
                              onClick={() => handleDeleteLesson(m.id, lesson.id)}
                              style={{ background: "none", border: "none", color: "#e11d48", cursor: "pointer", fontSize: "0.75rem" }}
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

      {/* ── MODAL: ADD MODULE ───────────────────────────────── */}
      {showModuleModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div className="card" style={{ width: "100%", maxWidth: 480, padding: "2rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1b2533", marginBottom: "1rem" }}>
              Add Curriculum Module
            </h3>

            <form onSubmit={handleCreateModule} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
                  {moduleLoading ? "Saving…" : "Add Module"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD LESSON ───────────────────────────────── */}
      {showLessonModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div className="card" style={{ width: "100%", maxWidth: 560, padding: "2rem", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1b2533", marginBottom: "1rem" }}>
              Add Lesson
            </h3>

            <form onSubmit={handleCreateLesson} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                  Lesson Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Wrangling with Pandas"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="input"
                  style={{ width: "100%", padding: "0.625rem 0.875rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                    Lesson Format
                  </label>
                  <select
                    value={lessonType}
                    onChange={(e) => setLessonType(e.target.value)}
                    className="input"
                    style={{ width: "100%", padding: "0.625rem 0.875rem", background: "#fff" }}
                  >
                    <option value="READING">Reading Guide</option>
                    <option value="VIDEO">Video Lecture</option>
                    <option value="VIDEO_READING">Video + Reading</option>
                    <option value="CODING_EXERCISE">Python Coding Lab</option>
                    <option value="SQL_EXERCISE">SQL Query Lab</option>
                    <option value="QUIZ">Concept Quiz</option>
                    <option value="ASSIGNMENT">Graded Assignment</option>
                    <option value="PROJECT">Practical Project</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                    Estimated Minutes
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={lessonMinutes}
                    onChange={(e) => setLessonMinutes(Number(e.target.value))}
                    className="input"
                    style={{ width: "100%", padding: "0.625rem 0.875rem" }}
                  />
                </div>
              </div>

              {/* Video URL (optional) */}
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                  Video URL (YouTube, Vimeo, MP4 stream - optional)
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={lessonVideo}
                  onChange={(e) => setLessonVideo(e.target.value)}
                  className="input"
                  style={{ width: "100%", padding: "0.625rem 0.875rem" }}
                />
              </div>

              {/* Markdown Content */}
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                  Lesson Instruction Content (Markdown supported)
                </label>
                <textarea
                  rows={4}
                  placeholder="## Lesson Overview&#10;&#10;Key concepts, code examples, and instructions."
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  className="input"
                  style={{ width: "100%", padding: "0.625rem 0.875rem", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}
                />
              </div>

              {/* Free preview toggle */}
              <div>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={lessonPreview}
                    onChange={(e) => setLessonPreview(e.target.checked)}
                  />
                  <span>Allow free preview for prospective learners</span>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowLessonModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={lessonLoading} className="btn btn-green">
                  {lessonLoading ? "Creating…" : "Save Lesson"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
