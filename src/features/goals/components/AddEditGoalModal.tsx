import { useEffect, useRef, useState } from "react";
import { Trash2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createBlankGoal, createBlankStep, saveUserGoal } from "../userGoalStorage";
import type { UserGoal, UserGoalStep } from "../goalTypes";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import { AIPromptScreen } from "./AIPromptScreen";
import { queueAIContextNudge } from "./AIContextNudge";

const PRIORITY_OPTIONS: UserGoal["priority"][] = ["high", "medium", "low"];

const PRIORITY_COLOR: Record<UserGoal["priority"], string> = {
  high: "border-rose-500/40 bg-rose-500/10 text-rose-400",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  low: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
};

const EMOJI_SUGGESTIONS = [
  "🎯",
  "💪",
  "📚",
  "💰",
  "🏃",
  "✈️",
  "💻",
  "🎬",
  "🎓",
  "🌱",
  "🏋️",
  "🎨",
  "🚀",
  "❤️",
  "🧘",
  "🧴",
  "🧠",
  "💼",
];

type Mode = "ai" | "manual";

type Props = {
  initial?: UserGoal;
  onSave: (goal: UserGoal) => void;
  onClose: () => void;
  startWithAI?: boolean;
  initialAIPrompt?: string;
};

export function AddEditGoalModal({
  initial,
  onSave,
  onClose,
  startWithAI = false,
  initialAIPrompt = "",
}: Props) {
  const isEdit = !!initial;
  const [mode, setMode] = useState<Mode>(
    isEdit ? "manual" : startWithAI ? "ai" : "manual",
  );
  const [goal, setGoal] = useState<UserGoal>(() => initial ?? createBlankGoal());
  const [saving, setSaving] = useState(false);
  const [openStepId, setOpenStepId] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "manual") titleRef.current?.focus();
  }, [mode]);

  function updateGoal(patch: Partial<UserGoal>) {
    setGoal((g) => ({ ...g, ...patch, updatedAt: getLocalDateKey() }));
  }

  function handleAIGenerated(generated: UserGoal) {
    setGoal(generated);
    setMode("manual");
  }

  function addStep() {
    const step = createBlankStep(goal.steps.length);
    updateGoal({ steps: [...goal.steps, step] });
    setOpenStepId(step.id);
  }

  function updateStep(id: string, patch: Partial<UserGoalStep>) {
    updateGoal({
      steps: goal.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  }

  function removeStep(id: string) {
    updateGoal({ steps: goal.steps.filter((s) => s.id !== id) });
    if (openStepId === id) setOpenStepId(null);
  }

  function moveStep(id: string, dir: -1 | 1) {
    const steps = [...goal.steps];
    const idx = steps.findIndex((s) => s.id === id);
    const next = idx + dir;
    if (next < 0 || next >= steps.length) return;

    [steps[idx], steps[next]] = [steps[next], steps[idx]];
    updateGoal({ steps: steps.map((s, i) => ({ ...s, sortOrder: i })) });
  }

  async function handleSave() {
    if (!goal.title.trim()) return;

    const trimmedGoal: UserGoal = {
      ...goal,
      title: goal.title.trim(),
      subtitle: goal.subtitle.trim(),
      steps: goal.steps.map((step) => ({
        ...step,
        label: step.label.trim(),
        notes: step.notes.trim(),
        estimatedTime: step.estimatedTime.trim(),
      })),
    };

    setSaving(true);

    try {
      await saveUserGoal(trimmedGoal);

      if (!isEdit) {
        queueAIContextNudge();
      }

      toast.success(isEdit ? "Goal updated" : "Goal created ✨");
      onSave(trimmedGoal);
    } catch {
      toast.error("Couldn't save goal. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const isValid = goal.title.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-0 sm:items-center sm:px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border bg-card shadow-2xl sm:max-w-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold">
                {isEdit ? "Edit goal" : mode === "ai" ? "AI goal planner" : "New goal"}
              </h2>

              {mode === "manual" && goal.title && !isEdit && goal.steps.length > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <Sparkles className="h-2.5 w-2.5" />
                  AI generated · review & edit
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isEdit && (
                <button
                  type="button"
                  onClick={() => setMode((m) => (m === "ai" ? "manual" : "ai"))}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    mode === "ai"
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Sparkles className="h-3 w-3" />
                  {mode === "ai" ? "AI mode" : "Use AI"}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="text-xl leading-none text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {mode === "ai" && (
          <AIPromptScreen
            onGenerated={handleAIGenerated}
            onBack={() => setMode("manual")}
            initialPrompt={initialAIPrompt}
            autoStart={Boolean(initialAIPrompt.trim())}
          />
        )}

        {mode === "manual" && (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setEmojiPickerOpen((o) => !o)}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border text-3xl transition-colors hover:bg-muted"
                  >
                    {goal.emoji}
                  </button>

                  {emojiPickerOpen && (
                    <div className="absolute left-0 top-14 z-10 flex w-56 flex-wrap gap-1.5 rounded-xl border bg-popover p-3 shadow-xl">
                      {EMOJI_SUGGESTIONS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => {
                            updateGoal({ emoji: e });
                            setEmojiPickerOpen(false);
                          }}
                          className="rounded-md p-1.5 text-lg hover:bg-muted"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <Input
                    ref={titleRef}
                    value={goal.title}
                    onChange={(e) => updateGoal({ title: e.target.value })}
                    placeholder="Goal title"
                    className="text-base"
                  />
                  <Textarea
                    value={goal.subtitle}
                    onChange={(e) => updateGoal({ subtitle: e.target.value })}
                    placeholder="Optional subtitle"
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateGoal({ priority: p })}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
                      goal.priority === p
                        ? PRIORITY_COLOR[p]
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Steps</div>
                  <Button type="button" size="sm" variant="outline" onClick={addStep}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add step
                  </Button>
                </div>

                <div className="space-y-2">
                  {goal.steps.map((step, idx) => {
                    const isOpen = openStepId === step.id;

                    return (
                      <div key={step.id} className="overflow-hidden rounded-xl border">
                        <div className="flex items-center gap-3 px-3 py-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                            {idx + 1}
                          </div>

                          <Input
                            value={step.label}
                            onChange={(e) =>
                              updateStep(step.id, { label: e.target.value })
                            }
                            placeholder="Step label"
                            className="h-9 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                          />

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveStep(step.id, -1)}
                              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              ▲
                            </button>

                            <button
                              type="button"
                              onClick={() => moveStep(step.id, 1)}
                              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              ▼
                            </button>

                            <button
                              type="button"
                              onClick={() => removeStep(step.id)}
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setOpenStepId(isOpen ? null : step.id)}
                              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              {isOpen ? "−" : "+"}
                            </button>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="space-y-2 border-t px-3 pb-3 pt-3">
                            <Textarea
                              placeholder="Notes (optional)"
                              value={step.notes}
                              onChange={(e) =>
                                updateStep(step.id, { notes: e.target.value })
                              }
                              rows={2}
                              className="resize-none text-sm"
                            />

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">
                                  Due date
                                </div>
                                <Input
                                  type="date"
                                  value={step.idealFinish ?? ""}
                                  onChange={(e) =>
                                    updateStep(step.id, {
                                      idealFinish: e.target.value || null,
                                    })
                                  }
                                  className="h-8 text-sm"
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">
                                  Est. time
                                </div>
                                <Input
                                  placeholder="e.g. 30 min"
                                  value={step.estimatedTime}
                                  onChange={(e) =>
                                    updateStep(step.id, {
                                      estimatedTime: e.target.value,
                                    })
                                  }
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {goal.steps.length === 0 && (
                    <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                      No steps yet. Add them manually or switch to AI mode.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={!isValid || saving}
                >
                  {saving ? "Saving…" : isEdit ? "Save changes" : "Create goal"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}