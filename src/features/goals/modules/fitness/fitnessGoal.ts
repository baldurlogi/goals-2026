import type { GoalDefinition } from "../../goalTypes";

export const fitnessGoal: GoalDefinition = {
  id: "fitness-nutrition",
  title: "Fitness & Nutrition Master Plan",
  subtitle: "Stay lean at 76-78kg while building muscle",
  emoji: "💪",
  priority: "high",
  steps: [
    // =========================
    // WEEK 1: Set the system (Feb 21–Feb 28)
    // =========================

    {
      id: "set-fitness-baseline",
      label: "W1: Baseline check (weight, waist, photos, current lifts)",
      notes:
        "Record:\n- Morning bodyweight 3 days in a row (use average)\n- Waist measurement (navel)\n- Progress photos (front/side/back)\n- Current main lifts baseline (bench/squat/hinge/pull)\n\nDone when: baseline is written down + photos saved.",
      idealFinish: "2026-02-24",
      estimatedTime: "30 min",
    },

    {
      id: "supplement-research",
      label: "W1: Research supplement stack + decide what's actually worth it",
      notes:
        "Goal: decide supplements based on evidence + your diet + (ideally) bloodwork.\n\nDecide on:\n- Must-haves (often: creatine monohydrate; protein powder if needed)\n- Conditional (vitamin D in winter, omega-3 if low fish intake, magnesium if sleep/cramps)\n- Not-needed/marketing\n\nSafety note: avoid high doses without checking with GP/pharmacist, especially vitamin D.\n\nDone when: you have a final list + brand choices + daily routine timing.",
      idealFinish: "2026-02-26",
      estimatedTime: "60-90 min",
      links: ["https://bodylab.dk", "https://matas.dk"],
    },

    {
      id: "buy-supplements",
      label: "W1: Buy chosen supplement stack",
      notes:
        "Buy only what you decided in the research step. Keep it simple.\nDone when: supplements are purchased and placed in an easy daily setup (kitchen + bedside).",
      idealFinish: "2026-02-28",
      estimatedTime: "45-60 min",
      links: ["https://bodylab.dk", "https://matas.dk"],
    },

    {
      id: "calculate-macros-v1",
      label: "W1: Calculate daily macros (v1) + set adjustment rule",
      notes:
        "Set initial targets based on goal: lean muscle.\n\nFramework:\n- Protein: 1.8-2.2 g/kg bodyweight\n- Fat: ~0.7-1.0 g/kg (don't go too low)\n- Carbs: fill remaining calories\n\nAdd an adjustment rule:\n- If weekly average weight is trending up too fast: -150 to -200 kcal/day\n- If weight is dropping and performance suffers: +150 to +200 kcal/day\n\nDone when: macros are saved + you have the adjustment rule written.",
      idealFinish: "2026-02-27",
      estimatedTime: "45 min",
    },

    {
      id: "meal-templates",
      label: "W1: Create meal templates (breakfast + lunch + dinner + snacks)",
      notes:
        "Create 2-3 options for each category so you can rotate without thinking.\n\nBreakfast rotation (pick 3):\n- Skyr bowl (skyr + berries + granola) + optional whey\n- Overnight oats (oats + skyr/milk + berries)\n- Eggs + toast + fruit\n\nPre-gym snack rotation (pick 3):\n- Chicken & avocado wrap\n- Rice cakes + banana + protein shake\n- Skyr + honey + fruit\n\nDone when: you have at least 3 breakfasts + 3 pre-gym snacks written + added to shopping list.",
      idealFinish: "2026-02-28",
      estimatedTime: "60 min",
    },

    {
      id: "meal-prep-system",
      label: "W1: Define meal prep system (what you prep + when)",
      notes:
        "Decide meal-prep cadence:\n- Grocery day + prep block (e.g., Sunday 90-120 min)\n\nPrep targets:\n- 2 proteins (e.g., chicken + beef/turkey)\n- 1 carb base (rice/potatoes/pasta)\n- 2-3 vegetables\n- 1 sauce option\n\nDone when: you have a repeating weekly plan + first shopping list.",
      idealFinish: "2026-03-01",
      estimatedTime: "60-90 min",
    },

    // =========================
    // WEEK 2: Execute + measure (Mar 1–Mar 8)
    // =========================

    {
      id: "track-week-1",
      label: "W2: Track nutrition for 7 consecutive days",
      notes:
        "Track food daily. Priority order:\n1) Hit protein\n2) Hit calories\n3) Carbs/fats fall into place\n\nDone when: 7/7 days logged.",
      idealFinish: "2026-03-08",
      estimatedTime: "10 min/day",
    },

    {
      id: "lock-workout-split",
      label: "W2: Lock workout split + minimum weekly commitment",
      notes:
        "Choose your split and define minimum success:\n- Minimum: 4 lifting sessions/week\n- Ideal: 5 lifting + 1 conditioning/swim\n\nYour current plan is great:\nMon Push, Tue Lower (squat), Wed Swim, Thu Pull, Fri Lower (hinge), Sat CrossFit, Sun Rest\n\nDone when: schedule is set + you know the minimum you'll hit even in travel weeks.",
      idealFinish: "2026-03-03",
      estimatedTime: "20 min",
    },

    // =========================
    // ONGOING SYSTEMS (monthly + quarterly)
    // =========================

    {
      id: "progressive-overload-8-weeks",
      label: "8-week block: Track progressive overload",
      notes:
        "Track lifts and aim for either:\n- +1-2 reps on accessories OR\n- +2.5-5kg on compounds when reps/tech are solid\n\nDone when: you complete 8 weeks of tracked workouts.",
      idealFinish: "2026-04-20",
      estimatedTime: "5 min/workout",
    },

    {
      id: "deload-week-1",
      label: "Deload week: reduce fatigue and protect progress",
      notes:
        "Deload rule:\n- Cut volume ~40-50%\n- Keep technique sharp\n- Prioritize sleep and recovery\n\nDone when: one full deload week is completed.",
      idealFinish: "2026-04-27",
      estimatedTime: "4-6 hrs/week",
    },

    {
      id: "monthly-fitness-close",
      label: "Monthly close: metrics + macro adjustment",
      notes:
        "End of each month (15-20 min):\n- Average weekly weight trend\n- Waist measurement\n- Adherence score (training days + macro hit rate)\n- Adjust calories by ±150-200 if needed\n\nDone when: you complete your first monthly close.",
      idealFinish: "2026-03-31",
      estimatedTime: "20 min/month",
    },

    {
      id: "body-comp-check",
      label: "Body composition check (optional) + update targets",
      notes:
        "If you do an InBody scan: treat it as a trend tool, not truth.\nDone when: scan is completed and you updated your plan if needed.",
      idealFinish: "2026-05-10",
      estimatedTime: "30 min",
      links: ["https://sats.com"],
    },

    {
      id: "q2-physique-milestone",
      label: "Q2 milestone: lean muscle progress checkpoint",
      notes:
        "By end of June:\n- Consistent training baseline\n- Visible recomposition trend (photos/waist)\n- Strength up on key lifts\n\nDone when: you take photos + evaluate progress and set next block focus.",
      idealFinish: "2026-06-30",
      estimatedTime: "20 min",
    },

    {
      id: "progress-photos-midyear",
      label: "Mid-year progress photos",
      notes:
        "Front/side/back. Same lighting + same time of day.\nDone when photos are saved and compared side-by-side.",
      idealFinish: "2026-07-01",
      estimatedTime: "10 min",
    },

    {
    id: "summer-body-ready",
    label: "Summer-ready checkpoint: lean + athletic look",
    notes:
        "Target by end of May:\n- Weight range: 76-78kg (or your chosen range)\n- Waist trend lean/stable\n- Strength up on key lifts\n- Photos show clear definition\n\nDone when: you take photos + measurements and confirm you're 'summer-ready'.",
    idealFinish: "2026-05-31",
    estimatedTime: "Ongoing",
    },

    {
    id: "summer-maintenance",
    label: "Maintain summer physique (June-August)",
    notes:
        "Maintain with simple rules:\n- Training: 4 sessions/week minimum (3 on travel weeks)\n- Nutrition: protein daily + flexible calories\n- Steps/movement: daily baseline\n\nDone when: end-of-Aug photos/measurements show maintenance.",
    idealFinish: "2026-08-31",
    estimatedTime: "Ongoing",
    },

    {
      id: "maintain-through-dec",
      label: "Maintain physique through December (travel-proof plan)",
      notes:
        "Create your travel-proof minimums:\n- Training: 3 sessions/week minimum\n- Nutrition: protein target daily + calorie awareness\n- Steps: daily movement goal\n\nDone when: you finish the year with consistency (not perfection).",
      idealFinish: "2026-12-31",
      estimatedTime: "Ongoing",
    },

    {
        id: "cut-plan-decision",
        label: "Cut decision: choose mini-cut vs recomp (based on March progress)",
        notes:
            "Decision rule (use 2 weeks of data):\n- If waist isn’t trending down and you feel 'soft': start a cut.\n- If waist is stable and lifts are going up: stay in recomp.\n\nCut starter plan:\n- Calories: -250 to -350/day\n- Protein stays high\n- Add 2k steps/day OR 2 x 20 min Zone 2/week\n\nDone when: you pick one plan and write exact numbers (calories + steps/cardio).",
        idealFinish: "2026-03-31",
        estimatedTime: "20 min",
        },
        {
        id: "cut-start",
        label: "Start cut phase (if chosen) + set cardio/steps schedule",
        notes:
            "If cutting:\n- Keep lifting the same (don’t turn workouts into cardio)\n- Add: 2–3 Zone 2 sessions/week (20–30 min) OR raise steps to 10k/day\n- Keep 1 higher-carb day if performance suffers\n\nDone when: first 7 days completed with targets hit 5/7 days.",
        idealFinish: "2026-04-06",
        estimatedTime: "30–90 min/week extra",
        },
        {
        id: "cut-checkpoint-2-weeks",
        label: "Cut checkpoint (2 weeks): adjust calories/cardio",
        notes:
            "Check:\n- Weekly average weight trend\n- Waist measurement\n- Gym performance\n\nAdjust rule:\n- If no change: -150 kcal/day OR +1 Zone 2 session/week\n- If losing too fast/feeling flat: +150 kcal/day OR reduce cardio\n\nDone when: you make one adjustment (or confirm no change).",
        idealFinish: "2026-04-20",
        estimatedTime: "15 min",
        },
        {
        id: "pre-summer-final-push",
        label: "Final push (May): lock in summer-ready look",
        notes:
            "May rules:\n- Keep training intensity high\n- Tighten diet consistency (80–90%)\n- Keep protein daily\n- Cardio/steps stay consistent\n\nDone when: you complete May with at least 20/31 days on plan.",
        idealFinish: "2026-05-31",
        estimatedTime: "Ongoing",
    },
  ],
};