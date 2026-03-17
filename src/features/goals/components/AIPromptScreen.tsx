import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  SkipForward,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { UserGoal } from "../goalTypes";
import { AIUsageLimitNotice } from "@/features/subscription/AIUsageLimitNotice";
import type { Tier } from "@/features/subscription/useTier";
import { useAuth } from "@/features/auth/authContext";
import { captureOnce } from "@/lib/analytics";
import {
  generateGoalFromPrompt,
  getClarifyingQuestions,
  AILimitError,
  PROMPT_EXAMPLES,
  type AIUsage,
  type ClarifyingQuestion,
} from "./generateGoal";

type Screen = "prompt" | "clarifying" | "generating";
type ActiveStep = "prompt" | "clarifying" | "generating";

type Props = {
  onGenerated: (goal: UserGoal) => void;
  onBack: () => void;
  initialPrompt?: string;
  autoStart?: boolean;
};

export function AIPromptScreen({
  onGenerated,
  onBack,
  initialPrompt = "",
  autoStart = false,
}: Props) {
  const { userId } = useAuth();
  const [screen, setScreen] = useState<Screen>("prompt");
  const [prompt, setPrompt] = useState(initialPrompt);
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingGoal, setLoadingGoal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState(false);
  const [limitTier, setLimitTier] = useState("free");
  const [usage, setUsage] = useState<AIUsage | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (screen === "prompt") {
      textareaRef.current?.focus();
    }
  }, [screen]);

  useEffect(() => {
    if (!initialPrompt.trim()) return;
    setPrompt((prev) => (prev.trim() ? prev : initialPrompt));
  }, [initialPrompt]);

  const handleGenerate = useCallback(async (
    answersOverride?: Record<string, string>,
    promptOverride?: string,
  ) => {
    const finalPrompt = (promptOverride ?? prompt).trim();
    if (!finalPrompt) return;

    setLoadingGoal(true);
    const sourceScreen = screen;
    setScreen("generating");
    setError(null);
    setLimitHit(false);

    const finalAnswers = answersOverride ?? answers;

    try {
      const { goal, usage: u } = await generateGoalFromPrompt(
        finalPrompt,
        finalAnswers,
      );

      captureOnce("first_goal_generated", userId, {
        had_clarifying_questions: Object.keys(finalAnswers).length > 0,
      });

      setUsage(u);
      onGenerated(goal);
    } catch (e) {
      if (e instanceof AILimitError) {
        setLimitTier(e.tier);
        setLimitHit(true);
        setScreen("prompt");
      } else {
        const fallbackScreen = questions.length > 0 ? "clarifying" : "prompt";
        const returnScreen = sourceScreen === "generating" ? fallbackScreen : sourceScreen;
        setError(
          e instanceof Error
            ? e.message
            : "Something went wrong while generating. Review your input and retry.",
        );
        setScreen(returnScreen);
      }
    } finally {
      setLoadingGoal(false);
    }
  }, [answers, onGenerated, prompt, questions.length, screen]);

  const handleNext = useCallback(async (promptOverride?: string) => {
    const nextPrompt = (promptOverride ?? prompt).trim();
    if (!nextPrompt) return;

    setLoadingQuestions(true);
    setError(null);

    try {
      const qs = await getClarifyingQuestions(nextPrompt);

      if (qs.length === 0) {
        await handleGenerate({}, nextPrompt);
        return;
      }

      setQuestions(qs);
      setAnswers({});
      setScreen("clarifying");
    } catch {
      await handleGenerate({}, nextPrompt);
    } finally {
      setLoadingQuestions(false);
    }
  }, [handleGenerate, prompt]);

  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    if (screen !== "prompt") return;
    if (!prompt.trim()) return;

    autoStartedRef.current = true;
    void handleNext(prompt);
  }, [autoStart, handleNext, prompt, screen]);

  const activeStep: ActiveStep = screen === "generating" ? "generating" : screen;
  const hasActionableError = Boolean(error);

  function StepIndicator() {
    const steps: { key: ActiveStep; label: string }[] = [
      { key: "prompt", label: "Prompt" },
      { key: "clarifying", label: "Clarify" },
      { key: "generating", label: "Generate" },
    ];

    const activeIndex = steps.findIndex((step) => step.key === activeStep);

    return (
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        {steps.map((step, index) => {
          const isActive = activeStep === step.key;
          const isDone = index < activeIndex;

          return (
            <div key={step.key} className="flex items-center gap-2">
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  isActive || isDone ? "bg-primary" : "bg-muted-foreground/40"
                }`}
              />
              <span
                className={
                  isActive ? "font-semibold text-foreground" : "text-muted-foreground"
                }
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <span className="text-muted-foreground/50">→</span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (limitHit) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <AIUsageLimitNotice
          tier={limitTier as Tier}
          feature="AI goal creation"
          className="w-full max-w-md"
          secondaryActionLabel="Create manually"
          onSecondaryAction={onBack}
        />
      </div>
    );
  }

  if (screen === "generating") {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <StepIndicator />
          <div className="flex gap-1">
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet-400 [animation-delay:0ms]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:150ms]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-pink-400 [animation-delay:300ms]" />
          </div>
          <div>
            <p className="text-sm font-semibold">Building your goal plan…</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Claude is breaking this into concrete, actionable steps
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              This can take around 10–20 seconds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "clarifying") {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto px-5 py-5">
      <div className="space-y-5">
          <StepIndicator />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">A few quick questions</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Answer these so Claude can make your plan specific to you. Skip any
              you’re not sure about.
            </p>
          </div>

          <div className="rounded-xl border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">Your goal</p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm font-medium">{prompt}</p>
          </div>

          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="space-y-1.5">
                <label className="text-sm font-medium">{q.question}</label>
                {q.hint && <p className="text-xs text-muted-foreground">{q.hint}</p>}
                <Input
                  placeholder={q.placeholder ?? "Your answer…"}
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleGenerate();
                  }}
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error} You’re still on clarifying questions. Update any response and retry,
              or skip and generate.
            </div>
          )}

          <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Uses 1 AI prompt
            {usage && (
              <>
                {" "}
                ·{" "}
                <span className="font-semibold text-foreground">
                  {usage.remaining}
                </span>{" "}
                left this month
              </>
            )}
          </div>
        </div>

      <div className="mt-6 space-y-2 border-t pt-4">
        <p className="text-right text-xs text-muted-foreground">
          Generating usually takes around 10–20 seconds.
        </p>
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScreen("prompt")}
            disabled={loadingGoal}
            className="gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleGenerate({})}
              disabled={loadingGoal}
              className="gap-1.5 text-muted-foreground"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Skip
            </Button>

            <Button
              onClick={() => void handleGenerate()}
              disabled={loadingGoal}
              className="min-w-36 gap-2"
            >
              {loadingGoal ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  {hasActionableError ? "Retry" : "Generate plan"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-5 py-5">
      <div className="space-y-5">
        <StepIndicator />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Describe your goal</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Tell Claude what you want to achieve. It will ask a couple of quick
            questions, then build a step-by-step plan.
          </p>
        </div>

        <Textarea
          ref={textareaRef}
          placeholder="e.g. I want to run a marathon by October"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          className="resize-none text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              void handleNext();
            }
          }}
        />

        {error && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error} You’re still on your prompt. Edit your goal details, then retry.
          </div>
        )}

        <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Uses 1 AI prompt · Claude will turn this into ordered steps with “done
          when” criteria.
        </div>

        {usage && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 shrink-0 text-primary" />
            <span>
              <span className="font-semibold text-foreground">{usage.remaining}</span>{" "}
              AI prompts remaining this month
              {usage.tier !== "pro_max" && (
                <>
                  {" "}
                  ·{" "}
                  <Link to="/app/upgrade" className="underline hover:text-foreground">
                    Upgrade for more
                  </Link>
                </>
              )}
            </span>
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
      </div>

      <div className="mt-6 space-y-2 border-t pt-4">
        <p className="text-right text-xs text-muted-foreground">
          Generating usually takes around 10–20 seconds.
        </p>
        <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>

        <Button
          onClick={() => void handleNext()}
          disabled={!prompt.trim() || loadingQuestions || loadingGoal}
          className="min-w-28 gap-2"
        >
          {loadingQuestions ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Next…
            </>
          ) : (
            <>
              {hasActionableError ? "Retry" : "Continue"}
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
        </div>
      </div>
    </div>
  );
}
