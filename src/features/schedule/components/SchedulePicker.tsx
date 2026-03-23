import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ScheduleView } from "../scheduleTypes";
import { SCHEDULE_CONFIG } from "../scheduleData";

export function SchedulePicker(props: {
  value: ScheduleView;
  onChange: (v: ScheduleView) => void;
}) {
  const { value, onChange } = props;

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => { if (v) onChange(v as ScheduleView); }}
      className="grid min-w-[280px] w-full grid-cols-3"
    >
      {(["wfh", "office", "weekend"] as ScheduleView[]).map((v) => (
        <ToggleGroupItem key={v} value={v} className="px-2 text-[11px] sm:text-xs">
          {SCHEDULE_CONFIG[v].label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
