import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { getUniversityState, setUniversityState, type UniApp } from "../universityStorage";

const STATUSES: UniApp["status"][] = [
  "Researching",
  "Shortlisted",
  "Applying",
  "Submitted",
  "Rejected",
  "Accepted",
];

export function ApplicationsCard({ goalId }: { goalId: string }) {
  const [tick, setTick] = useState(0);

  const state = useMemo(() => {
    void tick;
    return getUniversityState(goalId);
  }, [goalId, tick]);

  function patchApps(apps: UniApp[]) {
    setUniversityState(goalId, { ...getUniversityState(goalId), apps });
    setTick((x) => x + 1);
  }

  function add() {
    const id = `app-${Date.now()}`;
    patchApps([
      ...state.apps,
      { id, school: "New school", program: "MS (TBD)", status: "Researching" },
    ]);
  }

  function update(id: string, p: Partial<UniApp>) {
    patchApps(state.apps.map((a) => (a.id === id ? { ...a, ...p } : a)));
  }

  function remove(id: string) {
    patchApps(state.apps.filter((a) => a.id !== id));
  }

  const submitted = state.apps.filter((a) => a.status === "Submitted").length;

  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">🎓 Applications</CardTitle>
          <Badge variant="secondary">{submitted}/{state.apps.length} submitted</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {state.apps.map((a) => (
          <div key={a.id} className="space-y-2 rounded-xl border p-3">
            <div className="grid grid-cols-2 gap-2">
              <Input value={a.school} onChange={(e) => update(a.id, { school: e.target.value })} />
              <Input value={a.program} onChange={(e) => update(a.id, { program: e.target.value })} />
            </div>

            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={a.status === s ? "default" : "outline"}
                  onClick={() => update(a.id, { status: s })}
                >
                  {s}
                </Button>
              ))}
            </div>

            <Button variant="ghost" size="sm" onClick={() => remove(a.id)}>
              Remove
            </Button>
          </div>
        ))}

        <Separator />
        <Button className="w-full" onClick={add}>
          Add application
        </Button>
      </CardContent>
    </Card>
  );
}
