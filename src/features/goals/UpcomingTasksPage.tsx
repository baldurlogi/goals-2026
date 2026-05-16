import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowRight,
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Radar,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useGoalProgressState, useToggleGoalStepMutation } from '@/features/goals/goalStore';
import { useGoalsState } from './useGoalsQuery';
import type { UserGoal } from './goalTypes';
import type { UpcomingItem } from '@/features/dashboard/hooks/useGoalsDashboard';
import { getLocalDateKey } from '@/hooks/useTodayDate';
import { cn } from '@/lib/utils';

type JustCompletedItem = {
  key: string;
  goalId: string;
  goalTitle: string;
  goalEmoji: string;
  stepLabel: string;
};

function todayISO() {
  return getLocalDateKey();
}

function diffDays(isoA: string, isoB: string) {
  return Math.round(
    (new Date(isoB + 'T00:00:00').getTime() -
      new Date(isoA + 'T00:00:00').getTime()) /
      86400000,
  );
}

function getUpcomingItems(
  goals: UserGoal[],
  doneMap: Record<string, Record<string, boolean>>,
  horizonDays: number,
): UpcomingItem[] {
  const today = todayISO();
  const items: UpcomingItem[] = [];

  for (const goal of goals) {
    for (const step of goal.steps) {
      if (!step.idealFinish) continue;
      if (doneMap[goal.id]?.[step.id]) continue;
      const days = diffDays(today, step.idealFinish);
      if (days > horizonDays) continue;
      items.push({
        goalId: goal.id,
        goalTitle: goal.title,
        goalEmoji: goal.emoji,
        step,
        daysFromToday: days,
      });
    }
  }

  return items.sort((a, b) => a.daysFromToday - b.daysFromToday);
}

function formatDateLabel(iso: string | null) {
  if (!iso) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${iso}T12:00:00`));
}

function getTimingLabel(days: number) {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days}d`;
}

function getUrgencyTone(days: number) {
  if (days < 0) {
    return {
      label: 'Requires intervention',
      accent: 'text-rose-300',
      dot: 'bg-rose-300 shadow-[0_0_14px_rgba(253,164,175,0.45)]',
      row: 'hover:bg-rose-500/[0.045]',
    };
  }

  if (days === 0) {
    return {
      label: 'Active today',
      accent: 'text-amber-300',
      dot: 'bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.42)]',
      row: 'hover:bg-amber-500/[0.04]',
    };
  }

  return {
    label: days <= 3 ? 'Quietly approaching' : 'Background signal',
    accent: 'text-cyan-300',
    dot: 'bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.36)]',
    row: 'hover:bg-cyan-500/[0.035]',
  };
}

function getSystemInsight({
  itemCount,
  overdueCount,
  dueTodayCount,
  futureCount,
}: {
  itemCount: number;
  overdueCount: number;
  dueTodayCount: number;
  futureCount: number;
}) {
  if (itemCount === 0) {
    return 'The near field is quiet. This is a good window to protect momentum instead of adding pressure.';
  }

  if (overdueCount > 0) {
    return 'Some trajectories have crossed into friction. Clear one overdue step before scanning the rest.';
  }

  if (dueTodayCount > 0) {
    return 'Today has active weight. Finish the smallest visible step first to keep the day moving.';
  }

  if (futureCount > 0) {
    return 'Nothing is pressing yet. The system is surfacing quiet commitments before they become pressure.';
  }

  return 'Your attention field is stable.';
}

