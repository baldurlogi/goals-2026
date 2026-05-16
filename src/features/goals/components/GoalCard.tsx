import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import type { UserGoal } from '../goalTypes';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { getLocalDateKey } from '@/hooks/useTodayDate';
import { cn } from '@/lib/utils';


const PRIORITY_COLOR: Record<string, string> = {
  high: 'text-rose-500',
  medium: 'text-amber-500',
  low: 'text-emerald-500',
};

const PRIORITY_GLOW: Record<string, string> = {
  high: 'from-rose-500/24 via-violet-500/8 to-transparent',
  medium: 'from-amber-500/20 via-cyan-500/8 to-transparent',
  low: 'from-emerald-500/20 via-cyan-500/8 to-transparent',
};

type Props = {
  goal: UserGoal;
  doneMap?: Record<string, boolean>;
  overdueCount?: number;
  isCompleted?: boolean;
  variant?: 'featured' | 'compact' | 'archive';
  onEdit?: () => void;
  onDelete?: () => void;
  onImprove?: () => void;
};

function getMomentumSignal({
  pct,
  doneCount,
  total,
  overdueCount,
  priority,
  isCompleted,
}: {
  pct: number;
  doneCount: number;
  total: number;
  overdueCount: number;
  priority: UserGoal['priority'];
  isCompleted: boolean;
}) {
  if (isCompleted) {
    return {
      label: 'Resolved trajectory',
      insight: 'This path is complete. Keep it as proof of progress, not another task.',
      tone: 'text-emerald-400',
    };
  }

  if (overdueCount > 0) {
    return {
      label: 'Momentum slowing',
      insight: `${overdueCount} step${overdueCount === 1 ? '' : 's'} need a lighter next move.`,
      tone: 'text-amber-400',
    };
  }

  if (pct >= 70) {
    return {
      label: 'Strong consistency',
      insight: 'You are close enough for a focused finish window.',
      tone: 'text-emerald-400',
    };
  }

  if (doneCount === 0 && total > 0) {
    return {
      label: priority === 'high' ? 'Best tackled early' : 'Waiting for first signal',
      insight: 'One completed step will turn this from intention into trajectory.',
      tone: 'text-sky-400',
    };
  }

  return {
    label: 'Stable progress rhythm',
    insight: 'Keep the next action small enough to preserve motion.',
    tone: 'text-cyan-400',
  };
}

