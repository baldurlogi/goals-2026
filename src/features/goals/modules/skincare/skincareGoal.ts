import type { GoalDefinition } from "../../goalTypes";


export const skincareGoal: GoalDefinition =  {
    id: "skincare-hair",
    title: "Skincare & Hair Treatment",
    subtitle: "Optimize skin routine + prevent hair loss",
    emoji: "🧴",
    priority: "low",
    steps: [
        {
            id: "buy-skincare-products",
            label: "Buy skincare starter kit",
            notes: "CeraVe Foaming Cleanser, Paula's Choice BHA, CeraVe PM, La Roche-Posay SPF 50+, The Ordinary Niacinamide + Retinol. Budget: 600-800 DKK.",
            idealFinish: "2026-02-25",
            estimatedTime: "1 hour",
            links: ["https://matas.dk", "https://theordinary.com"]
        },
        {
            id: "establish-morning-routine",
            label: "Establish morning skincare routine (5 min)",
            notes: "Cleanser → BHA (2-3x/week) → Moisturizer → SPF. Do daily, even on weekends.",
            idealFinish: "2026-03-01",
            estimatedTime: "5 min/day"
        },
        {
            id: "establish-evening-routine",
            label: "Establish evening skincare routine (7 min)",
            notes: "Double cleanse → Niacinamide → Retinol (3x/week) → Moisturizer. Never skip!",
            idealFinish: "2026-03-01",
            estimatedTime: "7 min/day"
        },
        {
            id: "skincare-30-days",
            label: "Complete 30 days of consistent skincare",
            notes: "Take before photo on day 1, after on day 30. Track in habit app. You'll see improvement!",
            idealFinish: "2026-03-31",
            estimatedTime: "6 hrs total"
        },
        {
            id: "book-gp-hair-loss",
            label: "Book GP appointment for hair loss consultation",
            notes: "Discuss Finasteride prescription. Mention family history. Ask about side effects. CRITICAL: Do this ASAP!",
            idealFinish: "2026-02-20",
            estimatedTime: "1 hour (incl. appointment)",
            links: ["https://min.sundhed.dk"]
        },
        {
            id: "start-minoxidil",
            label: "Start Minoxidil 5% (2x daily)",
            notes: "Buy Rogaine or generic from Matas. Apply to dry scalp, morning and evening. Takes 4-6 months to see results. Cost: ~200 DKK/month.",
            idealFinish: "2026-02-25",
            estimatedTime: "5 min/day"
        },
        {
            id: "start-finasteride",
            label: "Start Finasteride 1mg (daily pill)",
            notes: "After GP approval. Take same time each day. Most effective hair loss prevention. Cost: ~150 DKK/month.",
            idealFinish: "2026-03-01",
            estimatedTime: "30 sec/day"
        },
        {
            id: "buy-derma-roller",
            label: "Buy dermaroller (0.5-1.0mm)",
            notes: "Enhances Minoxidil absorption. Use 1x/week. Clean with alcohol before/after. Cost: ~200 DKK one-time.",
            idealFinish: "2026-03-05",
            estimatedTime: "30 min"
        },
        {
            id: "dermaroll-weekly",
            label: "Dermaroll scalp 1x per week",
            notes: "Saturday mornings. Roll in 4 directions, light pressure. Don't apply Minoxidil same day. 10 min.",
            idealFinish: "ongoing",
            estimatedTime: "10 min/week"
        },
        {
            id: "hair-progress-photo-3-months",
            label: "Take hair progress photos (3 months)",
            notes: "Same lighting, same angle. Compare to baseline. Minoxidil takes time. Be patient!",
            idealFinish: "2026-06-01",
            estimatedTime: "5 min"
        },
        {
            id: "research-transplant-clinics",
            label: "Research hair transplant clinics",
            notes: "Turkey (20-40k DKK) vs Copenhagen (60-100k DKK). Read reviews, check before/afters. Make shortlist of 3-5.",
            idealFinish: "2026-06-30",
            estimatedTime: "5 hours",
            links: ["https://reddit.com/r/tressless"]
        },
        {
            id: "book-transplant-consultations",
            label: "Book 2 transplant consultations",
            notes: "One Turkey clinic (virtual), one Copenhagen (in-person). Ask: FUE vs FUT, grafts needed, cost, recovery.",
            idealFinish: "2026-07-31",
            estimatedTime: "3 hours"
        },
        {
            id: "decide-transplant-timing",
            label: "Decide on transplant timing",
            notes: "Best after grad school acceptance (Summer 2027). Need 10-14 days recovery. Plan accordingly.",
            idealFinish: "2026-08-31",
            estimatedTime: "decision"
        },
        {
            id: "hair-progress-photo-6-months",
            label: "Take hair progress photos (6 months)",
            notes: "Should see noticeable improvement with Minoxidil + Finasteride combo. Celebrate wins!",
            idealFinish: "2026-09-01",
            estimatedTime: "5 min"
        }
    ]
}