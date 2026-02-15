import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReadingStats } from "../readingTypes";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export function ReadingNowCard({ stats }: { stats: ReadingStats }) {
    return (
        <Card className="border-rose-200/60 dark:border:rose-900/60">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="text-ws font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                            Now reading
                        </div>
                        <CardTitle className="mt-1 text-base leading-tight">
                            {stats.current.title}
                        </CardTitle>
                        <div className="mt-1 text-sm text-muted-foreground">
                            {stats.current.author}
                        </div>
                    </div>

                    <div className="shrink-0 text-right">
                        <div className="text-2xl font-semibold text-rose-600 dark:text-rose-400">
                            {stats.pct}%
                        </div>
                        <div className="text-xs text-muted-foreground">done</div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Page {stats.current.currentPage}</span>
                    <span>~{stats.current.totalPages} pages total</span>
                </div>

                <Progress value={stats.pct} className="h-2" />

                <Separator />

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm text-muted-foreground">
                        At <span className="font-medium text-foreground">{stats.dailyGoalPages}</span> pages
                        <span className="font-medium text-foreground">{stats.pagesLeft}</span> pages
                    </div>

                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                        ~{stats.daysToFinishCurrent} days
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}