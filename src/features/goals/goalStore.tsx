import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import {
  getActiveUserId,
  getScopedStorageItem,
  legacyScopedKey,
  removeScopedStorageItem,
  writeScopedStorageItem,
} from "@/lib/activeUser";
import { CACHE_KEYS } from "@/lib/cacheRegistry";
import { queryKeys } from "@/lib/queryKeys";
import { supabase } from "@/lib/supabaseClient";

export type DoneState = Record<string, Record<string, boolean>>;

type GoalProgressRow = {
  goal_id: string;
  done: Record<string, boolean> | null;
};

export type StepHistoryEntry = {
  goalId: string;
  stepId: string;
  date: string;
};

type ToggleGoalStepVariables = {
  goalId: string;
  stepId: string;
};

type ResetGoalProgressVariables = {
  goalId: string;
};

type MutationContext = {
  previousDone: DoneState;
};

const GOAL_PROGRESS_CACHE_KEY = CACHE_KEYS.GOALS_DONE;
const LEGACY_GOAL_PROGRESS_CACHE_KEY = "cache:goals:v1";
const STEP_HISTORY_KEY = CACHE_KEYS.GOALS_STEP_HISTORY;

function cloneDoneState(done: DoneState): DoneState {
  return Object.fromEntries(
    Object.entries(done).map(([goalId, steps]) => [goalId, { ...steps }]),
  );
}

function normalizeDoneState(value: unknown): DoneState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const result: DoneState = {};

  for (const [goalId, steps] of Object.entries(value)) {
    if (!steps || typeof steps !== "object" || Array.isArray(steps)) continue;

    const normalizedSteps: Record<string, boolean> = {};
    for (const [stepId, done] of Object.entries(steps)) {
      if (typeof done === "boolean") {
        normalizedSteps[stepId] = done;
      }
    }

    result[goalId] = normalizedSteps;
  }

  return result;
}

function extractDoneState(payload: unknown): DoneState {
  const normalized = normalizeDoneState(payload);
  if (Object.keys(normalized).length > 0) return normalized;

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    const nestedState = normalizeDoneState(record.done);
    if (Object.keys(nestedState).length > 0) return nestedState;
  }

  return {};
}

function mergeDoneState(server: DoneState, seeded: DoneState): DoneState {
  const merged = cloneDoneState(server);

  for (const [goalId, steps] of Object.entries(seeded)) {
    const existing = merged[goalId] ?? {};
    const next: Record<string, boolean> = { ...existing };

    for (const [stepId, done] of Object.entries(steps)) {
      if (done) next[stepId] = true;
      else if (!(stepId in next)) next[stepId] = false;
    }

    merged[goalId] = next;
  }

  return merged;
}

function readGoalProgressSeed(userId: string): DoneState {
  try {
    const scopedRaw =
      getScopedStorageItem(GOAL_PROGRESS_CACHE_KEY, userId) ??
      getScopedStorageItem(LEGACY_GOAL_PROGRESS_CACHE_KEY, userId);

    if (scopedRaw) {
      return extractDoneState(JSON.parse(scopedRaw));
    }

    if (getActiveUserId() !== userId) return {};

    const legacyRaw =
      localStorage.getItem(GOAL_PROGRESS_CACHE_KEY) ??
      localStorage.getItem(LEGACY_GOAL_PROGRESS_CACHE_KEY);

    if (!legacyRaw) return {};

    const migrated = extractDoneState(JSON.parse(legacyRaw));
    writeGoalProgressSeed(userId, migrated);
    localStorage.removeItem(GOAL_PROGRESS_CACHE_KEY);
    localStorage.removeItem(LEGACY_GOAL_PROGRESS_CACHE_KEY);
    return migrated;
  } catch {
    return {};
  }
}

function writeGoalProgressSeed(userId: string, done: DoneState) {
  try {
    writeScopedStorageItem(
      GOAL_PROGRESS_CACHE_KEY,
      userId,
      JSON.stringify(done),
    );
    localStorage.removeItem(LEGACY_GOAL_PROGRESS_CACHE_KEY);
    localStorage.removeItem(legacyScopedKey(LEGACY_GOAL_PROGRESS_CACHE_KEY, userId));
  } catch {
    // ignore quota / private mode
  }
}

