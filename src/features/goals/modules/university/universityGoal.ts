import type { GoalDefinition } from "../../goalTypes";

export const universityGoal: GoalDefinition = {
  id: "university-applications",
  title: "US University Applications",
  subtitle: "Apply to focused MS programs for Fall 2027 (deep research + strong materials)",
  emoji: "🎓",
  priority: "high",
  steps: [
    // =========================
    // PHASE 0 — North Star + constraints
    // =========================
    {
      id: "define-intake-and-constraints",
      label: "Define intake + constraints (Fall 2027) + non-negotiables",
      notes:
        "Write:\n- Target intake: Fall 2027\n- Max total budget (apps/tests/fees + living)\n- Must-have program themes\n- Location preferences\n- Visa goal (F-1 path)\n\nDone when: you have 5 bullets that define your decision boundaries.",
      idealFinish: "2026-03-05",
      estimatedTime: "45 min",
    },
    {
      id: "pick-degree-themes",
      label: "Pick 2–3 degree themes (so research stays focused)",
      notes:
        "Choose 2–3 themes like:\n- Management Science & Engineering / Engineering Management\n- CS with systems/data focus\n- Tech + product/management blend\n\nDone when: themes are written and will guide your shortlist.",
      idealFinish: "2026-03-07",
      estimatedTime: "30 min",
    },

    // =========================
    // PHASE 1 — Friend at Columbia (high leverage)
    // =========================
    {
      id: "schedule-columbia-friend-call",
      label: "Schedule call with Columbia friend (process + visa + cost reality)",
      notes:
        "Book a 45–60 min call. Goal: get real insights on admissions process, biggest difficulty, visa steps, and cost planning.",
      idealFinish: "2026-03-10",
      estimatedTime: "10 min",
    },
    {
      id: "prep-columbia-call-questions",
      label: "Prepare question list + send ahead of call",
      notes:
        "Questions:\n- How she chose program (MSE/engineering management style)\n- Essays + what mattered most\n- Recommenders strategy\n- TOEFL/GRE/GMAT reality\n- Visa steps timeline + proof of funds\n- Real costs + NYC living\n- What she’d do differently\n\nDone when: list is shared with her before the call.",
      idealFinish: "2026-03-12",
      estimatedTime: "30 min",
    },
    {
      id: "columbia-call-and-insights-doc",
      label: "Do the call + write a '10 insights' summary",
      notes:
        "After the call, write:\n- 10 key insights\n- 5 action items you will apply to your plan\n\nDone when: summary is saved and referenced in your goal plan.",
      idealFinish: "2026-03-25",
      estimatedTime: "90 min",
    },

    // =========================
    // PHASE 2 — Program research (6–8 programs, deep)
    // =========================
    {
      id: "create-application-tracker",
      label: "Create application tracker (single source of truth)",
      notes:
        "Make a tracker with columns:\nSchool, Program, Theme fit, Deadline(s), Fee, TOEFL required, GRE/GMAT policy, LOR count, Essay prompts, Cost estimate, Status.\nDone when: tracker exists and you can sort by deadline.",
      idealFinish: "2026-03-15",
      estimatedTime: "60 min",
    },
    {
      id: "shortlist-6-8-programs",
      label: "Shortlist 6–8 programs total (2 reach / 3 match / 1–3 safety)",
      notes:
        "Rule: fewer programs, deeper applications.\nInclude Columbia-style MSE/engineering management options + a couple of CS-adjacent options.\nDone when: final shortlist count is 6–8.",
      idealFinish: "2026-03-18",
      estimatedTime: "90 min",
    },
    {
      id: "deep-profile-columbia",
      label: "Deep profile: Columbia program(s)",
      notes:
        "Profile template:\n- Curriculum + core courses\n- Specializations\n- Career outcomes\n- Admission requirements\n- Deadlines\n- Estimated cost\n\nDone when: profile is filled out in the tracker and you know why it fits.",
      idealFinish: "2026-03-22",
      estimatedTime: "90 min",
      links: [
        "https://www.engineering.columbia.edu/admissions-aid/graduate-admissions/how-apply/application-requirements",
        "https://www.gsas.columbia.edu/content/information-international-applicants",
      ],
    },
    {
      id: "deep-profile-top-2",
      label: "Deep profile: 2 additional top programs",
      notes:
        "Complete the same deep profile template for 2 more top programs.\nDone when: you can explain (in 3 bullets each) why you fit.",
      idealFinish: "2026-03-31",
      estimatedTime: "3 hours",
    },
    {
      id: "deep-profile-remaining",
      label: "Deep profile: remaining programs on your shortlist",
      notes:
        "Complete deep profiles for the rest of your 6–8 shortlist.\nDone when: every program has a complete profile and notes on fit.",
      idealFinish: "2026-04-10",
      estimatedTime: "6 hours",
    },
    {
      id: "lock-final-program-list",
      label: "Lock final program list + reach/match/safety strategy",
      notes:
        "Finalize your list and classify each program as reach/match/safety.\nDone when: list is locked and you stop adding schools impulsively.",
      idealFinish: "2026-04-15",
      estimatedTime: "45 min",
    },

    // =========================
    // PHASE 3 — Testing plan (TOEFL + optional GRE/GMAT)
    // =========================
    {
      id: "decide-test-requirements",
      label: "Decide test requirements (TOEFL + GRE/GMAT only if needed)",
      notes:
        "For each program, record:\n- TOEFL requirement + minimum\n- GRE/GMAT required/optional/not accepted\n\nDone when: you know exactly what tests you need for your final shortlist.",
      idealFinish: "2026-04-20",
      estimatedTime: "30 min",
    },
    {
      id: "toefl-target-and-date",
      label: "Set TOEFL target + book a test date",
      notes:
        "Target: aim 105+ for elite programs (buffer above minimums).\nPick a test date that allows a retake if needed.\nDone when: target + booked date are set.",
      idealFinish: "2026-05-01",
      estimatedTime: "30 min",
      links: ["https://www.ets.org/toefl.html"],
    },
    {
      id: "toefl-study-plan-8-weeks",
      label: "Complete 6–8 weeks TOEFL prep (focused)",
      notes:
        "Plan: 4 sessions/week (45–60 min).\nFocus: Speaking + Writing.\nDone when: you complete the plan and have at least 2 full practice tests.",
      idealFinish: "2026-06-10",
      estimatedTime: "24–32 hours",
      links: ["https://www.ets.org/toefl.html"],
    },
    {
      id: "take-toefl",
      label: "Take TOEFL exam",
      notes:
        "Arrive early with passport. After score arrives, update tracker with official score and whether a retake is needed.",
      idealFinish: "2026-06-15",
      estimatedTime: "4 hours",
    },
    {
      id: "toefl-retake-if-needed",
      label: "If needed: plan and book TOEFL retake",
      notes:
        "If below your target, book a retake and focus on weakest section(s).\nDone when: retake is booked and plan updated.",
      idealFinish: "2026-06-25",
      estimatedTime: "30 min",
    },
    {
      id: "gre-gmat-decision",
      label: "If required: decide GRE vs GMAT strategy + timeline",
      notes:
        "Only do this if one or more target programs benefit from or require it.\nDone when: you commit to taking it OR confirm it’s unnecessary.",
      idealFinish: "2026-06-30",
      estimatedTime: "30 min",
      links: ["https://www.ets.org/gre.html", "https://www.mba.com/exams/gmat-focus-edition"],
    },

    // =========================
    // PHASE 4 — Application assets (what wins admits)
    // =========================
    {
      id: "academic-cv-update",
      label: "Update CV (academic format + industry version)",
      notes:
        "Create:\n- 1–2 page academic CV\n- 1 page industry resume\nInclude projects, impact, teaching/research, and leadership.\nDone when: both are finalized.",
      idealFinish: "2026-06-30",
      estimatedTime: "4 hours",
      links: ["https://www.overleaf.com/"],
    },
    {
      id: "story-bank",
      label: "Create a story bank (10 impact stories)",
      notes:
        "Write 10 short stories with:\nSituation → Action → Result → What you learned.\nUse these for SOP, essays, interviews.\nDone when: stories are written and reusable.",
      idealFinish: "2026-07-10",
      estimatedTime: "90 min",
    },
    {
      id: "sop-master-outline",
      label: "Write master SOP outline",
      notes:
        "Structure:\n- Hook\n- Background + why now\n- Why this field\n- Why grad school\n- Why this program\n- Career goals\nDone when: outline is complete and can be adapted per school.",
      idealFinish: "2026-07-20",
      estimatedTime: "2 hours",
    },
    {
      id: "sop-master-draft",
      label: "Write master SOP draft (version 1)",
      notes:
        "Write a strong baseline SOP that you will tailor.\nDone when: you have a polished draft ready for feedback.",
      idealFinish: "2026-08-05",
      estimatedTime: "6–8 hours",
    },
    {
      id: "sop-feedback-round",
      label: "Get SOP feedback from 2–3 sources + revise",
      notes:
        "Sources can include:\n- professor/mentor\n- friend in grad school\n- trusted peer\nIncorporate feedback and create v2.\nDone when: SOP v2 exists.",
      idealFinish: "2026-08-20",
      estimatedTime: "4 hours",
    },
    {
      id: "lor-plan",
      label: "Letters of recommendation plan (3 recommenders + packet)",
      notes:
        "Choose 3 recommenders.\nPrepare a recommender packet:\n- CV\n- program list + deadlines\n- SOP v2\n- bullet achievements they can highlight\nDone when: packet is ready.",
      idealFinish: "2026-08-20",
      estimatedTime: "2 hours",
    },
    {
      id: "request-lors",
      label: "Request letters of recommendation (early)",
      notes:
        "Send clear email with:\n- timeline\n- submission instructions\n- what you want them to emphasize\nDone when: all 3 agree.",
      idealFinish: "2026-08-25",
      estimatedTime: "45 min",
    },
    {
      id: "transcripts-plan",
      label: "Transcripts plan (request + delivery method per school)",
      notes:
        "Confirm whether each school needs official transcripts at application time or only after admission.\nDone when: you know the process and have requested what’s needed.",
      idealFinish: "2026-09-10",
      estimatedTime: "45 min",
    },

    // =========================
    // PHASE 5 — Money + visa dependencies (don’t leave to the end)
    // =========================
    {
      id: "cost-model-per-program",
      label: "Cost model per program (tuition + living + fees)",
      notes:
        "Estimate per program:\n- tuition\n- insurance\n- living (rent/food/transport)\n- fees\nDone when: you have a realistic range for each program.",
      idealFinish: "2026-09-10",
      estimatedTime: "3 hours",
    },
    {
      id: "funding-plan",
      label: "Funding plan (savings + scholarships + assistantships)",
      notes:
        "List:\n- internal scholarships/assistantships per program\n- external scholarships\n- your savings plan + expected contribution\nDone when: you have a plan and what you’ll apply to.",
      idealFinish: "2026-09-20",
      estimatedTime: "2 hours",
    },
    {
      id: "visa-learning",
      label: "Visa basics (F-1): timeline + proof of funds + steps",
      notes:
        "Learn:\n- I-20 process\n- proof of funds expectations\n- timeline after admission\nDone when: you have a 1-page summary and know what documents you’ll need.",
      idealFinish: "2026-09-30",
      estimatedTime: "60 min",
      links: ["https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html"],
    },

    // =========================
    // PHASE 6 — Deadline season (program-specific; build a calendar)
    // =========================
    {
      id: "application-calendar",
      label: "Build application calendar (real deadlines for final list)",
      notes:
        "Add every deadline to calendar + tracker:\n- application deadline\n- LOR deadline\n- test score send deadline\nSet reminders 30/14/7 days before.\nDone when: calendar is complete.",
      idealFinish: "2026-10-01",
      estimatedTime: "60 min",
    },
    {
      id: "tailor-sops-per-program",
      label: "Tailor SOP/essays per program (6–8 versions, deep)",
      notes:
        "For each school:\n- name specific courses/labs/faculty\n- match to your story + goals\n- keep authentic\nDone when: each program has a tailored final version.",
      idealFinish: "2026-11-15",
      estimatedTime: "18–25 hours",
    },
    {
      id: "submit-first-wave",
      label: "Submit first-wave applications (earliest deadlines)",
      notes:
        "Submit the earliest 1–2 programs first.\nDone when: submitted + confirmation saved + tracker updated.",
      idealFinish: "2026-12-01",
      estimatedTime: "4–6 hours",
    },
    {
      id: "submit-main-wave",
      label: "Submit remaining applications (main deadline season)",
      notes:
        "Submit the remaining programs. Save confirmations. Verify LOR submissions.\nDone when: all are submitted.",
      idealFinish: "2027-02-15",
      estimatedTime: "8–12 hours",
    },
    {
      id: "interview-prep",
      label: "Interview prep + 2 mock interviews",
      notes:
        "Prepare:\n- 90-second story\n- why this program\n- why now\n- leadership + conflict + project questions\nDone when: you’ve done 2 mocks and improved weak answers.",
      idealFinish: "2027-03-15",
      estimatedTime: "3 hours",
    },
  ],
};