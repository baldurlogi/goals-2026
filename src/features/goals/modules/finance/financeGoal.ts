import type { GoalDefinition } from "@/features/goals/goalTypes";

export const financeGoal: GoalDefinition = {
  id: "finance",
  title: "Save 75,000 DKK",
  subtitle: "Build fund for US grad school applications + moving",
  emoji: "💰",
  priority: "high",

  steps: [
    {
      id: "finance-baseline",
      label: "Set baseline: current savings + fixed monthly obligations",
      notes:
        "Write down:\n- Current savings balance\n- Fixed monthly costs (rent, subscriptions, transport)\n- Minimum monthly savings you can always hit (even in travel months)\n\nDone when: you have these 3 numbers written down.",
      idealFinish: "2026-02-28",
      estimatedTime: "30 min",
    },

    {
      id: "open-savings-account",
      label: "Open separate savings account (buffer + near-term goals)",
      notes:
        "Keep near-term money safe (trips + moving/applications). Put savings in a separate account from daily spending.\n\nTip: pick a bank/account with decent interest and easy transfers.",
      idealFinish: "2026-03-02",
      estimatedTime: "30 min",
      links: ["https://lunar.app", "https://norwegian.dk"],
    },

    {
      id: "flexible-savings-rule",
      label: "Create a flexible savings rule (instead of fixed auto-transfer)",
      notes:
        "Rule:\n1) On salary week, transfer your *minimum guaranteed* amount (e.g., 3,000–5,000 DKK).\n2) At month-end close, transfer an extra 'top-up' based on how the month went.\n3) Travel months: keep minimum only; non-travel months: push higher.\n\nDone when: you write your minimum + your 'good month' target.",
      idealFinish: "2026-03-05",
      estimatedTime: "20 min",
    },

    {
      id: "monthly-close-process",
      label: "Monthly close: review spending + set next month saving target",
      notes:
        "End of each month (10–20 min):\n- Review categories in your bank + app\n- Note any overspend (why?)\n- Decide next month savings target\n- Transfer month-end top-up\n\nDone when: the process exists + you do the first close.",
      idealFinish: "2026-03-31",
      estimatedTime: "20 min/month",
    },

    {
      id: "trip-sinking-funds",
      label: "Create sinking funds for trips (so finance stays stable)",
      notes:
        "Make 3 buckets inside savings (or as notes):\n- Trips (April NYC/CPH, Easter, August, etc.)\n- Moving/grad school applications\n- Emergency buffer\n\nDone when: you have the buckets and an initial allocation plan.",
      idealFinish: "2026-03-10",
      estimatedTime: "30 min",
    },

    // =========================
    // QUARTERLY MILESTONES (less repetitive than monthly)
    // =========================

    {
      id: "q1-milestone",
      label: "Q1 Milestone: reach 15,000 DKK saved",
      notes:
        "Target by end of March: 15,000 DKK.\nIf below target: adjust April/May transfers (non-travel months) + cut 1–2 optional expenses.",
      idealFinish: "2026-03-31",
      estimatedTime: "20 min",
    },
    {
      id: "q2-milestone",
      label: "Q2 Milestone: reach 35,000 DKK saved",
      notes:
        "Target by end of June: 35,000 DKK.\nMay/June are your ‘catch-up’ months if April is expensive.",
      idealFinish: "2026-06-30",
      estimatedTime: "20 min",
    },
    {
      id: "q3-milestone",
      label: "Q3 Milestone: reach 55,000 DKK saved",
      notes:
        "Target by end of September: 55,000 DKK.\nIf you did August trips, use September to stabilize again.",
      idealFinish: "2026-09-30",
      estimatedTime: "20 min",
    },
    {
      id: "q4-milestone",
      label: "Q4 Milestone: reach 75,000 DKK saved",
      notes:
        "Target by Dec 31: 75,000 DKK.\nPlan a small reward that doesn’t destroy the goal.",
      idealFinish: "2026-12-31",
      estimatedTime: "20 min",
    },

    // =========================
    // INVESTING (optional / exploratory, Denmark-specific)
    // =========================

    {
      id: "investing-101-denmark",
      label: "Learn Denmark investing basics: ASK vs normal depot + taxes",
      notes:
        "Goal: understand where investing helps and where it can hurt.\n\nKey concepts to learn:\n- Aktiesparekonto (ASK): 17% tax on returns, annual taxation (lagerbeskatning), 2026 deposit cap 174,200 DKK.\n- Normal depot: taxation differs by product type.\n- Keep money needed within ~12 months (trips/moving) mostly in cash.\n\nDone when: you can explain (in 3 bullets) why/when you'd use ASK vs savings.",
      idealFinish: "2026-03-20",
      estimatedTime: "1.5 hours",
      links: [
        "https://skat.dk/borger/aktier-og-andre-vaerdipapirer/aktiesparekonto",
        "https://www.nordnet.dk/faq/aktiesparekonto/indbetaling-aktiesparekonto/hvor-meget-ma-jeg-indskyde-pa-en-aktiesparekonto",
      ],
    },

    {
      id: "choose-platform",
      label: "Pick an investing platform (if you decide to invest): Nordnet or Saxo",
      notes:
        "Choose one platform and open:\n- Aktiesparekonto (if using ASK)\n- Regular depot (optional)\n\nDone when: account is opened (you don't have to invest yet).",
      idealFinish: "2026-04-05",
      estimatedTime: "45 min",
      links: ["https://www.nordnet.dk", "https://www.home.saxo/da-dk"],
    },

    {
      id: "simple-invest-plan",
      label: "Write a simple investing rule (only after April trip budget is clear)",
      notes:
        "A safe default rule for your situation:\n- Keep near-term trip money in cash.\n- Invest only the amount that is truly long-term (e.g., money not needed for 12+ months).\n- Start small (e.g., 500–1,000 DKK/month) and scale after travel-heavy months.\n\nDone when: you’ve defined (a) cash buffer amount and (b) monthly invest amount range.",
      idealFinish: "2026-05-01",
      estimatedTime: "30 min",
    },

    // =========================
    // INCOME GROWTH (separate from freelancing goal, but finance-related)
    // =========================

    {
      id: "salary-negotiation-prep",
      label: "Prepare for salary review (wins + market data)",
      notes:
        "Document wins, impact, and scope. Collect market references. Define your ask + fallback.\nThis directly increases savings power without cutting life quality.",
      idealFinish: "2026-07-15",
      estimatedTime: "3 hours",
      links: ["https://www.glassdoor.com", "https://www.levels.fyi"],
    },
    {
      id: "salary-review-meeting",
      label: "Request and complete salary review meeting",
      notes:
        "Run the meeting with a clear ask + evidence. If declined, ask for: written growth plan + timeline + measurable criteria.",
      idealFinish: "2026-08-15",
      estimatedTime: "1 hour",
    },

    // =========================
    // SKAT Timeline
    // =========================

    {
        id: "tax-season-calendar",
        label: "Tax season 2026: add key dates to calendar (2025 income)",
        notes:
            "Add reminders:\n- Mar 23, 2026: Årsopgørelse available in TastSelv\n- Apr 24, 2026: Refund payouts begin (if you’re owed money)\n- May 20, 2026: Deadline to make corrections\n\nDone when: all reminders are in your calendar with notifications.",
        idealFinish: "2026-03-01",
        estimatedTime: "10 min",
        links: [
            "https://skat.dk/borger/aarsopgoerelse/aarsopgoerelsen",
            "https://skat.dk/borger/aarsopgoerelse/aarsopgoerelsen-hvornaar-sker-hvad",
        ],
        },
        {
        id: "tax-prep-documents",
        label: "Tax prep: checklist of what to verify before Mar 23",
        notes:
            "Before årsopgørelsen opens, make a quick checklist of items to verify:\n- Income matches employer reporting\n- Interest/loans (bank reported)\n- Deductibles you expect (transport, union fees, etc.)\n- Any foreign income or special situations\n\nDone when: checklist exists and you have any missing docs ready.",
        idealFinish: "2026-03-15",
        estimatedTime: "20 min",
        },
        {
        id: "review-aarsopgoerelse",
        label: "Review årsopgørelse in TastSelv + decide if changes are needed",
        notes:
            "On/after Mar 23: open TastSelv, verify key numbers vs your checklist.\nIf something is wrong or missing, draft the change plan immediately.\n\nDone when: you’ve either confirmed it’s correct OR you have a list of changes to make.",
        idealFinish: "2026-03-27",
        estimatedTime: "30–45 min",
        links: ["https://skat.dk/borger/aarsopgoerelse/aarsopgoerelsen"],
        },
        {
        id: "submit-tax-changes",
        label: "Submit any corrections before May 20 deadline",
        notes:
            "If you need to change anything, submit updates in TastSelv well before May 20.\nDone when: changes are submitted and you saved confirmation/screenshots.",
        idealFinish: "2026-05-10",
        estimatedTime: "30–60 min",
        },
        {
        id: "refund-or-restskat-plan",
        label: "If refund/restskat: decide what to do immediately",
        notes:
            "If refund: allocate it (e.g., 70% savings goal / 30% trip buffer).\nIf restskat: plan payment so you’re not stressed later.\nDone when: you have a simple plan and the money is earmarked.",
        idealFinish: "2026-04-26",
        estimatedTime: "15 min",
    },
  ],
};