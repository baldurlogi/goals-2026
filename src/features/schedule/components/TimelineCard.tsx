import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TimelineItem } from "../scheduleTypes";
import { cn } from "@/lib/utils";

export function TimelineCard(props: {
    item: TimelineItem;
    accentClass: string;
    colorClass: string;
}) {
    const { item, accentClass, colorClass } = props;

    return (
        <div className="relative grid grid-cols-[72px_1fr] gap-3">
            {/* Left timeline column */}
            <div className="relative flex flex-col items-center">
                <div className="text-xs font-semibold text-muted-foreground text-center leading-tight">
                    {item.time}
                </div>
                <div className="mt-2 h-full w-px bg-border" />
            </div>

            {/* Card */}
            <Card className={cn("mb-3 border", accentClass)}>
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-base">{item.icon}</span>
                                <div className="truncate text-sm font-semibold">{item.label}</div>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {item.detail}
                            </p>
                        </div>

                        {item.tag ? (
                            <Badge variant="secondary" className={cn("shrink-0", colorClass)}>
                                {item.tag}
                            </Badge>
                        ) : null}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}