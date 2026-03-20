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
- Avoid introducing regressions in auth, onboarding, hydration, route loading, and persisted state.
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
- Any `*Storage.ts` file must be treated as potentially user-scoped until verified otherwise.


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
3. `src/app/providers/AuthProvider.tsx`
4. `src/features/auth/*`
5. `src/features/onboarding/*`
6. `src/features/dashboard/*`
7. `src/features/goals/*`
8. `src/lib/*`

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

## Auth and onboarding architecture

### Primary files
- App entry and route wiring:
  - `src/app/App.tsx`
  - `src/app/AppLayout.tsx`

- Auth provider and auth context:
  - `src/app/providers/AuthProvider.tsx`
  - `src/features/auth/authContext.ts`

- Auth routes and guards:
  - `src/features/auth/RequireAuth.tsx`
  - `src/features/auth/RedirectIfAuth.tsx`
  - `src/features/auth/AuthCallbackPage.tsx`
  - `src/features/auth/LoginPage.tsx`
  - `src/features/auth/SignupPage.tsx`

- Onboarding flow and gating:
  - `src/features/onboarding/RequireOnboarding.tsx`
  - `src/features/onboarding/OnboardingFlow.tsx`
  - `src/features/onboarding/useProfile.ts`
  - `src/features/onboarding/useProfileQuery.ts`
  - `src/features/onboarding/profileStorage.ts`

- Profile and current-user-related utilities:
  - `src/lib/activeUser.ts`
  - `src/lib/clearUserCache.ts`
  - `src/lib/cache.ts`
  - `src/lib/cacheRegistry.ts`
  - `src/lib/storage.ts`
  - `src/lib/queryClient.ts`
  - `src/lib/queryKeys.ts`
  - `src/lib/supabaseClient.ts`

### Related user-data files that may participate in cross-user leakage
- Goals:
  - `src/features/goals/useGoalsQuery.ts`
  - `src/features/goals/goalStore.tsx`
  - `src/features/goals/userGoalStorage.ts`

- Subscription / tier / AI usage:
  - `src/features/subscription/useTierQuery.ts`
  - `src/features/subscription/useTier.ts`
  - `src/features/subscription/useAIUsage.ts`
  - `src/features/subscription/aiUsageCache.tsx`

- Reading:
  - `src/features/reading/useReadingQuery.ts`

- Todos:
  - `src/features/todos/useTodosQuery.ts`

- Dashboard aggregators:
  - `src/features/dashboard/hooks/*`

- Global UI store:
  - `src/store/uiStore.ts`

### Expected auth and onboarding flow
- On app boot, the app restores the Supabase session first.
- After auth is ready, the app resolves the current authenticated user.
- After the current user is known, the app fetches that user’s profile/onboarding state.
- Protected routes must not redirect until auth state is sufficiently resolved.
- Onboarding gating must not redirect until profile/onboarding state is sufficiently resolved.
- If there is no authenticated user, auth-protected routes should redirect to login/landing.
- If there is an authenticated user and onboarding is incomplete, the user should go to onboarding.
- If there is an authenticated user and onboarding is complete, the user should reach the dashboard/app.
- A profile fetch failure must not automatically be treated as a missing profile.
- On sign out or account switch, all user-scoped caches and persisted state must be cleared or isolated.

### Source-of-truth rules
- Supabase auth session is the source of truth for the current authenticated user.
- TanStack Query is the source of truth for fetched server data.
- Zustand is for UI state only, not durable server-backed profile/auth data.
- Any cached or persisted user data must be keyed by user id or cleared on auth change.

### Edge function note
- `supabase/functions/*` directory is currently listed in the provided repo tree.
- Do not assume an edge function exists unless it is present in the repo or explicitly provided.
- If onboarding or goal generation depends on an external edge function not stored in this repo, inspect the calling code and document the dependency before changing behavior.

## Rules for auth-related tasks
- Never redirect before auth readiness is established.
- Never treat a failed profile fetch as equivalent to “missing profile”.
- Never use cached profile data across different user IDs.
- On sign out, clear all user-scoped caches and persisted app state.
- On sign in, refetch profile and user-scoped queries for the current authenticated user.
- Any onboarding decision must be based on the current session user only.
- Distinguish clearly between:
  - auth loading
  - auth resolved with no user
  - profile loading
  - profile missing
  - profile fetch failed
  - onboarding incomplete
  - onboarding complete
- Verify auth event handling carefully, especially around:
  - initial session restore
  - sign in
  - sign out
  - token refresh
  - account switch in the same browser/tab set

## Common failure patterns to watch for
- Redirecting before auth bootstrap finishes
- Redirecting before profile bootstrap finishes
- Treating profile fetch failure as profile missing
- Reusing cached profile data across users
- Not clearing localStorage/sessionStorage/query cache on sign out
- Using non-user-scoped query keys for user data
- Race conditions between auth state and profile state
- Existing users being routed to onboarding during transient loading
- New users getting stuck because profile creation or profile fetch is delayed
- Account switch causing old user data to flash or persist
- Multi-tab auth drift
- Query cache hydration showing stale prior-user data
- Persisted feature storage leaking between users

## Files to inspect first for auth/onboarding bugs
1. `src/app/providers/AuthProvider.tsx`
2. `src/features/auth/authContext.ts`
3. `src/features/auth/RequireAuth.tsx`
4. `src/features/auth/RedirectIfAuth.tsx`
5. `src/features/onboarding/RequireOnboarding.tsx`
6. `src/features/onboarding/useProfile.ts`
7. `src/features/onboarding/useProfileQuery.ts`
8. `src/features/onboarding/profileStorage.ts`
9. `src/lib/activeUser.ts`
10. `src/lib/clearUserCache.ts`
11. `src/lib/queryKeys.ts`
12. `src/lib/queryClient.ts`
13. `src/lib/supabaseClient.ts`

## Required manual auth/onboarding checks
- Sign up with a brand new account
- Sign in with an existing onboarded account
- Sign out and sign in with another account in the same browser
- Refresh during app bootstrap
- Refresh during onboarding
- Existing onboarded user must not be redirected to onboarding
- New user must not be redirected to dashboard before onboarding is complete
- Failed profile fetch must show correct loading/error handling, not false onboarding
- Sign out must remove or isolate user-scoped cached data
- User-specific dashboard data must not bleed across users
- Query invalidation/reset must work on login/logout/account switch

## Done when
A task is only done when:
- the requested behavior is implemented
- the scope stayed narrow
- affected files are explained clearly
- likely regressions are called out
- `pnpm typecheck` and `pnpm build` are expected to pass
- the change does not obviously regress auth, onboarding, hydration, persistence, or mobile performance

## Auth-specific done means
- No redirect loops
- Existing onboarded users reach the app correctly
- New users reach onboarding correctly
- Sign out removes or isolates user-scoped cached state
- Account switch does not leak previous user data
- Loading states do not misroute the user
- Manual auth/onboarding checklist passes

## What to avoid
- Broad rewrites without a measured user benefit
- Replacing working user-scoped data with empty initial state
- Touching many modules when one feature slice is enough
- Large architecture changes in the same task as a small bug fix unless explicitly requested
- Adding new UI polish that slows first paint or interaction
- Mixing TanStack Query, Zustand, component state, and localStorage for the same server-backed data
- Inventing missing backend behavior instead of tracing the actual calling code