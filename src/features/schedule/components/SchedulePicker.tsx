import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ScheduleDayKey } from "../scheduleTypes";
import { SCHEDULE_CONFIG, SCHEDULE_DAY_ORDER } from "../scheduleData";

export function SchedulePicker(props: {
  value: ScheduleDayKey;
  onChange: (v: ScheduleDayKey) => void;
}) {
  const { value, onChange } = props;

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as ScheduleDayKey);
      }}
      className="grid w-full min-w-0 grid-cols-7"
    >
      {SCHEDULE_DAY_ORDER.map((v) => (
        <ToggleGroupItem key={v} value={v} className="px-2 text-[11px] sm:text-xs">
          {SCHEDULE_CONFIG[v].shortLabel}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
