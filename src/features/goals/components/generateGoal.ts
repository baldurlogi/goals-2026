import { supabase } from '@/lib/supabaseClient';
import { writeAIUsageCache } from '@/features/subscription/aiUsageCache';
import { getAISystemContext } from '@/features/ai/buildAIContext';
import { createBlankGoal, createBlankStep } from '../userGoalStorage';
import { type UserGoal } from '@/features/goals/goalTypes';
// ── Types ─────────────────────────────────────────────────────────────────

export type AIUsage = {
  prompts_used: number;
  monthly_limit: number;
  remaining: number;
  tier: string;
};

export type ClarifyingQuestion = {
  id: string;
  question: string;
  hint?: string;
  placeholder?: string;
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

// ── Helpers ───────────────────────────────────────────────────────────────

function isPriority(value: unknown): value is UserGoal['priority'] {
  return value === 'high' || value === 'medium' || value === 'low';
}

async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token)
    throw new Error('You must be signed in.');
  return session;
}

// ── Clarifying questions ──────────────────────────────────────────────────

export async function getClarifyingQuestions(
  prompt: string,
): Promise<ClarifyingQuestion[]> {
  if (USE_MOCK_AI) {
    return [
      {
        id: 'q1',
        question: 'What is your current level?',
        hint: 'This helps Claude calibrate the difficulty of your steps.',
        placeholder: 'e.g. complete beginner, some experience…',
      },
      {
        id: 'q2',
        question: 'Do you have a specific deadline or target date?',
        placeholder: 'e.g. end of October, no deadline…',
      },
    ];
  }

  const session = await getSession();

  const res = await fetch(EDGE_FN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action: 'clarify', prompt }),
  });

  if (!res.ok) throw new Error('Clarification failed');

  const data = await res.json() as { questions?: ClarifyingQuestion[] };
  return Array.isArray(data.questions) ? data.questions : [];
}

// ── Goal generation ───────────────────────────────────────────────────────

export async function generateGoalFromPrompt(
  prompt: string,
  answers: Record<string, string> = {},
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
        steps: Array.from({ length: 10 }, (_, i) => ({
          ...createBlankStep(i),
          label: ([
            'Choose a marathon race and register',
            'Assess current fitness baseline',
            'Build base mileage to 30km/week',
            'Add weekly long run',
            'Improve pacing and recovery',
            'Practice fueling strategy',
            'Run a half-marathon benchmark',
            'Peak training block',
            'Start taper plan',
            'Run the marathon',
          ][i] ?? `Complete milestone ${i + 1}`),
          notes: 'Done when: this step is fully completed as described.',
          idealFinish: null,
          estimatedTime: '1-2 hours',
          links: [],
        })),
      },
      usage: { prompts_used: 1, monthly_limit: 10, remaining: 9, tier: 'free' },
    };
  }

  const session = await getSession();

  let userContext = '';
  try {
    userContext = await getAISystemContext();
  } catch {
    /* non-fatal */
  }

  // Build answers block — only include non-empty answers
  const answersBlock = Object.values(answers).some((v) => v.trim())
    ? '\n\nUser context from follow-up questions:\n' +
      Object.entries(answers)
        .filter(([, v]) => v.trim())
        .map(([, v]) => `- ${v.trim()}`)
        .join('\n')
    : '';

  const response = await fetch(EDGE_FN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      action: 'goal',
      prompt: prompt + answersBlock,
      userContext,
    }),
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
          .map((s, i) => ({
            ...createBlankStep(i),
            label: typeof s.label === 'string' ? s.label : '',
            notes: typeof s.notes === 'string' ? s.notes : '',
            idealFinish: typeof s.idealFinish === 'string' ? s.idealFinish : null,
            estimatedTime: typeof s.estimatedTime === 'string' ? s.estimatedTime : '',
            links: Array.isArray(s.links)
              ? s.links.filter((item): item is string => typeof item === 'string')
              : [],
          }))
      : [],
  };

  // Keep usage cache in sync so pill/details card update immediately
  writeAIUsageCache(usage);

  return { goal, usage };
}
