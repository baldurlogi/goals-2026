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

type StepHistoryEntry = {
  goalId: string;
  stepId: string;
  date: string;
};

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
    let cancelled = false;

    async function load() {
      const cached = readCache();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) {
            dispatch({ type: "hydrate", done: cached });
          }
          return;
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

        if (!cancelled) {
          dispatch({ type: "hydrate", done });
          writeCache(done);
        }
      } catch (error) {
        console.warn("goalStore load exception:", error);

        if (!cancelled) {
          dispatch({ type: "hydrate", done: cached });
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  React.useEffect(() => {
    if (!state.loaded) return;

    async function persist() {
      writeCache(state.done);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        for (const [goalId, done] of Object.entries(state.done)) {
          const { error } = await supabase.from("goal_progress").upsert(
            { user_id: user.id, goal_id: goalId, done },
            { onConflict: "user_id,goal_id" },
          );

          if (error) {
            console.warn("goalStore persist error:", error);
            return;
          }
        }
      } catch (error) {
        console.warn("goalStore persist exception:", error);
      }
    }

    void persist();
  }, [state.done, state.loaded]);

  return (
    <GoalsStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </GoalsStoreContext.Provider>
  );
}