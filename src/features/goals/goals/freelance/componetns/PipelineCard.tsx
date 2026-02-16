import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { getPipeline, setPipeline } from "../freelanceStorage";

function StatRow({
  label,
  value,
  onInc,
  onDec,
}: {
  label: string;
  value: number;
  onInc: () => void;
  onDec: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onDec} disabled={value <= 0}>
          –
        </Button>
        <div className="w-10 text-center font-medium">{value}</div>
        <Button variant="outline" size="sm" onClick={onInc}>
          +
        </Button>
      </div>
    </div>
  );
}

export function PipelineCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    return getPipeline(goalId);
  }, [goalId, tick]);

  function patch(p: Partial<typeof state>) {
    const next = { ...getPipeline(goalId), ...p };
    setPipeline(goalId, next);
    setTick((x) => x + 1);
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">📨 Pipeline (this week)</CardTitle>
          <Badge variant="secondary">{state.weekLabel}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <StatRow
          label="Proposals sent"
          value={state.proposalsSent}
          onInc={() => patch({ proposalsSent: state.proposalsSent + 1 })}
          onDec={() => patch({ proposalsSent: Math.max(0, state.proposalsSent - 1) })}
        />
        <StatRow
          label="Replies"
          value={state.replies}
          onInc={() => patch({ replies: state.replies + 1 })}
          onDec={() => patch({ replies: Math.max(0, state.replies - 1) })}
        />
        <StatRow
          label="Calls booked"
          value={state.callsBooked}
          onInc={() => patch({ callsBooked: state.callsBooked + 1 })}
          onDec={() => patch({ callsBooked: Math.max(0, state.callsBooked - 1) })}
        />
        <StatRow
          label="Clients won"
          value={state.clientsWon}
          onInc={() => patch({ clientsWon: state.clientsWon + 1 })}
          onDec={() => patch({ clientsWon: Math.max(0, state.clientsWon - 1) })}
        />

        <Separator />

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => patch({ proposalsSent: 0, replies: 0, callsBooked: 0, clientsWon: 0 })}
        >
          Reset week
        </Button>
      </CardContent>
    </Card>
  );
}
