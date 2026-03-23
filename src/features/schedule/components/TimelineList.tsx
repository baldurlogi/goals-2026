import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduleConfig, TimelineItem } from "../scheduleTypes";
import { Checkbox } from "@/components/ui/checkbox";
import { formatTimeStringWithPreferences } from "@/lib/userPreferences";
import { useUserPreferences } from "@/features/profile/useUserPreferences";

// ── single compact row ────────────────────────────────────────────────────────
function BlockRow({
  item,
  index,
  done,
  onToggle,
}: {
  item: TimelineItem;
  index: number;
  done: boolean;
  onToggle: (index: number, done: boolean) => void;
}) {
  const preferences = useUserPreferences();
  const [open, setOpen] = useState(false);
  const hasDetail = !!item.detail;

  return (
    <div className={cn("group", done && "opacity-50")}>
      <div
        className={cn(
          "rounded-lg px-2 py-2 transition-colors hover:bg-muted/40",
          open && "bg-muted/40",
        )}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            checked={done}
            onCheckedChange={(c) => onToggle(index, !!c)}
            className="mt-0.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2 sm:items-center">
              <span className="w-14 shrink-0 pt-0.5 text-[11px] tabular-nums text-muted-foreground sm:pt-0">
                {formatTimeStringWithPreferences(item.time, preferences)}
              </span>
              <span className="pt-0.5 text-sm leading-none sm:pt-0">{item.icon}</span>
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "text-sm font-medium leading-snug",
                    done && "line-through text-muted-foreground",
                  )}
                >
                  {item.label}
                </div>
                {item.tag && (
                  <div className="mt-1 text-[10px] font-medium text-amber-500 dark:text-amber-400 tabular-nums sm:hidden">
                    {item.tag}
                  </div>
                )}
              </div>
              {item.tag && (
                <span className="hidden shrink-0 text-[10px] font-medium text-amber-500 dark:text-amber-400 tabular-nums sm:block">
                  {item.tag}
                </span>
              )}
              {hasDetail && (
                <button
                  type="button"
                  onClick={() => setOpen((o) => !o)}
                  className="ml-1 shrink-0 pt-0.5 text-muted-foreground/50 transition-colors hover:text-muted-foreground sm:pt-0"
                  aria-label={open ? "Collapse" : "Expand"}
                >
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* expandable detail */}
      {open && hasDetail && (
        <div className="pl-[5.2rem] pr-2 pb-2 text-xs leading-relaxed text-muted-foreground sm:pl-[4.25rem]">
          {item.detail}
        </div>
      )}
    </div>
  );
}

// ── list ──────────────────────────────────────────────────────────────────────
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
    <div className="space-y-0.5">
      {schedule.blocks.map((item, idx) => (
        <BlockRow
          key={`${item.time}-${idx}`}
          item={item}
          index={idx}
          done={completedSet.has(idx)}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
