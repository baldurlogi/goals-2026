import React from "react";
import { readJson, writeJson } from "@/lib/storage";

type DoneState = Record<string, Record<string, boolean>>;

type GoalsState = {
  done: DoneState;
};

type Action =
  | { type: "toggleStep"; goalId: string; stepId: string }
  | { type: "resetGoal"; goalId: string };

const STORAGE_KEY = "daily-life:goals:v1";

function loadInitialState(): GoalsState {
  const parsed = readJson<GoalsState | null>(STORAGE_KEY, null);
  return parsed?.done ? parsed : { done: {} };
}

function reducer(state: GoalsState, action: Action): GoalsState {
  switch (action.type) {
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

export function GoalsStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, undefined, loadInitialState);

  React.useEffect(() => {
    writeJson(STORAGE_KEY, state);
  }, [state]);

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
