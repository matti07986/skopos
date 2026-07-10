export const metadata = { title: "Terms of Service — Skopos" };

const INTER = { fontFamily: "'Inter', sans-serif" };
const h2 = { color: "#e6edf3", fontSize: "20px", fontWeight: 600, marginTop: "40px", marginBottom: "14px", ...INTER };
const p  = { color: "#a0aab4", fontSize: "14px", lineHeight: 1.8, marginBottom: "14px", ...INTER };
const ul = { color: "#a0aab4", fontSize: "14px", lineHeight: 1.8, marginBottom: "14px", paddingLeft: "20px", ...INTER };

export default function TermsPage() {
  return (
    <article>
      <h1 style={{ color: "#e6edf3", fontSize: "32px", fontWeight: 700, marginBottom: "8px", ...INTER }}>Terms of Service</h1>
      <p style={{ color: "#666", fontSize: "12px", marginBottom: "30px", ...INTER }}>Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>

      <p style={p}>These Terms of Service (&quot;Terms&quot;) govern your access to and use of Skopos (&quot;Service&quot;) operated by Skopos (&quot;we&quot;, &quot;us&quot;). By creating an account or using the Service, you agree to these Terms.</p>

      <h2 style={h2}>1. The Service</h2>
      <p style={p}>Skopos is a SaaS log monitoring platform that allows you to send, store, analyse, and visualise application logs. The Service is provided &quot;as is&quot;, with the features described at skopos.ink applicable to your subscription plan.</p>

      <h2 style={h2}>2. Account</h2>
      <ul style={ul}>
        <li>You must be at least 18 years old to use the Service.</li>
        <li>You are responsible for keeping your credentials secure.</li>
        <li>You are responsible for all activity carried out under your account.</li>
        <li>One account per person/entity; do not share credentials with third parties.</li>
      </ul>

      <h2 style={h2}>3. Subscription plans and billing</h2>
      <ul style={ul}>
        <li>The Service is offered on a free plan (Starter) and paid plans (Indie, Pro, Business) with the prices and limits published at skopos.ink/pricing.</li>
        <li>Billing is monthly, in advance.</li>
        <li>Prices are in EUR. Applicable VAT is added at checkout.</li>
        <li><strong>Lemon Squeezy acts as our Merchant of Record (MoR)</strong> for all transactions. They handle payment processing, sales tax/VAT compliance worldwide, and invoicing on our behalf. Your contractual relationship for the purchase is with Skopos; the financial transaction is processed by Lemon Squeezy under their own terms.</li>
        <li>You can cancel anytime; cancellation takes effect at the end of the paid period.</li>
        <li>We may change prices with 30 days notice via email.</li>
      </ul>

      <h2 style={h2}>4. Acceptable use</h2>
      <p style={p}>You agree NOT to:</p>
      <ul style={ul}>
        <li>Use the Service to violate laws or third-party rights.</li>
        <li>Send logs containing sensitive personal data (health, financial, government IDs) unless explicitly permitted.</li>
        <li>Send unsolicited spam, malware, or fraudulent content.</li>
        <li>Attempt to reverse engineer, decompile, or extract our source code.</li>
        <li>Resell or expose the Service to third parties without our authorization.</li>
        <li>Exceed plan limits to evade payment (e.g., creating multiple free accounts).</li>
        <li>Use the AI features to generate harmful, illegal, or deceptive content.</li>
      </ul>
      <p style={p}>We may suspend or terminate accounts that violate these rules without refund.</p>

      <h2 style={h2}>5. Intellectual property</h2>
      <p style={p}>The Service, its code, design, brand, and documentation are owned by Skopos and protected by copyright. We grant you a limited, non-exclusive, non-transferable license to use the Service per these Terms.</p>
      <p style={p}>You retain all rights over your data (logs, metadata, configurations). We do not claim ownership over your content.</p>

      <h2 style={h2}>6. Service availability</h2>
      <p style={p}>We strive to maintain high availability but do not guarantee 100% uptime. Planned maintenance is communicated in advance when possible. We are not liable for damages caused by service interruptions, except in cases of gross negligence.</p>

      <h2 style={h2}>7. Limitation of liability</h2>
      <p style={p}>To the maximum extent permitted by law:</p>
      <ul style={ul}>
        <li>The Service is provided &quot;AS IS&quot;, without warranties of any kind.</li>
        <li>Our total liability shall not exceed the amount you paid us in the 12 months preceding the event.</li>
        <li>We are not liable for indirect, consequential, or special damages (lost profits, data loss, business interruption).</li>
      </ul>
      <p style={p}>These limitations do not apply where prohibited by mandatory consumer protection law.</p>

      <h2 style={h2}>8. Data protection</h2>
      <p style={p}>Personal data processing is governed by our <a href="/legal/privacy" style={{ color: "#4ade80" }}>Privacy Policy</a>. For B2B customers, a <a href="/legal/dpa" style={{ color: "#4ade80" }}>Data Processing Agreement</a> is available.</p>

      <h2 style={h2}>9. Termination</h2>
      <p style={p}>You can close your account at any time from your profile settings. We may terminate your account in case of material breach of these Terms, illegal use, or non-payment, with prior notice when possible.</p>
      <p style={p}>Upon termination, your data is deleted within 30 days, except where retention is required by law.</p>

      <h2 style={h2}>10. Changes to these Terms</h2>
      <p style={p}>We may modify these Terms. Material changes will be communicated via email at least 30 days before they take effect. Continued use of the Service after that date constitutes acceptance.</p>

      <h2 style={h2}>11. Governing law and jurisdiction</h2>
      <p style={p}>These Terms are governed by Italian law. Any dispute will be subject to the exclusive jurisdiction of the competent Court in Italy, except where mandatory consumer protection law provides otherwise.</p>

      <h2 style={h2}>12. Contact</h2>
      <p style={p}>For questions about these Terms: <a href="mailto:support@skopos.ink" style={{ color: "#4ade80" }}>support@skopos.ink</a></p>
    </article>
  );
}
