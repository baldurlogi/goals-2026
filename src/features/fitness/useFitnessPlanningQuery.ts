import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import { queryKeys } from "@/lib/queryKeys";
import { getWeekStartISO } from "./date";
import {
  loadFitnessPlanningProfile,
  loadFitnessWeeklyPlan,
  saveFitnessPlanningProfile,
  saveFitnessWeeklyPlan,
} from "./fitnessPlanningStorage";
import { generateFitnessWeeklyPlanFromAI } from "./generateFitnessWeeklyPlan";
import {
  createEmptyFitnessPlanningProfile,
  createEmptyFitnessWeeklyPlan,
  hasFitnessWeeklyPlanContent,
  type FitnessWeeklyPlan,
  type FitnessPlanningProfile,
  type FitnessPlanningProfileUpdate,
} from "./planningTypes";

export function useFitnessPlanningProfileQuery() {
  const { userId, authReady } = useAuth();

  return useQuery<FitnessPlanningProfile>({
    queryKey: queryKeys.fitnessPlanningProfile(userId),
    queryFn: async () => {
      if (!userId) return createEmptyFitnessPlanningProfile("");
      return loadFitnessPlanningProfile(userId);
    },
    enabled: authReady && Boolean(userId),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useFitnessWeeklyPlanQuery(weekStart: string) {
  const { userId, authReady } = useAuth();

  return useQuery<FitnessWeeklyPlan>({
    queryKey: queryKeys.fitnessWeeklyPlan(userId, weekStart),
    queryFn: async () => {
      if (!userId) return createEmptyFitnessWeeklyPlan("", weekStart);
      return loadFitnessWeeklyPlan(userId, weekStart);
    },
    enabled: authReady && Boolean(userId) && Boolean(weekStart),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useCurrentFitnessWeeklyPlanQuery() {
  return useFitnessWeeklyPlanQuery(getWeekStartISO());
}

export function useCurrentFitnessWeeklyPlanState() {
  const { authReady, userId } = useAuth();
  const weekStart = getWeekStartISO();
  const query = useFitnessWeeklyPlanQuery(weekStart);

  const isWaitingForUserId = authReady && !userId;
  const isPlanLoading =
    isWaitingForUserId || (Boolean(userId) && query.isLoading && !query.data);
  const plan = query.data ?? null;

  return {
    ...query,
    weekStart,
    plan,
    isPlanLoading,
    isRefreshingPlan: Boolean(userId) && query.isFetching && !!query.data,
    isMissingPlan:
      Boolean(userId) &&
      !isWaitingForUserId &&
      !query.isLoading &&
      !query.error &&
      !hasFitnessWeeklyPlanContent(plan),
    hasPlan: hasFitnessWeeklyPlanContent(plan),
  };
}

export function useSaveFitnessPlanningProfileMutation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    FitnessPlanningProfile,
    Error,
    FitnessPlanningProfileUpdate
  >({
    mutationFn: async (patch) => {
      if (!userId) {
        throw new Error("You need to be signed in to save workout planning settings.");
      }

      return saveFitnessPlanningProfile(userId, patch);
    },
    onSuccess: async (saved) => {
      queryClient.setQueryData(
        queryKeys.fitnessPlanningProfile(userId),
        saved,
      );

      await queryClient.invalidateQueries({
        queryKey: queryKeys.fitnessPlanningProfile(userId),
      });
    },
  });
}

export function useSaveFitnessWeeklyPlanMutation(weekStart: string) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    FitnessWeeklyPlan,
    Error,
    Omit<FitnessWeeklyPlan, "userId" | "weekStart" | "createdAt" | "updatedAt">,
    { previous?: FitnessWeeklyPlan; queryKey: ReturnType<typeof queryKeys.fitnessWeeklyPlan> }
  >({
    mutationFn: async (value) => {
      if (!userId) {
        throw new Error("You need to be signed in to save weekly workout plans.");
      }

      return saveFitnessWeeklyPlan(userId, weekStart, {
        fitness_goal: value.fitnessGoal,
        days_per_week: value.daysPerWeek,
        split_name: value.splitName,
        progression_note: value.progressionNote,
        recovery_note: value.recoveryNote,
        sessions: value.sessions,
        status: value.status,
        source: value.source,
      });
    },
    onMutate: async (value) => {
      const queryKey = queryKeys.fitnessWeeklyPlan(userId, weekStart);

      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<FitnessWeeklyPlan>(queryKey);

      queryClient.setQueryData(queryKey, {
        userId: userId ?? "",
        weekStart,
        fitnessGoal: value.fitnessGoal,
        daysPerWeek: value.daysPerWeek,
        splitName: value.splitName,
        progressionNote: value.progressionNote,
        recoveryNote: value.recoveryNote,
        sessions: value.sessions,
        status: value.status,
        source: value.source,
        createdAt: previous?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } satisfies FitnessWeeklyPlan);

      return { previous, queryKey };
    },
    onError: (_error, _value, context) => {
      if (!context) return;

      if (context.previous) {
        queryClient.setQueryData(context.queryKey, context.previous);
        return;
      }

      queryClient.removeQueries({ queryKey: context.queryKey, exact: true });
    },
    onSuccess: async (saved) => {
      queryClient.setQueryData(
        queryKeys.fitnessWeeklyPlan(userId, weekStart),
        saved,
      );

      await queryClient.invalidateQueries({
        queryKey: queryKeys.fitnessWeeklyPlan(userId, weekStart),
      });
    },
  });
}

export function useGenerateFitnessWeeklyPlanMutation(
  weekStart: string,
  profile: FitnessPlanningProfile | null,
) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<FitnessWeeklyPlan, Error, void>({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("You need to be signed in to generate workout plans.");
      }

      const { plan } = await generateFitnessWeeklyPlanFromAI(profile, weekStart);

      return saveFitnessWeeklyPlan(userId, weekStart, {
        fitness_goal: plan.fitnessGoal,
        days_per_week: plan.daysPerWeek,
        split_name: plan.splitName,
        progression_note: plan.progressionNote,
        recovery_note: plan.recoveryNote,
        sessions: plan.sessions,
        status: "active",
        source: "ai",
      });
    },
    onSuccess: async (saved) => {
      queryClient.setQueryData(
        queryKeys.fitnessWeeklyPlan(userId, weekStart),
        saved,
      );

      await queryClient.invalidateQueries({
        queryKey: queryKeys.fitnessWeeklyPlan(userId, weekStart),
      });
    },
  });
}
