import type { GoalDefinition } from "../../goalTypes";


export const marathonGoal: GoalDefinition = {
    id: "half-marathon",
    title: "Half Marathon Training Plan",
    subtitle: "Complete 21.1km race in summer 2026",
    emoji: "🏃‍♂️",
    priority: "medium",
    steps: [
        {
            id: "buy-running-shoes",
            label: "Buy proper running shoes",
            notes: "Go to running store (Runners World Copenhagen). Get gait analysis. Buy 2 pairs to rotate. Budget: 1,500-2,000 DKK.",
            idealFinish: "2026-03-01",
            estimatedTime: "2 hours",
            links: ["https://runnersworld.dk"]
        },
        {
            id: "baseline-5k",
            label: "Run baseline 5K (record time)",
            notes: "Easy pace, don't race it. Just establish starting point. Use Strava to track.",
            idealFinish: "2026-03-10",
            estimatedTime: "30-40 min",
            links: ["https://strava.com"]
        },
        {
            id: "running-3x-week-4-weeks",
            label: "Build base: Run 3x/week for 4 weeks",
            notes: "Tue/Thu: 5-6km easy, Sat: 8-10km long run. All conversational pace. Focus on consistency.",
            idealFinish: "2026-04-07",
            estimatedTime: "12 hours total"
        },
        {
            id: "register-for-race",
            label: "Register for half marathon race",
            notes: "Copenhagen Half Marathon (Sept) or find summer race. Book now before sold out.",
            idealFinish: "2026-04-15",
            estimatedTime: "30 min",
            links: ["https://cphhalf.dk"]
        },
        {
            id: "start-12-week-plan",
            label: "Start 12-week half marathon plan",
            notes: "Begin late May. Tue/Thu: 6-8km with tempo/intervals. Sat: Progressive long runs. Track in Strava.",
            idealFinish: "2026-05-25",
            estimatedTime: "ongoing"
        },
        {
            id: "long-run-10k",
            label: "Complete 10km long run",
            notes: "Week 2 of plan. Easy pace. Hydrate well. Fuel if over 60 min.",
            idealFinish: "2026-06-08",
            estimatedTime: "55-70 min"
        },
        {
            id: "long-run-12k",
            label: "Complete 12km long run",
            notes: "Week 3. Start using energy gels/chews. Test what your stomach tolerates.",
            idealFinish: "2026-06-15",
            estimatedTime: "65-80 min"
        },
        {
            id: "long-run-14k",
            label: "Complete 14km long run",
            notes: "Week 4. Confidence builder! You're over halfway to race distance.",
            idealFinish: "2026-06-22",
            estimatedTime: "75-90 min"
        },
        {
            id: "recovery-week",
            label: "Recovery week (reduce volume 50%)",
            notes: "Week 5. Easy runs only. Let body adapt. This is training, not slacking!",
            idealFinish: "2026-06-29",
            estimatedTime: "lighter"
        },
        {
            id: "long-run-16k",
            label: "Complete 16km long run",
            notes: "Week 6. Building back up. Focus on maintaining pace in final 5km.",
            idealFinish: "2026-07-06",
            estimatedTime: "85-100 min"
        },
        {
            id: "long-run-18k",
            label: "Complete 18km long run",
            notes: "Week 7. This is the peak long run! Practice race day fueling and pacing.",
            idealFinish: "2026-07-13",
            estimatedTime: "95-110 min"
        },
        {
            id: "long-run-19k",
            label: "Complete 19km long run",
            notes: "Week 8. Last big run! 90% of race distance. You're READY.",
            idealFinish: "2026-07-20",
            estimatedTime: "100-115 min"
        },
        {
            id: "buy-race-day-gear",
            label: "Buy race day outfit + nutrition",
            notes: "Nothing new on race day! Buy and test: running shorts, moisture-wicking shirt, 2-3 energy gels, salt tabs.",
            idealFinish: "2026-07-15",
            estimatedTime: "1 hour"
        },
        {
            id: "taper-week-1",
            label: "Taper week 1 (reduce volume 60%)",
            notes: "Week 9. Short, easy runs. Banking energy. Trust your training!",
            idealFinish: "2026-07-27",
            estimatedTime: "lighter"
        },
        {
            id: "taper-week-2",
            label: "Taper week 2 (race week)",
            notes: "Week 10. Mon/Wed: 3-5km easy. Thu: complete rest. Carb load Fri/Sat. Early bed.",
            idealFinish: "2026-08-03",
            estimatedTime: "very light"
        },
        {
            id: "race-day-prep",
            label: "Race day preparation",
            notes: "Lay out everything night before: bib, timing chip, outfit, shoes, gels, watch. Set 2 alarms. Eat familiar breakfast 2-3 hrs before.",
            idealFinish: "2026-08-08",
            estimatedTime: "1 hour"
        },
        {
            id: "run-half-marathon",
            label: "RACE DAY: Run the half marathon (21.1km)!",
            notes: "Start slow (first 5k should feel easy). Fuel at 7k and 14k. Keep steady in middle, empty the tank last 3k. FINISH STRONG!",
            idealFinish: "2026-08-09",
            estimatedTime: "2-2.5 hours"
        },
        {
            id: "recovery-week-post-race",
            label: "Post-race recovery week",
            notes: "Rest 2-3 days completely. Then easy walks, light swimming. No running for 7-10 days. Let body heal!",
            idealFinish: "2026-08-16",
            estimatedTime: "ongoing"
        }
    ]
}