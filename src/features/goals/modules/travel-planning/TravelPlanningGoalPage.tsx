import { PageHeader, PageScaffold } from "@/components/PageScaffold";
import { TripCountdownCard } from "./components/TripCountdownCard";
import { BudgetCard } from "./components/BudgetCard";
import { ItineraryNotesCard } from "./components/ItineraryNotesCard";

const GOAL_ID = "travel-planning";

export function TravelPlanningGoalPage() {
  return (
    <PageScaffold width="wide">
      <PageHeader
        title="✈️ Travel Planning"
        description="Track trip countdown, budget, and itinerary notes."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <TripCountdownCard goalId={GOAL_ID} />
        <BudgetCard goalId={GOAL_ID} currency="DKK" />
        <ItineraryNotesCard goalId={GOAL_ID} />
      </div>
    </PageScaffold>
  );
}
