import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScheduleConfig, TimelineItem } from "../scheduleTypes";
import { formatTimeStringWithPreferences } from "@/lib/userPreferences";
import { useUserPreferences } from "@/features/profile/useUserPreferences";

// ── single compact row ────────────────────────────────────────────────────────
function BlockRow({
  item,
  index,
  done,
  state,
  onToggle,
}: {
  item: TimelineItem;
  index: number;
  done: boolean;
  state?: "now" | "next" | "later" | "done";
  onToggle: (index: number, done: boolean) => void;
}) {
  const preferences = useUserPreferences();
  const [open, setOpen] = useState(false);
  const hasDetail = !!item.detail;

  return (
    <div className={cn("group relative pl-7", done && "opacity-68")}>
      <div className="absolute bottom-0 left-[0.68rem] top-0 w-px bg-gradient-to-b from-white/10 via-white/8 to-transparent" />
      <span
        className={cn(
          "absolute left-0 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
          state === "now" && "bg-emerald-300 shadow-[0_0_22px_rgba(74,222,128,0.45)]",
          state === "next" && "bg-cyan-300/80 shadow-[0_0_18px_rgba(103,232,249,0.35)]",
          done && "bg-emerald-300/18",
        )}
      >
        {done ? (
          <Check className="h-3 w-3 text-emerald-100" />
        ) : (
          <span className={cn("h-1.5 w-1.5 rounded-full bg-muted-foreground/60", (state === "now" || state === "next") && "bg-slate-950")} />
        )}
      </span>
      <div
        className={cn(
          "relative rounded-[1.3rem] px-3 py-3 transition-all duration-500 hover:bg-background/28",
          open && "bg-background/28",
          state === "now" && "bg-emerald-300/10 shadow-[inset_0_0_0_1px_rgba(110,231,183,0.16),0_18px_46px_rgba(2,6,23,0.12)]",
          state === "next" && "bg-cyan-300/8 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.12)]",
          done && "bg-background/8",
        )}
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggle(index, !done);
            }}
            className={cn(
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/6 text-muted-foreground transition-colors hover:bg-emerald-300/14 hover:text-emerald-100",
              done && "bg-emerald-300/12 text-emerald-100",
            )}
            aria-label={done ? `Mark ${item.label} incomplete` : `Mark ${item.label} complete`}
          >
            {done ? <Check className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-current opacity-50" />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2 sm:items-center">
              <span className="w-14 shrink-0 pt-0.5 text-[11px] font-medium tabular-nums text-muted-foreground sm:pt-0">
                {formatTimeStringWithPreferences(item.time, preferences)}
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm leading-none sm:h-7 sm:w-7">
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "text-sm font-semibold leading-snug transition-colors",
                    done && "text-muted-foreground/70",
                  )}
                >
                  {item.label}
                </div>
                {state === "now" || state === "next" ? (
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100/80">
                    {state === "now" ? "Now" : "Next"}
                  </div>
                ) : null}
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
        <div className="pb-2 pl-[6.4rem] pr-2 text-xs leading-relaxed text-muted-foreground sm:pl-[5.8rem]">
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
  focusIndex,
  nextIndex,
}: {
  schedule: ScheduleConfig;
  completedSet: Set<number>;
  onToggle: (index: number, done: boolean) => void;
  focusIndex?: number | null;
  nextIndex?: number | null;
}) {
  return (
    <div className="space-y-1">
      {schedule.blocks.map((item, idx) => (
        <BlockRow
          key={`${item.time}-${idx}`}
          item={item}
          index={idx}
          done={completedSet.has(idx)}
          state={
            completedSet.has(idx)
              ? "done"
              : idx === focusIndex
                ? "now"
                : idx === nextIndex
                  ? "next"
                  : "later"
          }
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
