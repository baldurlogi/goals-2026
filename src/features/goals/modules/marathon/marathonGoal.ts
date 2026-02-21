import type { GoalDefinition } from "../../goalTypes";

export const marathonGoal: GoalDefinition = {
  id: "half-marathon",
  title: "Half Marathon Training Plan",
  subtitle: "Complete 21.1km race in summer 2026",
  emoji: "🏃‍♂️",
  priority: "medium",
  steps: [
    // =========================
    // PREP (late Feb / early Mar): set up the system
    // =========================

    {
      id: "gear-audit",
      label: "Gear audit: shoes are set + get essentials for long runs",
      notes:
        "You already have shoes. Confirm you have:\n- 2 pairs of running socks (anti-blister)\n- Anti-chafe (Vaseline/BodyGlide)\n- Lightweight running shorts/top\n- Small hydration solution for long runs (belt or handheld)\n\nDone when: you have socks + anti-chafe + a hydration option ready.",
      idealFinish: "2026-03-01",
      estimatedTime: "45 min",
    },
    {
      id: "running-playlist",
      label: "Create running playlist(s)",
      notes:
        "Make 2 playlists:\n- Easy runs (chill, steady)\n- Tempo/interval (high energy)\n\nOptional: download offline + set a 'no-skip first 10 min' rule to avoid starting too fast.",
      idealFinish: "2026-03-03",
      estimatedTime: "30 min",
    },
    {
      id: "fueling-research",
      label: "Research long-run fueling: gels, carbs, hydration, electrolytes",
      notes:
        "Goal: decide what you'll TEST in training.\n\nBasics:\n- If runs are <60 min: usually water is enough.\n- If runs are 60-90+ min: practice carbs + hydration.\n\nPick 1 gel brand + 1 backup. Decide:\n- Carb plan (e.g. 1 gel every ~30-40 min for long runs)\n- Hydration plan (water + electrolytes if warm/sweaty)\n\nDone when: you pick what you'll test and when you'll test it (see next step).",
      idealFinish: "2026-03-05",
      estimatedTime: "45-60 min",
    },
    {
      id: "buy-fueling",
      label: "Buy training nutrition (gels/chews + electrolytes) for testing",
      notes:
        "Buy a small variety pack (don't bulk buy yet). Include:\n- 4-6 gels/chews\n- Electrolyte tabs/powder (optional)\n\nDone when: you have enough to test across 2-3 long runs.",
      idealFinish: "2026-03-08",
      estimatedTime: "30 min",
      links: ["https://matas.dk", "https://bodylab.dk"],
    },
    {
      id: "baseline-5k",
      label: "Run baseline 5K (record time)",
      notes:
        "Easy pace, don't race it. Just establish starting point. Use Strava to track.",
      idealFinish: "2026-03-10",
      estimatedTime: "30-40 min",
      links: ["https://strava.com"],
    },

    // =========================
    // BASE BUILD (Mar): consistency + injury-proofing
    // =========================

    {
      id: "running-3x-week-4-weeks",
      label: "Build base: Run 3x/week for 4 weeks",
      notes:
        "Tue/Thu: 5-6km easy, Sat: 8-10km long run. All conversational pace.\nRule: increase weekly volume slowly. Consistency > intensity.",
      idealFinish: "2026-04-07",
      estimatedTime: "12 hours total",
    },
    {
      id: "strength-2x-week",
      label: "Add strength & mobility 2x/week (injury prevention)",
      notes:
        "2 short sessions/week (20-30 min):\n- Glutes: hip thrust/bridges\n- Hamstrings: RDL or hamstring curl\n- Calves: calf raises\n- Core: planks/dead bug\n- Ankles/hips mobility\n\nDone when: you complete 8 sessions (4 weeks).",
      idealFinish: "2026-04-07",
      estimatedTime: "3-4 hours total",
    },
    {
      id: "register-for-race",
      label: "Register for half marathon race",
      notes:
        "Copenhagen Half Marathon (Sept) or find a summer race. Book before sold out.\nDone when: race is selected and registration is completed.",
      idealFinish: "2026-04-15",
      estimatedTime: "30 min",
      links: ["https://cphhalf.dk"],
    },

    // =========================
    // 12-WEEK PLAN (late May → race): structure + long runs + fueling practice
    // =========================

    {
      id: "start-12-week-plan",
      label: "Start 12-week half marathon plan",
      notes:
        "Begin late May.\nTue/Thu: 6-8km with tempo/intervals.\nSat: progressive long runs.\nKeep most runs EASY; intensity is a small slice.\nTrack in Strava.",
      idealFinish: "2026-05-25",
      estimatedTime: "ongoing",
    },

    // Long run progression + fueling practice logic
    {
      id: "long-run-10k",
      label: "Complete 10km long run",
      notes:
        "Week 2 of plan. Easy pace.\nFueling: if you're running >60 min, test 1 gel around minute ~40-50.\nHydration: bring water if needed.",
      idealFinish: "2026-06-08",
      estimatedTime: "55-70 min",
    },
    {
      id: "long-run-12k",
      label: "Complete 12km long run",
      notes:
        "Week 3. Start fueling practice.\nFueling: 1 gel every ~30-40 min (likely 1-2 gels total).\nHydration: water + electrolytes if warm/sweaty.\nLog what your stomach tolerates.",
      idealFinish: "2026-06-15",
      estimatedTime: "65-80 min",
    },
    {
      id: "long-run-14k",
      label: "Complete 14km long run",
      notes:
        "Week 4. Confidence builder.\nPractice: same breakfast timing + same gel plan you'd use on race day.\nUse anti-chafe if needed.",
      idealFinish: "2026-06-22",
      estimatedTime: "75-90 min",
    },
    {
      id: "recovery-week",
      label: "Recovery week (reduce volume 50%)",
      notes:
        "Week 5. Easy runs only. Let body adapt.\nSleep + nutrition focus. Keep strength light.",
      idealFinish: "2026-06-29",
      estimatedTime: "lighter",
    },
    {
      id: "long-run-16k",
      label: "Complete 16km long run",
      notes:
        "Week 6. Maintain easy pace.\nFueling: replicate race gel cadence.\nGoal: steady last 5km (no hero pace).",
      idealFinish: "2026-07-06",
      estimatedTime: "85-100 min",
    },
    {
      id: "race-day-gear-test",
      label: "Test full race-day setup on a long run",
      notes:
        "Pick one long run and test:\n- Outfit + socks\n- Hydration method\n- Gels (exact brand)\n- Watch/phone setup\n- Anti-chafe\n\nDone when: you've done one long run with full race-day setup and made adjustments.",
      idealFinish: "2026-07-08",
      estimatedTime: "10 min setup + long run",
    },
    {
      id: "long-run-18k",
      label: "Complete 18km long run",
      notes:
        "Week 7. Peak long-run practice.\nFueling: do exactly what you plan for race day.\nPacing: first 10k relaxed; finish strong but controlled.",
      idealFinish: "2026-07-13",
      estimatedTime: "95-110 min",
    },
    {
      id: "long-run-19k",
      label: "Complete 19km long run",
      notes:
        "Week 8. Last big run (90% distance).\nKeep it EASY. Success is finishing feeling like you could do 2 more km.",
      idealFinish: "2026-07-20",
      estimatedTime: "100-115 min",
    },
    {
      id: "buy-race-day-gear",
      label: "Finalize race day gear + nutrition (no new surprises)",
      notes:
        "Nothing new on race day.\nConfirm you have:\n- Outfit tested\n- 2-3 gels (tested)\n- Safety pins/belt/bib plan\n- Electrolytes (if you use them)\n- Anti-chafe\n",
      idealFinish: "2026-07-15",
      estimatedTime: "45-60 min",
    },

    // =========================
    // TAPER + RACE
    // =========================

    {
      id: "taper-week-1",
      label: "Taper week 1 (reduce volume ~60%)",
      notes:
        "Week 9. Short, easy runs. Keep legs fresh. One short 'pick-up' session is okay (few strides).",
      idealFinish: "2026-07-27",
      estimatedTime: "lighter",
    },
    {
      id: "taper-week-2",
      label: "Taper week 2 (race week)",
      notes:
        "Week 10. Mon/Wed: 3-5km easy.\nThu: complete rest.\nCarb focus Fri/Sat.\nEarly bedtime.\nDo not test new foods/supplements.",
      idealFinish: "2026-08-03",
      estimatedTime: "very light",
    },
    {
      id: "race-day-prep",
      label: "Race day preparation",
      notes:
        "Night before: bib, outfit, shoes, gels, watch, anti-chafe.\nSet 2 alarms.\nEat familiar breakfast 2-3 hrs before.\nWarm-up: 5-10 min easy + a few strides.",
      idealFinish: "2026-08-08",
      estimatedTime: "45-60 min",
    },
    {
      id: "run-half-marathon",
      label: "RACE DAY: Run the half marathon (21.1km)!",
      notes:
        "Pacing:\n- First 5k should feel EASY.\n- Settle into rhythm 5-15k.\n- Last 5k: focus and push.\nFueling example: gel around 7k and 14k (based on what you tested).\nFinish strong!",
      idealFinish: "2026-08-09",
      estimatedTime: "2-2.5 hours",
    },

    // =========================
    // RECOVERY + REVIEW
    // =========================

    {
      id: "recovery-week-post-race",
      label: "Post-race recovery week",
      notes:
        "Rest 2-3 days completely. Then easy walks/light swimming.\nNo running for ~7-10 days.\nIf anything hurts sharply, back off and recover fully.",
      idealFinish: "2026-08-16",
      estimatedTime: "ongoing",
    },
    {
      id: "post-race-review",
      label: "Post-race review + next goal",
      notes:
        "Write a short review:\n- What worked (training, fueling, gear)\n- What didn't\n- Next target (another half, or start marathon base)\nDone when: review is written and next goal is chosen.",
      idealFinish: "2026-08-20",
      estimatedTime: "20 min",
    },
  ],
};