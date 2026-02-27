import React from "react";
import { supabase } from "@/lib/supabaseClient";

type DoneState = Record<string, Record<string, boolean>>;

type GoalsState = {
  done: DoneState;
  hydrated: boolean; // helps avoid UI flicker / debugging
};

type Action =
  | { type: "hydrate"; done: DoneState }
  | { type: "toggleStep"; goalId: string; stepId: string }
  | { type: "resetGoal"; goalId: string };

function reducer(state: GoalsState, action: Action): GoalsState {
  switch (action.type) {
    case "hydrate":
      return { done: action.done ?? {}, hydrated: true };

    case "toggleStep": {
      const { goalId, stepId } = action;
      const goalDone = state.done[goalId] ?? {};
      const nextGoalDone = { ...goalDone, [stepId]: !goalDone[stepId] };
      return { ...state, done: { ...state.done, [goalId]: nextGoalDone } };
    }

    case "resetGoal": {
      const { goalId } = action;
      const nextDone = { ...state.done };
      delete nextDone[goalId];
      return { ...state, done: nextDone };
    }

    default:
      return state;
  }
}

const GoalsStoreContext = React.createContext<
  { state: GoalsState; dispatch: React.Dispatch<Action> } | undefined
>(undefined);

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const uid = data?.user?.id;
  if (!uid) throw new Error("Not logged in");
  return uid;
}

async function fetchGoalsDone(uid: string): Promise<DoneState> {
  const { data, error } = await supabase
    .from("goal_progress")
    .select("goal_id, done")
    .eq("user_id", uid);

  if (error) throw error;

  const done: DoneState = {};
  for (const row of data ?? []) {
    done[row.goal_id] = (row.done ?? {}) as Record<string, boolean>;
  }
  return done;
}

async function upsertGoalDone(uid: string, goalId: string, goalDone: Record<string, boolean>) {
  const { error } = await supabase
    .from("goal_progress")
    .upsert(
      {
        user_id: uid,
        goal_id: goalId,
        done: goalDone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,goal_id" }
    );

  if (error) throw error;
}

async function deleteGoal(uid: string, goalId: string) {
  const { error } = await supabase
    .from("goal_progress")
    .delete()
    .eq("user_id", uid)
    .eq("goal_id", goalId);

  if (error) throw error;
}

export function GoalsStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, baseDispatch] = React.useReducer(reducer, { done: {}, hydrated: false });

  // Queue actions so we can persist only what changed
  const pending = React.useRef<Action[]>([]);
  const isHydrating = React.useRef(true);

  // Hydrate from Supabase once
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const uid = await requireUserId();
        const done = await fetchGoalsDone(uid);
        if (!cancelled) {
          isHydrating.current = true;
          baseDispatch({ type: "hydrate", done });
        }
      } catch (e) {
        console.warn("Goals hydrate failed:", e);
        if (!cancelled) baseDispatch({ type: "hydrate", done: {} });
      } finally {
        isHydrating.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Wrap dispatch to capture actions for persistence
  const dispatch = React.useCallback((action: Action) => {
    // never persist the hydrate action
    if (action.type !== "hydrate") pending.current.push(action);
    baseDispatch(action);
  }, []);

  // Persist queued changes after state updates
  React.useEffect(() => {
    if (!state.hydrated) return;
    if (isHydrating.current) return;

    const actions = pending.current.splice(0, pending.current.length);
    if (actions.length === 0) return;

    (async () => {
      const uid = await requireUserId();

      for (const action of actions) {
        if (action.type === "toggleStep") {
          const goalDone = state.done[action.goalId] ?? {};
          await upsertGoalDone(uid, action.goalId, goalDone);
        }

        if (action.type === "resetGoal") {
          await deleteGoal(uid, action.goalId);
        }
      }
    })().catch((e) => {
      console.warn("Goals persist failed:", e);
    });
  }, [state.done, state.hydrated]);

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