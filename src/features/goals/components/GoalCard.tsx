import { Link } from 'react-router-dom';
import { Pencil, Trash2, Sparkles } from 'lucide-react';
import type { UserGoal } from '../goalTypes';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { getLocalDateKey } from '@/hooks/useTodayDate';


const PRIORITY_COLOR: Record<string, string> = {
  high: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

type Props = {
  goal: UserGoal;
  doneMap?: Record<string, boolean>;
  overdueCount?: number;
  isCompleted?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onImprove?: () => void;
};

export function GoalCard({
  goal,
  doneMap = {},
  overdueCount = 0,
  isCompleted = false,
  onEdit,
  onDelete,
  onImprove,
}: Props) {
  const total = goal.steps.length;
  const doneCount = goal.steps.filter((s) => doneMap[s.id]).length;
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  // Count overdue steps
  const today = getLocalDateKey();
  const overdueSteps = goal.steps.filter(
    (s) => s.idealFinish && s.idealFinish < today && !doneMap[s.id],
  ).length;
  const displayOverdue = overdueCount || overdueSteps;
  const cardClassName = isCompleted
    ? 'border-emerald-500/30 bg-linear-to-br from-emerald-500/10 via-card to-emerald-400/5 shadow-[0_18px_45px_-28px_rgba(16,185,129,0.45)]'
    : 'border bg-card shadow-sm';

  return (
    <div className={`rounded-2xl p-5 space-y-4 ${cardClassName}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">{goal.emoji}</span>
            <h3 className="text-base font-semibold">{goal.title}</h3>

            <span
              className={[
                'rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
                PRIORITY_COLOR[goal.priority] ?? PRIORITY_COLOR.low,
              ].join(' ')}
            >
              {goal.priority}
            </span>

            {isCompleted && (
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                completed
              </span>
            )}

            {!isCompleted && displayOverdue > 0 && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                {displayOverdue} overdue
              </span>
            )}
          </div>

          {goal.subtitle && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {goal.subtitle}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <div className="text-sm font-semibold tabular-nums">
            {doneCount}/{total}
          </div>
          <div className="text-xs text-muted-foreground">steps</div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span className="tabular-nums">{pct}%</span>
        </div>
        <Progress
          value={pct}
          className={isCompleted ? 'h-2 bg-emerald-500/10' : 'h-2'}
          indicatorClassName={isCompleted ? 'bg-emerald-500' : undefined}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {onImprove && goal.steps.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onImprove}
              className="h-8 gap-1.5 px-2 text-xs text-violet-400 hover:bg-violet-500/10 hover:text-violet-400"
              title="Improve with AI"
            >
              <Sparkles className="h-3 w-3" /> Improve with AI
            </Button>
          )}
        </div>

        <Button asChild variant="secondary" size="sm" className="w-full sm:w-auto">
          <Link to={`/app/goals/${goal.id}`}>View details</Link>
        </Button>
      </div>
    </div>
  );
}
