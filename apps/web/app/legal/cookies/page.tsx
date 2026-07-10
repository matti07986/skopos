export const metadata = { title: "Cookie Policy — Skopos" };

const INTER = { fontFamily: "'Inter', sans-serif" };
const h2 = { color: "#e6edf3", fontSize: "20px", fontWeight: 600, marginTop: "40px", marginBottom: "14px", ...INTER };
const p  = { color: "#a0aab4", fontSize: "14px", lineHeight: 1.8, marginBottom: "14px", ...INTER };
const ul = { color: "#a0aab4", fontSize: "14px", lineHeight: 1.8, marginBottom: "14px", paddingLeft: "20px", ...INTER };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const, marginBottom: "20px", fontSize: "13px", ...INTER };
const th = { textAlign: "left" as const, padding: "10px", borderBottom: "1px solid #1a1a1a", color: "#e6edf3", fontWeight: 600 };
const td = { padding: "10px", borderBottom: "1px solid #111", color: "#a0aab4", verticalAlign: "top" as const };

export default function CookiesPage() {
  return (
    <article>
      <h1 style={{ color: "#e6edf3", fontSize: "32px", fontWeight: 700, marginBottom: "8px", ...INTER }}>Cookie Policy</h1>
      <p style={{ color: "#666", fontSize: "12px", marginBottom: "30px", ...INTER }}>Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>

      <p style={p}>This Cookie Policy explains what cookies are, how Skopos uses them, and how you can manage your preferences. It complies with EU ePrivacy Directive and GDPR.</p>

      <h2 style={h2}>1. What are cookies?</h2>
      <p style={p}>Cookies are small text files saved on your device when you visit a website. They allow the site to remember your actions, preferences, and authentication state. Similar technologies include localStorage, sessionStorage, and IndexedDB.</p>

      <h2 style={h2}>2. How we use cookies</h2>
      <p style={p}>Skopos uses cookies and similar technologies only for <strong>technical purposes</strong> strictly necessary for the Service to function. We do NOT use third-party advertising, profiling, or tracking cookies.</p>

      <h2 style={h2}>3. Cookies used</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={th}>Name</th>
            <th style={th}>Type</th>
            <th style={th}>Purpose</th>
            <th style={th}>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={td}>skopos_access_token</td>
            <td style={td}>Technical (localStorage)</td>
            <td style={td}>Keeps you authenticated.</td>
            <td style={td}>7 days</td>
          </tr>
          <tr>
            <td style={td}>skopos_active_project</td>
            <td style={td}>Technical (localStorage)</td>
            <td style={td}>Remembers the last selected project.</td>
            <td style={td}>Until logout</td>
          </tr>
          <tr>
            <td style={td}>skopos_chat_*</td>
            <td style={td}>Technical (localStorage)</td>
            <td style={td}>Stores AI chat history per project, on your device.</td>
            <td style={td}>Until logout / Clear</td>
          </tr>
          <tr>
            <td style={td}>skopos_pending_email</td>
            <td style={td}>Technical (sessionStorage)</td>
            <td style={td}>Temporary support for email verification flow.</td>
            <td style={td}>Session</td>
          </tr>
        </tbody>
      </table>

      <h2 style={h2}>4. Do we use third-party cookies?</h2>
      <p style={p}>Currently NO. We do not use Google Analytics, Facebook Pixel, advertising cookies, or third-party trackers. We may introduce analytics tools in the future that are privacy-friendly (e.g., Plausible, Fathom); if so, we will update this Policy and request consent where required.</p>

      <h2 style={h2}>5. Managing cookies</h2>
      <p style={p}>Because we only use cookies strictly necessary for the Service, no consent banner is required by EU law. However, you can:</p>
      <ul style={ul}>
        <li>Configure your browser to block all cookies (note: the Service won&apos;t work without technical cookies).</li>
        <li>Manually delete cookies and localStorage from your browser settings.</li>
        <li>Use private/incognito browsing mode.</li>
      </ul>

      <h2 style={h2}>6. Changes</h2>
      <p style={p}>We may update this Cookie Policy when technical needs change. The publication date at the top will be updated.</p>

      <h2 style={h2}>7. Contact</h2>
      <p style={p}>Questions about cookies: <a href="mailto:support@skopos.ink" style={{ color: "#4ade80" }}>support@skopos.ink</a></p>
    </article>
  );
}
