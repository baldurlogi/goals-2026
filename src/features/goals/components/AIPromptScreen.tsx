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
import { capture, captureOnce } from "@/lib/analytics";
import { seedGoalCache } from "../userGoalStorage";
import {
  AI_ACTION_CREDIT_COSTS,
  formatCreditCost,
  type AIUsage,
} from "@/features/subscription/aiCredits";
import {
  generateGoalFromPrompt,
  getClarifyingQuestions,
  AILimitError,
  GoalGenerationError,
  PROMPT_EXAMPLES,
  type ClarifyingQuestion,
} from "./generateGoal";

type Screen = "prompt" | "clarifying" | "generating";
type ActiveStep = "prompt" | "clarifying" | "generating";

type Props = {
  onGenerated: (goal: UserGoal) => void;
  onBack: () => void;
  initialPrompt?: string;
  autoStart?: boolean;
  presentation?: "modal" | "page";
};

export function AIPromptScreen({
  onGenerated,
  onBack,
  initialPrompt = "",
  autoStart = false,
  presentation = "modal",
}: Props) {
  const { userId } = useAuth();
  const [screen, setScreen] = useState<Screen>("prompt");
  const [prompt, setPrompt] = useState(initialPrompt);
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingGoal, setLoadingGoal] = useState(false);
  const [error, setError] = useState<GoalGenerationError | null>(null);
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

      capture("ai_credits_used", {
        feature: "goal_generation",
        source: "goal_ai_prompt",
        route: window.location.pathname,
        had_clarifying_questions: Object.keys(finalAnswers).length > 0,
        credits_used: u.credits_used,
        monthly_limit: u.monthly_limit,
        remaining: u.remaining,
        credits_cost: u.credits_cost ?? AI_ACTION_CREDIT_COSTS.goalGeneration,
        tier: u.tier,
      });

      captureOnce("first_goal_generated", userId, {
        had_clarifying_questions: Object.keys(finalAnswers).length > 0,
        is_first_goal: seedGoalCache(userId).length === 0,
        source: "goal_ai_prompt",
        route: window.location.pathname,
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
          e instanceof GoalGenerationError
            ? e
            : new GoalGenerationError(
                "service",
                e instanceof Error
                  ? e.message
                  : "Something went wrong while generating. Review your input and retry.",
              ),
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
  const isPage = presentation === "page";

  const errorContent = (() => {
    if (!error) return null;

    if (screen === "clarifying") {
      if (error.reason === "incomplete_goal") {
        return {
          title: "We still don’t have a usable goal plan yet",
          body:
            "Claude didn’t return complete goal steps this time. Answer any helpful question below and try again, or generate without answers if you’d rather keep moving.",
          next:
            error.missingParts.length > 0
              ? `Still missing: ${error.missingParts.join(", ")}.`
              : "Still missing: usable goal steps.",
        };
      }

      if (error.reason === "network") {
        return {
          title: "We couldn’t reach AI goal generation",
          body:
            "Your goal and answers are still here. Try again now, or generate without answers if you want to skip the follow-up questions.",
          next: "Nothing below is required. Any extra detail just makes the plan better.",
        };
      }

      return {
        title: "Goal generation didn’t finish",
        body:
          "Your goal and answers are still saved on this screen. Try again, or generate without answers if you want to keep moving.",
        next: "Nothing below is required. Fill in only what helps.",
      };
    }

    if (error.reason === "incomplete_goal") {
      return {
        title: "We couldn’t turn that into a usable step-by-step goal yet",
        body:
          "Try making the goal a bit more specific so Claude can produce real steps.",
        next:
          "Best additions: your deadline, current level, and how much time you can realistically give it each week.",
      };
    }

    if (error.reason === "network") {
      return {
        title: "We couldn’t reach AI goal generation",
        body: "Check your connection, then try again.",
        next: "Your prompt is still here and nothing was lost.",
      };
    }

    return {
      title: "Goal generation didn’t finish",
      body: "Review your goal text and try again.",
      next:
        "If it keeps failing, make the goal more concrete with a target date or clearer outcome.",
    };
  })();

  function StepIndicator() {
    const steps: { key: ActiveStep; label: string }[] = [
      { key: "prompt", label: "Prompt" },
      { key: "clarifying", label: "Clarify" },
      { key: "generating", label: "Generate" },
    ];

    const activeIndex = steps.findIndex((step) => step.key === activeStep);

    return (
      <div
        className={`flex w-full items-center justify-center gap-2 text-muted-foreground ${
          isPage ? "text-xs lg:text-sm" : "text-[11px]"
        }`}
      >
        {steps.map((step, index) => {
          const isActive = activeStep === step.key;
          const isDone = index < activeIndex;

          return (
            <div key={step.key} className="flex items-center gap-2">
              <div
                className={`${isPage ? "h-2 w-2" : "h-1.5 w-1.5"} rounded-full ${
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
        <div className="flex flex-col items-center gap-5 text-center">
          <StepIndicator />
          <div className="flex gap-1">
            <span className="h-3 w-3 animate-bounce rounded-full bg-violet-400 [animation-delay:0ms]" />
            <span className="h-3 w-3 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:150ms]" />
            <span className="h-3 w-3 animate-bounce rounded-full bg-pink-400 [animation-delay:300ms]" />
          </div>
          <div>
            <p className="text-lg font-semibold lg:text-2xl">Building your goal plan…</p>
            <p className="mt-2 text-sm text-muted-foreground lg:text-base">
              Claude is breaking this into concrete, actionable steps
            </p>
            <p className="mt-1 text-sm text-muted-foreground lg:text-base">
              This can take around 15-30 seconds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "clarifying") {
    return (
      <div
        className={`flex flex-1 flex-col overflow-y-auto ${
          isPage ? "px-4 pt-6 sm:px-8 lg:px-12" : "px-5 pt-5"
        }`}
      >
        <div className={`w-full pb-4 ${isPage ? "mx-auto max-w-5xl space-y-7" : "space-y-5"}`}>
          <StepIndicator />
          <div className={isPage ? "space-y-2" : "space-y-1"}>
            <div className="flex items-center gap-2">
              <Sparkles className={isPage ? "h-5 w-5 text-primary" : "h-4 w-4 text-primary"} />
              <span className={isPage ? "text-2xl font-semibold lg:text-3xl" : "text-sm font-semibold"}>
                A few quick questions
              </span>
            </div>
            <p className={isPage ? "max-w-3xl text-base leading-relaxed text-muted-foreground" : "text-xs text-muted-foreground"}>
              Nothing below is required. Answer what you can so Claude can make
              your plan more specific, or leave any question blank and still generate.
            </p>
          </div>

          <div className={isPage ? "rounded-xl border bg-muted/30 px-5 py-4" : "rounded-xl border bg-muted/30 px-4 py-3"}>
            <p className={isPage ? "text-sm text-muted-foreground" : "text-xs text-muted-foreground"}>Your goal</p>
            <p className={isPage ? "mt-1 whitespace-pre-wrap text-lg font-medium" : "mt-0.5 whitespace-pre-wrap text-sm font-medium"}>{prompt}</p>
          </div>

          <div className={isPage ? "grid gap-5 lg:grid-cols-2" : "space-y-4"}>
            {questions.map((q) => (
              <div key={q.id} className={isPage ? "space-y-2" : "space-y-1.5"}>
                <label className={isPage ? "text-base font-medium" : "text-sm font-medium"}>{q.question}</label>
                {q.hint && <p className={isPage ? "text-sm text-muted-foreground" : "text-xs text-muted-foreground"}>{q.hint}</p>}
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

          {error && errorContent && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <p className="font-medium">{errorContent.title}</p>
              <p className="mt-1">{errorContent.body}</p>
              <p className="mt-1 text-xs">{errorContent.next}</p>
            </div>
          )}

          <div className={isPage ? "rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground" : "rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground"}>
            Uses {formatCreditCost(AI_ACTION_CREDIT_COSTS.goalGeneration)}
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

        <div className={`sticky bottom-0 mt-2 space-y-2 border-t bg-background/95 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3 backdrop-blur ${isPage ? "-mx-4 px-4 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12" : "-mx-5 px-5"}`}>
          <p className={isPage ? "text-center text-sm text-muted-foreground sm:text-right" : "text-center text-xs text-muted-foreground sm:text-right"}>
            Generating usually takes around 15-30 seconds.
          </p>
          <div
            className={`flex flex-col-reverse items-center gap-2 sm:flex-row ${
              isPage ? "sm:justify-end" : "sm:justify-between"
            }`}
          >
            {!isPage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setScreen("prompt")}
                disabled={loadingGoal}
                className="w-full max-w-sm justify-center gap-1.5 sm:w-auto sm:justify-start"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            )}

            <div className="flex w-full max-w-sm flex-col-reverse gap-2 sm:w-auto sm:max-w-none sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleGenerate({})}
                disabled={loadingGoal}
                className="w-full justify-center gap-1.5 text-muted-foreground sm:w-auto"
              >
                <SkipForward className="h-3.5 w-3.5" />
                Generate without answers
              </Button>

              <Button
                onClick={() => void handleGenerate()}
                disabled={loadingGoal}
                className="min-h-11 w-full min-w-36 justify-center gap-2 sm:w-auto"
              >
                {loadingGoal ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    {hasActionableError ? "Try again" : "Generate plan"}
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
    <div
      className={`flex flex-1 flex-col overflow-y-auto ${
        isPage ? "px-4 pt-6 sm:px-8 lg:px-12" : "px-5 pt-5"
      }`}
    >
      <div className={`w-full pb-4 ${isPage ? "mx-auto max-w-5xl space-y-7" : "space-y-5"}`}>
        <StepIndicator />
        <div className={isPage ? "space-y-2" : "space-y-1"}>
          <div className="flex items-center gap-2">
            <Sparkles className={isPage ? "h-5 w-5 text-primary" : "h-4 w-4 text-primary"} />
            <span className={isPage ? "text-2xl font-semibold lg:text-3xl" : "text-sm font-semibold"}>
              Describe your goal
            </span>
          </div>
          <p className={isPage ? "text-base leading-relaxed text-muted-foreground" : "text-xs text-muted-foreground"}>
            Tell us what you want to achieve!
          </p>
        </div>

        <Textarea
          ref={textareaRef}
          placeholder="e.g. I want to run a marathon by October"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={isPage ? 7 : 5}
          className={isPage ? "min-h-52 resize-none text-lg leading-relaxed" : "resize-none text-sm"}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              void handleNext();
            }
          }}
        />

        {error && errorContent && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <p className="font-medium">{errorContent.title}</p>
            <p className="mt-1">{errorContent.body}</p>
            <p className="mt-1 text-xs">{errorContent.next}</p>
          </div>
        )}

        <div className={isPage ? "rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground" : "rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground"}>
          Uses {formatCreditCost(AI_ACTION_CREDIT_COSTS.goalGeneration)} · Strong prompts include the outcome, timing, and your starting point.
        </div>

        {usage && (
          <div className={isPage ? "flex items-center gap-2 rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground" : "flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground"}>
            <Sparkles className="h-3 w-3 shrink-0 text-primary" />
            <span>
              <span className="font-semibold text-foreground">{usage.remaining}</span>{" "}
              AI credits remaining this month
              {usage.tier !== "pro_max" && (
                <>
                  {" "}
                  ·{" "}
                  <Link to="/app/upgrade" className="underline hover:text-foreground">
                    Pricing preview
                  </Link>
                </>
              )}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <p className={isPage ? "text-sm font-medium text-muted-foreground" : "text-xs font-medium text-muted-foreground"}>Try an example</p>
          <div className="flex flex-wrap gap-2">
            {PROMPT_EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setPrompt(ex)}
                className={isPage ? "rounded-full border border-border/60 bg-muted/40 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" : "rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`sticky bottom-0 mt-2 space-y-2 border-t bg-background/95 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3 backdrop-blur ${isPage ? "-mx-4 px-4 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12" : "-mx-5 px-5"}`}>
        <p className={isPage ? "text-center text-sm text-muted-foreground sm:text-right" : "text-center text-xs text-muted-foreground sm:text-right"}>
          Generating usually takes around 15-30 seconds.
        </p>
        <div
          className={`flex flex-col-reverse items-center gap-2 sm:flex-row ${
            isPage ? "sm:justify-end" : "sm:justify-between"
          }`}
        >
          {!isPage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="w-full max-w-sm justify-center gap-1.5 sm:w-auto sm:justify-start"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          )}

          <Button
            onClick={() => void handleNext()}
            disabled={!prompt.trim() || loadingQuestions || loadingGoal}
            className="min-h-11 w-full max-w-sm justify-center gap-2 sm:w-auto sm:min-w-28"
          >
            {loadingQuestions ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Next…
              </>
            ) : (
              <>
                {hasActionableError ? "Try again" : "Continue"}
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
