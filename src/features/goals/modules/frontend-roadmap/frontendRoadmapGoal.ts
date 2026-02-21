import type { GoalDefinition } from "../../goalTypes";

export const frontendRoadmapGoal: GoalDefinition = {
  id: "frontend-roadmap",
  title: "Frontend Developer Roadmap",
  subtitle: "Complete roadmap.sh tracks (JS → TS → React → Frontend) with weekly modules + milestones",
  emoji: "💻",
  priority: "high",

  /**
   * Structure:
   * - Phase 0: setup + cadence
   * - Phase 1: JavaScript (6 weeks)
   * - Phase 2: TypeScript (4 weeks)
   * - Phase 3: React (7 weeks)
   * - Phase 4: Frontend roadmap (10 weeks)
   * - Capstones + portfolio polish throughout
   */

  steps: [
    // =========================
    // PHASE 0 — Setup + cadence (Week 1)
    // =========================
    {
      id: "bookmark-roadmaps",
      label: "W1: Bookmark all 4 roadmap.sh tracks + create progress repo",
      notes:
        "Tracks: JavaScript, TypeScript, React, Frontend.\nCreate a GitHub repo (or Notion page) where each week has: topics, notes, links, small deliverable.\nDone when: repo exists + week template exists.",
      idealFinish: "2026-02-24",
      estimatedTime: "45 min",
      links: [
        "https://roadmap.sh/javascript",
        "https://roadmap.sh/typescript",
        "https://roadmap.sh/react",
        "https://roadmap.sh/frontend",
      ],
    },
    {
      id: "study-cadence",
      label: "W1: Define weekly cadence (minimum + ideal)",
      notes:
        "Minimum: 4 study sessions/week x 45-60 min.\nIdeal: 5 sessions/week.\nEach session outputs something: notes, solved problems, small PR, or mini project.\nDone when: cadence is written + added to calendar.",
      idealFinish: "2026-02-25",
      estimatedTime: "20 min",
    },
    {
      id: "weekly-review-system",
      label: "W1: Add weekly review ritual (Sunday 15 min)",
      notes:
        "Every Sunday:\n- Check what you finished\n- Move unfinished items\n- Pick next week module\n- 1 sentence: what you learned\nDone when: first Sunday review is scheduled.",
      idealFinish: "2026-02-28",
      estimatedTime: "15 min/week",
    },

    // =========================
    // PHASE 1 — JavaScript Roadmap (6 weeks)
    // Deadline milestone
    // =========================
    {
      id: "milestone-js-complete",
      label: "Milestone: Finish JavaScript roadmap (core competence)",
      notes:
        "Definition of done:\n- Confident with closures, this, prototypes, async/promises, modules\n- Can solve common coding problems in JS\n- Built 1 small JS mini-project\n",
      idealFinish: "2026-04-12",
      estimatedTime: "Complete",
    },

    // Weekly modules: JS
    {
      id: "js-week-1-core",
      label: "JS W1: Core language fundamentals (deep)",
      notes:
        "Topics: scope/hoisting, closures, this, prototypes, classes.\nDeliverable: 1-page cheat sheet + 10 short examples in a playground repo.",
      idealFinish: "2026-03-01",
      estimatedTime: "6-8 hours",
    },
    {
      id: "js-week-2-async",
      label: "JS W2: Async mastery",
      notes:
        "Topics: event loop, promises, async/await, error handling, fetch.\nDeliverable: build a tiny 'API fetch + retry + timeout' utility + README.",
      idealFinish: "2026-03-08",
      estimatedTime: "6-8 hours",
    },
    {
      id: "js-week-3-modern-js",
      label: "JS W3: Modern JS / ES6+ in real code",
      notes:
        "Topics: modules, destructuring, rest/spread, immutability patterns.\nDeliverable: refactor a small piece of your app to use clean modern JS patterns.",
      idealFinish: "2026-03-15",
      estimatedTime: "5-7 hours",
    },
    {
      id: "js-week-4-dom",
      label: "JS W4: DOM + browser APIs (practical)",
      notes:
        "Topics: DOM events, forms, localStorage, URL/search params.\nDeliverable: mini app (e.g., habit tracker lite or notes app) in vanilla JS.",
      idealFinish: "2026-03-22",
      estimatedTime: "6-8 hours",
    },
    {
      id: "js-week-5-testing-basics",
      label: "JS W5: Testing basics + debugging",
      notes:
        "Topics: unit testing fundamentals, debugging in DevTools.\nDeliverable: add tests to your JS utilities + document how to run them.",
      idealFinish: "2026-03-29",
      estimatedTime: "5-7 hours",
    },
    {
      id: "js-week-6-problem-solving",
      label: "JS W6: Problem-solving block (LeetCode-lite)",
      notes:
        "Goal: 12-20 problems focused on arrays/strings/hashmaps/two pointers.\nDeliverable: solutions repo with notes on patterns.",
      idealFinish: "2026-04-12",
      estimatedTime: "8-12 hours",
      links: ["https://leetcode.com"],
    },

    // =========================
    // PHASE 2 — TypeScript Roadmap (4 weeks)
    // =========================
    {
      id: "milestone-ts-complete",
      label: "Milestone: Finish TypeScript roadmap (productive TS)",
      notes:
        "Definition of done:\n- Types, unions, narrowing, generics, utility types\n- Can type React components/hooks and shared utils cleanly\n- Converted one real project module to TS with confidence",
      idealFinish: "2026-05-10",
      estimatedTime: "Complete",
    },
    {
      id: "ts-week-1-basics",
      label: "TS W1: Types + narrowing + TS config",
      notes:
        "Topics: type vs interface, unions, narrowing, unknown/never, tsconfig basics.\nDeliverable: typed utility module + strict mode enabled (or reviewed).",
      idealFinish: "2026-04-19",
      estimatedTime: "6-8 hours",
      links: ["https://www.typescriptlang.org/docs/"],
    },
    {
      id: "ts-week-2-generics",
      label: "TS W2: Generics + utility types",
      notes:
        "Topics: generics in functions/components, Partial/Pick/Omit/Record.\nDeliverable: build 5 generic helpers you actually use (typed fetch wrapper, etc.).",
      idealFinish: "2026-04-26",
      estimatedTime: "6-8 hours",
    },
    {
      id: "ts-week-3-react-typing",
      label: "TS W3: Type React patterns properly",
      notes:
        "Topics: props typing, children patterns, refs, event typing, discriminated unions.\nDeliverable: refactor 2-3 existing components to 'gold standard' typing.",
      idealFinish: "2026-05-03",
      estimatedTime: "6-8 hours",
    },
    {
      id: "ts-week-4-convert-project",
      label: "TS W4: Convert one project slice to TS (real conversion)",
      notes:
        "Pick one project (your goal app is perfect). Convert a meaningful slice:\n- one feature folder OR shared utils + API layer.\nDeliverable: PR with summary of types + decisions.",
      idealFinish: "2026-05-10",
      estimatedTime: "8-12 hours",
    },

    // =========================
    // PHASE 3 — React Roadmap (7 weeks)
    // =========================
    {
      id: "milestone-react-complete",
      label: "Milestone: Finish React roadmap (ship confidently)",
      notes:
        "Definition of done:\n- Hooks, component patterns, state management, server-state\n- Testing basics\n- Can build a real dashboard with filters + async data + good UX",
      idealFinish: "2026-06-28",
      estimatedTime: "Complete",
    },
    {
      id: "react-week-1-hooks",
      label: "React W1: Hooks fundamentals + mental model",
      notes:
        "Topics: useState/useEffect/useMemo/useCallback, refs.\nDeliverable: notes + 5 small examples showing correct dependencies.",
      idealFinish: "2026-05-17",
      estimatedTime: "6-8 hours",
    },
    {
      id: "react-week-2-custom-hooks",
      label: "React W2: Custom hooks library (5 hooks)",
      notes:
        "Build: useLocalStorage, useDebounce, useFetch, useToggle, useAsync.\nDeliverable: small docs + examples page.",
      idealFinish: "2026-05-24",
      estimatedTime: "6-8 hours",
    },
    {
      id: "react-week-3-context",
      label: "React W3: Context + architecture",
      notes:
        "Build a small auth-ish flow or settings store.\nDeliverable: one feature built with context + reasoning when to not use it.",
      idealFinish: "2026-05-31",
      estimatedTime: "5-7 hours",
    },
    {
      id: "react-week-4-state-management",
      label: "React W4: Zustand (or Redux Toolkit) in a real feature",
      notes:
        "Pick ONE. Implement a real state use-case (filters, selections, UI state).\nDeliverable: feature done + short writeup.",
      idealFinish: "2026-06-07",
      estimatedTime: "6-8 hours",
      links: ["https://zustand-demo.pmnd.rs", "https://redux-toolkit.js.org"],
    },
    {
      id: "react-week-5-react-query",
      label: "React W5: TanStack Query (React Query)",
      notes:
        "Topics: queries, caching, invalidation, mutations.\nDeliverable: integrate into one real API-backed screen.",
      idealFinish: "2026-06-14",
      estimatedTime: "6-8 hours",
      links: ["https://tanstack.com/query"],
    },
    {
      id: "react-week-6-testing",
      label: "React W6: Testing essentials",
      notes:
        "Jest + React Testing Library basics.\nDeliverable: 10 meaningful tests on one feature (utils + components).",
      idealFinish: "2026-06-21",
      estimatedTime: "6-10 hours",
      links: ["https://testing-library.com/react"],
    },
    {
      id: "react-week-7-capstone-dashboard",
      label: "React W7: Capstone — complex dashboard",
      notes:
        "Build: tables + filters + charts + async data + good UX.\nDeliverable: deployed demo + README + screenshots.",
      idealFinish: "2026-06-28",
      estimatedTime: "15-25 hours",
    },

    // =========================
    // PHASE 4 — Frontend Roadmap (10 weeks)
    // =========================
    {
      id: "milestone-frontend-complete",
      label: "Milestone: Finish Frontend roadmap (well-rounded FE engineer)",
      notes:
        "Definition of done:\n- HTML/CSS fundamentals, accessibility, performance\n- Networking basics, security awareness\n- Tooling, bundling, deployment\n- You can audit and improve a real app",
      idealFinish: "2026-09-06",
      estimatedTime: "Complete",
    },
    {
      id: "fe-week-1-html-css",
      label: "Frontend W1: HTML/CSS foundations (refresh)",
      notes:
        "Topics: layout, flex/grid, responsive, forms.\nDeliverable: recreate 1 clean UI layout from scratch.",
      idealFinish: "2026-07-05",
      estimatedTime: "6-8 hours",
    },
    {
      id: "fe-week-2-a11y",
      label: "Frontend W2: Accessibility (a11y)",
      notes:
        "Topics: semantic HTML, keyboard nav, ARIA basics.\nDeliverable: run an accessibility audit on your app and fix top 5 issues.",
      idealFinish: "2026-07-12",
      estimatedTime: "6-8 hours",
      links: ["https://web.dev/accessibility"],
    },
    {
      id: "fe-week-3-performance",
      label: "Frontend W3: Performance",
      notes:
        "Topics: code splitting, lazy loading, memoization, bundle analysis.\nDeliverable: improve Lighthouse score + document what you changed.",
      idealFinish: "2026-07-19",
      estimatedTime: "6-10 hours",
    },
    {
      id: "fe-week-4-networking",
      label: "Frontend W4: Networking + APIs",
      notes:
        "Topics: HTTP basics, caching, auth concepts, CORS.\nDeliverable: write a 1-page summary + apply one improvement to your API layer.",
      idealFinish: "2026-07-26",
      estimatedTime: "5-7 hours",
    },
    {
      id: "fe-week-5-security-basics",
      label: "Frontend W5: Security basics",
      notes:
        "Topics: XSS, CSRF, dependency hygiene.\nDeliverable: audit dependencies + add basic security practices to README.",
      idealFinish: "2026-08-02",
      estimatedTime: "4-6 hours",
    },
    {
      id: "fe-week-6-tooling",
      label: "Frontend W6: Tooling (build/test/lint)",
      notes:
        "Topics: bundler basics (Vite), linting, formatting, CI basics.\nDeliverable: clean scripts + consistent checks in one repo.",
      idealFinish: "2026-08-09",
      estimatedTime: "5-7 hours",
    },
    {
      id: "fe-week-7-forms-validation",
      label: "Frontend W7: Forms + validation patterns",
      notes:
        "Deliverable: build one complex form with validation + great UX (errors, loading states).",
      idealFinish: "2026-08-16",
      estimatedTime: "5-7 hours",
    },
    {
      id: "fe-week-8-deployment",
      label: "Frontend W8: Deployment + monitoring basics",
      notes:
        "Deploy your capstone/dashboard.\nDeliverable: deployed URL + basic error tracking/logging plan.",
      idealFinish: "2026-08-23",
      estimatedTime: "4-6 hours",
    },
    {
      id: "fe-week-9-portfolio-polish",
      label: "Frontend W9: Portfolio polish",
      notes:
        "Update portfolio with:\n- 2-3 best projects\n- screenshots + metrics\n- short technical writeups\nDeliverable: portfolio update shipped.",
      idealFinish: "2026-08-30",
      estimatedTime: "6-10 hours",
    },
    {
      id: "frontend-roadmap-complete",
      label: "Mark all roadmap.sh tracks as complete",
      notes:
        "Definition of done:\n- 90%+ completed on each roadmap\n- capstone deployed\n- portfolio updated\nOptional: share a short post (LinkedIn/IG).",
      idealFinish: "2026-09-06",
      estimatedTime: "Complete",
    },
  ],
};