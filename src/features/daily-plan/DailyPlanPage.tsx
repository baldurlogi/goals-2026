import { BookOpen, CalendarDays, Salad, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { NutritionPage } from "@/features/nutrition/NutritionPage";
import { SchedulePage } from "@/features/schedule/SchedulePage";
import { ReadingPage } from "@/features/reading/ReadingPage";
import { GoalsPage } from "@/features/goals/GoalsPage";

export default function DailyPlanPage() {
  return (
    <Tabs defaultValue="nutrition" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
        <TabsTrigger value="nutrition" className="flex items-center gap-2">
          <Salad className="h-4 w-4" />
          <span>Nutrition</span>
        </TabsTrigger>

        <TabsTrigger value="schedule" className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <span>Schedule</span>
        </TabsTrigger>

        <TabsTrigger value="reading" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span>Reading</span>
        </TabsTrigger>

        <TabsTrigger value="goals" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          <span>Goals</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="nutrition">
        <NutritionPage />
      </TabsContent>

      <TabsContent value="schedule">
        <SchedulePage />
      </TabsContent>

      <TabsContent value="reading">
        <ReadingPage />
      </TabsContent>

      <TabsContent value="goals">
        <GoalsPage />
      </TabsContent>
    </Tabs>
  );
}