export function GoalCard({
  goal,
  doneMap = {},
  overdueCount = 0,
  isCompleted = false,
  variant = 'compact',
  onEdit,
  onDelete,
  onImprove,
}: Props) {
  const navigate = useNavigate();
  const total = goal.steps.length;
  const doneCount = goal.steps.filter((s) => doneMap[s.id]).length;
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  // Count overdue steps
  const today = getLocalDateKey();
  const overdueSteps = goal.steps.filter(
    (s) => s.idealFinish && s.idealFinish < today && !doneMap[s.id],
  ).length;
  const displayOverdue = overdueCount || overdueSteps;
  const nextStep = goal.steps.find((step) => !doneMap[step.id]);
  const signal = getMomentumSignal({
    pct,
    doneCount,
    total,
    overdueCount: displayOverdue,
    priority: goal.priority,
    isCompleted,
  });

  const baseClassName =
    'group relative min-w-0 overflow-hidden rounded-[1.35rem] transition-all duration-500 hover:-translate-y-0.5';
  const surfaceClassName =
    variant === 'featured'
      ? 'ai-reactive-edge border border-white/10 bg-background/52 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.28)] backdrop-blur-xl sm:p-6'
      : variant === 'archive'
        ? 'border border-white/6 bg-background/24 px-3 py-3 opacity-78 hover:opacity-100'
        : 'border border-white/8 bg-background/36 p-4 shadow-[0_16px_48px_rgba(2,6,23,0.12)] backdrop-blur-md';

  if (variant === 'archive') {
    return (
      <div
        className={cn(baseClassName, 'cursor-pointer', surfaceClassName)}
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/app/goals/${goal.id}`)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            navigate(`/app/goals/${goal.id}`);
          }
        }}
      >
        <div className="relative z-10 flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-lg">
            {goal.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{goal.title}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-emerald-400/80">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              <span className="truncate">Completed memory</span>
            </div>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{pct}%</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(baseClassName, 'cursor-pointer', surfaceClassName)}
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/app/goals/${goal.id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(`/app/goals/${goal.id}`);
        }
      }}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-br opacity-80 blur-2xl',
          PRIORITY_GLOW[goal.priority] ?? PRIORITY_GLOW.low,
        )}
      />
      <div className="relative z-10 space-y-4">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className={cn(
                'flex shrink-0 items-center justify-center rounded-2xl bg-background/48 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]',
                variant === 'featured' ? 'h-12 w-12 text-2xl' : 'h-10 w-10 text-xl',
              )}>
                {goal.emoji}
              </span>
              <div className="min-w-0">
                <h3 className={cn(
                  'truncate font-semibold tracking-tight',
                  variant === 'featured' ? 'text-xl sm:text-2xl' : 'text-base',
                )}>
                  {goal.title}
                </h3>
                <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px]">
                  <span className={cn('font-semibold', signal.tone)}>{signal.label}</span>
                  <span className="text-muted-foreground/45">/</span>
                  <span className={cn('capitalize', PRIORITY_COLOR[goal.priority] ?? PRIORITY_COLOR.low)}>
                    {goal.priority}
                  </span>
                </div>
              </div>
            </div>

            {goal.subtitle && variant === 'featured' && (
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
                {goal.subtitle}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <div className={cn(
              'font-semibold tabular-nums',
              variant === 'featured' ? 'text-3xl' : 'text-lg',
            )}>
              {pct}%
            </div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">flow</div>
          </div>
        </div>

        <div className="space-y-2">
          <Progress
            value={pct}
            className="h-2 bg-white/8"
            indicatorClassName={cn(
              'bg-gradient-to-r',
              isCompleted
                ? 'from-emerald-400 to-cyan-300'
                : displayOverdue > 0
                  ? 'from-amber-400 via-rose-400 to-violet-400'
                  : 'from-emerald-400 via-cyan-300 to-violet-400',
            )}
          />
          <div className="flex min-w-0 items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="truncate">
              {doneCount}/{total} steps integrated
            </span>
            {displayOverdue > 0 ? (
              <span className="shrink-0 text-amber-400">{displayOverdue} overdue</span>
            ) : (
              <span className="shrink-0">rhythm stable</span>
            )}
          </div>
        </div>

        <div className={cn(
          'rounded-2xl border border-white/6 bg-background/24',
          variant === 'featured' ? 'p-3.5' : 'p-3',
        )}>
          <div className="flex min-w-0 items-start gap-2.5">
            <TrendingUp className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', signal.tone)} />
            <div className="min-w-0">
              <p className="text-xs leading-5 text-muted-foreground">{signal.insight}</p>
              {nextStep ? (
                <p className="mt-1 truncate text-xs font-medium text-foreground/88">
                  Next: {nextStep.label}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {onImprove && goal.steps.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onImprove();
                }}
                className="relative z-10 h-8 rounded-full px-2.5 text-xs text-violet-300 hover:bg-violet-500/10 hover:text-violet-200"
                title="Refine trajectory"
              >
                <Sparkles className="h-3 w-3" />
                <span className={variant === 'featured' ? '' : 'sr-only'}>Refine</span>
              </Button>
            )}

            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onEdit();
                }}
                className="relative z-10 h-8 w-8 rounded-full p-0 text-muted-foreground hover:text-foreground"
                title="Edit goal"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDelete();
                }}
                className="relative z-10 h-8 w-8 rounded-full p-0 text-muted-foreground/60 hover:text-destructive"
                title="Delete goal"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {variant === 'featured' ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/88">
              Open path <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          ) : (
            <MoreHorizontal className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );
}
