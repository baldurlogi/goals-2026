import { GoalCard } from "./components/GoalCard";
import { useGoalsStore } from "./goalStore";
import { goalsRegistry } from "./registry";

export function GoalsTab() {
  const { state } = useGoalsStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">2026 Goals</h2>
        <p className="text-sm text-muted-foreground">
          Check off steps to update progress automatically.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {goalsRegistry.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            doneMap={state.done[goal.id]}
          />
        ))}
      </div>
    </div>
  );
}
