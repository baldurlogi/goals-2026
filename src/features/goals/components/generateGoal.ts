import { supabase } from '@/lib/supabaseClient';
import { getAISystemContext } from '@/features/ai/buildAIContext';
import { createBlankGoal, createBlankStep } from '../userGoalStorage';
import type { UserGoal } from '../goalTypes';

// ── Types ─────────────────────────────────────────────────────────────────

export type AIUsage = {
  prompts_used: number;
  monthly_limit: number;
  remaining: number;
  tier: string;
};

type AILimitPayload = {
  error: 'monthly_limit_reached';
  message: string;
  tier: string;
  monthly_limit: number;
  prompts_used: number;
  upgrade_required: boolean;
};

export class AILimitError extends Error {
  tier: string;
  limit: number;
  constructor(payload: AILimitPayload) {
    super(payload.message);
    this.name = 'AILimitError';
    this.tier = payload.tier;
    this.limit = payload.monthly_limit;
  }
}

// ── Constants ─────────────────────────────────────────────────────────────

const EDGE_FN_URL =
  'https://jvtpemjrswfwsiwkhreq.supabase.co/functions/v1/hyper-responder';

const USE_MOCK_AI = import.meta.env.VITE_USE_MOCK_AI === 'true';

export const PROMPT_EXAMPLES = [
  'I want to run a marathon by October',
  'Save 50,000 DKK before end of year',
  'Launch my freelance business and get 3 clients',
  'Read 24 books this year',
  'Learn TypeScript and React deeply',
  'Build a consistent skincare routine',
];

export const STEP_COUNT_OPTIONS = [5, 6, 8, 10, 12];

// ── Helpers ───────────────────────────────────────────────────────────────

function isPriority(value: unknown): value is UserGoal['priority'] {
  return value === 'high' || value === 'medium' || value === 'low';
}

// ── Main function ─────────────────────────────────────────────────────────

export async function generateGoalFromPrompt(
  prompt: string,
  stepCount: number,
): Promise<{ goal: UserGoal; usage: AIUsage }> {
  if (USE_MOCK_AI) {
    const blank = createBlankGoal();
    return {
      goal: {
        ...blank,
        title: 'Run marathon by October',
        subtitle: 'Build up endurance and complete a marathon by your target month.',
        emoji: '🏃',
        priority: 'high',
        steps: Array.from({ length: stepCount }, (_, i) => ({
          ...createBlankStep(i),
          label: ([
            'Choose a marathon race',
            'Set a weekly running schedule',
            'Build base mileage',
            'Add a long run each week',
            'Improve pacing and recovery',
            'Practice fueling strategy',
            'Run a half-marathon benchmark',
            'Start taper plan',
            'Finalize race logistics',
            'Run the marathon',
          ][i] ?? `Complete milestone ${i + 1}`),
          notes: 'AI mock step for UI testing.',
          idealFinish: null,
          estimatedTime: i === stepCount - 1 ? 'ongoing' : '1-2 hours',
        })),
      },
      usage: { prompts_used: 1, monthly_limit: 10, remaining: 9, tier: 'free' },
    };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token)
    throw new Error('You must be signed in to generate AI goals.');

  let userContext = '';
  try {
    userContext = await getAISystemContext();
  } catch {
    /* non-fatal — falls back to no context */
  }

  const response = await fetch(EDGE_FN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ prompt, stepCount, userContext }),
  });

  const raw = await response.text();

  if (response.status === 429) {
    try {
      const payload = JSON.parse(raw) as AILimitPayload;
      if (payload.error === 'monthly_limit_reached') throw new AILimitError(payload);
    } catch (e) {
      if (e instanceof AILimitError) throw e;
    }
  }

  if (!response.ok) {
    let message = `Edge function failed (${response.status})`;
    try {
      const e = JSON.parse(raw) as { error?: string; details?: string; raw_text?: string };
      if (e.error) {
        message = e.error;
        if (e.details) message += `: ${e.details}`;
        if (e.raw_text) message += `: ${e.raw_text}`;
      }
    } catch {
      if (raw) message += `: ${raw}`;
    }
    throw new Error(message);
  }

  let data: { goal?: unknown; usage?: unknown };
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('AI returned invalid response. Please try again.');
  }

  const result = (data.goal ?? data) as Record<string, unknown>;
  const usage = (data.usage ?? {
    prompts_used: 1,
    monthly_limit: 10,
    remaining: 9,
    tier: 'free',
  }) as AIUsage;

  const blank = createBlankGoal();
  const goal: UserGoal = {
    ...blank,
    title: typeof result.title === 'string' ? result.title : '',
    subtitle: typeof result.subtitle === 'string' ? result.subtitle : '',
    emoji:
      typeof result.emoji === 'string' && result.emoji.trim()
        ? result.emoji
        : '🎯',
    priority: isPriority(result.priority) ? result.priority : 'medium',
    steps: Array.isArray(result.steps)
      ? (result.steps as Record<string, unknown>[])
          .filter(
            (s) =>
              typeof s?.label === 'string' &&
              (s.label as string).trim().length > 0,
          )
          .slice(0, stepCount)
          .map((s, i) => ({
            ...createBlankStep(i),
            label: typeof s.label === 'string' ? s.label : '',
            notes: typeof s.notes === 'string' ? s.notes : '',
            idealFinish: typeof s.idealFinish === 'string' ? s.idealFinish : null,
            estimatedTime: typeof s.estimatedTime === 'string' ? s.estimatedTime : '',
          }))
      : [],
  };

  return { goal, usage };
}