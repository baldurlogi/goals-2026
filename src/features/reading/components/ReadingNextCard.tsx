import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReadingStats } from "../readingTypes";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export function ReadingNextCard({ stats }: { stats: ReadingStats }) {
    if (!stats.next) return null;

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                    Up next
                </div>
                <CardTitle className="mt-1 text-base leading-tight">
                    {stats.next.title}
                </CardTitle>
                <div className="mt-1 text-sm text-muted-foreground">
                    {stats.next.author} · ~{stats.next.totalPages} pages
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                <Separator />

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm text-muted-foreground">
                        Starts in ~<span className="font-medium text-foreground">{stats.daysToFinishCurrent}</span>
                    </div>

                    {typeof stats.daysToFinishNext === "number" ? (
                        <Badge variant="secondary">~{stats.daysToFinishNext} days to finish</Badge>
                    ) : (
                        <Badge variant="secondary">Set next pages</Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}