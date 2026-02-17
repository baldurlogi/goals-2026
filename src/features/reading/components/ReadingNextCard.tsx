import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ReadingNextCard(props: {
  queue: Array<{ title: string; author: string; totalPages: string }>;
  onRemove: (index: number) => void;
}) {
  const { queue, onRemove } = props;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          Up next
        </div>
        <CardTitle className="mt-1 text-base leading-tight">
          {queue.length ? `${queue.length} book${queue.length === 1 ? "" : "s"} queued` : "No books queued"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <Separator />

        {queue.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Add books to your queue and they’ll auto-promote when you finish your current book.
          </div>
        ) : (
          <div className="space-y-2">
            {queue.map((b, idx) => (
              <div key={`${b.title}-${idx}`} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {idx === 0 ? (
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Next</Badge>
                    ) : (
                      <Badge variant="secondary">#{idx + 1}</Badge>
                    )}
                    <div className="font-medium truncate">{b.title || "Untitled"}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {b.author || "Unknown author"} · {b.totalPages || "?"} pages
                  </div>
                </div>

                <Button variant="outline" size="sm" onClick={() => onRemove(idx)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}