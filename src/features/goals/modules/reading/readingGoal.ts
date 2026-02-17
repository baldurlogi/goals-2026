import type { GoalDefinition } from "../../goalTypes";


export const readingGoal: GoalDefinition = {
    id: "reading-12-books",
    title: "Read 12 Books in 2026",
    subtitle: "1 book per month for personal & business growth",
    emoji: "📚",
    priority: "medium",
    steps: [
        {
            id: "book-1-completed",
            label: "✓ Book 1 completed (Jan-Feb)",
            notes: "Already done! 1/12 complete.",
            idealFinish: "2026-02-14",
            estimatedTime: "completed"
        },
        {
            id: "book-2-zero-to-one",
            label: "Read 'Zero to One' by Peter Thiel",
            notes: "224 pages. Startup thinking, innovation, contrarian ideas. Read 30-45 min before bed daily.",
            idealFinish: "2026-03-31",
            estimatedTime: "8 hours"
        },
        {
            id: "book-3-deep-work",
            label: "Read 'Deep Work' by Cal Newport",
            notes: "296 pages. Focus, productivity, attention management. Perfect for balancing all your goals.",
            idealFinish: "2026-04-30",
            estimatedTime: "10 hours"
        },
        {
            id: "book-4-lean-startup",
            label: "Read 'The Lean Startup' by Eric Ries",
            notes: "336 pages. SaaS methodology, MVP, validated learning. Apply directly to your side project.",
            idealFinish: "2026-05-31",
            estimatedTime: "11 hours"
        },
        {
            id: "book-5-why-we-sleep",
            label: "Read 'Why We Sleep' by Matthew Walker",
            notes: "368 pages. Sleep science, recovery, performance. Will improve training and productivity.",
            idealFinish: "2026-06-30",
            estimatedTime: "12 hours"
        },
        {
            id: "book-6-show-your-work",
            label: "Read 'Show Your Work' by Austin Kleon",
            notes: "224 pages. Building in public, sharing process. Perfect for YouTube channel launch.",
            idealFinish: "2026-07-31",
            estimatedTime: "7 hours"
        },
        {
            id: "book-7-7-habits",
            label: "Read '7 Habits of Highly Effective People' by Stephen Covey",
            notes: "384 pages. Classic productivity, leadership, character. Timeless principles.",
            idealFinish: "2026-08-31",
            estimatedTime: "13 hours"
        },
        {
            id: "book-8-traction",
            label: "Read 'Traction' by Gabriel Weinberg",
            notes: "240 pages. Customer acquisition for startups. 19 traction channels explained.",
            idealFinish: "2026-09-30",
            estimatedTime: "8 hours"
        },
        {
            id: "book-9-48-laws",
            label: "Read 'The 48 Laws of Power' by Robert Greene",
            notes: "452 pages. Strategy, influence, power dynamics. Dense but valuable. Take notes.",
            idealFinish: "2026-10-31",
            estimatedTime: "15 hours"
        },
        {
            id: "book-10-100-startup",
            label: "Read 'The $100 Startup' by Chris Guillebeau",
            notes: "272 pages. Low-capital business ideas, case studies. Inspiring and actionable.",
            idealFinish: "2026-11-15",
            estimatedTime: "9 hours"
        },
        {
            id: "book-11-art-of-learning",
            label: "Read 'The Art of Learning' by Josh Waitzkin",
            notes: "288 pages. Mastery, peak performance, learning process. Chess/martial arts wisdom.",
            idealFinish: "2026-11-30",
            estimatedTime: "10 hours"
        },
        {
            id: "book-12-rework",
            label: "Read 'Rework' by Jason Fried & DHH",
            notes: "279 pages. Unconventional business wisdom, remote work, simplicity. Quick, punchy read.",
            idealFinish: "2026-12-31",
            estimatedTime: "9 hours"
        },
        {
            id: "reading-habit-established",
            label: "Establish 30-45 min daily reading habit",
            notes: "Before bed. No phone. Use Kindle app or physical books. Track in Goodreads.",
            idealFinish: "2026-03-31",
            estimatedTime: "ongoing",
            links: ["https://goodreads.com"]
        }
    ]
}