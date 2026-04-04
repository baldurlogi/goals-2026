import { QueryClient, type QueryKey } from "@tanstack/react-query";

const USER_BOUND_QUERY_ROOTS = new Set([
  "profile",
  "enabled-modules",
  "profile-derived-modules",
  "goals",
  "goal",
  "goal-steps",
  "goal-progress",
  "todos",
  "reading",
  "nutrition",
  "nutrition-log",
  "schedule",
  "schedule-log",
  "fitness-planning-profile",
  "fitness-weekly-plan",
  "fitness-exercise-search",
  "fitness-exercise-swap",
  "fitness-exercise-filters",
  "fitness-exercise-image",
  "fitness-exercise-preview",
  "sleep-log",
  "sleep-history",
  "wellbeing-log",
  "wellbeing-history",
  "tier",
  "dashboard",
  "ai-usage",
]);

function isUserBoundQueryKey(
  queryKey: QueryKey,
  userId: string | null,
): boolean {
  if (!Array.isArray(queryKey) || queryKey.length < 2) return false;
  const [root, scopedUserId] = queryKey;
  return (
    typeof root === "string" &&
    USER_BOUND_QUERY_ROOTS.has(root) &&
    scopedUserId === userId
  );
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 30,
      retry: (failureCount, error) => {
        const message =
          error instanceof Error ? error.message.toLowerCase() : "";
        if (message.includes("not signed in") || message.includes("auth")) {
          return false;
        }
        return failureCount < 1;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function clearUserBoundQueries(userId: string | null): void {
  queryClient
    .cancelQueries({
      predicate: (query) => isUserBoundQueryKey(query.queryKey, userId),
    })
    .catch(() => undefined);

  queryClient.removeQueries({
    predicate: (query) => isUserBoundQueryKey(query.queryKey, userId),
  });
}
