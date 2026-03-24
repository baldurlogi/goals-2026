import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  buildRoutineItemsForDay,
  completeRoutineStreakDay,
  countCompletedRoutineSteps,
  countRoutineSteps,
  createRoutineStep,
  getDailyRoutine, setDailyRoutine,
  getRoutineItems, setRoutineItems, seedRoutineItems,
  getRoutineStreak,
  getRoutineTemplate, setRoutineTemplate, seedRoutineTemplate,
  isRoutineSectionComplete,
  normalizeRoutineItems,
  sanitizeRoutineStepLabel,
  setRoutineStreak,
  syncDailyRoutineWithItems,
  todayISO,
  type DailyRoutineState,
  type RoutineItemsState,
  type RoutineSection,
  type RoutineTemplateState,
} from "../skincareStorage";

function SectionTitle({ title }: { title: string }) {
  return <div className="text-sm font-medium">{title}</div>;
}

export function RoutineChecklistCard({ goalId }: { goalId: string }) {
  const seededRoutine = seedRoutineTemplate(goalId);
  const seededItems = seedRoutineItems(goalId, seededRoutine);

  const [routine, setRoutine] = useState<RoutineTemplateState>(() => seededRoutine);
  const [items, setItems] = useState<RoutineItemsState>(() => seededItems);
  const [daily, setDaily] = useState<DailyRoutineState>(() =>
    syncDailyRoutineWithItems(seededRoutine, seededItems),
  );
  const [newStepLabels, setNewStepLabels] = useState<Record<RoutineSection, string>>({
    am: "",
    pm: "",
  });

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      const nextRoutine = await getRoutineTemplate(goalId);
      const [storedDaily, nextItems] = await Promise.all([
        getDailyRoutine(goalId),
        getRoutineItems(goalId, nextRoutine),
      ]);

      if (cancelled) return;

      const syncedDaily = syncDailyRoutineWithItems(nextRoutine, nextItems);
      setRoutine(nextRoutine);
      setItems(nextItems);
      setDaily(syncedDaily);

      if (
        storedDaily.dayISO !== syncedDaily.dayISO ||
        storedDaily.amDone !== syncedDaily.amDone ||
        storedDaily.pmDone !== syncedDaily.pmDone
      ) {
        void setDailyRoutine(goalId, syncedDaily);
      }

      if (syncedDaily.dayISO === todayISO() && syncedDaily.amDone && syncedDaily.pmDone) {
        const currentStreak = await getRoutineStreak(goalId);
        const nextStreak = completeRoutineStreakDay(currentStreak, syncedDaily.dayISO);
        if (
          nextStreak.lastISO !== currentStreak.lastISO ||
          nextStreak.streak !== currentStreak.streak
        ) {
          void setRoutineStreak(goalId, nextStreak);
        }
      }
    }

    void fetch();
    return () => { cancelled = true; };
  }, [goalId]);

  async function syncStreakForDailyState(nextDaily: DailyRoutineState) {
    if (nextDaily.dayISO !== todayISO() || !nextDaily.amDone || !nextDaily.pmDone) {
      return;
    }

    const currentStreak = await getRoutineStreak(goalId);
    const nextStreak = completeRoutineStreakDay(currentStreak, nextDaily.dayISO);
    if (
      nextStreak.lastISO === currentStreak.lastISO &&
      nextStreak.streak === currentStreak.streak
    ) {
      return;
    }

    await setRoutineStreak(goalId, nextStreak);
  }

  async function persistItems(nextItems: RoutineItemsState) {
    const nextDaily = syncDailyRoutineWithItems(routine, nextItems);
    setItems(nextItems);
    setDaily(nextDaily);
    await Promise.all([
      setRoutineItems(goalId, nextItems),
      setDailyRoutine(goalId, nextDaily),
    ]);
    await syncStreakForDailyState(nextDaily);
  }

  async function persistRoutine(nextRoutine: RoutineTemplateState) {
    const nextItems = normalizeRoutineItems(items, nextRoutine);
    const nextDaily = syncDailyRoutineWithItems(nextRoutine, nextItems);

    setRoutine(nextRoutine);
    setItems(nextItems);
    setDaily(nextDaily);

    await Promise.all([
      setRoutineTemplate(goalId, nextRoutine),
      setRoutineItems(goalId, nextItems),
      setDailyRoutine(goalId, nextDaily),
    ]);
  }

  async function toggleItem(kind: RoutineSection, stepId: string) {
    const nextItems: RoutineItemsState = {
      ...items,
      items: {
        ...items.items,
        [kind]: {
          ...items.items[kind],
          [stepId]: !items.items[kind][stepId],
        },
      },
    };
    await persistItems(nextItems);
  }

  async function toggleSectionDone(kind: RoutineSection) {
    const target = !isRoutineSectionComplete(kind, routine, items);
    const nextItems: RoutineItemsState = {
      ...items,
      items: {
        ...items.items,
        [kind]: Object.fromEntries(
          routine[kind].map((step) => [step.id, target]),
        ),
      },
    };
    await persistItems(nextItems);
  }

  function updateStepLabel(kind: RoutineSection, stepId: string, label: string) {
    setRoutine((current) => ({
      ...current,
      [kind]: current[kind].map((step) =>
        step.id === stepId ? { ...step, label } : step,
      ),
    }));
  }

  async function commitStepLabel(
    kind: RoutineSection,
    stepId: string,
    rawLabel: string,
  ) {
    const currentStep = routine[kind].find((step) => step.id === stepId);
    if (!currentStep) return;

    const label = sanitizeRoutineStepLabel(rawLabel) || currentStep.label;
    const nextRoutine: RoutineTemplateState = {
      ...routine,
      [kind]: routine[kind].map((step) =>
        step.id === stepId ? { ...step, label } : step,
      ),
    };
    await persistRoutine(nextRoutine);
  }

  async function addStep(kind: RoutineSection) {
    const label = sanitizeRoutineStepLabel(newStepLabels[kind]);
    if (!label) return;

    const nextRoutine: RoutineTemplateState = {
      ...routine,
      [kind]: [...routine[kind], createRoutineStep(label)],
    };
    setNewStepLabels((current) => ({ ...current, [kind]: "" }));
    await persistRoutine(nextRoutine);
  }

  async function removeStep(kind: RoutineSection, stepId: string) {
    const nextRoutine: RoutineTemplateState = {
      ...routine,
      [kind]: routine[kind].filter((step) => step.id !== stepId),
    };
    await persistRoutine(nextRoutine);
  }

  async function resetToday() {
    const freshItems = buildRoutineItemsForDay(todayISO(), routine);
    const freshDaily = syncDailyRoutineWithItems(routine, freshItems);
    setDaily(freshDaily);
    setItems(freshItems);
    await Promise.all([
      setDailyRoutine(goalId, freshDaily),
      setRoutineItems(goalId, freshItems),
    ]);
  }

  const doneCount = countCompletedRoutineSteps(routine, items);
  const totalSteps = countRoutineSteps(routine);

  function renderRoutineEditor(kind: RoutineSection) {
    return (
      <div className="space-y-2">
        {routine[kind].length === 0 ? (
          <div className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
            No {kind.toUpperCase()} steps yet. Add your first one below.
          </div>
        ) : (
          routine[kind].map((step) => (
            <div key={step.id} className="flex items-center gap-2">
              <Input
                value={step.label}
                onChange={(event) =>
                  updateStepLabel(kind, step.id, event.target.value)
                }
                onBlur={(event) =>
                  void commitStepLabel(kind, step.id, event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
                placeholder={`${kind.toUpperCase()} step`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => void removeStep(kind, step.id)}
                aria-label={`Remove ${step.label}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}

        <div className="flex items-center gap-2">
          <Input
            value={newStepLabels[kind]}
            onChange={(event) =>
              setNewStepLabels((current) => ({
                ...current,
                [kind]: event.target.value,
              }))
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void addStep(kind);
              }
            }}
            placeholder={`Add ${kind.toUpperCase()} step`}
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={() => void addStep(kind)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="rounded-xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">🧴 Routine (today)</CardTitle>
          <Badge variant="secondary">{doneCount}/{totalSteps}</Badge>
        </div>
        <div className="text-xs text-muted-foreground">{daily.dayISO}</div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <SectionTitle title="AM" />
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">AM routine done</div>
            <Checkbox
              checked={daily.amDone}
              onCheckedChange={() => void toggleSectionDone("am")}
            />
          </div>
          <div className="space-y-2">
            {routine.am.map((step) => (
              <div key={step.id} className="flex items-center justify-between">
                <div className="text-sm">{step.label}</div>
                <Checkbox
                  checked={items.items.am[step.id]}
                  onCheckedChange={() => void toggleItem("am", step.id)}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <SectionTitle title="PM" />
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">PM routine done</div>
            <Checkbox
              checked={daily.pmDone}
              onCheckedChange={() => void toggleSectionDone("pm")}
            />
          </div>
          <div className="space-y-2">
            {routine.pm.map((step) => (
              <div key={step.id} className="flex items-center justify-between">
                <div className="text-sm">{step.label}</div>
                <Checkbox
                  checked={items.items.pm[step.id]}
                  onCheckedChange={() => void toggleItem("pm", step.id)}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <SectionTitle title="Routine setup" />
          <div className="space-y-4 rounded-xl border bg-card/30 p-4">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                AM steps
              </div>
              {renderRoutineEditor("am")}
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                PM steps
              </div>
              {renderRoutineEditor("pm")}
            </div>
          </div>
        </div>

        <Separator />

        <Button variant="ghost" className="w-full" onClick={resetToday}>
          Reset today
        </Button>
      </CardContent>
    </Card>
  );
}
