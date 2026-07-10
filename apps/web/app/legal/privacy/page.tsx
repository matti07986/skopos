export const metadata = { title: "Privacy Policy — Skopos" };

const INTER = { fontFamily: "'Inter', sans-serif" };
const h2 = { color: "#e6edf3", fontSize: "20px", fontWeight: 600, marginTop: "40px", marginBottom: "14px", ...INTER };
const p  = { color: "#a0aab4", fontSize: "14px", lineHeight: 1.8, marginBottom: "14px", ...INTER };
const ul = { color: "#a0aab4", fontSize: "14px", lineHeight: 1.8, marginBottom: "14px", paddingLeft: "20px", ...INTER };

export default function PrivacyPage() {
  return (
    <article>
      <h1 style={{ color: "#e6edf3", fontSize: "32px", fontWeight: 700, marginBottom: "8px", ...INTER }}>Privacy Policy</h1>
      <p style={{ color: "#666", fontSize: "12px", marginBottom: "30px", ...INTER }}>Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>

      <p style={p}>
        Skopos (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy.
        This Privacy Policy explains how we collect, use, store, and disclose your personal data when you use our log monitoring service available at skopos.ink (the &quot;Service&quot;).
      </p>
      <p style={p}>This Policy complies with the EU General Data Protection Regulation (GDPR) and Italian Legislative Decree 196/2003.</p>

      <h2 style={h2}>1. Data Controller</h2>
      <p style={p}>The Data Controller is Skopos, with registered office in Italy. For any privacy-related question contact: <a href="mailto:support@skopos.ink" style={{ color: "#4ade80" }}>support@skopos.ink</a>.</p>

      <h2 style={h2}>2. Personal data we collect</h2>
      <p style={p}>We collect and process the following categories of personal data:</p>
      <ul style={ul}>
        <li><strong>Account data:</strong> email address, hashed password, account creation date.</li>
        <li><strong>Billing data:</strong> when you subscribe to a paid plan, we process billing details via our payment provider (we do not store credit card numbers directly).</li>
        <li><strong>Log data:</strong> the application logs you send to our Service through our SDK, which may contain technical information about your applications.</li>
        <li><strong>Usage data:</strong> aggregated metrics about how you use the Service (login times, features used, AI chat usage).</li>
        <li><strong>Technical data:</strong> IP address, browser type, device information, collected automatically for security and analytics.</li>
      </ul>

      <h2 style={h2}>3. Legal basis for processing</h2>
      <p style={p}>We process your personal data on the following legal bases (GDPR Art. 6):</p>
      <ul style={ul}>
        <li><strong>Contract performance</strong> (Art. 6(1)(b)): to provide the Service you subscribed to.</li>
        <li><strong>Legal obligation</strong> (Art. 6(1)(c)): tax, accounting, and regulatory requirements.</li>
        <li><strong>Legitimate interest</strong> (Art. 6(1)(f)): security, fraud prevention, service improvement.</li>
        <li><strong>Consent</strong> (Art. 6(1)(a)): for non-essential cookies and marketing communications, when applicable.</li>
      </ul>

      <h2 style={h2}>4. How we use your data</h2>
      <ul style={ul}>
        <li>To provide and maintain the Service.</li>
        <li>To process payments and send invoices.</li>
        <li>To send transactional emails (verification, alerts, account notifications).</li>
        <li>To analyse your logs and generate AI-powered insights (only with your data, never aggregated across customers).</li>
        <li>To detect and prevent fraud, abuse, and security incidents.</li>
        <li>To comply with legal obligations.</li>
      </ul>

      <h2 style={h2}>5. Data retention</h2>
      <p style={p}>We retain your data only as long as necessary. Log data retention depends on your subscription plan:</p>
      <ul style={ul}>
        <li><strong>Starter:</strong> 7 days</li>
        <li><strong>Indie:</strong> 21 days</li>
        <li><strong>Pro:</strong> 60 days</li>
        <li><strong>Business:</strong> 90 days</li>
      </ul>
      <p style={p}>After these periods, log data and derived AI insights are automatically and permanently deleted by our retention worker. Other data categories:</p>
      <ul style={ul}>
        <li><strong>Account data:</strong> for the duration of your account, plus 12 months for legal/billing requirements after account closure.</li>
        <li><strong>Backups:</strong> daily database backups are retained for 30 days, then permanently deleted.</li>
      </ul>

      <h2 style={h2}>6. Third-party processors</h2>
      <p style={p}>We share data only with vetted sub-processors strictly necessary to operate the Service:</p>
      <ul style={ul}>
        <li><strong>Hetzner Online GmbH</strong> (Germany, EU): hosting infrastructure for the API and database.</li>
        <li><strong>Vercel Inc.</strong> (USA, SCC + DPF): frontend hosting and CDN.</li>
        <li><strong>Cloudflare, Inc.</strong> (USA, SCC + DPF): DNS, edge security, and inbound email routing for skopos.ink.</li>
        <li><strong>Anthropic PBC</strong> (USA, SCC): AI processing for log insights and chatbot (no training on customer data).</li>
        <li><strong>Resend</strong> (USA, SCC): transactional email delivery.</li>
        <li><strong>Lemon Squeezy, Inc.</strong> (USA, SCC) acts as our <strong>Merchant of Record (MoR)</strong> for all payment transactions. In this role, Lemon Squeezy is the data controller for billing, payment, and tax data, and Skopos receives only the minimum information needed to fulfill the subscription.</li>
      </ul>
      <p style={p}>All non-EU transfers are based on Standard Contractual Clauses (SCC) or equivalent safeguards per GDPR Articles 44–46. New sub-processors are announced at least 30 days in advance via email, giving you the opportunity to object.</p>

      <h2 style={h2}>7. Your rights (GDPR Articles 15–22)</h2>
      <p style={p}>You have the right to:</p>
      <ul style={ul}>
        <li>Access your personal data (Art. 15).</li>
        <li>Rectify inaccurate or incomplete data (Art. 16).</li>
        <li>Erasure — &quot;right to be forgotten&quot; (Art. 17).</li>
        <li>Restrict processing (Art. 18).</li>
        <li>Object to processing based on legitimate interest (Art. 21).</li>
        <li>Data portability in a structured, commonly used, machine-readable format (Art. 20).</li>
        <li>Withdraw consent at any time, without affecting the lawfulness of prior consent-based processing (Art. 7).</li>
        <li>Lodge a complaint with a supervisory authority — typically the Italian Garante per la protezione dei dati personali, or the authority of your habitual residence, place of work, or place of the alleged infringement (Art. 77).</li>
      </ul>
      <p style={p}>To exercise these rights, email <a href="mailto:support@skopos.ink" style={{ color: "#4ade80" }}>support@skopos.ink</a>. We respond within 30 days.</p>

      <h2 style={h2}>8. Security</h2>
      <p style={p}>We apply industry-standard security measures: TLS encryption in transit, bcrypt password hashing, rate limiting, isolated database access, regular backups. No method is 100% secure, but we work continuously to protect your data.</p>

      <h2 style={h2}>9. Changes to this Policy</h2>
      <p style={p}>We may update this Privacy Policy from time to time. We will notify you of material changes by email at least 30 days before they take effect.</p>

      <h2 style={h2}>10. Contact</h2>
      <p style={p}>Email: <a href="mailto:support@skopos.ink" style={{ color: "#4ade80" }}>support@skopos.ink</a></p>
    </article>
  );
}
