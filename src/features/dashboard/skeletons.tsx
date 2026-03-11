import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Base primitive ────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted", className)} />
  );
}

// ── Reusable card shell ───────────────────────────────────────────────────

function SkeletonCard({
  colSpan,
  accentColor,
  className,
  children,
}: {
  colSpan?: string;
  accentColor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("relative overflow-hidden", colSpan, className)}>
      {accentColor && (
        <div className={cn("absolute inset-x-0 top-0 h-0.5", accentColor)} />
      )}
      {children}
    </Card>
  );
}

// ── Dashboard card skeletons ──────────────────────────────────────────────

export function ReadingCardSkeleton() {
  return (
    <SkeletonCard
      colSpan="lg:col-span-5"
      accentColor="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500"
    >
      <CardHeader className="space-y-2 pb-2 pt-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3 pb-5">
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
      </CardContent>
    </SkeletonCard>
  );
}

export function MacrosCardSkeleton() {
  return (
    <SkeletonCard
      colSpan="lg:col-span-7"
      accentColor="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400"
    >
      <CardHeader className="space-y-2 pb-2 pt-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3 pb-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </CardContent>
    </SkeletonCard>
  );
}

export function ScheduleCardSkeleton() {
  return (
    <SkeletonCard
      colSpan="lg:col-span-7"
      className="min-h-[320px]"
      accentColor="bg-gradient-to-r from-violet-500 via-purple-400 to-fuchsia-400"
    >
      <CardHeader className="space-y-2 pb-2 pt-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-14 rounded-full" />
        </div>

        <Skeleton className="h-4 w-2/3" />

        <div className="mt-3 space-y-1">
          <Skeleton className="h-1.5 w-full rounded-full" />
          <div className="flex justify-end">
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pb-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3 w-10 shrink-0" />
            <Skeleton className="h-8 flex-1 rounded-lg" />
          </div>
        ))}

        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-24 rounded-md" />
        </div>
      </CardContent>
    </SkeletonCard>
  );
}

export function UpcomingGoalsCardSkeleton() {
  return (
    <SkeletonCard
      colSpan="lg:col-span-5"
      accentColor="bg-gradient-to-r from-rose-500 via-pink-400 to-orange-400"
    >
      <CardHeader className="space-y-2 pb-2 pt-5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent className="space-y-3 pb-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3 py-1.5">
            <Skeleton className="h-5 w-5 shrink-0 rounded" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
          </div>
        ))}
      </CardContent>
    </SkeletonCard>
  );
}

export function SpendingCardSkeleton() {
  return (
    <SkeletonCard
      colSpan="lg:col-span-5"
      accentColor="bg-gradient-to-r from-violet-500 via-purple-400 to-fuchsia-400"
    >
      <CardHeader className="space-y-2 pb-2 pt-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3 pb-5">
        <div className="flex items-center justify-center">
          <Skeleton className="h-32 w-32 rounded-full" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </SkeletonCard>
  );
}

export function TodoCardSkeleton() {
  return (
    <SkeletonCard
      colSpan="lg:col-span-3"
      accentColor="bg-gradient-to-r from-sky-500 via-blue-400 to-indigo-400"
    >
      <CardHeader className="space-y-2 pb-2 pt-5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-2 pb-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 shrink-0 rounded" />
            <Skeleton className="h-3.5 flex-1" />
          </div>
        ))}
        <div className="flex items-center gap-1.5 pt-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </CardContent>
    </SkeletonCard>
  );
}

export function FitnessCardSkeleton() {
  return (
    <SkeletonCard
      colSpan="lg:col-span-4"
      accentColor="bg-gradient-to-r from-violet-500 via-purple-400 to-fuchsia-400"
    >
      <CardHeader className="space-y-2 pb-2 pt-5">
        <Skeleton className="h-3 w-20" />
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </CardContent>
    </SkeletonCard>
  );
}

// ── Goals page skeletons ──────────────────────────────────────────────────

export function GoalCardSkeleton() {
  return (
    <div className="animate-pulse space-y-4 rounded-2xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="space-y-1 text-right">
          <Skeleton className="ml-auto h-4 w-10" />
          <Skeleton className="ml-auto h-3 w-8" />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      <div className="flex justify-end">
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </div>
  );
}

export function GoalsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-72" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <GoalCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ── Generic widget skeleton ───────────────────────────────────────────────

export function WidgetCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}