function TaskSignalRow({
  item,
  onToggle,
  prominent = false,
}: {
  item: UpcomingItem;
  onToggle: (item: UpcomingItem) => void;
  prominent?: boolean;
}) {
  const tone = getUrgencyTone(item.daysFromToday);

  return (
    <div
      className={cn(
        'group grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-xl px-2 py-2.5 transition-colors sm:px-3',
        prominent ? 'bg-background/28' : 'bg-transparent',
        tone.row,
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(item)}
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/12 text-muted-foreground/50 transition-all hover:border-emerald-300/40 hover:bg-emerald-400/10 hover:text-emerald-300"
        aria-label={`Mark ${item.step.label} complete`}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
      </button>

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', tone.dot)} />
          <span className={cn('text-[10px] font-semibold uppercase tracking-[0.17em]', tone.accent)}>
            {tone.label}
          </span>
        </div>
        <p className={cn('mt-1 truncate font-medium leading-snug', prominent ? 'text-base' : 'text-sm')}>
          {item.step.label}
        </p>
        <Link
          to={`/app/goals/${item.goalId}`}
          className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="truncate">
            {item.goalEmoji} {item.goalTitle}
          </span>
          <ArrowRight className="h-3 w-3 shrink-0" />
        </Link>
      </div>

      <div className="shrink-0 text-right">
        <div className={cn('text-xs font-semibold tabular-nums', tone.accent)}>
          {getTimingLabel(item.daysFromToday)}
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground/58">
          {formatDateLabel(item.step.idealFinish)}
        </div>
      </div>
    </div>
  );
}

function AttentionBand({
  title,
  items,
  icon: Icon,
  tone,
  onToggle,
}: {
  title: string;
  items: UpcomingItem[];
  icon: typeof Flame;
  tone: string;
  onToggle: (item: UpcomingItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className={cn('relative overflow-hidden rounded-[1.6rem] px-3 py-3 sm:px-4', tone)}>
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground/70" />
          <h3 className="truncate text-sm font-semibold">{title}</h3>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {items.length}
        </span>
      </div>

      <div className="space-y-1">
        {items.map((item) => (
          <TaskSignalRow key={`${item.goalId}:${item.step.id}`} item={item} onToggle={onToggle} />
        ))}
      </div>
    </section>
  );
}

export function UpcomingTasksPage() {
  const { doneState: done, isGoalProgressLoading } = useGoalProgressState();
  const toggleGoalStepMutation = useToggleGoalStepMutation();
  const { goals, isGoalsLoading } = useGoalsState();
  const [horizonDays, setHorizonDays] = useState<7 | 14>(7);
  const [justCompleted, setJustCompleted] = useState<JustCompletedItem[]>([]);
  const completionTimersRef = useRef<Record<string, number>>({});
  const loading = isGoalsLoading || isGoalProgressLoading;

  const items = useMemo(
    () => getUpcomingItems(goals, done, horizonDays),
    [done, goals, horizonDays],
  );

  const overdueCount = useMemo(
    () => items.filter((item) => item.daysFromToday < 0).length,
    [items],
  );
  const overdueItems = useMemo(
    () => items.filter((item) => item.daysFromToday < 0),
    [items],
  );
  const dueTodayItems = useMemo(
    () => items.filter((item) => item.daysFromToday === 0),
    [items],
  );
  const futureItems = useMemo(
    () => items.filter((item) => item.daysFromToday > 0),
    [items],
  );
  const primaryItem = items[0] ?? null;
  const primaryKey = primaryItem ? `${primaryItem.goalId}:${primaryItem.step.id}` : null;
  const overdueFlow = useMemo(
    () => overdueItems.filter((item) => `${item.goalId}:${item.step.id}` !== primaryKey),
    [overdueItems, primaryKey],
  );
  const dueTodayFlow = useMemo(
    () => dueTodayItems.filter((item) => `${item.goalId}:${item.step.id}` !== primaryKey),
    [dueTodayItems, primaryKey],
  );
  const futureFlow = useMemo(
    () => futureItems.filter((item) => `${item.goalId}:${item.step.id}` !== primaryKey),
    [futureItems, primaryKey],
  );
  const systemInsight = getSystemInsight({
    itemCount: items.length,
    overdueCount,
    dueTodayCount: dueTodayItems.length,
    futureCount: futureItems.length,
  });

  useEffect(() => {
    return () => {
      Object.values(completionTimersRef.current).forEach((timer) => {
        window.clearTimeout(timer);
      });
    };
  }, []);

  function handleToggle(item: UpcomingItem) {
    const key = `${item.goalId}:${item.step.id}`;

    toggleGoalStepMutation.mutate({
      goalId: item.goalId,
      stepId: item.step.id,
    });

    setJustCompleted((current) =>
      [
        {
          key,
          goalId: item.goalId,
          goalTitle: item.goalTitle,
          goalEmoji: item.goalEmoji,
          stepLabel: item.step.label,
        },
        ...current.filter((entry) => entry.key !== key),
      ].slice(0, 3),
    );

    window.clearTimeout(completionTimersRef.current[key]);
    completionTimersRef.current[key] = window.setTimeout(() => {
      setJustCompleted((current) => current.filter((entry) => entry.key !== key));
      delete completionTimersRef.current[key];
    }, 2600);

    toast('Marked as done', {
      description: `${item.goalEmoji} ${item.goalTitle} — ${item.step.label}`,
      action: {
        label: 'Undo',
        onClick: () => {
          toggleGoalStepMutation.mutate({
            goalId: item.goalId,
            stepId: item.step.id,
          });
          window.clearTimeout(completionTimersRef.current[key]);
          delete completionTimersRef.current[key];
          setJustCompleted((current) => current.filter((entry) => entry.key !== key));
        },
      },
    });
  }

  return (
    <div className="ai-depth-stage mx-auto max-w-6xl space-y-5 overflow-x-clip">
      <section className="ai-atmosphere ai-reactive-edge overflow-hidden rounded-[2rem] border border-white/8 px-4 py-5 shadow-[0_26px_90px_rgba(2,6,23,0.24)] sm:px-6">
        <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <Radar className="h-3.5 w-3.5 text-cyan-300" />
              Attention timeline
            </div>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              What needs energy next.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {systemInsight}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
            <div className="ai-layer-soft rounded-2xl p-3">
              <div className="text-2xl font-semibold tabular-nums">{items.length}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">signals</div>
            </div>
            <div className="ai-layer-soft rounded-2xl p-3">
              <div className="text-2xl font-semibold tabular-nums">{overdueCount}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">overdue</div>
            </div>
            <div className="ai-layer-soft rounded-2xl p-3">
              <div className="text-2xl font-semibold tabular-nums">{dueTodayItems.length}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">today</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <Brain className="h-3.5 w-3.5 shrink-0 text-violet-300" />
            <span className="truncate">
              {overdueCount > 0
                ? 'Resolve pressure before adding new scope.'
                : 'Near-term commitments are being kept visible.'}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/8 bg-background/34 p-1">
            {([7, 14] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setHorizonDays(d)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  horizonDays === d
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </section>

      {!loading && justCompleted.length > 0 && (
        <div className="ai-layer-soft flex min-w-0 items-start gap-3 rounded-[1.35rem] px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/85">
              Momentum restored
            </div>
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm text-muted-foreground">
              {justCompleted.map((entry) => (
                <span key={entry.key} className="min-w-0">
                  <span className="font-medium text-foreground">
                    {entry.goalEmoji} {entry.stepLabel}
                  </span>
                  <span> / {entry.goalTitle}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="ai-layer-soft animate-pulse space-y-3 rounded-[1.5rem] p-4"
            >
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-5 w-2/3 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="ai-layer-soft rounded-[1.75rem] p-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-cyan-300" />
          <div className="mt-4 text-lg font-semibold">Near field is clear</div>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {goals.length === 0
              ? 'Create one meaningful trajectory and Begyn will start surfacing what needs attention.'
              : 'No dated steps are approaching in this window.'}
          </p>
        </div>
      )}

      {!loading && primaryItem && (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.7fr)] lg:items-start">
          <div className="ai-priority-surface ai-reactive-edge overflow-hidden rounded-[1.85rem] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <Flame className="h-4 w-4 shrink-0 text-rose-300" />
                Primary signal
              </div>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {getTimingLabel(primaryItem.daysFromToday)}
              </span>
            </div>
            <TaskSignalRow item={primaryItem} onToggle={handleToggle} prominent />
            <p className="mt-4 border-l border-white/10 pl-3 text-xs leading-5 text-muted-foreground/72">
              {primaryItem.daysFromToday < 0
                ? 'This is becoming overdue momentum. Make the next action smaller, then clear it.'
                : primaryItem.daysFromToday === 0
                  ? 'This belongs to today. Treat it as an active focus, not background noise.'
                  : 'This is early enough to handle calmly before pressure forms.'}
            </p>
          </div>

          <div className="ai-layer-soft rounded-[1.6rem] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-cyan-300" />
              Trajectory read
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {overdueCount > 0
                ? 'Pressure is concentrated. One overdue completion will change the emotional shape of this page.'
                : dueTodayItems.length > 1
                  ? 'Today has multiple active commitments. Clear the shortest one first.'
                  : 'The timeline is calm. Keep future steps visible without pulling them into today.'}
            </p>
          </div>
        </section>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          <AttentionBand
            title="Pressure"
            items={overdueFlow}
            icon={Flame}
            tone="border border-rose-500/10 bg-rose-500/[0.035] shadow-[0_18px_60px_rgba(244,63,94,0.07)]"
            onToggle={handleToggle}
          />
          <AttentionBand
            title="Today"
            items={dueTodayFlow}
            icon={Clock3}
            tone="border border-amber-400/10 bg-amber-400/[0.035] shadow-[0_18px_60px_rgba(245,158,11,0.06)]"
            onToggle={handleToggle}
          />
          <AttentionBand
            title="Approaching"
            items={futureFlow}
            icon={CalendarDays}
            tone="border border-cyan-400/10 bg-cyan-400/[0.025] shadow-[0_18px_60px_rgba(34,211,238,0.045)]"
            onToggle={handleToggle}
          />
        </div>
      )}
    </div>
  );
}
