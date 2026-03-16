import React from "react";
import { supabase } from "@/lib/supabaseClient";
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

function cloneDoneState(done: DoneState): DoneState {
  return Object.fromEntries(
    Object.entries(done).map(([goalId, steps]) => [goalId, { ...steps }]),
  );
}

function readCache(): DoneState {
  try {
    const raw =
      localStorage.getItem(CACHE_KEY) ??
      localStorage.getItem(LEGACY_WEEKLY_DONE_KEY);
    return raw ? (JSON.parse(raw) as DoneState) : {};
  } catch {
    return {};
  }
}

function writeCache(done: DoneState) {
  try {
    const serialized = JSON.stringify(done);
    localStorage.setItem(CACHE_KEY, serialized);
    localStorage.setItem(LEGACY_WEEKLY_DONE_KEY, serialized);
  } catch {
    // ignore quota / private mode
  }
}

function readStepHistory(): StepHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STEP_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as StepHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeStepHistory(entries: StepHistoryEntry[]) {
  try {
    localStorage.setItem(STEP_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // ignore quota / private mode
  }
}

function addStepHistory(goalId: string, stepId: string) {
  const today = getLocalDateKey();
  const next = readStepHistory().filter(
    (entry) =>
      !(
        entry.goalId === goalId &&
        entry.stepId === stepId &&
        entry.date === today
      ),
  );

  next.push({ goalId, stepId, date: today });
  writeStepHistory(next);
}

function removeStepHistoryForToday(goalId: string, stepId: string) {
  const today = getLocalDateKey();
  writeStepHistory(
    readStepHistory().filter(
      (entry) =>
        !(
          entry.goalId === goalId &&
          entry.stepId === stepId &&
          entry.date === today
        ),
    ),
  );
}

function clearGoalHistoryForToday(goalId: string) {
  const today = getLocalDateKey();
  writeStepHistory(
    readStepHistory().filter(
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
  const [state, rawDispatch] = React.useReducer(reducer, {
    done: readCache(),
    loaded: false,
  });
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

  React.useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const cached = readCache();
        dispatch({ type: "hydrate", done: cached });
        writeCache(cached);
        return;
      }

      const { data } = await supabase
        .from("goal_progress")
        .select("goal_id, done")
        .eq("user_id", user.id);

      const done: DoneState = {};
      for (const row of data ?? []) {
        done[row.goal_id] = row.done;
      }

      dispatch({ type: "hydrate", done });
      writeCache(done);
    }

    void load();
  }, []);

  const dispatch = React.useCallback(
    (action: Action) => {
      if (action.type === "toggleStep") {
        const wasDone = !!state.done[action.goalId]?.[action.stepId];

        if (wasDone) {
          removeStepHistoryForToday(action.goalId, action.stepId);
        } else {
          addStepHistory(action.goalId, action.stepId);
        }
      }

      if (action.type === "resetGoal") {
        clearGoalHistoryForToday(action.goalId);
        void deleteGoalProgress(action.goalId);
      }

      rawDispatch(action);
    },
    [state.done],
  );

  React.useEffect(() => {
    if (!state.loaded) return;

    writeCache(state.done);
    queuedDoneRef.current = cloneDoneState(state.done);

    if (debounceTimerRef.current != null) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      void flushPersistQueue();
    }, PERSIST_DEBOUNCE_MS);
  }, [flushPersistQueue, state.done, state.loaded]);

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
