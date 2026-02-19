import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduleConfig, TimelineItem } from "../scheduleTypes";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [open, setOpen] = useState(false);
  const hasDetail = !!item.detail;

  return (
    <div className={cn("group", done && "opacity-50")}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40",
          open && "bg-muted/40",
        )}
      >
        {/* checkbox */}
        <Checkbox
          checked={done}
          onCheckedChange={(c) => onToggle(index, !!c)}
          className="shrink-0"
          onClick={(e) => e.stopPropagation()}
        />

        {/* time */}
        <span className="w-14 shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {item.time}
        </span>

        {/* icon + label */}
        <span className="text-sm leading-none">{item.icon}</span>
        <span
          className={cn(
            "flex-1 text-sm font-medium leading-none",
            done && "line-through text-muted-foreground",
          )}
        >
          {item.label}
        </span>

        {/* macro tag */}
        {item.tag && (
          <span className="shrink-0 text-[10px] font-medium text-amber-500 dark:text-amber-400 tabular-nums">
            {item.tag}
          </span>
        )}

        {/* expand chevron */}
        {hasDetail && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="ml-1 shrink-0 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
            aria-label={open ? "Collapse" : "Expand"}
          >
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
            />
          </button>
        )}
      </div>

      {/* expandable detail */}
      {open && hasDetail && (
        <div className="ml-[4.25rem] pb-2 pr-2 text-xs text-muted-foreground leading-relaxed">
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