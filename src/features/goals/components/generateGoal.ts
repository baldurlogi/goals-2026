import { getSupabaseFunctionUrl, supabase } from '@/lib/supabaseClient';
import { writeAIUsageCache } from '@/features/subscription/aiUsageCache';
import {
  AI_ACTION_CREDIT_COSTS,
  BETA_MONTHLY_AI_CREDITS,
  coerceAIUsage,
  type AILimitPayload,
  type AIUsage,
} from '@/features/subscription/aiCredits';
import { getAISystemContext } from '@/features/ai/buildAIContext';
import { createBlankGoal, createBlankStep } from '../userGoalStorage';
import { type UserGoal } from '@/features/goals/goalTypes';

export type ClarifyingQuestion = {
  id: string;
  question: string;
  hint?: string;
  placeholder?: string;
};

export type GoalGenerationFailureReason =
  | 'network'
  | 'service'
  | 'invalid_response'
  | 'incomplete_goal'
  | 'unauthorized';

export class AILimitError extends Error {
  tier: string;
  limit: number;
  constructor(payload: AILimitPayload) {
    super(payload.message ?? 'Monthly AI credit limit reached.');
    this.name = 'AILimitError';
    this.tier = typeof payload.tier === 'string' ? payload.tier : 'free';
    this.limit = payload.monthly_limit ?? BETA_MONTHLY_AI_CREDITS;
  }
}

export class GoalGenerationError extends Error {
  reason: GoalGenerationFailureReason;
  missingParts: string[];

  constructor(
    reason: GoalGenerationFailureReason,
    message: string,
    options?: { missingParts?: string[] },
  ) {
    super(message);
    this.name = 'GoalGenerationError';
    this.reason = reason;
    this.missingParts = options?.missingParts ?? [];
  }
}

// ── Constants ─────────────────────────────────────────────────────────────

const EDGE_FN_URL = getSupabaseFunctionUrl('hyper-responder');

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
    throw new GoalGenerationError(
      'unauthorized',
      'You need to be signed in to generate a goal plan.',
    );
  return session;
}

function deriveGoalTitle(prompt: string) {
  const cleaned = prompt.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';

  const withoutPrefix = cleaned
    .replace(/^i want to\s+/i, '')
    .replace(/^i want\s+/i, '')
    .replace(/^my goal is to\s+/i, '');

  const sentence = withoutPrefix.split(/[.!?]/)[0]?.trim() ?? withoutPrefix;
  if (!sentence) return '';

  return sentence.charAt(0).toUpperCase() + sentence.slice(1, 96);
}

function toNonEmptyString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toGoalGenerationError(
  error: unknown,
  fallbackMessage: string,
  fallbackReason: GoalGenerationFailureReason = 'service',
) {
  if (error instanceof GoalGenerationError || error instanceof AILimitError) {
    return error;
  }

  if (error instanceof TypeError) {
    return new GoalGenerationError(
      'network',
      'We couldn’t reach AI goal generation. Check your connection and try again.',
    );
  }

  if (error instanceof Error) {
    return new GoalGenerationError(fallbackReason, error.message || fallbackMessage);
  }

  return new GoalGenerationError(fallbackReason, fallbackMessage);
}

function normalizeGoalSteps(value: unknown): UserGoal['steps'] {
  if (!Array.isArray(value)) return [];

  const steps: UserGoal['steps'] = [];

  value.forEach((step, index) => {
      if (!step || typeof step !== 'object') return null;

      const record = step as Record<string, unknown>;
      const label =
        toNonEmptyString(record.label) ||
        toNonEmptyString(record.title) ||
        toNonEmptyString(record.step) ||
        toNonEmptyString(record.action);

      if (!label) return;

      const links = Array.isArray(record.links)
        ? record.links.filter((item): item is string => typeof item === 'string')
        : [];

      steps.push({
        ...createBlankStep(index),
        label,
        notes:
          toNonEmptyString(record.notes) ||
          toNonEmptyString(record.description) ||
          toNonEmptyString(record.detail),
        idealFinish: toNonEmptyString(record.idealFinish) || null,
        estimatedTime:
          toNonEmptyString(record.estimatedTime) ||
          toNonEmptyString(record.duration),
        links: links.length > 0 ? links : undefined,
      });
  });

  return steps;
}

