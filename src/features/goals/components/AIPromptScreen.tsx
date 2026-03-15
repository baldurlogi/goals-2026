import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Sparkles, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import type { UserGoal } from '../goalTypes';
import { AIUsageLimitNotice } from '@/features/subscription/AIUsageLimitNotice';
import { AIUsageInlineHint } from '@/features/subscription/AIUsageInlineHint';
import type { Tier } from '@/features/subscription/useTier';
import {
  generateGoalFromPrompt,
  getClarifyingQuestions,
  AILimitError,
  PROMPT_EXAMPLES,
  type ClarifyingQuestion,
} from './generateGoal';

type Screen = 'prompt' | 'clarifying' | 'generating';

type Props = {
  onGenerated: (goal: UserGoal) => void;
  onBack: () => void;
};

export function AIPromptScreen({ onGenerated, onBack }: Props) {
  const [screen, setScreen] = useState<Screen>('prompt');
  const [prompt, setPrompt] = useState('');
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingGoal, setLoadingGoal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState(false);
  const [limitTier, setLimitTier] = useState('free');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (screen === 'prompt') textareaRef.current?.focus();
  }, [screen]);

  async function handleNext() {
    if (!prompt.trim()) return;
    setLoadingQuestions(true);
    setError(null);

    try {
      const qs = await getClarifyingQuestions(prompt.trim());
      setQuestions(qs);
      setAnswers({});
      setScreen('clarifying');
    } catch {
      await handleGenerate({});
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function handleGenerate(answersOverride?: Record<string, string>) {
    setLoadingGoal(true);
    setScreen('generating');
    setError(null);
    setLimitHit(false);

    const finalAnswers = answersOverride ?? answers;

    try {
      const { goal } = await generateGoalFromPrompt(prompt.trim(), finalAnswers);
      onGenerated(goal);
    } catch (e) {
      if (e instanceof AILimitError) {
        setLimitTier(e.tier);
        setLimitHit(true);
        setScreen('prompt');
      } else {
        setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
        setScreen('clarifying');
      }
    } finally {
      setLoadingGoal(false);
    }
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

  if (screen === 'generating') {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
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
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'clarifying') {
    return (
      <div className="flex flex-col flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">A few quick questions</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Answer these so Claude can make your plan specific to you. Skip any you&apos;re not sure about.
          </p>
        </div>

        <div className="rounded-xl border bg-muted/30 px-4 py-3">
          <p className="text-xs text-muted-foreground">Your goal</p>
          <p className="mt-0.5 text-sm font-medium">{prompt}</p>
        </div>

        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="space-y-1.5">
              <label className="text-sm font-medium">{q.question}</label>
              {q.hint && <p className="text-xs text-muted-foreground">{q.hint}</p>}
              <Input
                placeholder={q.placeholder ?? 'Your answer…'}
                value={answers[q.id] ?? ''}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleGenerate();
                }}
              />
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <AIUsageInlineHint actionLabel="Generating this plan uses 1 AI prompt" />

        <div className="flex items-center justify-between gap-3 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScreen('prompt')}
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
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Generate plan
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto px-5 py-5 space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Describe your goal</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Tell Claude what you want to achieve — it will ask a couple of quick
          questions, then build a detailed step-by-step plan.
        </p>
      </div>

      <Textarea
        ref={textareaRef}
        placeholder="e.g. I want to run a marathon by October"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        className="resize-none text-sm"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void handleNext();
        }}
      />

      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <AIUsageInlineHint actionLabel="Generating a goal plan uses 1 AI prompt" />

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

      <div className="flex items-center justify-between gap-3 pt-1">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Manual
        </Button>
        <Button
          onClick={() => void handleNext()}
          disabled={!prompt.trim() || loadingQuestions}
          className="min-w-36 gap-2"
        >
          {loadingQuestions ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
