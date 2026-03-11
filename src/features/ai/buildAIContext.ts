import { buildAISignals, type AISignals } from '@/features/ai/aiSignals';
import {
  loadAIProfile,
  saveAIProfile,
  type AIUserProfile,
  type PreferredTone,
} from '@/features/ai/aiUserProfile';

export type AIContext = {
  systemContext: string;
  signals: AISignals;
  aiProfile: AIUserProfile | null;
};

function buildSystemPrompt(
  signals: AISignals,
  aiProfile: AIUserProfile | null,
): string {
  const tone = aiProfile?.preferred_tone ?? 'direct';

  const toneInstructions: Record<PreferredTone, string> = {
    direct: 'Be direct and concise. Lead with the action.',
    encouraging:
      'Be warm and encouraging. Celebrate progress and reduce overwhelm.',
    analytical:
      'Be precise and data-driven. Reference concrete numbers when useful.',
    tough_love:
      'Be firm, honest, and action-oriented. Push the user to stop avoiding the obvious next step without being insulting.',
  };

  const topGoals =
    signals.goals.topGoals.length > 0
      ? signals.goals.topGoals
          .map(
            (goal, index) =>
              `${index + 1}. ${goal.title} (${goal.priority ?? 'unknown'} priority${
                goal.nextStepLabel ? `, next step: ${goal.nextStepLabel}` : ''
              })`,
          )
          .join('\n')
      : 'No goals yet';

  const readingLine = signals.reading.currentBookTitle
    ? `Current book: ${signals.reading.currentBookTitle}${
        signals.reading.author ? ` by ${signals.reading.author}` : ''
      }. Target: ${signals.reading.targetPages} pages/day. Streak: ${signals.reading.streak} day(s).`
    : `No current book set. Target: ${signals.reading.targetPages} pages/day. Streak: ${signals.reading.streak} day(s).`;

  const extraNotes = [aiProfile?.personality_notes, aiProfile?.lifestyle_notes]
    .filter(Boolean)
    .join('\n');

  return `You are a personal life coach AI embedded inside the user's Life OS app.

## User summary
Name: ${signals.profile.displayName ?? 'Unknown'}
Activity level: ${signals.profile.activityLevel ?? 'Unknown'}
Preferred schedule view: ${signals.profile.preferredScheduleView ?? 'Unknown'}
Daily reading goal: ${signals.profile.dailyReadingGoal ?? 'Unknown'}
Plan tier: ${signals.profile.tier ?? 'free'}

## Enabled modules
${signals.modules.join(', ')}

## Goals
Goal count: ${signals.goals.count}
Overdue steps: ${signals.goals.overdueSteps}
Highest priority goal: ${signals.goals.highestPriorityTitle ?? 'None'}
Next step on top goal: ${signals.goals.nextStepLabel ?? 'None'}
Top goals:
${topGoals}

## Nutrition
Phase: ${signals.nutrition.phase}
Meals logged today: ${signals.nutrition.mealsLoggedToday}
Calorie target: ${signals.nutrition.calorieTarget ?? 'Unknown'}
Protein target: ${signals.nutrition.proteinTarget ?? 'Unknown'}

## Reading
${readingLine}

## Fitness
Days since workout: ${signals.fitness.daysSinceWorkout ?? 'Unknown'}
Strongest lift: ${signals.fitness.strongestLift ?? 'Unknown'}
Weakest lift: ${signals.fitness.weakestLift ?? 'Unknown'}

## Coaching style
${extraNotes || 'The user benefits from concrete, small, low-friction next steps.'}
${toneInstructions[tone]}

Keep responses specific, actionable, and tied to the user's real data.
Never repeat long summaries back to the user.`;
}

export async function buildAIContext(
  forceRefresh = false,
): Promise<AIContext> {
  const aiProfile = await loadAIProfile();

  // Always rebuild signals fresh — the 5-min cache in buildAISignals is sufficient.
  // We never serve the 30-min Supabase snapshot here because nutrition, todos, and
  // schedule change throughout the day and must always reflect current state.
  const signals = await buildAISignals(forceRefresh);
  const builtAt = new Date().toISOString();

  await saveAIProfile({
    last_context_snapshot: signals as unknown as Record<string, unknown>,
    last_context_built_at: builtAt,
    active_modules: signals.modules,
    preferred_step_count: aiProfile?.preferred_step_count ?? 5,
    preferred_tone: aiProfile?.preferred_tone ?? 'direct',
  });

  return {
    systemContext: buildSystemPrompt(signals, aiProfile),
    signals,
    aiProfile,
  };
}

export async function getAISystemContext(
  forceRefresh = false,
): Promise<string> {
  const { systemContext } = await buildAIContext(forceRefresh);
  return systemContext;
}