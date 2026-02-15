import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ScheduleView } from "../scheduleTypes";

export function SchedulePicker(props: {
    value: ScheduleView;
    onChange: (v: ScheduleView) => void;
}) {
    const { value, onChange } = props;

    return (
        <div className="flex items-center justify-between gap-3">
            <div>
                <div className="text-sm font-medium">Schedule view</div>
                <div className="text-xs text-muted-foreground">Pick the day type</div>
            </div>

            <ToggleGroup
                type="single"
                value={value}
                onValueChange={(v) => {
                    if (!v) return;
                    onChange(v as ScheduleView);
                }}
                className="justify-end"
            >
                <ToggleGroupItem value="wfh" aria-label="Work from home">
                    Mon/Tue
                </ToggleGroupItem>
                <ToggleGroupItem value="office" aria-label="Office days">
                    Wed-Fri
                </ToggleGroupItem>
                <ToggleGroupItem value="weekend" aria-label="Weekend">
                    Sat/Sun
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
    );
}