async function postGoalRequest(
  token: string,
  body: Record<string, unknown>,
) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(EDGE_FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.status >= 500 && attempt === 0) {
        lastError = new GoalGenerationError(
          'service',
          'The AI service had a temporary problem. Retrying once…',
        );
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt === 0) continue;
      throw toGoalGenerationError(
        error,
        'We couldn’t reach AI goal generation. Please try again.',
        'network',
      );
    }
  }

  throw toGoalGenerationError(
    lastError,
    'The AI service is unavailable right now. Please try again.',
    'service',
  );
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

  try {
    const res = await fetch(EDGE_FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action: 'clarify', prompt }),
    });

    if (!res.ok) {
      const raw = await res.text().catch(() => '');
      throw new GoalGenerationError(
        'service',
        raw ? `Clarifying questions failed: ${raw}` : 'Clarifying questions failed.',
      );
    }

    const data = await res.json() as { questions?: ClarifyingQuestion[] };
    return Array.isArray(data.questions) ? data.questions : [];
  } catch (error) {
    throw toGoalGenerationError(
      error,
      'We couldn’t load follow-up questions.',
      'service',
    );
  }
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
      usage: {
        credits_used: AI_ACTION_CREDIT_COSTS.goalGeneration,
        monthly_limit: BETA_MONTHLY_AI_CREDITS,
        remaining: BETA_MONTHLY_AI_CREDITS - AI_ACTION_CREDIT_COSTS.goalGeneration,
        tier: 'free',
        credits_cost: AI_ACTION_CREDIT_COSTS.goalGeneration,
      },
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

  const response = await postGoalRequest(session.access_token, {
    action: 'goal',
    prompt: prompt + answersBlock,
    userContext,
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
    throw new GoalGenerationError(
      response.status >= 500 ? 'service' : 'invalid_response',
      message,
    );
  }

  let data: { goal?: unknown; usage?: unknown };
  try {
    data = JSON.parse(raw);
  } catch {
    throw new GoalGenerationError(
      'invalid_response',
      'AI returned an unreadable goal plan. Please try again.',
    );
  }

  const result = (data.goal ?? data) as Record<string, unknown>;
  const usage = coerceAIUsage(data.usage, {
    credits_used: AI_ACTION_CREDIT_COSTS.goalGeneration,
    monthly_limit: BETA_MONTHLY_AI_CREDITS,
    remaining: BETA_MONTHLY_AI_CREDITS - AI_ACTION_CREDIT_COSTS.goalGeneration,
    tier: 'free',
    credits_cost: AI_ACTION_CREDIT_COSTS.goalGeneration,
  });

  const blank = createBlankGoal();
  const rawSteps =
    Array.isArray(result.steps)
      ? result.steps
      : Array.isArray(result.milestones)
        ? result.milestones
        : Array.isArray(result.tasks)
          ? result.tasks
          : [];
  const goal: UserGoal = {
    ...blank,
    title: toNonEmptyString(result.title) || deriveGoalTitle(prompt),
    subtitle:
      toNonEmptyString(result.subtitle) ||
      toNonEmptyString(result.summary) ||
      '',
    emoji:
      typeof result.emoji === 'string' && result.emoji.trim()
        ? result.emoji
        : '🎯',
    priority: isPriority(result.priority) ? result.priority : 'medium',
    steps: normalizeGoalSteps(rawSteps),
  };

  const missingParts: string[] = [];
  if (!goal.title.trim()) {
    missingParts.push('a clear goal title');
  }
  if (goal.steps.length === 0) {
    missingParts.push('at least one actionable step');
  }

  if (missingParts.length > 0) {
    throw new GoalGenerationError(
      'incomplete_goal',
      `We couldn’t finish a usable goal plan because the AI response was missing ${missingParts.join(' and ')}.`,
      { missingParts },
    );
  }

  // Keep usage cache in sync so pill/details card update immediately
  writeAIUsageCache(usage);

  return { goal, usage };
}