function clearGoalProgressSeed(userId: string) {
  try {
    removeScopedStorageItem(GOAL_PROGRESS_CACHE_KEY, userId);
    localStorage.removeItem(LEGACY_GOAL_PROGRESS_CACHE_KEY);
    localStorage.removeItem(legacyScopedKey(LEGACY_GOAL_PROGRESS_CACHE_KEY, userId));
  } catch {
    // ignore quota / private mode
  }
}

function readStepHistory(userId: string): StepHistoryEntry[] {
  try {
    const scopedRaw = getScopedStorageItem(STEP_HISTORY_KEY, userId);
    if (scopedRaw) return JSON.parse(scopedRaw) as StepHistoryEntry[];

    if (getActiveUserId() !== userId) return [];

    const legacyRaw = localStorage.getItem(STEP_HISTORY_KEY);
    if (!legacyRaw) return [];

    const migrated = JSON.parse(legacyRaw) as StepHistoryEntry[];
    writeStepHistory(userId, migrated);
    localStorage.removeItem(STEP_HISTORY_KEY);
    return migrated;
  } catch {
    return [];
  }
}

export function seedGoalStepHistory(userId: string | null): StepHistoryEntry[] {
  if (!userId) return [];
  return readStepHistory(userId);
}

function writeStepHistory(userId: string, entries: StepHistoryEntry[]) {
  try {
    writeScopedStorageItem(STEP_HISTORY_KEY, userId, JSON.stringify(entries));
  } catch {
    // ignore quota / private mode
  }
}

function addStepHistory(userId: string, goalId: string, stepId: string) {
  const today = getLocalDateKey();
  const next = readStepHistory(userId).filter(
    (entry) =>
      !(entry.goalId === goalId && entry.stepId === stepId && entry.date === today),
  );

  next.push({ goalId, stepId, date: today });
  writeStepHistory(userId, next);
}

function removeStepHistoryForToday(userId: string, goalId: string, stepId: string) {
  const today = getLocalDateKey();
  writeStepHistory(
    userId,
    readStepHistory(userId).filter(
      (entry) =>
        !(entry.goalId === goalId && entry.stepId === stepId && entry.date === today),
    ),
  );
}

function clearGoalHistoryForToday(userId: string, goalId: string) {
  const today = getLocalDateKey();
  writeStepHistory(
    userId,
    readStepHistory(userId).filter(
      (entry) => !(entry.goalId === goalId && entry.date === today),
    ),
  );
}

async function loadGoalProgress(userId: string | null): Promise<DoneState> {
  if (!userId) return {};

  const seeded = readGoalProgressSeed(userId);

  const { data, error } = await supabase
    .from("goal_progress")
    .select("goal_id, done")
    .eq("user_id", userId);

  if (error) {
    console.warn("loadGoalProgress error:", error);
    return seeded;
  }

  const serverDone = (data ?? []).reduce<DoneState>((acc, row) => {
    const goalRow = row as GoalProgressRow;
    acc[goalRow.goal_id] =
      normalizeDoneState({ [goalRow.goal_id]: goalRow.done })[goalRow.goal_id] ??
      {};
    return acc;
  }, {});

  const merged = mergeDoneState(serverDone, seeded);
  writeGoalProgressSeed(userId, merged);
  return merged;
}

