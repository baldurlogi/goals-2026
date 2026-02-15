import { useEffect, useReducer } from "react";

export type GoalsState = {
    done: Record<string, Record<string, boolean>>; // done[goalId][stepId]
};

type Action =
  | { type: "toggleStep"; goalId: string; stepId: string }
  | { type: "resetGoal"; goalId: string }
  | { type: "hydrate"; state: GoalsState };

  const STORAGE_KEY = "daily-system:goals:v1";

  function reducer(state: GoalsState, action: Action): GoalsState {
    if (action.type === "hydrate") return action.state;

    if (action.type === "toggleStep") {
        const prevGoal = state.done[action.goalId] ?? {};
        const nextGoal = { ...prevGoal, [action.stepId] : !prevGoal[action.stepId] };
        return { ...state, done: { ...state.done, [action.goalId]: nextGoal } };
    }

    if (action.type === "resetGoal") {
        const { [action.goalId]: _, ...rest } = state.done;
        return { ...state, done: rest };
    }

    return state;
}

function loadState(): GoalsState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { done: {} };
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return { done: {} };
        if (!parsed.done || typeof parsed.done !== "object") return { done: {} };
        return { done: parsed.done };
    } catch {
        return { done: {} };
    }
}

function saveState(state: GoalsState) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // ignor (quota/private mode)
    }
}

export function useGoalsStore() {
    const [state, dispatch] = useReducer(reducer, { done: {} });

    // hydrate once
    useEffect(() => {
        dispatch({ type: "hydrate", state: loadState() });
    }, []);

    // persist on change (after hydrate runs)
    useEffect(() => {
        saveState(state);
    }, [state]);

    return { state, dispatch };
}