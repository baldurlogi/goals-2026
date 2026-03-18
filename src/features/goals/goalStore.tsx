import React from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/features/auth/authContext";
import { getActiveUserId } from "@/lib/activeUser";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import {
  GoalsStoreContext,
  type Action,
  type DoneState,
  type GoalsState,
} from "./goalStoreContext";

const CACHE_KEY = "cache:goals:v1";
const LEGACY_WEEKLY_DONE_KEY = "goals:done:v1";
const STEP_HISTORY_KEY = "goals:step-history:v1";
const PERSIST_DEBOUNCE_MS = 300;
const RETRY_BASE_DELAY_MS = 1000;
const RETRY_MAX_DELAY_MS = 5000;

type StepHistoryEntry = {
  goalId: string;
  stepId: string;
  date: string;
};

function scopedKey(baseKey: string, userId: string) {
  return `${baseKey}:${userId}`;
}

function cloneDoneState(done: DoneState): DoneState {
  return Object.fromEntries(
    Object.entries(done).map(([goalId, steps]) => [goalId, { ...steps }]),
  );
}

function readDoneCache(userId: string): DoneState {
  try {
    const scopedCacheKey = scopedKey(CACHE_KEY, userId);
    const scopedLegacyDoneKey = scopedKey(LEGACY_WEEKLY_DONE_KEY, userId);

    const scopedRaw =
      localStorage.getItem(scopedCacheKey) ??
      localStorage.getItem(scopedLegacyDoneKey);

    if (scopedRaw) {
      return JSON.parse(scopedRaw) as DoneState;
    }

    if (getActiveUserId() !== userId) return {};

    const legacyRaw =
      localStorage.getItem(CACHE_KEY) ??
      localStorage.getItem(LEGACY_WEEKLY_DONE_KEY);

    if (!legacyRaw) return {};

    const legacyDone = JSON.parse(legacyRaw) as DoneState;
    writeDoneCache(userId, legacyDone);
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(LEGACY_WEEKLY_DONE_KEY);
    return legacyDone;
  } catch {
    return {};
  }
}

function writeDoneCache(userId: string, done: DoneState) {
  try {
    const serialized = JSON.stringify(done);
    localStorage.setItem(scopedKey(CACHE_KEY, userId), serialized);
    localStorage.setItem(scopedKey(LEGACY_WEEKLY_DONE_KEY, userId), serialized);
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(LEGACY_WEEKLY_DONE_KEY);
  } catch {
    // ignore quota / private mode
  }
}

function readStepHistory(userId: string): StepHistoryEntry[] {
  try {
    const scopedHistoryKey = scopedKey(STEP_HISTORY_KEY, userId);
    const scopedRaw = localStorage.getItem(scopedHistoryKey);
    if (scopedRaw) return JSON.parse(scopedRaw) as StepHistoryEntry[];

    if (getActiveUserId() !== userId) return [];

    const legacyRaw = localStorage.getItem(STEP_HISTORY_KEY);
    if (!legacyRaw) return [];

    const legacyHistory = JSON.parse(legacyRaw) as StepHistoryEntry[];
    writeStepHistory(userId, legacyHistory);
    localStorage.removeItem(STEP_HISTORY_KEY);
    return legacyHistory;
  } catch {
    return [];
  }
}

function writeStepHistory(userId: string, entries: StepHistoryEntry[]) {
  try {
    localStorage.setItem(scopedKey(STEP_HISTORY_KEY, userId), JSON.stringify(entries));
    localStorage.removeItem(STEP_HISTORY_KEY);
  } catch {
    // ignore quota / private mode
  }
}

