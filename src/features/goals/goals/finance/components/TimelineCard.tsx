import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { GoalStep } from "../../../goalTypes";

type Bucket = "overdue" | "upcoming" | "later" | "ongoing" | "undated";

function parseISODate(d?: string) {
  if (!d) return null;
  // Accept "YYYY-MM-DD" best; if "ongoing" return null
  if (d.toLowerCase() === "ongoing") return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function dayStart(dt: Date) {
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

function daysBetween(a: Date, b: Date) {
  const ms = dayStart(b).getTime() - dayStart(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function prettyHref(href: string) {
  return href.replace(/^https?:\/\//, "");
}

export function TimelineCard(props: {
  steps: GoalStep[];
  doneMap?: Record<string, boolean>;
  className?: string;
}) {
  const { steps, doneMap, className } = props;
  const today = useMemo(() => dayStart(new Date()), []);

  const items = useMemo(() => {
    return steps
      .map((s) => {
        const dt = parseISODate(s.idealFinish);
        const done = !!doneMap?.[s.id];

        let bucket: Bucket = "undated";
        if (s.idealFinish?.toLowerCase() === "ongoing") bucket = "ongoing";
        else if (!dt) bucket = "undated";
        else {
          const diff = daysBetween(today, dt);
          if (diff < 0) bucket = "overdue";
          else if (diff <= 14) bucket = "upcoming";
          else bucket = "later";
        }

        return { step: s, dt, done, bucket };
      })
      .sort((a, b) => {
        // done last within buckets, then date
        if (a.done !== b.done) return a.done ? 1 : -1;

        const at = a.dt?.getTime() ?? Number.POSITIVE_INFINITY;
        const bt = b.dt?.getTime() ?? Number.POSITIVE_INFINITY;
        return at - bt;
      });
  }, [steps, doneMap, today]);

  return (
    <div className={cn("rounded-2xl border bg-card p-5 shadow-sm space-y-4", className)}>
      <div>
        <div className="text-sm text-muted-foreground">Timeline</div>
        <div className="text-lg font-semibold">Upcoming milestones</div>
        <div className="text-sm text-muted-foreground">
          Next 2 weeks are highlighted. Overdue stands out.
        </div>
      </div>

      <div className="space-y-3">
        {/* Today marker */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-3 w-3 rounded-full bg-foreground" />
          </div>
          <div className="text-sm font-medium">Today</div>
          <div className="text-xs text-muted-foreground">
            {today.toISOString().slice(0, 10)}
          </div>
        </div>

        <div className="pl-1 space-y-3">
          {items.map(({ step, dt, done, bucket }) => {
            const due = step.idealFinish ?? "—";
            const isOverdue = bucket === "overdue" && !done;
            const isUpcoming = bucket === "upcoming" && !done;

            return (
              <div key={step.id} className="flex items-start gap-3">
                {/* Timeline line + dot */}
                <div className="relative mt-1">
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full border",
                      done
                        ? "bg-muted border-border/60"
                        : isOverdue
                          ? "bg-destructive border-destructive"
                          : isUpcoming
                            ? "bg-amber-500 border-amber-500"
                            : "bg-background border-border/60"
                    )}
                  />
                  <div className="absolute left-1/2 top-3 -translate-x-1/2 h-10 w-px bg-border/60" />
                </div>

                {/* Content */}
                <div className={cn("min-w-0 flex-1 rounded-xl border p-3", done ? "opacity-75" : "border-border/60")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={cn("text-sm font-semibold", done ? "line-through text-muted-foreground" : "")}>
                        {step.label}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>📅 {due}</span>
                        {step.estimatedTime ? <span>⏱ {step.estimatedTime}</span> : null}
                        {!done && dt ? (
                          <span className={cn(isOverdue ? "text-destructive font-medium" : isUpcoming ? "text-amber-500 font-medium" : "")}>
                            {(() => {
                              const diff = daysBetween(today, dt);
                              if (diff < 0) return `${Math.abs(diff)}d overdue`;
                              if (diff === 0) return "Due today";
                              return `In ${diff}d`;
                            })()}
                          </span>
                        ) : null}
                      </div>

                      {step.links?.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {step.links.map((href) => (
                            <a
                              key={href}
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs underline text-muted-foreground hover:text-foreground"
                            >
                              {prettyHref(href)}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* remove the last line tail visually */}
        <div className="h-2" />
      </div>
    </div>
  );
}