async function persistGoalProgress(
  userId: string,
  goalId: string,
  goalDone: Record<string, boolean>,
) {
  const hasAnyCompletedStep = Object.values(goalDone).some(Boolean);

  if (!hasAnyCompletedStep) {
    const { error } = await supabase
      .from("goal_progress")
      .delete()
      .eq("user_id", userId)
      .eq("goal_id", goalId);

    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("goal_progress").upsert(
    {
      user_id: userId,
      goal_id: goalId,
      done: goalDone,
    },
    { onConflict: "user_id,goal_id" },
  );

  if (error) throw error;
}

export function seedGoalProgressCache(userId: string | null): DoneState {
  if (!userId) return {};
  return readGoalProgressSeed(userId);
}

export function useGoalProgressQuery() {
  const { userId, authReady } = useAuth();

  return useQuery<DoneState>({
    queryKey: queryKeys.goalProgress(userId),
    queryFn: () => loadGoalProgress(userId),
    enabled: authReady && Boolean(userId),
    placeholderData: userId ? seedGoalProgressCache(userId) : undefined,
  });
}

export function useGoalProgressState() {
  const { authReady, userId } = useAuth();
  const query = useGoalProgressQuery();

  const doneState = query.data ?? {};
  const isWaitingForUserId = authReady && !userId;
  const hasUserId = Boolean(userId);
  const hasSeededProgress = Object.keys(doneState).length > 0;

  return {
    ...query,
    doneState,
    isGoalProgressLoading:
      isWaitingForUserId ||
      (hasUserId &&
        !hasSeededProgress &&
        ((query.isLoading && !query.data) || query.isPlaceholderData)),
  };
}

export function useToggleGoalStepMutation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, ToggleGoalStepVariables, MutationContext>({
    mutationFn: async ({ goalId }: ToggleGoalStepVariables) => {
      if (!userId) return;
      const nextDone =
        queryClient.getQueryData<DoneState>(queryKeys.goalProgress(userId)) ?? {};

      await persistGoalProgress(userId, goalId, nextDone[goalId] ?? {});
    },
    onMutate: async ({ goalId, stepId }: ToggleGoalStepVariables) => {
      if (!userId) return { previousDone: {} };

      await queryClient.cancelQueries({ queryKey: queryKeys.goalProgress(userId) });

      const previousDone = cloneDoneState(
        queryClient.getQueryData<DoneState>(queryKeys.goalProgress(userId)) ?? {},
      );

      const goalDone = previousDone[goalId] ?? {};
      const nextValue = !goalDone[stepId];
      const nextDone = {
        ...previousDone,
        [goalId]: {
          ...goalDone,
          [stepId]: nextValue,
        },
      };

      queryClient.setQueryData(queryKeys.goalProgress(userId), nextDone);
      writeGoalProgressSeed(userId, nextDone);

      if (nextValue) addStepHistory(userId, goalId, stepId);
      else removeStepHistoryForToday(userId, goalId, stepId);

      return { previousDone };
    },
    onError: (_error, _variables, context) => {
      if (!userId || !context) return;
      queryClient.setQueryData(queryKeys.goalProgress(userId), context.previousDone);
      writeGoalProgressSeed(userId, context.previousDone);
    },
    onSettled: async () => {
      if (!userId) return;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.goalProgress(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardGoals(userId) }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboardLifeProgress(userId),
        }),
      ]);
    },
  });
}

export function useResetGoalProgressMutation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, ResetGoalProgressVariables, MutationContext>({
    mutationFn: async ({ goalId }: ResetGoalProgressVariables) => {
      if (!userId) return;

      const { error } = await supabase
        .from("goal_progress")
        .delete()
        .eq("user_id", userId)
        .eq("goal_id", goalId);

      if (error) throw error;
    },
    onMutate: async ({ goalId }: ResetGoalProgressVariables) => {
      if (!userId) return { previousDone: {} };

      await queryClient.cancelQueries({ queryKey: queryKeys.goalProgress(userId) });

      const previousDone = cloneDoneState(
        queryClient.getQueryData<DoneState>(queryKeys.goalProgress(userId)) ?? {},
      );

      const nextDone = cloneDoneState(previousDone);
      delete nextDone[goalId];

      queryClient.setQueryData(queryKeys.goalProgress(userId), nextDone);
      writeGoalProgressSeed(userId, nextDone);
      clearGoalHistoryForToday(userId, goalId);

      return { previousDone };
    },
    onError: (_error, _variables, context) => {
      if (!userId || !context) return;
      queryClient.setQueryData(queryKeys.goalProgress(userId), context.previousDone);
      writeGoalProgressSeed(userId, context.previousDone);
    },
    onSettled: async () => {
      if (!userId) return;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.goalProgress(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardGoals(userId) }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboardLifeProgress(userId),
        }),
      ]);
    },
  });
}

export function clearGoalProgressLocalSeed(userId: string | null) {
  if (!userId) return;
  clearGoalProgressSeed(userId);
}
