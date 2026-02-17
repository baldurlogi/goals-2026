import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { TimelineItem } from "../scheduleTypes";
import { cn } from "@/lib/utils";

export function TimelineCard(props: {
  item: TimelineItem;
  index: number;
  accentClass: string;
  colorClass: string;
  done: boolean;
  onToggle: (index: number, done: boolean) => void;
}) {
  const { item, index, accentClass, colorClass, done, onToggle } = props;

  return (
    <div className="relative grid grid-cols-[72px_1fr] gap-3">
      {/* Left timeline column */}
      <div className="relative flex flex-col items-center">
        <div className="text-xs font-semibold text-muted-foreground text-center leading-tight">
          {item.time}
        </div>
        <div className="mt-2 h-full w-px bg-border" />
      </div>

      {/* Card */}
      <Card
        className={cn(
          "mb-3 border transition-all duration-200",
          accentClass,
          done && "opacity-60",
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {/* Check-off checkbox */}
              <Checkbox
                id={`block-${index}`}
                checked={done}
                onCheckedChange={(checked) => onToggle(index, !!checked)}
                className="mt-0.5 shrink-0"
              />

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base">{item.icon}</span>
                  <div
                    className={cn(
                      "truncate text-sm font-semibold transition-colors",
                      done && "line-through text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </div>
                </div>
                <p
                  className={cn(
                    "mt-1 text-sm text-muted-foreground transition-colors",
                    done && "line-through",
                  )}
                >
                  {item.detail}
                </p>
              </div>
            </div>

            {item.tag ? (
              <Badge variant="secondary" className={cn("shrink-0", colorClass)}>
                {item.tag}
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}