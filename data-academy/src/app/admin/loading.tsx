export default function AdminLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--na-gray-50)", display: "flex" }}>
      {/* Sidebar Skeleton */}
      <div
        style={{
          width: 260,
          background: "var(--na-navy-900)",
          padding: "2rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        <div className="skeleton" style={{ width: "70%", height: 28, background: "rgba(255,255,255,0.15)" }} />
        <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: 38, borderRadius: 6, background: "rgba(255,255,255,0.08)" }} />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div style={{ flex: 1, padding: "2.5rem 3rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <div className="skeleton" style={{ width: 220, height: 32, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 340, height: 16 }} />
          </div>
          <div className="skeleton" style={{ width: 140, height: 40, borderRadius: 6 }} />
        </div>

        {/* 4 Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem", marginBottom: "2rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ padding: "1.5rem" }}>
              <div className="skeleton" style={{ width: "40%", height: 14, marginBottom: 12 }} />
              <div className="skeleton" style={{ width: "65%", height: 28 }} />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div className="skeleton" style={{ width: 180, height: 20, marginBottom: "1.5rem" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ height: 48, borderRadius: 6 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
