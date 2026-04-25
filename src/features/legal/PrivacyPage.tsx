import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  readCookieConsent,
  subscribeCookieConsent,
  writeCookieConsent,
  type CookieConsentState,
} from "@/features/legal/cookieConsent";

const LAST_UPDATED = "April 9, 2026";
const CONTACT_EMAIL = "legal@begyn.app";
const APP_NAME = "Begyn";
const CONTROLLER = "Begyn";
const JURISDICTION = "Denmark";

export function PrivacyPage() {
  const [cookieConsent, setCookieConsent] = useState<CookieConsentState | null>(
    () => readCookieConsent(),
  );

  useEffect(() => subscribeCookieConsent(setCookieConsent), []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
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

      <div className="mx-auto max-w-3xl space-y-10 px-6 py-12">
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
          <p className="text-sm leading-relaxed text-muted-foreground">
            This Privacy Policy explains how {CONTROLLER} collects, uses, stores,
            and protects personal data when you use {APP_NAME}. We designed
            Begyn as a personal planning app, so a lot of the information we
            process is data you deliberately choose to enter so the app can help
            you plan, reflect, and track progress.
          </p>
        </div>

        <Section title="1. Who controls your data">
          <p>
            {CONTROLLER} operates {APP_NAME} from {JURISDICTION}. If you have
            questions about privacy, cookies, or your rights, email{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-violet-500 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section title="2. The data we collect">
          <p className="mb-4">
            We collect the information needed to run the app and the features
            you ask us to provide.
          </p>

          <SubSection title="Account and authentication data">
            <p>
              Your email address, display name, authentication identifiers, and
              basic account metadata. If you sign in with Google, we receive the
              account information needed to authenticate you.
            </p>
          </SubSection>

          <SubSection title="Profile and planning data">
            <p>
              Information you add to your profile, goals, tasks, schedule,
              reading, fitness, nutrition, finance, and other planning modules.
              This includes notes, preferences, and progress history you choose
              to save in the app.
            </p>
          </SubSection>

          <SubSection title="Health, wellbeing, and recovery data">
            <p>
              Some optional features let you store data that may be considered
              data concerning health under GDPR, such as weight, nutrition
              targets, workouts, sleep, recovery, mood, stress, energy, and
              related notes. You decide whether to add this information. We use
              it only to provide the feature you requested and to generate the
              summaries or AI outputs you ask for.
            </p>
          </SubSection>

          <SubSection title="AI request data">
            <p>
              When you use AI features, we process the prompt you submit and the
              app context needed to answer it, such as your goals, selected
              modules, progress signals, or optional profile information relevant
              to the specific request. We do not use your data for advertising.
            </p>
          </SubSection>

          <SubSection title="Analytics and diagnostics">
            <p>
              If you consent, we use product analytics and performance tools to
              understand which pages are used, how features perform, and where
              people drop off. We keep essential authentication and security
              storage separate from optional analytics.
            </p>
          </SubSection>

          <SubSection title="Billing data">
            <p>
              If paid plans are enabled, billing is handled by Stripe. We do not
              store full payment card details in Begyn.
            </p>
          </SubSection>
        </Section>

        <Section title="3. How we use your data">
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>To authenticate you and keep your account secure</li>
            <li>To save and sync the goals, plans, and logs you create</li>
            <li>To generate AI outputs you explicitly request</li>
            <li>To measure AI credit usage and enforce beta limits</li>
            <li>To improve reliability, security, and product quality</li>
            <li>To process billing and account administration if plans go live</li>
            <li>To comply with legal obligations and handle user-rights requests</li>
          </ul>
        </Section>

        <Section title="4. GDPR legal bases">
          <p className="mb-3">
            Depending on the feature, we rely on one or more of these legal
            bases:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Contract performance</strong>{" "}
              for core app functionality, authentication, syncing your data, and
              providing the features you signed up to use.
            </li>
            <li>
              <strong className="text-foreground">Legitimate interests</strong>{" "}
              for security, abuse prevention, service reliability, and limited
              internal product improvement.
            </li>
            <li>
              <strong className="text-foreground">Consent</strong> for optional
              analytics technologies and, where applicable, for optional
              health-related or highly personal data you choose to enter into
              relevant wellbeing, recovery, fitness, or nutrition features.
            </li>
            <li>
              <strong className="text-foreground">Legal obligation</strong> when
              we need to keep records or respond to lawful requests.
            </li>
          </ul>
        </Section>

        <Section title="5. Health and wellbeing data">
          <p>
            Begyn includes optional features that can involve health-related
            data. Under GDPR, this can be a special category of personal data.
            We only process this information when you deliberately provide it to
            use a related feature. We do not sell it, use it for advertising, or
            make insurance, employment, or similar decisions about you.
          </p>
          <p>
            If you no longer want us to process that information, you can remove
            it from the app, stop using the related feature, or contact us to
            request deletion.
          </p>
        </Section>

        <Section title="6. AI data processing">
          <p>
            AI features in Begyn are optional. When you ask Begyn to generate a
            goal, improve a goal, suggest a next move, create a weekly report,
            or produce another AI output, we send the prompt and the minimum
            relevant context to our AI provider so it can return a response.
          </p>
          <p>
            That context can include goal text, progress signals, module data,
            and optional health or wellbeing information when it is directly
            relevant to the request you initiated. We use this processing only
            to provide the AI feature you asked for and to operate the service.
          </p>
        </Section>

        <Section title="7. Processors and transfers">
          <p className="mb-4">
            We use specialist processors to run Begyn. Where data is transferred
            outside the EEA/UK, we rely on appropriate safeguards such as
            standard contractual clauses where needed.
          </p>

          <div className="space-y-4">
            <ProcessorRow
              name="Supabase"
              purpose="Authentication, database storage, and server-side functions."
              location="Hosting provider for core app infrastructure"
              link="https://supabase.com/privacy"
            />
            <ProcessorRow
              name="Anthropic"
              purpose="AI generation for coach guidance, goal planning, reports, and other user-requested AI features."
              location="AI provider"
              link="https://www.anthropic.com/privacy"
            />
            <ProcessorRow
              name="PostHog"
              purpose="Product analytics, event measurement, and funnel analysis when you consent to analytics."
              location="Analytics provider"
              link="https://posthog.com/privacy"
            />
            <ProcessorRow
              name="Vercel Analytics and Speed Insights"
              purpose="Traffic and performance measurement when you consent to analytics."
              location="Performance and web analytics provider"
              link="https://vercel.com/legal/privacy-policy"
            />
            <ProcessorRow
              name="Stripe"
              purpose="Payment processing if paid plans are enabled."
              location="Payments provider"
              link="https://stripe.com/privacy"
            />
          </div>
        </Section>

        <Section title="8. Retention">
          <p>
            We keep your account data and the content you save for as long as
            your account remains active, unless a shorter retention period is
            required by law or we no longer need the data for the purpose it was
            collected. If you delete your account or request deletion, we will
            delete or anonymise your personal data unless we must retain some of
            it for legal, accounting, or security reasons.
          </p>
        </Section>

        <Section title="9. Cookies and similar technologies">
          <p>
            Begyn uses essential browser storage and similar technologies to keep
            you signed in, maintain security, and remember necessary app state.
            These are required for the service to work.
          </p>
          <p>
            We only enable non-essential analytics after you actively choose to
            allow them. If you reject analytics, Begyn will continue to work,
            but we will not load optional analytics or performance measurement
            tools.
          </p>

          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Cookie preferences</p>
              <p className="text-sm text-muted-foreground">
                Current setting:{" "}
                <span className="font-medium text-foreground">
                  {cookieConsent?.analytics ? "Analytics allowed" : "Essential only"}
                </span>
                {cookieConsent
                  ? ` · Updated ${new Date(cookieConsent.updatedAt).toLocaleDateString()}`
                  : " · No choice saved yet"}
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCookieConsent(writeCookieConsent("rejected"));
                }}
              >
                Use essential only
              </Button>
              <Button
                type="button"
                className="bg-violet-600 text-white hover:bg-violet-600/90"
                onClick={() => {
                  setCookieConsent(writeCookieConsent("accepted"));
                }}
              >
                Allow analytics
              </Button>
            </div>
          </div>
        </Section>

        <Section title="10. Your rights">
          <p className="mb-3">
            Subject to applicable law, you have the right to:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>access the personal data we hold about you;</li>
            <li>correct inaccurate or incomplete data;</li>
            <li>request deletion of your data;</li>
            <li>object to or restrict certain processing;</li>
            <li>withdraw consent for consent-based processing;</li>
            <li>receive a portable copy of data you provided to us; and</li>
            <li>complain to your local supervisory authority.</li>
          </ul>
          <p className="mt-4">
            To exercise any of these rights, email{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-violet-500 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            . If you are in Denmark, you may also contact Datatilsynet at{" "}
            <a
              href="https://www.datatilsynet.dk"
              target="_blank"
              rel="noreferrer"
              className="text-violet-500 hover:underline"
            >
              datatilsynet.dk
            </a>
            .
          </p>
        </Section>

        <Section title="11. Security">
          <p>
            We use reasonable technical and organisational measures to protect
            personal data, including encrypted transport, authentication controls,
            and access restrictions. No system is perfectly secure, so if you
            think your account has been compromised, contact us immediately.
          </p>
        </Section>

        <Section title="12. Changes to this policy">
          <p>
            We may update this policy from time to time. When we make material
            changes, we will update the date at the top of this page and, where
            appropriate, provide additional notice in the app.
          </p>
        </Section>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</span>
          <div className="flex gap-6">
            <Link to="/privacy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1 border-l border-border/60 pl-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        {title}
      </p>
      <div className="text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

function ProcessorRow({
  name,
  purpose,
  location,
  link,
}: {
  name: string;
  purpose: string;
  location: string;
  link: string;
}) {
  return (
    <div className="space-y-1 rounded-xl border border-border/50 bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold">{name}</span>
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-violet-500 hover:underline"
        >
          Privacy policy ↗
        </a>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{purpose}</p>
      <p className="text-xs text-muted-foreground/70">{location}</p>
    </div>
  );
}
