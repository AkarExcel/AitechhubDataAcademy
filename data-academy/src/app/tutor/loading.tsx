export default function TutorLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--na-gray-50)", display: "flex" }}>
      {/* Sidebar Skeleton */}
      <div
        style={{
          width: 250,
          background: "var(--na-navy-900)",
          padding: "2rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        <div className="skeleton" style={{ width: "65%", height: 26, background: "rgba(255,255,255,0.15)" }} />
        <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 38, borderRadius: 6, background: "rgba(255,255,255,0.08)" }} />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div style={{ flex: 1, padding: "2.5rem 3rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <div className="skeleton" style={{ width: 240, height: 32, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 360, height: 16 }} />
          </div>
          <div className="skeleton" style={{ width: 150, height: 40, borderRadius: 6 }} />
        </div>

        {/* Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem", marginBottom: "2rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ padding: "1.5rem" }}>
              <div className="skeleton" style={{ width: "50%", height: 14, marginBottom: 12 }} />
              <div className="skeleton" style={{ width: "70%", height: 30 }} />
            </div>
          ))}
        </div>

        {/* Assigned Courses List skeleton */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div className="skeleton" style={{ width: 200, height: 22, marginBottom: "1.5rem" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.25rem" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: 120, borderRadius: 8 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
