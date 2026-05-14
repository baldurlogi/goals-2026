import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/authContext";
import { queryKeys } from "@/lib/queryKeys";
import { AddEditGoalModal } from "./components/AddEditGoalModal";
import type { UserGoal } from "./goalTypes";

type GoalCreateMode = "manual" | "ai";

type Props = {
  mode: GoalCreateMode;
};

type GoalCreateRouteState = {
  initialPrompt?: string;
} | null;

export function GoalCreatePage({ mode }: Props) {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const initialPrompt = useMemo(() => {
    const state = location.state as GoalCreateRouteState;
    return typeof state?.initialPrompt === "string" ? state.initialPrompt : "";
  }, [location.state]);

  function leave() {
    navigate("/app/goals");
  }

  function handleSaved(goal: UserGoal) {
    queryClient.setQueryData<UserGoal[]>(
      queryKeys.goals(userId),
      (previous = []) => {
        const existingIndex = previous.findIndex((item) => item.id === goal.id);
        if (existingIndex === -1) return [...previous, goal];

        const next = [...previous];
        next[existingIndex] = goal;
        return next;
      },
    );

    void Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.goals(userId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.goalProgress(userId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardGoals(userId) }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboardLifeProgress(userId),
      }),
    ]);

    navigate(`/app/goals/${goal.id}`, { replace: true });
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-6xl flex-col px-0 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-4 lg:px-6">
      <div className="mb-4 flex items-center justify-between gap-3 px-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={leave}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Goals
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <AddEditGoalModal
          startWithAI={mode === "ai"}
          initialAIPrompt={initialPrompt}
          onSave={handleSaved}
          onClose={leave}
          presentation="page"
        />
      </div>
    </div>
  );
}
