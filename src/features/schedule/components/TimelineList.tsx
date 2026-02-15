import type { ScheduleConfig } from "../scheduleTypes";
import { TimelineCard } from "./TimelineCard";

export function TimelineList({ schedule }: {schedule: ScheduleConfig}) {
    return (
        <div className="mt-4">
            <div className="text-sm font-medium">{schedule.label}</div>
            <div className="mt-3">
                {schedule.blocks.map((item, idx) => (
                    <TimelineCard
                        key={`${item.time}-${idx}`}
                        item={item}
                        accentClass={schedule.accentClass}
                        colorClass={schedule.colorClass}
                    />
                ))}
            </div>
        </div>
    );
}