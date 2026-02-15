import type { GoalDefinition } from "../../goalTypes";


export const financeGoal: GoalDefinition = {
    id: "financial-savings",
    title: "Save 75,000 DKK",
    subtitle: "Build fund for US grad school applications + moving",
    emoji: "💰",
    priority: "high",
    steps: [
        {
            id: "open-savings-account",
            label: "Open separate high-yield savings account",
            notes: "Use Lunar, Norwegian, or Saxo Bank for better interest rates. Keep separate from checking.",
            idealFinish: "2026-02-18",
            estimatedTime: "30 min",
            links: ["https://lunar.app", "https://norwegian.dk"]
        },
        {
            id: "setup-auto-transfer",
            label: "Set up automatic 7,500 DKK monthly transfer",
            notes: "Transfer day after salary (around 1st of month). Set up in MobilePay or bank app.",
            idealFinish: "2026-02-20",
            estimatedTime: "15 min"
        },
        {
            id: "expense-tracking-app",
            label: "Download and set up expense tracker",
            notes: "Use Spendee, YNAB, or Spiir. Link bank accounts. Categorize spending.",
            idealFinish: "2026-02-22",
            estimatedTime: "45 min",
            links: ["https://spendee.com", "https://ynab.com", "https://spiir.dk"]
        },
        {
            id: "track-feb-expenses",
            label: "Track all February expenses",
            notes: "Log every purchase. Find patterns. Identify 2-3 areas to cut 500-1,000 DKK/month.",
            idealFinish: "2026-02-28",
            estimatedTime: "5 min/day"
        },
        {
            id: "cut-subscriptions",
            label: "Audit and cancel unused subscriptions",
            notes: "Check Netflix, Spotify, apps, gym memberships you don't use. Aim to save 300-500 DKK/month.",
            idealFinish: "2026-03-05",
            estimatedTime: "1 hour"
        },
        {
            id: "march-savings-7500",
            label: "Save 7,500 DKK in March",
            notes: "First full month. Monitor closely. Adjust spending if needed.",
            idealFinish: "2026-03-31",
            estimatedTime: "ongoing"
        },
        {
            id: "q1-review-22500",
            label: "Q1 Review: Confirm 22,500 DKK saved",
            notes: "Should have 3 months x 7,500 = 22,500 DKK. If short, identify gaps.",
            idealFinish: "2026-03-31",
            estimatedTime: "30 min"
        },
        {
            id: "salary-negotiation-prep",
            label: "Prepare for 6-month salary review",
            notes: "Document wins, research market rates (Glassdoor, Levels.fyi). Aim for 10-15% raise (2,500-3,750 DKK/month).",
            idealFinish: "2026-07-15",
            estimatedTime: "3 hours",
            links: ["https://glassdoor.com", "https://levels.fyi"]
        },
        {
            id: "salary-review-meeting",
            label: "Request and complete salary review meeting",
            notes: "Present case to manager. Be confident but collaborative. Have backup plan if declined.",
            idealFinish: "2026-08-15",
            estimatedTime: "1 hour"
        },
        {
            id: "q2-review-45000",
            label: "Q2 Review: Confirm 45,000 DKK saved",
            notes: "6 months x 7,500 = 45,000 DKK. On track for 75k goal.",
            idealFinish: "2026-06-30",
            estimatedTime: "30 min"
        },
        {
            id: "q3-review-67500",
            label: "Q3 Review: Confirm 67,500 DKK saved",
            notes: "9 months x 7,500 = 67,500 DKK. Final stretch!",
            idealFinish: "2026-09-30",
            estimatedTime: "30 min"
        },
        {
            id: "final-push-75000",
            label: "Hit 75,000 DKK goal by December 31",
            notes: "10.5 months x 7,500 = 78,750 DKK. You'll exceed the goal! Celebrate this massive achievement.",
            idealFinish: "2026-12-31",
            estimatedTime: "ongoing"
        }
    ]
}