function addStepHistory(userId: string, goalId: string, stepId: string) {
  const today = getLocalDateKey();
  const next = readStepHistory(userId).filter(
    (entry) =>
      !(
        entry.goalId === goalId &&
        entry.stepId === stepId &&
        entry.date === today
      ),
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
        !(
          entry.goalId === goalId &&
          entry.stepId === stepId &&
          entry.date === today
        ),
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

async function deleteGoalProgress(goalId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("goal_progress")
    .delete()
    .eq("user_id", user.id)
    .eq("goal_id", goalId);
}

function reducer(state: GoalsState, action: Action): GoalsState {
  switch (action.type) {
    case "hydrate":
      return { ...state, done: action.done, loaded: true };

    case "toggleStep": {
      const { goalId, stepId } = action;
      const goalDone = state.done[goalId] ?? {};
      const nextDone = {
        ...state.done,
        [goalId]: { ...goalDone, [stepId]: !goalDone[stepId] },
      };
      return { ...state, done: nextDone };
    }

    case "resetGoal": {
      const nextDone = { ...state.done };
      delete nextDone[action.goalId];
      return { ...state, done: nextDone };
    }

    default:
      return state;
  }
}

export function GoalStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId: authUserId } = useAuth();
  const [state, rawDispatch] = React.useReducer(reducer, {
    done: {},
    loaded: false,
  });
  const [userId, setUserId] = React.useState<string | null>(null);
  const debounceTimerRef = React.useRef<number | null>(null);
  const retryTimerRef = React.useRef<number | null>(null);
  const persistInFlightRef = React.useRef(false);
  const queuedDoneRef = React.useRef<DoneState | null>(null);
  const latestDoneRef = React.useRef<DoneState>(state.done);
  const retryAttemptRef = React.useRef(0);

  React.useEffect(() => {
    latestDoneRef.current = state.done;
  }, [state.done]);

  const persistDoneState = React.useCallback(async (done: DoneState) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      retryAttemptRef.current = 0;
      return;
    }

    const payload = Object.entries(done).map(([goalId, goalDone]) => ({
      user_id: user.id,
      goal_id: goalId,
      done: goalDone,
    }));

    if (payload.length > 0) {
      const { error } = await supabase
        .from("goal_progress")
        .upsert(payload, { onConflict: "user_id,goal_id" });

      if (error) {
        throw error;
      }
    }

    retryAttemptRef.current = 0;
  }, []);

  const flushPersistQueue = React.useCallback(async () => {
    if (persistInFlightRef.current) return;

    const next = queuedDoneRef.current;
    if (!next) return;

    queuedDoneRef.current = null;
    persistInFlightRef.current = true;

    try {
      await persistDoneState(next);
    } catch (error) {
      queuedDoneRef.current = cloneDoneState(latestDoneRef.current);
      const retryDelay = Math.min(
        RETRY_BASE_DELAY_MS * 2 ** retryAttemptRef.current,
        RETRY_MAX_DELAY_MS,
      );
      retryAttemptRef.current += 1;

      if (retryTimerRef.current != null) {
        window.clearTimeout(retryTimerRef.current);
      }

      retryTimerRef.current = window.setTimeout(() => {
        void flushPersistQueue();
      }, retryDelay);

      console.error("Failed to persist goal progress. Retrying...", error);
    } finally {
      persistInFlightRef.current = false;

      if (queuedDoneRef.current) {
        void flushPersistQueue();
      }
    }
  }, [persistDoneState]);

  const dispatch = React.useCallback(
    (action: Action) => {
      if (action.type === "toggleStep" && userId) {
        const wasDone = !!state.done[action.goalId]?.[action.stepId];

        if (wasDone) {
          removeStepHistoryForToday(userId, action.goalId, action.stepId);
        } else {
          addStepHistory(userId, action.goalId, action.stepId);
        }
      }

      if (action.type === "resetGoal" && userId) {
        clearGoalHistoryForToday(userId, action.goalId);
        void deleteGoalProgress(action.goalId);
      }

      rawDispatch(action);
    },
    [state.done, userId],
  );

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) {
            setUserId(null);
            dispatch({ type: "hydrate", done: {} });
          }
          return;
        }

        const cached = readDoneCache(user.id);

        if (!cancelled) {
          setUserId(user.id);
        }

        const { data, error } = await supabase
          .from("goal_progress")
          .select("goal_id, done")
          .eq("user_id", user.id);

        if (error) {
          console.warn("goalStore load error:", error);

          if (!cancelled) {
            dispatch({ type: "hydrate", done: cached });
          }
          return;
        }

        const done: DoneState = {};
        for (const row of data ?? []) {
          done[row.goal_id] = row.done;
        }

        const mergedDone: DoneState = {
          ...done,
          ...latestDoneRef.current,
        };

        if (!cancelled) {
          dispatch({ type: "hydrate", done: mergedDone });
          writeDoneCache(user.id, mergedDone);
        }
      } catch (error) {
        console.warn("goalStore load exception:", error);

        if (!cancelled) {
          dispatch({ type: "hydrate", done: {} });
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [authUserId, dispatch]);

  React.useEffect(() => {
    if (!state.loaded || !userId) return;

    writeDoneCache(userId, state.done);
    queuedDoneRef.current = cloneDoneState(state.done);

    if (debounceTimerRef.current != null) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      void flushPersistQueue();
    }, PERSIST_DEBOUNCE_MS);
  }, [flushPersistQueue, state.done, state.loaded, userId]);


  React.useEffect(() => {
    queuedDoneRef.current = null;
    retryAttemptRef.current = 0;

    if (debounceTimerRef.current != null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (retryTimerRef.current != null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, [userId]);

  React.useEffect(
    () => () => {
      if (debounceTimerRef.current != null) {
        window.clearTimeout(debounceTimerRef.current);
      }

      if (retryTimerRef.current != null) {
        window.clearTimeout(retryTimerRef.current);
      }
    },
    [],
  );

  return (
    <GoalsStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </GoalsStoreContext.Provider>
  );
}
