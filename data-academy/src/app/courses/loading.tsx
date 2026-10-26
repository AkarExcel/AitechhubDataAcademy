import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function CoursesLoading() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "var(--topbar-height)", minHeight: "100vh", background: "var(--na-gray-50)" }}>
        {/* Banner Skeleton */}
        <div style={{ background: "linear-gradient(135deg, var(--na-navy-900), var(--na-navy-800))", padding: "3rem 0 2.5rem" }}>
          <div className="container">
            <div className="skeleton" style={{ width: 140, height: 16, marginBottom: "0.75rem", background: "rgba(255,255,255,0.1)" }} />
            <div className="skeleton" style={{ width: 340, height: 36, marginBottom: "0.75rem", background: "rgba(255,255,255,0.15)" }} />
            <div className="skeleton" style={{ width: 480, height: 20, background: "rgba(255,255,255,0.1)" }} />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="container" style={{ padding: "2.5rem 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "2rem" }}>
            {/* Sidebar Filter Skeleton */}
            <div className="desktop-only" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="skeleton" style={{ height: 220, borderRadius: "10px" }} />
              <div className="skeleton" style={{ height: 160, borderRadius: "10px" }} />
            </div>

            {/* Course Cards Grid Skeleton */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div className="skeleton" style={{ width: 180, height: 24 }} />
                <div className="skeleton" style={{ width: 120, height: 24 }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    style={{
                      background: "#fff",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      height: 380,
                    }}
                  >
                    <div className="skeleton" style={{ height: 175, borderRadius: 0 }} />
                    <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
                      <div className="skeleton" style={{ width: 110, height: 14 }} />
                      <div className="skeleton" style={{ width: "85%", height: 22 }} />
                      <div className="skeleton" style={{ width: "100%", height: 14 }} />
                      <div className="skeleton" style={{ width: "70%", height: 14 }} />
                      <div style={{ marginTop: "auto", paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9" }}>
                        <div className="skeleton" style={{ width: 140, height: 14 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
