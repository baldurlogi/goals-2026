import { useEffect, useRef, useState } from "react";
import { Trash2, Plus, Sparkles, ArrowLeft, Loader2 } from "lucide-react";
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

const EMOJI_SUGGESTIONS = ["🎯","💪","📚","💰","🏃","✈️","💻","🎬","🎓","🌱","🏋️","🎨","🚀","❤️","🧘","🧴","🧠"];

const PROMPT_EXAMPLES = [
  "I want to run a marathon by October",
  "Save 50,000 DKK before end of year",
  "Launch my freelance business and get 3 clients",
  "Read 24 books this year",
  "Learn TypeScript and React deeply",
  "Build a consistent skincare routine",
];

type Mode = "ai" | "manual";

type Props = {
  initial?: UserGoal;
  onSave: (goal: UserGoal) => void;
  onClose: () => void;
  /** If true, opens directly in AI mode */
  startWithAI?: boolean;
};

// ── AI generation ─────────────────────────────────────────────────────────

async function generateGoalFromPrompt(prompt: string, stepCount: number): Promise<UserGoal> {
  const today = new Date().toISOString().slice(0, 10);

  const systemPrompt = `You are a goal planning assistant. Given a user's goal description, generate a structured goal plan.

Return ONLY valid JSON matching this exact schema — no markdown, no explanation:
{
  "title": "string (concise, 3-6 words)",
  "subtitle": "string (one sentence describing the goal)",
  "emoji": "string (single relevant emoji)",
  "priority": "high" | "medium" | "low",
  "steps": [
    {
      "label": "string (action-oriented step, starts with verb)",
      "notes": "string (helpful detail or how-to, 1-2 sentences)",
      "idealFinish": "YYYY-MM-DD or null",
      "estimatedTime": "string (e.g. '2 hours', '30 min', 'ongoing') or empty string"
    }
  ]
}

Rules:
- Generate exactly ${stepCount} concrete, actionable steps
- Steps ordered logically (foundation before advanced)
- idealFinish dates realistic and spread over the goal timeline
- Today's date is ${today}
- Priority: high = life-changing/time-sensitive, medium = important, low = nice-to-have
- Keep titles short and motivating
- Steps specific enough to know when they're done`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) throw new Error(`API error ${response.status}`);

  const data = await response.json();
  const text = data.content
    .map((c: { type: string; text?: string }) => c.type === "text" ? c.text ?? "" : "")
    .join("")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(text);
  const blank  = createBlankGoal();

  return {
    ...blank,
    title:    parsed.title    ?? "",
    subtitle: parsed.subtitle ?? "",
    emoji:    parsed.emoji    ?? "🎯",
    priority: parsed.priority ?? "medium",
    steps: (parsed.steps ?? []).map((
      s: { label?: string; notes?: string; idealFinish?: string | null; estimatedTime?: string },
      i: number
    ) => ({
      ...createBlankStep(i),
      label:         s.label         ?? "",
      notes:         s.notes         ?? "",
      idealFinish:   s.idealFinish   ?? null,
      estimatedTime: s.estimatedTime ?? "",
    })),
  };
}

// ── AI prompt screen ──────────────────────────────────────────────────────

