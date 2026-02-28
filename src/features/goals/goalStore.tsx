import React from "react";
import { supabase } from "@/lib/supabaseClient";

type DoneState  = Record<string, Record<string, boolean>>;
type GoalsState = { done: DoneState; loaded: boolean; };
type Action =
  | { type: "toggleStep"; goalId: string; stepId: string }
  | { type: "resetGoal";  goalId: string }
  | { type: "hydrate";    done: DoneState };

const CACHE_KEY = "cache:goals:v1";

function readCache(): DoneState {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function reducer(state: GoalsState, action: Action): GoalsState {
  switch (action.type) {
    case "hydrate":
      return { ...state, done: action.done, loaded: true };

    case "toggleStep": {
      const { goalId, stepId } = action;
      const goalDone  = state.done[goalId] ?? {};
      const nextDone  = { ...state.done, [goalId]: { ...goalDone, [stepId]: !goalDone[stepId] } };
      return { ...state, done: nextDone };
    }

    case "resetGoal": {
      const nextDone = { ...state.done };
      delete nextDone[action.goalId];
      return { ...state, done: nextDone };
    }

    default: return state;
  }
}

const GoalsStoreContext = React.createContext<
  { state: GoalsState; dispatch: React.Dispatch<Action> } | undefined
>(undefined);

export function GoalsStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, {
    done:   readCache(), // instant paint from cache
    loaded: false,
  });

  // ── Hydrate from Supabase on mount ────────────────────────────────────────
  React.useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { dispatch({ type: "hydrate", done: readCache() }); return; }

      const { data } = await supabase
        .from("goal_progress")
        .select("goal_id, done")
        .eq("user_id", user.id);

      const done: DoneState = {};
      for (const row of data ?? []) done[row.goal_id] = row.done;

      dispatch({ type: "hydrate", done });
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(done)); } catch {}
    }
    load();
  }, []);

  // ── Persist to Supabase on every state change (after loaded) ─────────────
  React.useEffect(() => {
    if (!state.loaded) return;

    async function persist() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upsert each changed goal's done record
      for (const [goalId, done] of Object.entries(state.done)) {
        await supabase
          .from("goal_progress")
          .upsert({ user_id: user.id, goal_id: goalId, done }, { onConflict: "user_id,goal_id" });
      }
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(state.done)); } catch {}
    }

    persist();
  }, [state.done, state.loaded]);

  return (
    <GoalsStoreContext.Provider value={{ state, dispatch }}>
      {children}
    </GoalsStoreContext.Provider>
  );
}

export function useGoalsStore() {
  const ctx = React.useContext(GoalsStoreContext);
  if (!ctx) throw new Error("useGoalsStore must be used inside GoalsStoreProvider");
  return ctx;
}