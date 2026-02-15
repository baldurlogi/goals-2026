import { GoalCard } from "./components/GoalCard";
import { useGoalsStore } from "./goalStore";
import { goalsRegistry } from "./registry";

export function GoalsTab() {
    const {state, dispatch} = useGoalsStore();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">2026 Goals</h2>
                <p className="text-sm text-muted-foreground">
                    Check off steps to update progress automatically.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {goalsRegistry.map((goal) => {
                    const doneMap = state.done[goal.id];

                    return (
                        <GoalCard
                            key={goal.id}
                            goal={goal}
                            doneMap={doneMap}
                            onToggleStep={(stepId) => dispatch({ type: "toggleStep", goalId: goal.id, stepId })}
                            onReset={() => dispatch({ type: "resetGoal", goalId: goal.id })}
                        />
                    );
                })}
            </div>
        </div>
    );
}