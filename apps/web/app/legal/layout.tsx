import Link from "next/link";

const INTER = { fontFamily: "'Inter', sans-serif" };

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000", ...INTER }}>
      {/* Navbar */}
      <nav style={{ borderBottom: "1px solid #111", padding: "16px 0", backgroundColor: "rgba(0,0,0,0.9)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: "880px", margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#e6edf3", fontSize: "14px", fontWeight: 600 }}>← Skopos</Link>
          <div style={{ display: "flex", gap: "20px" }}>
            <Link href="/legal/privacy" style={{ color: "#a0aab4", fontSize: "12px", textDecoration: "none" }}>Privacy</Link>
            <Link href="/legal/terms" style={{ color: "#a0aab4", fontSize: "12px", textDecoration: "none" }}>Terms</Link>
            <Link href="/legal/cookies" style={{ color: "#a0aab4", fontSize: "12px", textDecoration: "none" }}>Cookies</Link>
            <Link href="/legal/dpa" style={{ color: "#a0aab4", fontSize: "12px", textDecoration: "none" }}>DPA</Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: "780px", margin: "0 auto", padding: "60px 24px 80px" }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #111", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ color: "#444", fontSize: "11px", margin: 0 }}>
          © {new Date().getFullYear()} Skopos · See what&apos;s breaking. Fix it fast.
        </p>
      </footer>
    </div>
  );
}
