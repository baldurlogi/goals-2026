import { useMemo, useState } from "react";
import type { ScheduleView } from "./scheduleTypes";
import { dailySchedule } from "./scheduleData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SchedulePicker } from "./components/SchedulePicker";
import { Separator } from "@/components/ui/separator";
import { TimelineList } from "./components/TimelineList";

export function ScheduleTab() {
    const [view, setView] = useState<ScheduleView>("wfh");

    const schedule = useMemo(() => dailySchedule[view], [view]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Daily Schedule</CardTitle>
                </CardHeader>
                <CardContent className="spce-y-4">
                    <SchedulePicker value={view} onChange={setView} />
                    <Separator />
                    <TimelineList schedule={schedule} />
                </CardContent>
            </Card>
        </div>
    );
}