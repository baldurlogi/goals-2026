import type { GoalDefinition } from "../../goalTypes";

export const skincareGoal: GoalDefinition = {
  id: "skincare-hair",
  title: "Skincare & Hair Treatment",
  subtitle: "Optimize skin routine + prevent hair loss",
  emoji: "🧴",
  priority: "medium",

  /**
   * Scheduling approach:
   * - Week 1: set up basics + baselines + start habits (skin + hair start in parallel)
   * - Week 2: GP visits + introduce BHA + niacinamide; ramp minoxidil
   * - Week 3–4: introduce retinol gradually + stabilize routines; optional dermaroller setup
   * - Month 3/6: progress photo checkpoints + transplant research later
   */
  steps: [
    // =========================
    // WEEK 1 (Feb 21–Feb 28): Setup + Baselines + Bookings
    // =========================

    {
      id: "skin-baseline-photos",
      label: "W1: Take baseline skin photos",
      notes:
        "Take 3 photos: front + left + right. Same lighting/angle each time (bathroom light, morning). Save to album: '2026 Skin'.",
      idealFinish: "2026-02-22",
      estimatedTime: "10 min",
    },
    {
      id: "hair-baseline-photos",
      label: "W1: Take baseline hair photos",
      notes:
        "Take crown + hairline + temples. Same lighting/angle. Save to album: '2026 Hair'.",
      idealFinish: "2026-02-22",
      estimatedTime: "10 min",
    },

    {
      id: "skin-concerns-list",
      label: "W1: List skin concerns + take targeted photos",
      notes:
        "Write 4 bullets: (1) sebaceous filaments/blackheads on nose, (2) redness/uneven tone, (3) dark patch near eye, (4) mole check. Take close-up photos of nose + redness area + dark patch + any moles you're unsure about. Save to album: '2026 Skin - Concerns'.",
      idealFinish: "2026-02-23",
      estimatedTime: "15 min",
    },

    {
      id: "buy-skincare-products",
      label: "W1: Buy skincare starter kit",
      notes:
        "Goal: simple, non-irritating base. Suggested: CeraVe Foaming Cleanser, CeraVe PM (moisturizer), La Roche-Posay SPF 50+. Optional actives to add later: Paula's Choice 2% BHA, The Ordinary Niacinamide, Retinol. Budget: 600–800 DKK total.",
      idealFinish: "2026-02-25",
      estimatedTime: "1 hour",
      links: ["https://matas.dk", "https://theordinary.com", "https://www.paulaschoice.com/"],
    },
    {
      id: "setup-sink-station",
      label: "W1: Set up bathroom 'sink station'",
      notes:
        "Make it frictionless. Put AM products together (cleanser, moisturizer, SPF). PM products together (cleanser, moisturizer). Keep actives separate until Week 2–4.",
      idealFinish: "2026-02-25",
      estimatedTime: "10 min",
    },
    {
      id: "install-habit-tracking",
      label: "W1: Set up habit tracking (skin + hair)",
      notes:
        "Add daily habits: AM cleanse, AM SPF, PM cleanse, PM moisturize, Minoxidil. Minimum success rule: never miss AM SPF + PM cleanse.",
      idealFinish: "2026-02-26",
      estimatedTime: "15 min",
    },

    {
      id: "book-gp-skin-check",
      label: "W1: Book GP appointment for skin check (moles + discoloration)",
      notes:
        "Book appointment (done when booked). Request: mole check + evaluate dark patch near eye + redness/uneven tone. Mention how long it's been present and any changes. Ask if dermatologist referral is appropriate and what to watch for in moles (change in shape/color/size).",
      idealFinish: "2026-02-26",
      estimatedTime: "10 min",
      links: ["https://min.sundhed.dk"],
    },

    // -------------------------
    // HAIR TRACK (parallel) — start immediately
    // -------------------------

    {
      id: "book-gp-hair-loss",
      label: "W1: Book GP appointment for hair loss consultation",
      notes:
        "Book the appointment (done when it's BOOKED). Prepare to discuss: timeline, family history, goals, and questions about Finasteride risks/side effects.",
      idealFinish: "2026-02-24",
      estimatedTime: "10 min",
      links: ["https://min.sundhed.dk"],
    },
    {
      id: "buy-minoxidil",
      label: "W1: Buy Minoxidil 5% (foam or liquid)",
      notes:
        "Choose foam if you prefer less dripping; liquid if cheaper. Start 1x/day for the first week to reduce irritation, then ramp to 2x/day if tolerated.",
      idealFinish: "2026-02-25",
      estimatedTime: "20 min",
      links: ["https://matas.dk"],
    },
    {
      id: "start-minoxidil-week-1",
      label: "W1: Start Minoxidil 5% (1x daily for 7 days)",
      notes:
        "Apply to DRY scalp, same time each day (e.g. evening). Track 7/7 days. If irritation: reduce amount, ensure scalp is dry, avoid broken skin.",
      idealFinish: "2026-03-03",
      estimatedTime: "3–5 min/day",
    },

    // -------------------------
    // SKIN TRACK — Week 1 basics only (no actives yet)
    // -------------------------

    {
      id: "start-am-routine-basics",
      label: "W1: Start AM routine (basics only)",
      notes:
        "AM (daily): Cleanser → Moisturizer → SPF. Do NOT add BHA/retinol yet. Goal is consistency and zero irritation.",
      idealFinish: "2026-02-26",
      estimatedTime: "3–5 min/day",
    },
    {
      id: "spf-reapply-rule",
      label: "W1: Set SPF reapply rule",
      notes:
        "Reapply SPF if you're outdoors for ~2+ hours or sweating. If you're mostly indoors, 1 morning application is fine—keep it simple and consistent.",
      idealFinish: "2026-02-27",
      estimatedTime: "5 min",
    },
    {
      id: "start-pm-routine-basics",
      label: "W1: Start PM routine (basics only)",
      notes:
        "PM (daily): Cleanser → Moisturizer. If you wore heavy SPF/makeup: cleanse twice (same cleanser). No actives in Week 1.",
      idealFinish: "2026-02-26",
      estimatedTime: "3–6 min/day",
    },

    // =========================
    // WEEK 2 (Mar 1–Mar 7): GP visits + introduce mild actives + ramp minoxidil
    // =========================

    {
      id: "gp-skin-visit",
      label: "W2: Attend GP appointment (skin check + plan)",
      notes:
        "Bring photos and list of concerns. Ask:\n- Are the nose spots sebaceous filaments vs blackheads?\n- Best treatment plan (BHA, retinoid, azelaic acid?)\n- Dark patch near eye: possible hyperpigmentation/melasma/vascular? Safe options?\n- Redness/uneven tone: irritation vs rosacea? triggers?\n- Mole check: which to monitor; whether dermoscopy/referral is needed.\nLeave with: a clear plan + follow-up if needed.",
      idealFinish: "2026-03-07",
      estimatedTime: "30–60 min",
      links: ["https://min.sundhed.dk"],
    },

    {
      id: "patch-test-actives",
      label: "W2: Patch test actives (BHA + Retinol)",
      notes:
        "Patch test on a small area for 2 nights each (separately). Stop if strong burning/rash. Proceed only if tolerated. If your baseline redness is high, delay retinol to Week 4.",
      idealFinish: "2026-03-04",
      estimatedTime: "10 min total",
    },
    {
      id: "add-bha-2x-week",
      label: "W2: Add BHA 2x/week (after patch test)",
      notes:
        "Schedule: Tue + Sat nights. Order: Cleanser → BHA → Moisturizer. Skip retinol on BHA nights. If irritation/dryness: drop to 1x/week for 2 weeks.",
      idealFinish: "2026-03-07",
      estimatedTime: "2 extra min on BHA nights",
      links: ["https://www.paulaschoice.com/"],
    },
    {
      id: "add-niacinamide",
      label: "W2: Add Niacinamide (most nights)",
      notes:
        "If tolerated: Cleanser → Niacinamide → Moisturizer. If sensitive, avoid on the same nights as your first BHA uses (keep variables separated).",
      idealFinish: "2026-03-07",
      estimatedTime: "1–2 extra min",
      links: ["https://theordinary.com"],
    },

    {
      id: "gp-appointment-hair-loss",
      label: "W2: Attend GP appointment (hair loss plan)",
      notes:
        "Ask about: Finasteride 1mg daily, monitoring, contraindications, and what to do if side effects occur. Ask whether dermatologist referral is recommended.",
      idealFinish: "2026-03-07",
      estimatedTime: "30–60 min",
      links: ["https://min.sundhed.dk"],
    },
    {
      id: "start-minoxidil-2x-daily",
      label: "W2: Ramp Minoxidil to 2x daily (if tolerated)",
      notes:
        "Add morning application. If irritation occurs, revert to 1x/day for another week then retry.",
      idealFinish: "2026-03-07",
      estimatedTime: "3–5 min/day",
    },

    // =========================
    // WEEK 3–4 (Mar 8–Mar 31): Introduce retinol gradually + stabilize routines
    // =========================

    {
      id: "start-retinol-2x-week",
      label: "W3: Start Retinol 2x/week (gentle ramp)",
      notes:
        "Schedule: Wed + Sun nights. Order: Cleanser → (optional Niacinamide) → Retinol → Moisturizer. Skip on BHA nights. If redness is active or you feel sensitized, delay to Week 4 and start 1x/week first.",
      idealFinish: "2026-03-15",
      estimatedTime: "2 extra min on retinol nights",
      links: ["https://theordinary.com"],
    },
    {
      id: "skincare-30-days-consistency",
      label: "W4: Complete 30 days of consistent skincare (basics + planned actives)",
      notes:
        "Success rule: Basics daily (AM cleanse + SPF, PM cleanse + moisturize). Actives only on schedule. Take after photos on day 30.",
      idealFinish: "2026-03-31",
      estimatedTime: "5–6 hours total (month)",
    },
    {
      id: "skin-30-day-review",
      label: "W4: 30-day skin review + tweak one thing max",
      notes:
        "Compare baseline vs day-30 photos. Decide ONE tweak: increase BHA from 2x→3x/week OR keep same OR reduce if dry/irritated. Don't change multiple variables at once.",
      idealFinish: "2026-03-31",
      estimatedTime: "15 min",
    },

    // =========================
    // HAIR MEDS (only after GP approval)
    // =========================

    {
      id: "start-finasteride",
      label: "Start Finasteride 1mg daily (after GP approval)",
      notes:
        "Only start if GP approves/prescribes. Take same time daily. Track a 14-day adherence streak as 'stabilized'.",
      idealFinish: "2026-03-15",
      estimatedTime: "30 sec/day",
    },

    // =========================
    // OPTIONAL: Dermaroller (introduce only after minoxidil routine is stable)
    // =========================

    {
      id: "buy-derma-roller",
      label: "Optional: Buy dermaroller + sterilization supplies",
      notes:
        "Only if you are consistent with Minoxidil first. Buy 0.5mm to start + 70% isopropyl alcohol for cleaning. If unsure, skip this step entirely.",
      idealFinish: "2026-03-31",
      estimatedTime: "30 min",
      links: ["https://matas.dk"],
    },
    {
      id: "dermaroll-weekly-setup",
      label: "Optional: Start dermarolling 1x/week (recurring)",
      notes:
        "Once weekly (e.g. Saturday morning). Light pressure. Clean before/after. Avoid Minoxidil same day if you get irritation. If this feels stressful, skip—consistency with meds matters more.",
      idealFinish: "2026-04-06",
      estimatedTime: "10–15 min/week",
    },

    // =========================
    // CHECKPOINTS
    // =========================

    {
      id: "hair-progress-photo-3-months",
      label: "Checkpoint: Hair progress photos (3 months)",
      notes:
        "Repeat the same baseline angles. Compare crown/hairline/temples. Expect slow change; consistency matters more than weekly judgment.",
      idealFinish: "2026-06-01",
      estimatedTime: "10 min",
    },
    {
      id: "hair-progress-photo-6-months",
      label: "Checkpoint: Hair progress photos (6 months)",
      notes:
        "6 months is a meaningful checkpoint for Minoxidil (+ Finasteride if used). Decide: keep as-is, adjust, or consult dermatologist.",
      idealFinish: "2026-09-01",
      estimatedTime: "10 min",
    },

    // =========================
    // TRANSPLANT (later; not urgent in early months)
    // =========================

    {
      id: "research-transplant-clinics",
      label: "Research hair transplant clinics (shortlist 3–5)",
      notes:
        "Research only after you've been consistent with your routine for months. Compare Turkey vs Copenhagen. Save notes: technique, graft estimate, cost, recovery, reviews.",
      idealFinish: "2026-06-30",
      estimatedTime: "5 hours",
      links: ["https://reddit.com/r/tressless"],
    },
    {
      id: "book-transplant-consultations",
      label: "Book 2 transplant consultations (1 virtual + 1 in-person)",
      notes:
        "Ask: FUE vs FUT, graft count, donor area, scarring, total cost, timeline, recovery plan, and realistic expectations.",
      idealFinish: "2026-07-31",
      estimatedTime: "2–3 hours",
    },
    {
      id: "decide-transplant-timing",
      label: "Decide on transplant timing (if still needed)",
      notes:
        "Decision criteria: stability of hair loss on meds, budget, time off (10–14 days), and life schedule. If you're unsure, default to 'wait and reassess'.",
      idealFinish: "2026-08-31",
      estimatedTime: "30 min",
    },
  ],
};