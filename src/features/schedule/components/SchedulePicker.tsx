import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ScheduleView } from "../scheduleTypes";

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
      className="w-full grid grid-cols-3"
    >
      <ToggleGroupItem value="wfh"     className="text-xs">Mon / Tue</ToggleGroupItem>
      <ToggleGroupItem value="office"  className="text-xs">Wed – Fri</ToggleGroupItem>
      <ToggleGroupItem value="weekend" className="text-xs">Sat / Sun</ToggleGroupItem>
    </ToggleGroup>
  );
}