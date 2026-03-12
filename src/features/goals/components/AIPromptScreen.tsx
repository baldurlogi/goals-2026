import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { UserGoal } from '../goalTypes';
import {
  generateGoalFromPrompt,
  AILimitError,
  PROMPT_EXAMPLES,
  STEP_COUNT_OPTIONS,
  type AIUsage,
} from './generateGoal';

type Props = {
  onGenerated: (goal: UserGoal) => void;
  onBack: () => void;
};

export function AIPromptScreen({ onGenerated, onBack }: Props) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState(false);
  const [limitTier, setLimitTier] = useState('free');
  const [usage, setUsage] = useState<AIUsage | null>(null);
  const [stepCount, setStepCount] = useState(8);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setLimitHit(false);

    try {
      const { goal, usage: u } = await generateGoalFromPrompt(prompt.trim(), stepCount);
      setUsage(u);
      onGenerated(goal);
    } catch (e) {
      if (e instanceof AILimitError) {
        setLimitTier(e.tier);
        setLimitHit(true);
      } else {
        setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Limit reached ──────────────────────────────────────────────────────
  if (limitHit) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center px-5 py-10 text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
          <Zap className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <p className="text-base font-semibold">Monthly AI limit reached</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            {limitTier === 'free'
              ? "You've used all 10 free AI prompts this month. Upgrade to Pro for 200 prompts/month."
              : limitTier === 'pro'
                ? "You've used all 200 Pro prompts this month. Upgrade to Pro Max for 1,000 prompts/month."
                : "You've used all 1,000 prompts this month. Your limit resets on the 1st."}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            Create manually
          </Button>
          {limitTier !== 'pro_max' && (
            <Button size="sm" className="gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              {limitTier === 'free' ? 'Upgrade to Pro' : 'Upgrade to Pro Max'}
            </Button>
          )}
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
          Tell Claude what you want to achieve — it will create a structured
          plan with steps and due dates.
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
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
        }}
      />

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">How many steps?</p>
        <div className="flex flex-wrap gap-2">
          {STEP_COUNT_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setStepCount(count)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                stepCount === count
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {count} steps
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {usage && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 shrink-0 text-primary" />
          <span>
            <span className="font-semibold text-foreground">{usage.remaining}</span>{' '}
            AI prompts remaining this month
            {usage.tier !== 'pro_max' && (
              <>
                {' '}·{' '}
                <button type="button" className="underline hover:text-foreground">
                  Upgrade for more
                </button>
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

      {loading && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium">Generating your goal plan…</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Claude is creating {stepCount} steps and due dates
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Manual
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || loading}
          className="min-w-36 gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" /> Generate plan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}