async function AIPromptScreen({
  onGenerated,
  onBack,
}: {
  onGenerated: (goal: UserGoal) => void;
  onBack: () => void;
}) {
  const [prompt, setPrompt]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [stepCount, setStepCount] = useState(8);

  const goal = await generateGoalFromPrompt(prompt.trim(), stepCount);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const goal = await generateGoalFromPrompt(prompt.trim(), stepCount);
      onGenerated(goal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto px-5 py-5 space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Describe your goal</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Tell Claude what you want to achieve — it will create a structured plan with steps and due dates.
        </p>
      </div>

      <Textarea
        ref={textareaRef}
        placeholder="e.g. I want to run a marathon by October, or Save 50,000 DKK before end of year"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        className="resize-none text-sm"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
        }}
      />

      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Try an example</p>
        <div className="flex flex-wrap gap-2">
          {PROMPT_EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setPrompt(ex)}
              className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium">Generating your goal plan…</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Claude is creating steps and due dates</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Manual
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || loading}
          className="min-w-36 gap-2"
        >
          {loading ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
          ) : (
            <><Sparkles className="h-3.5 w-3.5" /> Generate plan</>
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────

export function AddEditGoalModal({ initial, onSave, onClose, startWithAI = false }: Props) {
  const isEdit = !!initial;
  const [mode, setMode]     = useState<Mode>(isEdit ? "manual" : (startWithAI ? "ai" : "manual"));
  const [goal, setGoal]     = useState<UserGoal>(() => initial ?? createBlankGoal());
  const [saving, setSaving] = useState(false);
  const [openStepId, setOpenStepId]           = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "manual") titleRef.current?.focus();
  }, [mode]);

  function updateGoal(patch: Partial<UserGoal>) {
    setGoal((g) => ({ ...g, ...patch, updatedAt: new Date().toISOString() }));
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
    updateGoal({ steps: goal.steps.map((s) => s.id === id ? { ...s, ...patch } : s) });
  }

  function removeStep(id: string) {
    updateGoal({ steps: goal.steps.filter((s) => s.id !== id) });
    if (openStepId === id) setOpenStepId(null);
  }

  function moveStep(id: string, dir: -1 | 1) {
    const steps = [...goal.steps];
    const idx   = steps.findIndex((s) => s.id === id);
    const next  = idx + dir;
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
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold">
              {isEdit ? "Edit goal" : mode === "ai" ? "AI goal planner" : "New goal"}
            </h2>
            {/* Badge shown after AI generation in review mode */}
            {mode === "manual" && goal.title && !isEdit && goal.steps.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Sparkles className="h-2.5 w-2.5" /> AI generated · review & edit
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isEdit && (
              <button
                type="button"
                onClick={() => setMode((m) => m === "ai" ? "manual" : "ai")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  mode === "ai"
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="h-3 w-3" />
                {mode === "ai" ? "AI mode" : "Use AI"}
              </button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">
              ×
            </button>
          </div>
        </div>

        {/* ── AI screen ── */}
        {mode === "ai" && (
          <AIPromptScreen onGenerated={handleAIGenerated} onBack={() => setMode("manual")} />
        )}

        {/* ── Manual / review form ── */}
        {mode === "manual" && (
          <>
            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

              {/* Emoji + Title */}
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
                        <button key={e} type="button"
                          onClick={() => { updateGoal({ emoji: e }); setEmojiPickerOpen(false); }}
                          className="text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted"
                        >{e}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Input ref={titleRef} placeholder="Goal title *" value={goal.title}
                    onChange={(e) => updateGoal({ title: e.target.value })}
                    className="text-base font-medium" />
                  <Input placeholder="Short description (optional)" value={goal.subtitle}
                    onChange={(e) => updateGoal({ subtitle: e.target.value })} />
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground font-medium">Priority</div>
                <div className="flex gap-2">
                  {PRIORITY_OPTIONS.map((p) => (
                    <button key={p} type="button" onClick={() => updateGoal({ priority: p })}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-xs font-semibold capitalize transition-all",
                        goal.priority === p ? PRIORITY_COLOR[p] : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >{p}</button>
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
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button type="button" onClick={() => moveStep(step.id, -1)} disabled={idx === 0}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none text-xs">▲</button>
                            <button type="button" onClick={() => moveStep(step.id, 1)} disabled={idx === goal.steps.length - 1}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none text-xs">▼</button>
                          </div>
                          <span className="text-xs text-muted-foreground w-5 text-center shrink-0">{idx + 1}</span>
                          <Input placeholder="Step label *" value={step.label}
                            onChange={(e) => updateStep(step.id, { label: e.target.value })}
                            className="flex-1 h-8 text-sm"
                            onClick={() => setOpenStepId(isOpen ? null : step.id)} />
                          <button type="button" onClick={() => setOpenStepId(isOpen ? null : step.id)}
                            className="text-xs text-muted-foreground hover:text-foreground shrink-0">
                            {isOpen ? "▲" : "▼"}
                          </button>
                          <button type="button" onClick={() => removeStep(step.id)}
                            className="text-muted-foreground hover:text-destructive shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {isOpen && (
                          <div className="px-3 pb-3 space-y-2 border-t pt-3">
                            <Textarea placeholder="Notes (optional)" value={step.notes}
                              onChange={(e) => updateStep(step.id, { notes: e.target.value })}
                              rows={2} className="text-sm resize-none" />
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Due date</div>
                                <Input type="date" value={step.idealFinish ?? ""}
                                  onChange={(e) => updateStep(step.id, { idealFinish: e.target.value || null })}
                                  className="h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Est. time</div>
                                <Input placeholder="e.g. 30 min" value={step.estimatedTime}
                                  onChange={(e) => updateStep(step.id, { estimatedTime: e.target.value })}
                                  className="h-8 text-sm" />
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

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t shrink-0">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={!isValid || saving} className="min-w-28">
                {saving ? "Saving…" : isEdit ? "Save changes" : "Create goal"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}