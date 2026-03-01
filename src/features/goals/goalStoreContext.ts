import React from "react";

export type DoneState = Record<string, Record<string, boolean>>;
export type GoalsState = { done: DoneState; loaded: boolean };

export type Action =
  | { type: "toggleStep"; goalId: string; stepId: string }
  | { type: "resetGoal"; goalId: string }
  | { type: "hydrate"; done: DoneState };

export const GoalsStoreContext = React.createContext<
  { state: GoalsState; dispatch: React.Dispatch<Action> } | undefined
>(undefined);

export function useGoalsStore() {
  const ctx = React.useContext(GoalsStoreContext);
  if (!ctx) throw new Error("useGoalsStore must be used inside GoalsStoreProvider");
  return ctx;
}