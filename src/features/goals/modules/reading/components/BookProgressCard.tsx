import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { getBookProgress, setBookProgress } from "../readingStorage";

function toNum(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function BookProgressCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    return getBookProgress(goalId);
  }, [goalId, tick]);

  const pct =
    state.totalPages <= 0 ? 0 : Math.min(100, Math.round((state.currentPage / state.totalPages) * 100));

  function patch(p: Partial<typeof state>) {
    const cur = getBookProgress(goalId);
    const next = { ...cur, ...p };
    // keep currentPage bounded
    next.currentPage = Math.max(0, Math.min(next.totalPages, next.currentPage));
    setBookProgress(goalId, next);
    setTick((x) => x + 1);
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">📚 Current book</CardTitle>
          <Badge variant="secondary">{pct}%</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            value={state.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="Book title"
          />
          <Input
            value={state.author}
            onChange={(e) => patch({ author: e.target.value })}
            placeholder="Author (optional)"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Total pages</div>
            <Input
              inputMode="numeric"
              value={String(state.totalPages)}
              onChange={(e) => patch({ totalPages: Math.max(1, toNum(e.target.value, 300)) })}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Current page</div>
            <Input
              inputMode="numeric"
              value={String(state.currentPage)}
              onChange={(e) => patch({ currentPage: toNum(e.target.value, 0) })}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {state.currentPage} / {state.totalPages} pages
            </span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="mt-2 h-2" />
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => patch({ currentPage: state.currentPage - 10 })}>
            –10
          </Button>
          <Button className="flex-1" onClick={() => patch({ currentPage: state.currentPage + 10 })}>
            +10
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
