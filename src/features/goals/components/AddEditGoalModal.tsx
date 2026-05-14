import { useEffect, useRef, useState } from "react";
import { Trash2, Plus, Sparkles, ChevronDown, GripVertical, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  createBlankGoal,
  createBlankStep,
  GoalRemotePersistenceError,
  saveUserGoal,
  seedGoalCache,
} from "../userGoalStorage";
import type { UserGoal, UserGoalStep } from "../goalTypes";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import { AIPromptScreen } from "./AIPromptScreen";
import { queueAIContextNudge } from "./AIContextNudge.utils";
import { useAuth } from "@/features/auth/authContext";
import { capture, captureOnce } from "@/lib/analytics";
import { buildStepNotes, parseStepDetails, parseStepLinksInput } from "../stepDetails";
import { useGoalProgressState } from "../goalStore";

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
  presentation?: "modal" | "page";
};

export function AddEditGoalModal({
  initial,
  onSave,
  onClose,
  startWithAI = false,
  initialAIPrompt = "",
  presentation = "modal",
}: Props) {
  const { userId } = useAuth();
  const { doneState } = useGoalProgressState();
  const isEdit = !!initial;
  const [mode, setMode] = useState<Mode>(
    isEdit ? "manual" : startWithAI ? "ai" : "manual",
  );
  const [goal, setGoal] = useState<UserGoal>(() => initial ?? createBlankGoal());
  const [saving, setSaving] = useState(false);
  const [openStepId, setOpenStepId] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [draggingStepId, setDraggingStepId] = useState<string | null>(null);
  const [dragOverStepId, setDragOverStepId] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const stepsListRef = useRef<HTMLDivElement>(null);
  const stepItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pendingScrollStepIdRef = useRef<string | null>(null);
  const creationStartTrackedRef = useRef(false);
  const initialGoalCountRef = useRef<number>(isEdit ? 1 : seedGoalCache(userId).length);

  useEffect(() => {
    if (mode === "manual") titleRef.current?.focus();
  }, [mode]);

  useEffect(() => {
    const pendingStepId = pendingScrollStepIdRef.current;
    if (!pendingStepId) return;

    const stepCard = stepItemRefs.current[pendingStepId];
    if (!stepCard) return;

    const frame = window.requestAnimationFrame(() => {
      stepCard.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      pendingScrollStepIdRef.current = null;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [goal.steps.length, openStepId]);

  useEffect(() => {
    if (isEdit || creationStartTrackedRef.current) return;
    if (initialGoalCountRef.current > 0) return;

    creationStartTrackedRef.current = true;

    captureOnce("first_goal_started", userId, {
      entry_mode: startWithAI ? "ai" : "manual",
      is_first_goal: true,
      source: "goal_modal",
      route: window.location.pathname,
    });

    captureOnce("first_goal_creation_started", userId, {
      entry_mode: startWithAI ? "ai" : "manual",
      is_first_goal: true,
      source: "goal_modal",
      route: window.location.pathname,
    });
  }, [isEdit, startWithAI, userId]);

  function cacheLooksLikeFirstGoal(goalId: string): boolean {
    const goals = seedGoalCache(userId);
    return goals.length === 1 && goals[0]?.id === goalId;
  }

  function updateGoal(patch: Partial<UserGoal>) {
    setGoal((g) => ({ ...g, ...patch, updatedAt: getLocalDateKey() }));
  }

  function trackFirstGoalCompleted(savedGoal: UserGoal) {
    captureOnce("first_goal_completed", userId, {
      goal_id: savedGoal.id,
      goal_title: savedGoal.title,
      steps_count: savedGoal.steps.length,
      creation_mode: mode,
      goal_creation_method: mode,
      is_first_goal: true,
      source: "goal_modal",
      route: window.location.pathname,
    });

    captureOnce("first_goal_created", userId, {
      goal_id: savedGoal.id,
      goal_title: savedGoal.title,
      steps_count: savedGoal.steps.length,
      creation_mode: mode,
      goal_creation_method: mode,
      is_first_goal: true,
      source: "goal_modal",
      route: window.location.pathname,
    });

    capture("first_goal_saved", {
      goal_id: savedGoal.id,
      goal_title: savedGoal.title,
      steps_count: savedGoal.steps.length,
      creation_mode: mode,
      goal_creation_method: mode,
      is_first_goal: true,
      source: "goal_modal",
      route: window.location.pathname,
    });
  }

  function handleAIGenerated(generated: UserGoal) {
    setGoal(generated);
    setMode("manual");
  }

  function addStep() {
    const step = createBlankStep(goal.steps.length);
    pendingScrollStepIdRef.current = step.id;
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

  function reorderSteps(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;

    const steps = [...goal.steps];
    const fromIndex = steps.findIndex((step) => step.id === draggedId);
    const toIndex = steps.findIndex((step) => step.id === targetId);

    if (fromIndex < 0 || toIndex < 0) return;

    const [moved] = steps.splice(fromIndex, 1);
    steps.splice(toIndex, 0, moved);

    updateGoal({
      steps: steps.map((step, index) => ({ ...step, sortOrder: index })),
    });
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
        links: step.links?.length ? step.links : undefined,
      })),
    };

    setSaving(true);

    try {
      const status = await saveUserGoal(userId, trimmedGoal);

      if (!isEdit) {
        queueAIContextNudge();
        if (status.isFirstGoalCreated) {
          trackFirstGoalCompleted(trimmedGoal);
        }
      }

      onSave(trimmedGoal);

      if (status.remoteSyncSucceeded) {
        toast.success(isEdit ? "Goal updated" : "Goal created ✨");
      } else {
        toast.warning("Saved locally, syncing failed. We'll retry.");
      }
    } catch (error) {
      if (error instanceof GoalRemotePersistenceError && error.localCacheWriteSucceeded) {
        if (!isEdit) {
          queueAIContextNudge();
          if (cacheLooksLikeFirstGoal(trimmedGoal.id)) {
            trackFirstGoalCompleted(trimmedGoal);
          }
        }
        onSave(trimmedGoal);
        toast.warning("Saved locally, syncing failed. We'll retry.");
      } else {
        toast.error("Couldn't save goal. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  const isValid = goal.title.trim().length > 0;

  const panel = (
    <div
      className={cn(
        "relative flex w-full flex-col overflow-hidden",
        presentation === "modal" && "bg-card",
        presentation === "modal" &&
          "rounded-t-2xl border shadow-2xl sm:max-w-2xl sm:rounded-2xl",
        presentation === "page" &&
          "min-h-[calc(100dvh-8rem)] rounded-none border-0 bg-transparent shadow-none",
        presentation === "modal" &&
          (mode === "ai"
            ? "h-[calc(100dvh-env(safe-area-inset-bottom)-1.75rem)] max-h-[calc(100dvh-env(safe-area-inset-bottom)-1.75rem)] sm:h-auto sm:max-h-[92dvh]"
            : "max-h-[calc(100dvh-env(safe-area-inset-bottom)-1.75rem)] sm:max-h-[92dvh]"),
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={cn(
          "shrink-0 border-b",
          presentation === "page" ? "px-4 py-5 sm:px-8 lg:px-12" : "px-5 py-4",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className={presentation === "page" ? "text-xl font-semibold lg:text-2xl" : "text-base font-semibold"}>
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

            {presentation === "modal" && (
              <button
                type="button"
                onClick={onClose}
                className="text-xl leading-none text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {mode === "ai" && (
        <AIPromptScreen
          onGenerated={handleAIGenerated}
          onBack={() => setMode("manual")}
          initialPrompt={initialAIPrompt}
          autoStart={Boolean(initialAIPrompt.trim())}
          presentation={presentation}
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

              <p className="text-xs text-muted-foreground">
                Keep it simple: add a step title first. Details are optional. Drag by the grip to reorder.
              </p>

              <div
                ref={stepsListRef}
                className={cn(
                  "space-y-2 overflow-y-auto pr-1",
                  presentation === "modal"
                    ? "max-h-[min(42dvh,420px)]"
                    : "max-h-none",
                )}
              >
                {goal.steps.map((step, idx) => {
                  const isOpen = openStepId === step.id;
                  const isDragTarget = dragOverStepId === step.id;
                  const isCompleted = Boolean(goal.id && doneState[goal.id]?.[step.id]);
                  const details = parseStepDetails(step);
                  const guidanceText = details.guidance.join("\n");
                  const linksText = (step.links?.length ? step.links : details.links).join("\n");

                  return (
                    <div
                      key={step.id}
                      ref={(element) => {
                        stepItemRefs.current[step.id] = element;
                      }}
                      className={cn(
                        "overflow-hidden rounded-xl border transition-colors",
                        draggingStepId === step.id && "opacity-60",
                        isDragTarget && "border-primary bg-primary/5",
                        isCompleted &&
                          !isDragTarget &&
                          "border-emerald-500/35 bg-emerald-500/8 shadow-[0_0_0_1px_rgba(16,185,129,0.08)]",
                      )}
                      onDragOver={(event) => {
                        event.preventDefault();
                        if (draggingStepId && draggingStepId !== step.id) {
                          setDragOverStepId(step.id);
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (draggingStepId) {
                          reorderSteps(draggingStepId, step.id);
                        }
                        setDraggingStepId(null);
                        setDragOverStepId(null);
                      }}
                      onDragEnd={() => {
                        setDraggingStepId(null);
                        setDragOverStepId(null);
                      }}
                    >
                      <div className="flex items-center gap-3 px-3 py-3">
                        <div
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            isCompleted
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-muted text-foreground",
                          )}
                        >
                          {idx + 1}
                        </div>

                        <button
                          type="button"
                          draggable
                          onDragStart={(event) => {
                            setDraggingStepId(step.id);
                            setDragOverStepId(step.id);
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", step.id);
                          }}
                          title="Drag to reorder"
                          aria-label="Drag to reorder"
                          className="flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>

                        <Input
                          value={step.label}
                          onChange={(e) =>
                            updateStep(step.id, { label: e.target.value })
                          }
                          placeholder="Step label"
                          className={cn(
                            "h-9 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0",
                            isCompleted && "font-medium text-emerald-100/95",
                          )}
                        />

                        <div className="flex items-center gap-2">
                          {isCompleted && (
                            <div className="hidden items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400 sm:inline-flex">
                              <Check className="h-3 w-3" />
                              Completed
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setOpenStepId(isOpen ? null : step.id)}
                            title={isOpen ? "Hide details" : "Show details"}
                            aria-label={isOpen ? "Hide details" : "Show details"}
                            className={cn(
                              "inline-flex h-10 min-w-20 items-center justify-center gap-1.5 rounded-md border px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                              isCompleted &&
                                "border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200",
                            )}
                          >
                            <span>Details</span>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform",
                                isOpen && "rotate-180",
                              )}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeStep(step.id)}
                            title="Delete step"
                            aria-label="Delete step"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div
                          className={cn(
                            "space-y-2 border-t px-3 pb-3 pt-3",
                            isCompleted && "border-emerald-500/15 bg-emerald-500/5",
                          )}
                        >
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              How
                            </div>
                            <Textarea
                              placeholder="How to do it, notes, examples, or checklist"
                              value={guidanceText}
                              onChange={(e) =>
                                updateStep(step.id, {
                                  notes: buildStepNotes(e.target.value, details.doneWhen),
                                })
                              }
                              rows={3}
                              className="resize-none text-sm"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              Done when
                            </div>
                            <Textarea
                              placeholder="What must be true for this step to count as done?"
                              value={details.doneWhen ?? ""}
                              onChange={(e) =>
                                updateStep(step.id, {
                                  notes: buildStepNotes(guidanceText, e.target.value),
                                })
                              }
                              rows={2}
                              className="resize-none text-sm"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              Links
                            </div>
                            <Textarea
                              placeholder="One link per line"
                              value={linksText}
                              onChange={(e) =>
                                updateStep(step.id, {
                                  links: parseStepLinksInput(e.target.value),
                                })
                              }
                              rows={2}
                              className="resize-none text-sm"
                            />
                          </div>

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
            <div
              className={cn(
                "flex items-center gap-3",
                presentation === "page" ? "justify-end" : "justify-between",
              )}
            >
              {presentation === "modal" && (
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}

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
  );

  if (presentation === "page") {
    return panel;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-0 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 sm:items-center sm:px-4 sm:py-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {panel}
    </div>
  );
}
