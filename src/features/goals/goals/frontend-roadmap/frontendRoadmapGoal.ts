import type { GoalDefinition } from "../../goalTypes";


export const frontendRoadmapGoal: GoalDefinition = {
    id: "frontend-roadmap",
    title: "Frontend Developer Roadmap",
    subtitle: "Complete roadmap.sh tracks (JS, TS, React, Frontend)",
    emoji: "💻",
    priority: "medium",
    steps: [
        {
            id: "bookmark-roadmaps",
            label: "Bookmark all 4 roadmap.sh tracks",
            notes: "JavaScript, TypeScript, React, Frontend. Create GitHub repo to track progress.",
            idealFinish: "2026-02-20",
            estimatedTime: "30 min",
            links: [
                "https://roadmap.sh/javascript",
                "https://roadmap.sh/typescript",
                "https://roadmap.sh/react",
                "https://roadmap.sh/frontend"
            ]
        },
        {
            id: "js-fundamentals-review",
            label: "Review JavaScript fundamentals",
            notes: "Closures, prototypes, this, async/await, promises. Make cheatsheet.",
            idealFinish: "2026-03-15",
            estimatedTime: "10 hours"
        },
        {
            id: "js-es6-features",
            label: "Master ES6+ features",
            notes: "Destructuring, spread, rest, template literals, modules, classes. Use in daily coding.",
            idealFinish: "2026-03-31",
            estimatedTime: "8 hours"
        },
        {
            id: "leetcode-30-problems",
            label: "Solve 30 LeetCode problems in JavaScript",
            notes: "Focus on arrays, strings, objects. Build problem-solving muscle. 2-3 per week.",
            idealFinish: "2026-04-30",
            estimatedTime: "15 hours",
            links: ["https://leetcode.com"]
        },
        {
            id: "typescript-basics",
            label: "Learn TypeScript basics",
            notes: "Types, interfaces, union types, type aliases. Follow official docs tutorial.",
            idealFinish: "2026-04-30",
            estimatedTime: "8 hours",
            links: ["https://typescriptlang.org/docs"]
        },
        {
            id: "typescript-generics",
            label: "Master TypeScript generics & utility types",
            notes: "Generic functions, Partial, Pick, Omit, Record. Most powerful TS features.",
            idealFinish: "2026-05-31",
            estimatedTime: "10 hours"
        },
        {
            id: "convert-project-to-ts",
            label: "Convert 2 personal projects from JS to TypeScript",
            notes: "Practical application. Start with portfolio site, then one side project.",
            idealFinish: "2026-06-15",
            estimatedTime: "12 hours"
        },
        {
            id: "react-custom-hooks",
            label: "Learn React custom hooks",
            notes: "Build 5 custom hooks: useLocalStorage, useDebounce, useFetch, useToggle, useAsync. Add to utils library.",
            idealFinish: "2026-06-30",
            estimatedTime: "8 hours"
        },
        {
            id: "react-context-api",
            label: "Master React Context API",
            notes: "Build authentication flow with context. Understand when to use vs prop drilling.",
            idealFinish: "2026-07-15",
            estimatedTime: "6 hours"
        },
        {
            id: "state-management",
            label: "Learn modern state management (Zustand or Redux Toolkit)",
            notes: "Pick one. Build todo app or small dashboard. Zustand is simpler to start.",
            idealFinish: "2026-07-31",
            estimatedTime: "10 hours",
            links: ["https://zustand-demo.pmnd.rs", "https://redux-toolkit.js.org"]
        },
        {
            id: "react-query",
            label: "Learn React Query for data fetching",
            notes: "Server state vs client state. Caching, refetching, mutations. Game changer for API calls.",
            idealFinish: "2026-08-15",
            estimatedTime: "8 hours",
            links: ["https://tanstack.com/query"]
        },
        {
            id: "build-complex-dashboard",
            label: "Build complex dashboard project",
            notes: "Real-time data, charts (Recharts), filters, tables. Use all new skills. Add to portfolio.",
            idealFinish: "2026-08-31",
            estimatedTime: "25 hours"
        },
        {
            id: "testing-jest-rtl",
            label: "Learn testing with Jest + React Testing Library",
            notes: "Unit tests for utils, component tests for UI. Aim for 70%+ coverage on one project.",
            idealFinish: "2026-09-30",
            estimatedTime: "12 hours",
            links: ["https://testing-library.com/react"]
        },
        {
            id: "performance-optimization",
            label: "Learn React performance optimization",
            notes: "Code splitting, lazy loading, memoization (React.memo, useMemo, useCallback), bundle analysis.",
            idealFinish: "2026-10-15",
            estimatedTime: "8 hours"
        },
        {
            id: "accessibility-audit",
            label: "Learn web accessibility (a11y)",
            notes: "ARIA, semantic HTML, keyboard navigation, screen readers. Run Lighthouse audit on projects.",
            idealFinish: "2026-10-31",
            estimatedTime: "10 hours",
            links: ["https://web.dev/accessibility"]
        },
        {
            id: "frontend-roadmap-complete",
            label: "Mark all roadmap.sh tracks as complete",
            notes: "You've covered 90%+ of each roadmap. Take screenshot, share on LinkedIn!",
            idealFinish: "2026-10-31",
            estimatedTime: "complete"
        }
    ]
}