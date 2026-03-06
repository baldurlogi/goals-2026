import { TripCountdownCard } from "./components/TripCountdownCard";
import { BudgetCard } from "./components/BudgetCard";
import { ItineraryNotesCard } from "./components/ItineraryNotesCard";

const GOAL_ID = "travel-planning";

export function TravelPlanningGoalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">✈️ Travel Planning</h1>
        <p className="text-muted-foreground text-sm mt-1">Track trip countdown, budget, and itinerary notes.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <TripCountdownCard goalId={GOAL_ID} />
        <BudgetCard goalId={GOAL_ID} currency="DKK" />
        <ItineraryNotesCard goalId={GOAL_ID} />
      </div>
    </div>
  );
}