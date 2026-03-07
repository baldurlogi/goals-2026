import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { NutritionPage } from '@/features/nutrition/NutritionPage';
import { SchedulePage } from '@/features/schedule/SchedulePage';
import { ReadingPage } from '@/features/reading/ReadingPage';
import { GoalsPage } from '@/features/goals/GoalsPage';

export default function DailyPlanPage() {
  return (
    <Tabs defaultValue="nutrition" className="space-y-6">
      <TabsList className="flex w-full">
        <TabsTrigger value="nutrition" className="flex-1">
          🥗 Nutrition
        </TabsTrigger>
        <TabsTrigger value="schedule" className="flex-1">
          📅 Schedule
        </TabsTrigger>
        <TabsTrigger value="reading" className="flex-1">
          📖 Reading
        </TabsTrigger>
        <TabsTrigger value="goals" className="flex-1">
          🎯 Goals
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
