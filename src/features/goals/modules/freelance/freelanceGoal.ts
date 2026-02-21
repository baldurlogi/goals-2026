import type { GoalDefinition } from "../../goalTypes";

export const freelanceGoal: GoalDefinition = {
  id: "freelance-saas",
  title: "Freelancing & SaaS Launch",
  subtitle: "Freelance pipeline + validate and launch a paid version of your app",
  emoji: "🧠",
  priority: "high",

  /**
   * Strategy:
   * - Track A (Freelance): get 1–3 small projects via warm network (boyfriend’s brother/friends + roommate)
   * - Track B (SaaS): validate BEFORE building (problem → audience → pricing → MVP → first paid users)
   * - Denmark guardrails: CVR/VAT/B-income steps so you stay compliant
   */

  steps: [
    // =========================
    // PHASE 0 — Setup (Week 1–2)
    // =========================
    {
      id: "define-time-budget",
      label: "Define time budget (so this doesn't destroy your routine)",
      notes:
        "Set a realistic weekly commitment:\n- Freelance: 3-5 hrs/week\n- SaaS: 4-6 hrs/week\n\nDefine minimum success: 1 focused session Mon-Thu + 1 weekend block.\nDone when: weekly slots are in calendar.",
      idealFinish: "2026-02-28",
      estimatedTime: "15 min",
    },
    {
      id: "offer-definition",
      label: "Define your freelance offer (simple website package)",
      notes:
        "Define 1-2 offers only:\nOffer A: Simple website (landing + about + contact)\nOffer B: Small business site (3-5 pages + basic SEO + analytics)\n\nInclude what is NOT included (custom backend, complex integrations, etc.).\nDone when: you have 1 paragraph describing each offer.",
      idealFinish: "2026-03-02",
      estimatedTime: "45 min",
    },
    {
      id: "pricing-compensation",
      label: "Set pricing + compensation rules (DKK + USD)",
      notes:
        "Set your baseline pricing to avoid awkward negotiation.\nExamples (adjust later):\n- Offer A: 6,000-10,000 DKK ($950-$1,580)\n- Offer B: 12,000-20,000 DKK ($1,900-$3,150)\n\nRules:\n- 30-50% deposit upfront\n- Clear deadline + revision limit\n- Hosting/domain billed to client\n\nDone when: you have price ranges + payment terms written.",
      idealFinish: "2026-03-03",
      estimatedTime: "45 min",
    },
    {
      id: "contracts-invoicing-template",
      label: "Create templates: scope + contract + invoice text",
      notes:
        "Create:\n- 1-page scope doc template (deliverables, timeline, revisions)\n- Basic contract terms (payment, cancellation, handoff)\n- Invoice template text\n\nDone when: templates exist in a folder and can be reused.",
      idealFinish: "2026-03-06",
      estimatedTime: "2 hours",
    },

    // =========================
    // Denmark guardrails (do early)
    // =========================
    {
      id: "denmark-business-form-decision",
      label: "Denmark: decide setup (hobby/B-income vs CVR business)",
      notes:
        "Decision gate:\n- If you expect recurring gigs or want to invoice properly: register a business (CVR).\n- If it's a tiny one-off: you may treat it as B-income, but you still must handle tax.\n\nDone when: you choose 'start CVR now' OR 'start as B-income and reassess after first paid gig'.",
      idealFinish: "2026-03-05",
      estimatedTime: "30 min",
      links: ["https://virk.dk/myndigheder/stat/ERST/Start_virksomhed/"],
    },
    {
      id: "skat-b-income-plan",
      label: "Denmark: B-income plan (avoid tax surprises)",
      notes:
        "Read SKAT guidance on B-income and how to add it to forskudsopgørelsen.\nDone when: you know how you'll report income and set aside tax on freelance earnings.",
      idealFinish: "2026-03-10",
      estimatedTime: "45 min",
      links: ["https://skat.dk/borger/b-indkomst", "https://skat.dk/en-us/individuals/b-income"],
    },
    {
      id: "vat-moms-threshold-awareness",
      label: "Denmark: VAT (moms) threshold awareness + monitoring rule",
      notes:
        "Rule: register for VAT when sales exceed 50,000 DKK over 12 months (optional below threshold).\nDone when: you add a simple running total (rolling 12 months) to monitor moms threshold.",
      idealFinish: "2026-03-10",
      estimatedTime: "15 min",
      links: [
        "https://skat.dk/en-us/businesses/vat/vat-what-to-do/how-to-register-your-business",
        "https://skat.dk/borger/skat-for-freelancere-konsulenter-og-andre",
      ],
    },
    {
      id: "cvr-registration-if-needed",
      label: "Denmark: Register CVR (if you chose business setup)",
      notes:
        "If you chose to start a business, register via Virk to get CVR.\nDone when: CVR registration is completed (or you consciously postponed it).",
      idealFinish: "2026-03-20",
      estimatedTime: "45-90 min",
      links: ["https://businessindenmark.virk.dk/authorities/stat/ERST/self-service/Start_company/"],
    },

    // =========================
    // TRACK A — Freelancing pipeline (network-first)
    // =========================
    {
      id: "warm-network-outreach-plan",
      label: "Create warm outreach list (boyfriend's brother/friends + roommate leads)",
      notes:
        "Make a list of 10 warm contacts max:\n- Brother\n- 3-5 friends\n- Roommate's leads\n- 2-3 local businesses you already know\n\nDone when: list exists with name + what they might need.",
      idealFinish: "2026-03-04",
      estimatedTime: "30 min",
    },
    {
      id: "send-5-outreach-messages",
      label: "Send 5 warm outreach messages with your simple website offer",
      notes:
        "Send short DM/email:\n- What you build\n- Price range\n- Timeline (e.g., 10-14 days)\n- Ask for a quick 15-min call\n\nDone when: 5 messages are sent.",
      idealFinish: "2026-03-08",
      estimatedTime: "45 min",
    },
    {
      id: "discovery-call-script",
      label: "Prepare a 15-min discovery call script",
      notes:
        "Questions:\n- Goal of site\n- Needed pages\n- Examples they like\n- Deadline\n- Budget range\n- Who provides copy/images\n\nDone when: script exists + you can run a call confidently.",
      idealFinish: "2026-03-10",
      estimatedTime: "30 min",
    },
    {
      id: "close-first-client",
      label: "Close first client (scope + deadline + deposit)",
      notes:
        "Success criteria:\n- Signed scope\n- Deadline agreed\n- Deposit paid\n- Content checklist sent to client\n\nDone when: the project is officially started and paid deposit is received.",
      idealFinish: "2026-03-25",
      estimatedTime: "2-4 hours",
    },
    {
      id: "deliver-first-website",
      label: "Deliver first website project (end-to-end)",
      notes:
        "Deliverables:\n- Responsive site\n- Basic SEO (titles/meta)\n- Analytics\n- Handoff doc (how to update)\n\nDone when: site is live + final invoice paid + testimonial requested.",
      idealFinish: "2026-04-20",
      estimatedTime: "15-30 hours",
    },
    {
      id: "testimonial-case-study",
      label: "Create a case study + testimonial from first client",
      notes:
        "One-page case study:\n- Problem\n- What you built\n- Timeline\n- Before/after screenshots\n- Client quote\n\nDone when: added to portfolio or shared as a PDF.",
      idealFinish: "2026-04-25",
      estimatedTime: "2 hours",
    },
    {
      id: "freelance-sustainable-target",
      label: "Freelance milestone: 1-2 paid gigs per quarter (sustainable)",
      notes:
        "Instead of 40 Upwork jobs, the sustainable target is:\n- Q2: 1 paid gig\n- Q3: 1-2 paid gigs\n- Q4: 1-2 paid gigs\n\nDone when: target is written and accepted (no guilt).",
      idealFinish: "2026-04-30",
      estimatedTime: "10 min",
    },

    // =========================
    // TRACK B — SaaS validation + launch (your current app)
    // =========================
    {
      id: "saas-idea-definition",
      label: "Define your SaaS idea clearly (who it's for + core promise)",
      notes:
        "Write:\n- Target user (who exactly)\n- Top 3 pains\n- One sentence promise\n- Core workflow (3 steps)\n\nDone when: you have a 1-paragraph description of the product.",
      idealFinish: "2026-03-12",
      estimatedTime: "45 min",
    },
    {
      id: "saas-validate-10-interviews",
      label: "Validate with 8-10 quick user chats (15 min each)",
      notes:
        "Talk to friends/coworkers/online communities.\nAsk:\n- What do they currently use?\n- What annoys them?\n- Would they pay to solve it?\n- What features matter most?\n\nDone when: you have 8-10 notes + top 3 patterns.",
      idealFinish: "2026-04-05",
      estimatedTime: "3-4 hours",
    },
    {
      id: "saas-landing-page",
      label: "Build a landing page (waitlist + value prop + screenshots)",
      notes:
        "Landing page must include:\n- Value prop\n- 3 bullets of benefits\n- Screenshots/mockups\n- Email waitlist\n- Pricing hypothesis (even if rough)\n\nDone when: page is deployed + collecting emails.",
      idealFinish: "2026-04-15",
      estimatedTime: "4-8 hours",
    },
    {
      id: "saas-pricing-tiers",
      label: "Decide pricing tiers (Free + Pro)",
      notes:
        "Create a simple tier model:\n- Free: core tracking\n- Pro ($8-$12/mo): advanced features (analytics, exports, automations, templates)\n\nDecide:\n- monthly price\n- annual discount\n- what is locked behind Pro\n\nDone when: tiers are defined and can be shown on landing page.",
      idealFinish: "2026-04-20",
      estimatedTime: "60 min",
    },
    {
      id: "saas-platform-decision",
      label: "Decide: web-only first vs web + app (focus decision)",
      notes:
        "Default recommendation: web-first (responsive) → app later.\nDecide based on:\n- audience behavior\n- your time budget\n- fastest path to paying users\n\nDone when: you choose one path and explicitly postpone the other.",
      idealFinish: "2026-04-22",
      estimatedTime: "30 min",
    },
    {
      id: "saas-mvp-scope",
      label: "Define MVP scope (must be shippable in 2-4 weeks)",
      notes:
        "MVP rule:\n- only features needed to deliver the core promise\n- remove anything 'nice to have'\n\nDone when: you have an MVP checklist with 8-12 items max.",
      idealFinish: "2026-04-25",
      estimatedTime: "45 min",
    },
    {
      id: "saas-payment-setup",
      label: "Set up payments (Stripe) + legal basics (terms/privacy)",
      notes:
        "Setup:\n- Stripe test mode\n- Pricing plan\n- Terms of Service + Privacy Policy (simple)\n\nDenmark: ensure your business setup supports invoicing/subscriptions.\nDone when: payments work end-to-end in test mode.",
      idealFinish: "2026-05-10",
      estimatedTime: "3-6 hours",
      links: ["https://stripe.com"],
    },
    {
      id: "saas-beta-launch",
      label: "Beta launch to first 10-25 users",
      notes:
        "Invite:\n- your friends\n- gym friends\n- coworkers who match the persona\n- online community\n\nGoal: get usage + feedback, not perfection.\nDone when: 10-25 users have access and at least 5 gave feedback.",
      idealFinish: "2026-05-25",
      estimatedTime: "4-8 hours",
    },
    {
      id: "saas-first-paid-users",
      label: "Get first 3 paying users",
      notes:
        "Target: 3 paid users validates pricing + value.\nTactics:\n- offer founding member price\n- personally onboard 5 people\n- fix biggest friction fast\n\nDone when: 3 people are paying (monthly or annual).",
      idealFinish: "2026-06-30",
      estimatedTime: "Ongoing",
    },

    // =========================
    // Compliance + admin (light but real)
    // =========================
    {
      id: "tax-admin-checkpoint",
      label: "Admin checkpoint: confirm tax/VAT setup after first income",
      notes:
        "After first freelance income or SaaS payment:\n- confirm B-income reporting plan\n- confirm whether VAT registration is needed (50,000 DKK/12 months threshold)\n- decide if you need professional help\n\nDone when: you have a clear compliance checklist and next action.",
      idealFinish: "2026-05-31",
      estimatedTime: "45 min",
      links: [
        "https://skat.dk/borger/skat-for-freelancere-konsulenter-og-andre",
        "https://skat.dk/en-us/businesses/vat/vat-what-to-do/how-to-register-your-business",
      ],
    },
    {
      id: "accountant-consultation-optional",
      label: "Optional: 30-60 min consult with accountant (Denmark freelancing/SaaS)",
      notes:
        "Do this if income starts flowing or if you're unsure.\nBring:\n- expected revenue\n- business form choice\n- whether you're charging VAT\n- subscription payments question\n\nDone when: you have answers + a simple action list.",
      idealFinish: "2026-06-15",
      estimatedTime: "1-2 hours",
    },
  ],
};