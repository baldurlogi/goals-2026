import { Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import { DailyPlanHeader } from "./DailyPlanHeader";

import { NutritionTab } from "@/features/nutrition/NutritionTab";
import { ScheduleTab } from "@/features/schedule/ScheduleTab";
import { ReadingTab } from "@/features/reading/ReadingTab";
import { GoalsTab } from "@/features/goals/GoalsTab";


export default function DailyPlanPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
        <DailyPlanHeader />

        <main className="container mx-auto max-w-5xl px-4 py-6">
            <Tabs defaultValue="nutrition" className="space-y-6">
                <TabsList className="flex w-full">
                    <TabsTrigger value="nutrition" className="flex-1">🥗 Nutrition</TabsTrigger>
                    <TabsTrigger value="schedule" className="flex-1">📅 Schedule</TabsTrigger>
                    <TabsTrigger value="reading" className="flex-1">📖 Reading</TabsTrigger>
                    <TabsTrigger value="goals" className="flex-1">🎯 Goals</TabsTrigger>
                </TabsList>

                <TabsContent value="nutrition">
                    <NutritionTab />
                </TabsContent>

                <TabsContent value="schedule">
                    <ScheduleTab />
                </TabsContent>

                <TabsContent value="reading">
                    <ReadingTab />
                </TabsContent>

                <TabsContent value="goals">
                    <GoalsTab />
                </TabsContent>
            </Tabs>
        </main>
    </div>
  )
}


