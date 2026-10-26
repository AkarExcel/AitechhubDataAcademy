import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function CourseDetailLoading() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "var(--topbar-height)", minHeight: "100vh", background: "var(--na-gray-50)" }}>
        {/* Hero Skeleton */}
        <div style={{ background: "linear-gradient(135deg, var(--na-navy-900), var(--na-navy-800))", padding: "3.5rem 0 3rem" }}>
          <div className="container">
            <div style={{ maxWidth: 860 }}>
              <div className="skeleton" style={{ width: 180, height: 16, marginBottom: "1rem", background: "rgba(255,255,255,0.1)" }} />
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <div className="skeleton" style={{ width: 80, height: 24, borderRadius: 999, background: "rgba(255,255,255,0.15)" }} />
                <div className="skeleton" style={{ width: 90, height: 24, borderRadius: 999, background: "rgba(255,255,255,0.15)" }} />
              </div>
              <div className="skeleton" style={{ width: "70%", height: 42, marginBottom: "1rem", background: "rgba(255,255,255,0.2)" }} />
              <div className="skeleton" style={{ width: "90%", height: 20, marginBottom: "2rem", background: "rgba(255,255,255,0.1)" }} />
              <div className="skeleton" style={{ width: 220, height: 48, borderRadius: 999, background: "rgba(255,255,255,0.2)" }} />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="container" style={{ padding: "3rem 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.65fr 1fr", gap: "2.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div className="skeleton" style={{ height: 160, borderRadius: "10px" }} />
              <div className="skeleton" style={{ height: 320, borderRadius: "10px" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div className="skeleton" style={{ height: 280, borderRadius: "10px" }} />
              <div className="skeleton" style={{ height: 140, borderRadius: "10px" }} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
