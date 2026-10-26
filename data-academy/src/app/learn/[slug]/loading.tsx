export default function LearnLoading() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      {/* Top Header Skeleton */}
      <header
        style={{
          height: 64,
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.25rem",
          position: "sticky",
          top: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div className="skeleton" style={{ width: 100, height: 32, borderRadius: "6px", background: "rgba(255,255,255,0.1)" }} />
          <div className="skeleton" style={{ width: 220, height: 20, background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div className="skeleton" style={{ width: 100, height: 32, borderRadius: "6px", background: "rgba(255,255,255,0.1)" }} />
          <div className="skeleton" style={{ width: 100, height: 32, borderRadius: "6px", background: "rgba(255,255,255,0.1)" }} />
        </div>
      </header>

      {/* Workspace Skeleton */}
      <div style={{ display: "flex", flex: 1 }}>
        <main style={{ flex: 1, padding: "2.5rem 3rem", maxWidth: 960, margin: "0 auto", width: "100%" }}>
          <div className="skeleton" style={{ width: 160, height: 18, marginBottom: "0.75rem" }} />
          <div className="skeleton" style={{ width: "65%", height: 36, marginBottom: "2rem" }} />
          <div className="skeleton" style={{ width: "100%", height: 380, borderRadius: "12px", marginBottom: "2rem" }} />
          <div className="skeleton" style={{ width: "100%", height: 20, marginBottom: "0.75rem" }} />
          <div className="skeleton" style={{ width: "95%", height: 20, marginBottom: "0.75rem" }} />
          <div className="skeleton" style={{ width: "80%", height: 20 }} />
        </main>

        <aside
          className="desktop-only"
          style={{
            width: 360,
            background: "#fff",
            borderLeft: "1px solid #e2e8f0",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div className="skeleton" style={{ width: 140, height: 16 }} />
          <div className="skeleton" style={{ width: "100%", height: 8, borderRadius: 999 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="skeleton" style={{ height: 44, borderRadius: "6px" }} />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
