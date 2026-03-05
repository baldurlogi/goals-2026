import { useEffect, useRef, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  createBlankGoal,
  createBlankStep,
  saveUserGoal,
} from "../userGoalStorage";
import type { UserGoal, UserGoalStep } from "../goalTypes";

const PRIORITY_OPTIONS: UserGoal["priority"][] = ["high", "medium", "low"];
const PRIORITY_COLOR: Record<UserGoal["priority"], string> = {
  high:   "border-rose-500/40 bg-rose-500/10 text-rose-400",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  low:    "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
};

const EMOJI_SUGGESTIONS = ["🎯","💪","📚","💰","🏃","✈️","💻","🎬","🎓","🌱","🏋️","🎨","🚀","❤️","🧘"];

type Props = {
  initial?: UserGoal;          // if provided → edit mode
  onSave: (goal: UserGoal) => void;
  onClose: () => void;
};

export function AddEditGoalModal({ initial, onSave, onClose }: Props) {
  const [goal, setGoal] = useState<UserGoal>(() => initial ?? createBlankGoal());
  const [saving, setSaving] = useState(false);
  const [openStepId, setOpenStepId] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  function updateGoal(patch: Partial<UserGoal>) {
    setGoal((g) => ({ ...g, ...patch, updatedAt: new Date().toISOString() }));
  }

  function addStep() {
    const step = createBlankStep(goal.steps.length);
    const steps = [...goal.steps, step];
    updateGoal({ steps });
    setOpenStepId(step.id);
  }

  function updateStep(id: string, patch: Partial<UserGoalStep>) {
    updateGoal({
      steps: goal.steps.map((s) => s.id === id ? { ...s, ...patch } : s),
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
    setSaving(true);
    try {
      await saveUserGoal({ ...goal, title: goal.title.trim(), subtitle: goal.subtitle.trim() });
      onSave(goal);
    } finally {
      setSaving(false);
    }
  }

  const isValid = goal.title.trim().length > 0;

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-0 sm:px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full sm:max-w-2xl max-h-[92dvh] flex flex-col rounded-t-2xl sm:rounded-2xl border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="text-base font-semibold">
            {initial ? "Edit goal" : "New goal"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

          {/* Emoji + Title row */}
          <div className="flex items-start gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setEmojiPickerOpen((o) => !o)}
                className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl border hover:bg-muted transition-colors"
              >
                {goal.emoji}
              </button>
              {emojiPickerOpen && (
                <div className="absolute top-14 left-0 z-10 flex flex-wrap gap-1.5 p-3 rounded-xl border bg-popover shadow-xl w-56">
                  {EMOJI_SUGGESTIONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => { updateGoal({ emoji: e }); setEmojiPickerOpen(false); }}
                      className="text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <Input
                ref={titleRef}
                placeholder="Goal title *"
                value={goal.title}
                onChange={(e) => updateGoal({ title: e.target.value })}
                className="text-base font-medium"
              />
              <Input
                placeholder="Short description (optional)"
                value={goal.subtitle}
                onChange={(e) => updateGoal({ subtitle: e.target.value })}
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <div className="text-xs text-muted-foreground font-medium">Priority</div>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateGoal({ priority: p })}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-semibold capitalize transition-all",
                    goal.priority === p
                      ? PRIORITY_COLOR[p]
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground font-medium">
                Steps ({goal.steps.length})
              </div>
              <Button variant="ghost" size="sm" onClick={addStep} className="gap-1 h-7 text-xs">
                <Plus className="h-3 w-3" /> Add step
              </Button>
            </div>

            {goal.steps.length === 0 && (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No steps yet — add some to track progress
              </div>
            )}

            <div className="space-y-2">
              {goal.steps.map((step, idx) => {
                const isOpen = openStepId === step.id;
                return (
                  <div key={step.id} className="rounded-xl border bg-muted/20">
                    {/* Step header row */}
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveStep(step.id, -1)}
                          disabled={idx === 0}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none text-xs"
                        >▲</button>
                        <button
                          type="button"
                          onClick={() => moveStep(step.id, 1)}
                          disabled={idx === goal.steps.length - 1}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none text-xs"
                        >▼</button>
                      </div>

                      <span className="text-xs text-muted-foreground w-5 text-center shrink-0">
                        {idx + 1}
                      </span>

                      <Input
                        placeholder="Step label *"
                        value={step.label}
                        onChange={(e) => updateStep(step.id, { label: e.target.value })}
                        className="flex-1 h-8 text-sm"
                        onClick={() => setOpenStepId(isOpen ? null : step.id)}
                      />

                      <button
                        type="button"
                        onClick={() => setOpenStepId(isOpen ? null : step.id)}
                        className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                      >
                        {isOpen ? "▲" : "▼"}
                      </button>

                      <button
                        type="button"
                        onClick={() => removeStep(step.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Step details (expanded) */}
                    {isOpen && (
                      <div className="px-3 pb-3 space-y-2 border-t pt-3">
                        <Textarea
                          placeholder="Notes (optional)"
                          value={step.notes}
                          onChange={(e) => updateStep(step.id, { notes: e.target.value })}
                          rows={2}
                          className="text-sm resize-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Due date</div>
                            <Input
                              type="date"
                              value={step.idealFinish ?? ""}
                              onChange={(e) =>
                                updateStep(step.id, { idealFinish: e.target.value || null })
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Est. time</div>
                            <Input
                              placeholder="e.g. 30 min"
                              value={step.estimatedTime}
                              onChange={(e) =>
                                updateStep(step.id, { estimatedTime: e.target.value })
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
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t shrink-0">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!isValid || saving} className="min-w-28">
            {saving ? "Saving…" : initial ? "Save changes" : "Create goal"}
          </Button>
        </div>
      </div>
    </div>
  );
}