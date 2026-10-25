"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TutorUser {
  id: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
  } | null;
  tutorProfile: {
    id: string;
    headline: string | null;
    expertise: string[];
    biography: string | null;
    isApproved: boolean;
    rating: number;
    totalStudents: number;
    courseInstructors: Array<{
      course: { id: string; title: string; slug: string; status: string };
    }>;
  } | null;
}

export default function TutorsClient({
  initialTutors,
  eligibleUsers,
}: {
  initialTutors: TutorUser[];
  eligibleUsers: Array<{
    id: string;
    email: string;
    role: string;
    profile: { firstName: string; lastName: string } | null;
  }>;
}) {
  const router = useRouter();
  const [tutors, setTutors] = useState<TutorUser[]>(initialTutors);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal State for promoting a user to tutor
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(eligibleUsers[0]?.id || "");
  const [headline, setHeadline] = useState("");
  const [biography, setBiography] = useState("");
  const [expertiseInput, setExpertiseInput] = useState("Python, Data Science, Machine Learning");
  const [submitting, setSubmitting] = useState(false);

  // Toggle approval
  const handleToggleApprove = async (tutorProfileId: string) => {
    setActionLoading(tutorProfileId);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/tutors/${tutorProfileId}/approve`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error || "Failed to update tutor status.", type: "error" });
      } else {
        setMessage({ text: data.message, type: "success" });
        setTutors((prev) =>
          prev.map((t) =>
            t.tutorProfile?.id === tutorProfileId
              ? {
                  ...t,
                  tutorProfile: { ...t.tutorProfile, isApproved: data.isApproved },
                }
              : t
          )
        );
        router.refresh();
      }
    } catch {
      setMessage({ text: "Network error occurred.", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  // Add / Promote user to tutor
  const handleAddTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setSubmitting(true);
    setMessage(null);

    const expertiseArray = expertiseInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/admin/tutors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          headline: headline.trim() || "Course Instructor",
          biography: biography.trim() || null,
          expertise: expertiseArray,
          isApproved: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error || "Failed to add tutor.", type: "error" });
      } else {
        setMessage({ text: "Tutor profile created and approved.", type: "success" });
        setShowAddModal(false);
        router.refresh();
      }
    } catch {
      setMessage({ text: "Failed to connect to server.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Alert Banner */}
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

      {/* Header Action Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-green"
          style={{ padding: "0.625rem 1.25rem", borderRadius: "9999px", fontWeight: 700 }}
        >
          + Add New Faculty / Tutor
        </button>
      </div>

      {/* Tutors Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {tutors.map((tutor) => {
          const profile = tutor.tutorProfile;
          const isBusy = actionLoading === profile?.id;
          const assignedCourses = profile?.courseInstructors || [];

          return (
            <div key={tutor.id} className="card" style={{ padding: "1.75rem", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--na-navy-800), var(--na-blue-500))",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {tutor.profile?.firstName?.[0] || tutor.email[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1b2533", margin: 0 }}>
                      {tutor.profile?.firstName} {tutor.profile?.lastName}
                    </h2>
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--na-gray-500)", marginBottom: "0.25rem" }}>
                    {tutor.email}
                  </div>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--na-blue-600)" }}>
                    {profile?.headline || "Instructor"}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ marginBottom: "1rem" }}>
                <span className={`badge ${profile?.isApproved ? "badge-green" : "badge-amber"}`}>
                  {profile?.isApproved ? "Approved Faculty" : "Pending Approval"}
                </span>
              </div>

              {/* Biography snippet */}
              {profile?.biography && (
                <p style={{ fontSize: "0.8125rem", color: "var(--na-gray-600)", lineHeight: 1.6, marginBottom: "1rem", flex: 1 }}>
                  {profile.biography.slice(0, 160)}...
                </p>
              )}

              {/* Expertise Tags */}
              {profile?.expertise && profile.expertise.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1rem" }}>
                  {profile.expertise.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "0.6875rem",
                        padding: "0.15rem 0.45rem",
                        background: "var(--na-gray-100)",
                        borderRadius: "4px",
                        color: "var(--na-gray-700)",
                        fontWeight: 600,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Assigned Courses */}
              <div style={{ borderTop: "1px solid var(--na-gray-100)", paddingTop: "0.875rem", marginTop: "auto" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--na-gray-500)", marginBottom: "0.35rem", textTransform: "uppercase" }}>
                  Assigned Courses ({assignedCourses.length})
                </div>
                {assignedCourses.length === 0 ? (
                  <span style={{ fontSize: "0.8125rem", color: "var(--na-gray-400)" }}>None assigned yet</span>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    {assignedCourses.map((ac) => (
                      <Link
                        key={ac.course.id}
                        href={`/admin/courses/${ac.course.id}`}
                        style={{ fontSize: "0.8125rem", color: "var(--na-blue-600)", textDecoration: "underline" }}
                      >
                        {ac.course.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Approval Action Button */}
              {profile && (
                <div style={{ marginTop: "1.25rem", paddingTop: "0.75rem", borderTop: "1px solid var(--na-gray-100)" }}>
                  <button
                    onClick={() => handleToggleApprove(profile.id)}
                    disabled={isBusy}
                    className={`btn ${profile.isApproved ? "btn-secondary" : "btn-green"}`}
                    style={{ width: "100%", fontSize: "0.8125rem", padding: "0.45rem" }}
                  >
                    {isBusy
                      ? "Updating…"
                      : profile.isApproved
                      ? "Revoke Instructor Approval"
                      : "Approve Instructor Access"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── MODAL: PROMOTE USER TO TUTOR ────────────────────────── */}
      {showAddModal && (
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
          <div className="card" style={{ width: "100%", maxWidth: 520, padding: "2rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1b2533", marginBottom: "1rem" }}>
              Promote User to Faculty / Tutor
            </h3>

            <form onSubmit={handleAddTutor} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                  Select User Account *
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="input"
                  style={{ width: "100%", padding: "0.625rem 0.875rem", background: "#fff" }}
                >
                  {eligibleUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.profile?.firstName} {u.profile?.lastName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                  Headline / Professional Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Data Scientist & Machine Learning Specialist"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="input"
                  style={{ width: "100%", padding: "0.625rem 0.875rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                  Expertise (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Python, Machine Learning, SQL, Big Data"
                  value={expertiseInput}
                  onChange={(e) => setExpertiseInput(e.target.value)}
                  className="input"
                  style={{ width: "100%", padding: "0.625rem 0.875rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "var(--na-gray-700)", marginBottom: "0.35rem" }}>
                  Biography
                </label>
                <textarea
                  rows={3}
                  placeholder="Instructor background, industry experience, teaching philosophy."
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  className="input"
                  style={{ width: "100%", padding: "0.625rem 0.875rem" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-green">
                  {submitting ? "Promoting…" : "Create & Approve Tutor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
