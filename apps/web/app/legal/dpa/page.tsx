export const metadata = { title: "Data Processing Agreement — Skopos" };

const INTER = { fontFamily: "'Inter', sans-serif" };
const h2 = { color: "#e6edf3", fontSize: "20px", fontWeight: 600, marginTop: "40px", marginBottom: "14px", ...INTER };
const p  = { color: "#a0aab4", fontSize: "14px", lineHeight: 1.8, marginBottom: "14px", ...INTER };
const ul = { color: "#a0aab4", fontSize: "14px", lineHeight: 1.8, marginBottom: "14px", paddingLeft: "20px", ...INTER };

export default function DpaPage() {
  return (
    <article>
      <h1 style={{ color: "#e6edf3", fontSize: "32px", fontWeight: 700, marginBottom: "8px", ...INTER }}>Data Processing Agreement</h1>
      <p style={{ color: "#666", fontSize: "12px", marginBottom: "30px", ...INTER }}>Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>

      <p style={p}>This Data Processing Agreement (&quot;DPA&quot;) forms part of the Terms of Service between Skopos (&quot;Processor&quot;) and the Customer (&quot;Controller&quot;) and regulates the processing of personal data carried out on behalf of the Controller in accordance with Article 28 of the GDPR.</p>

      <p style={p}><strong>Note for B2B customers:</strong> if you process personal data of your end users via our Service (Controller), this DPA is automatically applicable upon acceptance of the Terms. For signed copies on company letterhead, contact <a href="mailto:support@skopos.ink" style={{ color: "#4ade80" }}>support@skopos.ink</a>.</p>

      <h2 style={h2}>1. Definitions</h2>
      <ul style={ul}>
        <li><strong>Personal data, Controller, Processor, Sub-processor:</strong> as defined in GDPR Article 4.</li>
        <li><strong>Service:</strong> the Skopos platform described in the Terms.</li>
        <li><strong>Customer data:</strong> personal data processed by Skopos on behalf of the Controller.</li>
      </ul>

      <h2 style={h2}>2. Subject and duration</h2>
      <p style={p}>Skopos processes Customer data only on documented instructions from the Controller, for the duration of the Service contract.</p>

      <h2 style={h2}>3. Nature and purpose of processing</h2>
      <ul style={ul}>
        <li><strong>Nature:</strong> storage, indexing, analysis, AI-generated insights of application logs.</li>
        <li><strong>Purpose:</strong> providing the log monitoring Service.</li>
        <li><strong>Data categories:</strong> log content (which may include user identifiers, IP addresses, technical metadata).</li>
        <li><strong>Data subjects:</strong> end users of the Controller&apos;s applications.</li>
      </ul>

      <h2 style={h2}>4. Obligations of the Processor</h2>
      <p style={p}>Skopos commits to:</p>
      <ul style={ul}>
        <li>Process data only on documented instructions from the Controller.</li>
        <li>Ensure confidentiality of personnel authorized to process data.</li>
        <li>Apply appropriate technical and organizational measures (Art. 32 GDPR).</li>
        <li>Assist the Controller in fulfilling requests from data subjects (Art. 15–22 GDPR).</li>
        <li>Notify the Controller of personal data breaches without undue delay (within 72 hours where possible).</li>
        <li>Make available all information necessary to demonstrate compliance with Art. 28 GDPR.</li>
      </ul>

      <h2 style={h2}>5. Sub-processors</h2>
      <p style={p}>The Controller authorizes Skopos to use the sub-processors listed in our <a href="/legal/privacy" style={{ color: "#4ade80" }}>Privacy Policy</a> (Hetzner, Vercel, Cloudflare, Anthropic, Resend, Lemon Squeezy). The full and current list is maintained on the Privacy Policy page; new sub-processors are notified by email at least 30 days in advance, giving the Controller the right to object.</p>
      <p style={p}>Skopos remains liable to the Controller for any failure by sub-processors to fulfill their obligations.</p>
      <p style={p}><strong>Lemon Squeezy as Merchant of Record:</strong> for billing, payment, and tax data, Lemon Squeezy acts as an independent Controller under its own privacy policy, not as a sub-processor of Skopos. This DPA does not extend to that processing relationship.</p>

      <h2 style={h2}>6. International transfers</h2>
      <p style={p}>Non-EU transfers are based on Standard Contractual Clauses (SCC) approved by the European Commission, or on equivalent adequacy mechanisms (e.g., EU-US Data Privacy Framework).</p>

      <h2 style={h2}>7. Security measures</h2>
      <p style={p}>Skopos applies:</p>
      <ul style={ul}>
        <li>TLS 1.3 encryption for all data in transit.</li>
        <li>Encrypted database with restricted access.</li>
        <li>Bcrypt password hashing.</li>
        <li>Network and application-level rate limiting.</li>
        <li>Daily backups with 30-day retention.</li>
        <li>Monitoring of unauthorized access.</li>
        <li>Principle of least privilege for personnel access.</li>
      </ul>

      <h2 style={h2}>8. Data subject rights</h2>
      <p style={p}>Skopos provides the Controller with the technical tools to:</p>
      <ul style={ul}>
        <li>Export data (via API).</li>
        <li>Delete data (via project deletion or account closure).</li>
        <li>Rectify data (via dashboard).</li>
      </ul>

      <h2 style={h2}>9. Data return and deletion</h2>
      <p style={p}>Upon termination of the Service, the Controller has 30 days to export their data via API. After that period, data is permanently deleted, except where retention is required by law.</p>

      <h2 style={h2}>10. Audit</h2>
      <p style={p}>The Controller has the right to audit Skopos&apos;s compliance with this DPA by requesting documentation. On-site audits may be agreed upon for Business plans with at least 30 days&apos; notice.</p>

      <h2 style={h2}>11. Liability</h2>
      <p style={p}>Limitations of liability are those set forth in the Terms of Service.</p>

      <h2 style={h2}>12. Contact</h2>
      <p style={p}>Data Protection Officer (DPO): <a href="mailto:support@skopos.ink" style={{ color: "#4ade80" }}>support@skopos.ink</a></p>
    </article>
  );
}
