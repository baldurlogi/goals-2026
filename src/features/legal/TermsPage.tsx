import { Link } from "react-router-dom";
import { ArrowLeft, ScrollText } from "lucide-react";

const LAST_UPDATED = "March 2025";
const CONTACT_EMAIL = "legal@begyn.app";
const APP_NAME = "Begyn";
const CONTROLLER = "Begyn";
const JURISDICTION = "Denmark";

export function TermsPage() {
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
            <ScrollText className="h-4 w-4 text-violet-400" />
            <span>Terms of Service</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-10">

        {/* Title */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
              <ScrollText className="h-5 w-5 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            These Terms of Service ("Terms") govern your access to and use of the {APP_NAME} application
            ("Service") operated by {CONTROLLER} ("we", "us", or "our"). By creating an account or using
            the Service, you agree to be bound by these Terms. If you do not agree, do not use {APP_NAME}.
          </p>
        </div>

        <Section title="1. Eligibility">
          <p>
            You must be at least 16 years old to use {APP_NAME}. By using the Service you confirm that
            you meet this requirement. If you are using the Service on behalf of an organisation, you
            confirm that you are authorised to bind that organisation to these Terms.
          </p>
        </Section>

        <Section title="2. Your Account">
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for
            all activity that occurs under your account. You agree to notify us immediately at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-400 hover:underline">{CONTACT_EMAIL}</a>{" "}
            if you suspect any unauthorised access.
          </p>
          <p>
            You may not share your account with others or create accounts using false information.
            We reserve the right to suspend or terminate accounts that violate these Terms.
          </p>
        </Section>

        <Section title="3. Subscription Plans and Payments">
          <p className="mb-3">
            {APP_NAME} offers the following plans:
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
            During the current beta, all users receive 1,000 AI credits per month and access to all live features while paid plans remain in preview.
          </p>
          <div className="space-y-3">
            <PlanRow name="Free" price="€0/month" features="10 AI credits per month, all core tracking features" />
            <PlanRow name="Pro" price="€9/month" features="200 AI credits per month, AI Weekly Report, AI Goal Optimisation" />
            <PlanRow name="Pro Max" price="€19/month" features="1,000 AI credits per month, all Pro features" />
          </div>
          <p className="mt-4">
            Paid subscriptions are billed monthly via Stripe. You may cancel at any time from your
            account settings — cancellation takes effect at the end of the current billing period.
            We do not offer refunds for partial months except where required by applicable law
            (including your statutory right of withdrawal under EU consumer law, which allows you to
            cancel within 14 days of first subscribing for a full refund).
          </p>
          <p>
            We reserve the right to change pricing with at least 30 days' notice. Continued use after
            the effective date constitutes acceptance of the new pricing.
          </p>
        </Section>

        <Section title="4. AI Features">
          <p>
            {APP_NAME} uses AI (powered by Anthropic's Claude) to provide coaching suggestions, goal
            optimisation, and weekly reports. You acknowledge that:
          </p>
          <ul className="space-y-2 mt-3 list-disc pl-5">
            <li>AI-generated content is for informational and motivational purposes only.</li>
            <li>AI output does not constitute medical, nutritional, financial, or professional advice.</li>
            <li>AI responses may occasionally be inaccurate — always use your own judgment.</li>
            <li>AI credits are limited per month based on your plan. Unused credits do not roll over.</li>
          </ul>
        </Section>

        <Section title="5. Acceptable Use">
          <p className="mb-3">You agree not to:</p>
          <ul className="space-y-2 list-disc pl-5">
            <li>Use the Service for any unlawful purpose or in violation of these Terms</li>
            <li>Attempt to circumvent plan limits, rate limits, or access controls</li>
            <li>Reverse-engineer, decompile, or attempt to extract the source code of {APP_NAME}</li>
            <li>Use automated scripts or bots to access the Service</li>
            <li>Upload or transmit malicious code, spam, or content that infringes third-party rights</li>
            <li>Impersonate another person or misrepresent your identity</li>
            <li>Resell or sublicense access to the Service without our written consent</li>
          </ul>
          <p className="mt-4">
            We reserve the right to suspend or terminate your access without notice for serious violations
            of these Terms.
          </p>
        </Section>

        <Section title="6. Your Content">
          <p>
            You retain ownership of all data and content you input into {APP_NAME} ("Your Content").
            By using the Service, you grant us a limited licence to store, process, and transmit Your
            Content solely to provide the Service to you. We do not claim any ownership over Your Content.
          </p>
          <p>
            You are responsible for ensuring that Your Content does not violate any applicable law or
            third-party rights. We may remove content that violates these Terms.
          </p>
        </Section>

        <Section title="7. Intellectual Property">
          <p>
            The {APP_NAME} application, including its design, code, branding, and AI prompt templates, is owned
            by {CONTROLLER} and protected by copyright and other intellectual property laws. You may not
            copy, reproduce, or create derivative works without our express written permission.
          </p>
        </Section>

        <Section title="8. Availability and Changes">
          <p>
            We aim to keep {APP_NAME} available at all times but do not guarantee uninterrupted access.
            We may modify, suspend, or discontinue features at any time. Where changes materially affect
            paid features, we will provide reasonable advance notice.
          </p>
          <p>
            We reserve the right to update these Terms at any time. Material changes will be communicated
            via in-app notice or email. Continued use after the effective date constitutes acceptance.
          </p>
        </Section>

        <Section title="9. Disclaimers">
          <p>
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
            INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
            OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE OR UNINTERRUPTED.
          </p>
          <p>
            Nothing in these Terms excludes or limits liability that cannot be excluded under applicable
            consumer protection law, including EU consumer rights directives.
          </p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY {JURISDICTION.toUpperCase()} AND EU LAW, {CONTROLLER.toUpperCase()}'S
            TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM YOUR USE OF THE SERVICE SHALL NOT
            EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM, OR €50, WHICHEVER
            IS GREATER.
          </p>
          <p>
            WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
            DAMAGES, INCLUDING LOSS OF DATA OR PROFITS.
          </p>
        </Section>

        <Section title="11. Termination">
          <p>
            You may delete your account at any time from the app settings. Upon account deletion, your
            personal data will be removed in accordance with our{" "}
            <Link to="/privacy" className="text-violet-400 hover:underline">Privacy Policy</Link>.
          </p>
          <p>
            We may terminate or suspend your account for violation of these Terms. Sections 6, 7, 9,
            10, and 12 survive termination.
          </p>
        </Section>

        <Section title="12. Governing Law and Disputes">
          <p>
            These Terms are governed by the laws of {JURISDICTION}. Any disputes shall be subject to
            the exclusive jurisdiction of the courts of {JURISDICTION}, without prejudice to your rights
            as a consumer under EU law (including the right to bring proceedings in your country of
            residence).
          </p>
          <p>
            The EU Online Dispute Resolution platform is available at{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noreferrer"
              className="text-violet-400 hover:underline"
            >
              ec.europa.eu/consumers/odr
            </a>.
          </p>
        </Section>

        <Section title="13. Contact">
          <p>
            For questions about these Terms, contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-violet-400 hover:underline">
              {CONTACT_EMAIL}
            </a>.
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

function PlanRow({ name, price, features }: { name: string; price: string; features: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4 flex items-start gap-4">
      <div className="min-w-[80px]">
        <span className="text-sm font-semibold">{name}</span>
        <p className="text-xs text-violet-400 font-medium">{price}</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{features}</p>
    </div>
  );
}
