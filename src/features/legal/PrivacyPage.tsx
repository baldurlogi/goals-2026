import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

const LAST_UPDATED = "March 2025";
const CONTACT_EMAIL = "legal@begyn.app";
const APP_NAME = "Begyn";
const CONTROLLER = "Begyn";
const JURISDICTION = "Denmark";

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Begyn
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-violet-400" />
            <span>Privacy Policy</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-10">

        {/* Title */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
              <Shield className="h-5 w-5 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This Privacy Policy explains how {CONTROLLER} ("{APP_NAME}", "we", "us", or "our") collects,
            uses, and protects your personal data when you use the {APP_NAME} application. We are committed
            to protecting your privacy and complying with the EU General Data Protection Regulation (GDPR)
            and applicable {JURISDICTION} data protection law.
          </p>
        </div>

        <Section title="1. Who We Are">
          <p>
            {APP_NAME} is a personal productivity and life-tracking application operated by {CONTROLLER},
            based in {JURISDICTION}. For questions about this policy or your personal data, contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-400 hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="2. Data We Collect">
          <p className="mb-4">We collect only what is necessary to provide the service:</p>
          <SubSection title="Account data">
            <p>Your email address and display name, provided when you sign up via email or OAuth (e.g. Google).</p>
          </SubSection>
          <SubSection title="Profile and health data">
            <p>
              Information you voluntarily enter into the app: body weight, height, sex, activity level,
              calorie and macro targets, fitness logs, nutrition logs, reading progress, financial goals,
              schedule blocks, to-do items, and other life-tracking data. This data is stored solely to
              provide the app's features to you and is never sold.
            </p>
          </SubSection>
          <SubSection title="AI coach context">
            <p>
              If you use AI features, you may optionally provide a goals summary, lifestyle notes, and
              preferred coaching tone. This information is sent to our AI provider (Anthropic) to
              generate personalised responses, as described in Section 4.
            </p>
          </SubSection>
          <SubSection title="Usage data">
            <p>
              We count the number of AI prompts you use per month to enforce plan limits. If you have
              analytics enabled, we collect anonymous, aggregated page-view data (no personal identifiers)
              via Plausible Analytics.
            </p>
          </SubSection>
          <SubSection title="Payment data">
            <p>
              If you subscribe to a paid plan, payment is processed entirely by Stripe. We do not store
              your card number or payment details — only your subscription tier and status.
            </p>
          </SubSection>
        </Section>

        <Section title="3. Legal Basis for Processing (GDPR)">
          <p className="mb-3">We process your personal data on the following legal bases:</p>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            <li><strong className="text-foreground">Contract performance</strong> — to provide the app and its features you signed up for.</li>
            <li><strong className="text-foreground">Legitimate interests</strong> — to maintain security, prevent abuse, and improve the service.</li>
            <li><strong className="text-foreground">Consent</strong> — for optional AI personalisation features (you can withdraw by clearing your AI profile settings).</li>
            <li><strong className="text-foreground">Legal obligation</strong> — where required by applicable law.</li>
          </ul>
        </Section>

        <Section title="4. Third-Party Processors">
          <p className="mb-4">
            We use the following sub-processors. Each is bound by a Data Processing Agreement and provides
            appropriate GDPR safeguards:
          </p>

          <div className="space-y-4">
            <ProcessorRow
              name="Supabase"
              purpose="Authentication, database storage, and edge functions (all app data)"
              location="EU (AWS eu-west-1)"
              link="https://supabase.com/privacy"
            />
            <ProcessorRow
              name="Anthropic"
              purpose="AI coaching, goal optimisation, and weekly report generation. Your data context is sent to Anthropic's API when you use AI features. Anthropic does not use API data to train models."
              location="USA (Standard Contractual Clauses apply)"
              link="https://www.anthropic.com/privacy"
            />
            <ProcessorRow
              name="Stripe"
              purpose="Payment processing for paid subscriptions (when enabled)"
              location="USA / EU (Standard Contractual Clauses apply)"
              link="https://stripe.com/privacy"
            />
            <ProcessorRow
              name="Plausible Analytics"
              purpose="Anonymous, cookie-free page-view analytics. No personal data or IP addresses are stored."
              location="EU (Germany)"
              link="https://plausible.io/privacy"
            />
          </div>
        </Section>

        <Section title="5. How We Use Your Data">
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            <li>To provide, operate, and improve the {APP_NAME} application</li>
            <li>To personalise AI coaching responses based on your context</li>
            <li>To enforce plan limits and process payments</li>
            <li>To send transactional emails (e.g. password reset, weekly report summaries) — only if you have an account</li>
            <li>To detect and prevent fraud, abuse, and security incidents</li>
            <li>To comply with legal obligations</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            We do <strong className="text-foreground">not</strong> sell your personal data.
            We do <strong className="text-foreground">not</strong> use your data for advertising.
            We do <strong className="text-foreground">not</strong> share your data with third parties
            except the processors listed in Section 4.
          </p>
        </Section>

        <Section title="6. Data Retention">
          <p>
            We retain your data for as long as your account is active. If you delete your account,
            we will delete your personal data within 30 days, except where we are required to retain
            it for legal or accounting purposes (typically up to 5 years for financial records).
            Anonymous, aggregated analytics data may be retained indefinitely.
          </p>
        </Section>

        <Section title="7. Your Rights (GDPR)">
          <p className="mb-3">As a data subject under GDPR, you have the right to:</p>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            <li><strong className="text-foreground">Access</strong> — request a copy of the personal data we hold about you</li>
            <li><strong className="text-foreground">Rectification</strong> — correct inaccurate or incomplete data</li>
            <li><strong className="text-foreground">Erasure</strong> — request deletion of your personal data ("right to be forgotten")</li>
            <li><strong className="text-foreground">Portability</strong> — receive your data in a structured, machine-readable format</li>
            <li><strong className="text-foreground">Restriction</strong> — ask us to stop processing your data in certain circumstances</li>
            <li><strong className="text-foreground">Objection</strong> — object to processing based on legitimate interests</li>
            <li><strong className="text-foreground">Withdraw consent</strong> — at any time for consent-based processing (e.g. AI personalisation)</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            To exercise any of these rights, email us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-400 hover:underline">{CONTACT_EMAIL}</a>.
            We will respond within 30 days. You also have the right to lodge a complaint with the
            Danish Data Protection Authority (Datatilsynet) at{" "}
            <a href="https://www.datatilsynet.dk" target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">
              datatilsynet.dk
            </a>.
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            {APP_NAME} uses only strictly necessary cookies for authentication (session tokens managed
            by Supabase). We use Plausible Analytics which is cookie-free and does not track individuals
            across sessions. We do not use advertising or tracking cookies.
          </p>
        </Section>

        <Section title="9. Security">
          <p>
            We implement appropriate technical and organisational security measures including encrypted
            data transmission (TLS), encrypted storage, row-level security in our database, and
            access controls. No system is completely secure — if you believe your account has been
            compromised, contact us immediately at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-400 hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="10. Children">
          <p>
            {APP_NAME} is not directed at children under 16. We do not knowingly collect personal data
            from anyone under 16. If you believe a child has provided us with personal data, please
            contact us and we will delete it promptly.
          </p>
        </Section>

        <Section title="11. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes
            by posting the new policy in the app and updating the "Last updated" date above. Continued
            use of {APP_NAME} after changes constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            For any privacy-related questions, data requests, or concerns, contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-400 hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        {/* Footer nav */}
        <div className="border-t border-border/40 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</span>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 pl-4 border-l border-border/60">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">{title}</p>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function ProcessorRow({
  name, purpose, location, link,
}: {
  name: string;
  purpose: string;
  location: string;
  link: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{name}</span>
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-violet-400 hover:underline"
        >
          Privacy policy ↗
        </a>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{purpose}</p>
      <p className="text-xs text-muted-foreground/60">📍 {location}</p>
    </div>
  );
}
