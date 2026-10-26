import Navbar from "@/components/layout/Navbar";

export default function DashboardLoading() {
  return (
    <>
      <Navbar />
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "var(--na-gray-50)",
          paddingTop: "var(--topbar-height)",
        }}
      >
        {/* Sidebar Skeleton */}
        <aside
          className="desktop-only"
          style={{
            width: "var(--sidebar-width)",
            background: "#0f172a",
            padding: "1.5rem 1rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div className="skeleton" style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <div className="skeleton" style={{ width: 90, height: 14, background: "rgba(255,255,255,0.15)" }} />
              <div className="skeleton" style={{ width: 60, height: 10, background: "rgba(255,255,255,0.1)" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton" style={{ height: 36, borderRadius: "6px", background: "rgba(255,255,255,0.08)" }} />
            ))}
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <main style={{ flex: 1, padding: "2rem" }}>
          <div style={{ marginBottom: "2rem" }}>
            <div className="skeleton" style={{ width: 280, height: 32, marginBottom: "0.5rem" }} />
            <div className="skeleton" style={{ width: 380, height: 16 }} />
          </div>

          {/* Stats Skeleton */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card" style={{ padding: "1.25rem", background: "#fff", borderRadius: "10px" }}>
                <div className="skeleton" style={{ width: 80, height: 12, marginBottom: "0.5rem" }} />
                <div className="skeleton" style={{ width: 50, height: 28 }} />
              </div>
            ))}
          </div>

          {/* Enrolled Courses Skeleton */}
          <div>
            <div className="skeleton" style={{ width: 200, height: 24, marginBottom: "1rem" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
              {[1, 2].map((i) => (
                <div key={i} style={{ background: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden", height: 260 }}>
                  <div className="skeleton" style={{ height: 110, borderRadius: 0 }} />
                  <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div className="skeleton" style={{ width: "80%", height: 20 }} />
                    <div className="skeleton" style={{ width: "100%", height: 10, borderRadius: 999 }} />
                    <div className="skeleton" style={{ width: "100%", height: 36, borderRadius: "6px", marginTop: "auto" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
