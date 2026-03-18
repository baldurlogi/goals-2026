# AGENTS.md

## Project overview
- This is a Vite + React + TypeScript application.
- Main app code lives in `src/`.
- Feature-based structure under `src/features/`.
- App shell and providers live under `src/app/`.
- Shared UI primitives live under `src/components/ui/`.
- Supabase is used for auth and persistence.

## Main priorities
- Protect mobile performance first.
- Preserve current UX unless the task explicitly changes UX.
- Prefer small, production-safe changes over large rewrites.
- Avoid introducing regressions in auth, onboarding, hydration, and route loading.
- Keep the app feeling fast, stable, and clear.

## Commands
- Install: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`

## How to work in this repo
1. Inspect relevant files first.
2. Explain root cause briefly before making multi-file changes.
3. Prefer the smallest safe fix.
4. Do not broaden scope into unrelated files.
5. After changes, explain which files changed and why.
6. List likely regressions or follow-up work separately instead of silently expanding scope.

## Code and architecture rules
- Keep feature ownership clear; prefer changing files inside the relevant feature folder.
- Do not refactor unrelated modules while fixing one issue.
- Avoid creating abstraction layers unless they clearly reduce repeated bugs or repeated code.
- Prefer explicit code over clever indirection.
- Keep naming practical and consistent with the current repo style.
- Avoid adding new dependencies unless clearly justified.

## State management rules
- TanStack Query is the source of truth for async server/Supabase state.
- Zustand is for UI state only.
- Do not store fetched Supabase/server data in Zustand.
- Do not create duplicate client-side copies of server state unless there is a clear, temporary optimistic update reason.
- Query keys must be scoped by authenticated user id when data is user-specific.
- Mutations must invalidate or update the correct user-scoped queries.
- On login/logout/user switch, reset or isolate user-bound persisted UI state and avoid cross-user leakage.
- Prefer one clear source of truth over mixed local cache + component state + store state patterns.

## Data-loading and persistence rules
- Prefer TanStack Query over ad hoc localStorage caching for server data.
- Never treat temporary auth or Supabase delay as “no user data” if known good user-scoped data is still resolving.
- Do not overwrite good data with empty data from a transient failure.
- Be careful with hydration paths, query invalidation, and auth-change resets.
- Changes touching auth, onboarding, profile loading, persistence, or localStorage/sessionStorage must be extra conservative.
- If a bug may be caused by environment mismatch, verify whether localhost and production point to the same Supabase project before changing behavior.

## Performance rules
- Optimize the worst offender first, not everything at once.
- Prefer route-level code splitting for heavy routes.
- Prefer lazy loading for below-the-fold landing sections and non-critical dashboard content.
- Avoid rerender-heavy patterns on scroll and first mount.
- Be cautious with expensive shadows, blur, gradients, and large client-only components in first viewport content.
- Protect landing, dashboard, onboarding, goals list, goal detail, and AI goal flows.

## UI/UX rules
- Mobile-first.
- Improve clarity, hierarchy, and scannability.
- Prefer better loading, empty, and error states over abrupt blank states.
- Keep cards and repeated module UI patterns visually consistent.
- Do not add complexity for polish if it harms responsiveness or readability.

## Route priorities
When unsure, inspect these first:
1. `src/app/App.tsx`
2. `src/app/AppLayout.tsx`
3. `src/features/landing/*`
4. `src/features/dashboard/*`
5. `src/features/onboarding/*`
6. `src/features/goals/*`
7. `src/features/nutrition/*`
8. `src/features/fitness/*`

## When planning is required
Use a plan first when:
- a task touches more than 3 files
- a task changes auth, onboarding, hydration, persistence, or route loading
- a task is a significant refactor
- a task is performance work across a route or feature slice

For those tasks:
- inspect first
- summarize root cause
- propose the smallest safe approach
- then implement

## Done when
A task is only done when:
- the requested behavior is implemented
- the scope stayed narrow
- affected files are explained clearly
- likely regressions are called out
- `pnpm typecheck` and `pnpm build` are expected to pass
- the change does not obviously regress auth, onboarding, hydration, persistence, or mobile performance

## What to avoid
- Broad rewrites without a measured user benefit
- Replacing working user-scoped data with empty initial state
- Touching many modules when one feature slice is enough
- Large architecture changes in the same task as a small bug fix unless explicitly requested
- Adding new UI polish that slows first paint or interaction
- Mixing TanStack Query, Zustand, component state, and localStorage for the same server-backed data