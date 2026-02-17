import type { ScheduleConfig } from "../scheduleTypes";
import { TimelineCard } from "./TimelineCard";

export function TimelineList({
  schedule,
  completedSet,
  onToggle,
}: {
  schedule: ScheduleConfig;
  completedSet: Set<number>;
  onToggle: (index: number, done: boolean) => void;
}) {
  return (
    <div className="mt-4">
      <div className="text-sm font-medium">{schedule.label}</div>
      <div className="mt-3">
        {schedule.blocks.map((item, idx) => (
          <TimelineCard
            key={`${item.time}-${idx}`}
            item={item}
            index={idx}
            accentClass={schedule.accentClass}
            colorClass={schedule.colorClass}
            done={completedSet.has(idx)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}