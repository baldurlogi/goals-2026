import { loadPRGoals, type PRGoal } from '@/features/fitness/fitnessStorage';
import type { MetricType, PREntry } from '@/features/fitness/fitnessStorage';
import { loadWeeklySplit } from '@/features/fitness/weeklySplitStorage';
import {
  loadGoalProgress,
  seedGoalStepHistory,
  type DoneState,
} from '@/features/goals/goalStore';
import {
  getLoggedMacros,
  loadNutritionLog,
  loadPhase,
  type NutritionLog,
} from '@/features/nutrition/nutritionStorage';
import { getTargets } from '@/features/nutrition/nutritionData';
import { isMacroSuccessful } from '@/features/nutrition/nutritionStatus';
import { loadUserGoals } from '@/features/goals/userGoalStorage';
import {
  loadReadingHistory,
  loadReadingInputs,
  type ReadingHistoryEntry,
} from '@/features/reading/readingStorage';
import {
  getDailyRoutine,
  getRoutineStreak,
  getSkinLog,
} from '@/features/skincare/skincareStorage';
import { loadModuleState } from '@/lib/goalModuleStorage';
import {
  listTodos,
  loadTodoCompletionHistory,
} from '@/features/todos/todoStorage';
import { loadProfile } from '@/features/onboarding/profileStorage';
import { supabase } from '@/lib/supabaseClient';
import type { AchievementCheckData } from './achievementTypes';

type LegacyFitnessLift = {
  label: string;
  goal: number;
  unit: MetricType;
  category: PRGoal['category'];
  history: PREntry[];
};

type LegacyFitnessStore = {
  lifts: Record<string, LegacyFitnessLift>;
};

type NutritionLogRow = {
  log_date: string;
  eaten: NutritionLog['eaten'];
  custom_entries: NutritionLog['customEntries'];
};

type WaterLogRow = {
  log_date: string;
  ml: number | null;
  target_ml: number | null;
};

type FinanceMonthRow = {
  state: {
    income?: number;
    categories?: Array<{
      budget?: number;
      spent?: number;
    }>;
  } | null;
};

function toLegacyFitness(prGoals: PRGoal[]): LegacyFitnessStore {
  return {
    lifts: Object.fromEntries(
      prGoals.map((goal) => [
        goal.id,
        {
          label: goal.label,
          goal: goal.goal,
          unit: goal.unit,
          category: goal.category,
          history: Array.isArray(goal.history) ? goal.history : [],
        },
      ]),
    ),
  };
}

function hasNutritionData(log: NutritionLog | null | undefined) {
  if (!log) return false;

  return (
    Object.values(log.eaten ?? {}).some(Boolean) ||
    (log.customEntries ?? []).length > 0
  );
}

function isBalancedNutritionDay(log: NutritionLog | null | undefined) {
  if (!log) return false;

  const eaten = log.eaten ?? {};
  const hasBreakfast = !!(eaten.breakfast1 || eaten.breakfast2);
  const hasLunch = !!(eaten.lunchWfh || eaten.lunchOffice);
  const hasDinner = !!eaten.dinner;

  return hasBreakfast && hasLunch && hasDinner;
}

function getLongestConsecutiveDateRun(dates: string[]) {
  if (dates.length === 0) return 0;

  const unique = [...new Set(dates)].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < unique.length; i += 1) {
    const previous = new Date(`${unique[i - 1]}T00:00:00`).getTime();
    const next = new Date(`${unique[i]}T00:00:00`).getTime();
    const diffDays = Math.round((next - previous) / 86400000);

    if (diffDays === 1) {
      current += 1;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  return longest;
}

function normalizeMealName(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

function buildReadingDailyTotals(history: ReadingHistoryEntry[]) {
  const byDate = new Map<
    string,
    {
      pagesRead: number;
      goalPages: number;
    }
  >();

  for (const entry of history) {
    const current = byDate.get(entry.date) ?? { pagesRead: 0, goalPages: 0 };
    byDate.set(entry.date, {
      pagesRead: current.pagesRead + Math.max(entry.pagesRead, 0),
      goalPages: Math.max(current.goalPages, Math.max(entry.goalPages, 0)),
    });
  }

  return Array.from(byDate.values());
}

function buildDailyCountMap(dates: string[]) {
  const counts = new Map<string, number>();

  for (const date of dates) {
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  return counts;
}

function toPositiveNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export async function buildAchievementCheckData(): Promise<AchievementCheckData> {
  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({
    data: { user: null },
  }));

  const userId = user?.id ?? null;
  const skincareGoalId = 'skincare';
  const financeGoalId = 'finance';

  const [
    goals,
    goalProgress,
    prGoals,
    weeklySplit,
    nutritionLog,
    reading,
    todos,
    profile,
    skincareDaily,
    skincareStreakState,
    skincareSkinLog,
    financeSavingsState,
  ] =
    await Promise.all([
      loadUserGoals().catch(() => []),
      loadGoalProgress(userId).catch(() => ({}) as DoneState),
      loadPRGoals().catch(() => []),
      loadWeeklySplit(userId).catch(() => null),
      loadNutritionLog(userId).catch(() => null),
      loadReadingInputs(userId).catch(() => null),
      listTodos().catch(() => []),
      loadProfile().catch(() => null),
      getDailyRoutine(skincareGoalId).catch(() => ({ dayISO: '', amDone: false, pmDone: false })),
      getRoutineStreak(skincareGoalId).catch(() => ({ lastISO: null, streak: 0 })),
      getSkinLog(skincareGoalId).catch(() => ({ entries: [] })),
      loadModuleState<{ saved: number }>(financeGoalId, 'savings', { saved: 0 }).catch(
        () => ({ saved: 0 }),
      ),
    ]);

  let readingStreak = 0;
  try {
    const s = await loadModuleState<{ streak: number }>(
      'reading',
      'reading_streak',
      { streak: 0 },
    );
    readingStreak = s?.streak ?? 0;
  } catch {
    // ignore
  }

  const readingHistory = userId ? loadReadingHistory(userId) : [];
  const readingDailyTotals = buildReadingDailyTotals(readingHistory);
  const readingGoalHitDays = readingDailyTotals.filter(
    (entry) => entry.goalPages > 0 && entry.pagesRead >= entry.goalPages,
  ).length;
  const readingPagesTotal = readingDailyTotals.reduce(
    (sum, entry) => sum + entry.pagesRead,
    0,
  );
  const readingBooksCompleted = (reading?.completed ?? []).length;

  const goalStepCompletionsTotal = userId
    ? seedGoalStepHistory(userId).length
    : 0;

  const goalsCompletedTotal = goals.filter((goal) => {
    if (!Array.isArray(goal.steps) || goal.steps.length === 0) return false;

    const doneMap = goalProgress[goal.id] ?? {};
    return goal.steps.every((step) => doneMap[step.id]);
  }).length;

  const fitnessCompletedWorkoutDays = weeklySplit
    ? Object.values(weeklySplit.days).filter((day) => day.completedDate !== null).length
    : 0;

  const fitnessWorkoutStreak = weeklySplit?.streak ?? 0;

  let nutritionLogsThisWeek = 0;
  let nutritionLoggedDaysTotal = 0;
  let nutritionProteinTargetHitDays = 0;
  let nutritionOnTargetDays = 0;
  let nutritionLongestLoggedStreak = 0;
  let nutritionRepeatedCustomMealCount = 0;
  let nutritionBalancedOnTargetDays = 0;
  try {
    if (user) {
      const [phase, { data }] = await Promise.all([
        loadPhase(user.id).catch(() => 'maintain' as const),
        supabase
          .from('nutrition_logs')
          .select('log_date, eaten, custom_entries')
          .eq('user_id', user.id),
      ]);

      const targets = getTargets(phase, profile);
      const logs = ((data ?? []) as NutritionLogRow[])
        .map((row) => ({
          date: row.log_date,
          eaten: (row.eaten ?? {}) as NutritionLog['eaten'],
          customEntries: (row.custom_entries ?? []) as NutritionLog['customEntries'],
        }))
        .filter(hasNutritionData);

      nutritionLogsThisWeek = logs.length;
      nutritionLoggedDaysTotal = logs.length;
      nutritionLongestLoggedStreak = getLongestConsecutiveDateRun(
        logs.map((log) => log.date),
      );

      const repeatedCustomMeals = new Map<string, number>();

      for (const log of logs) {
        const macros = getLoggedMacros(log);
        const proteinHit = isMacroSuccessful('protein', macros.protein, targets.protein);
        const macrosOnTarget =
          isMacroSuccessful('cal', macros.cal, targets.cal) &&
          proteinHit &&
          isMacroSuccessful('carbs', macros.carbs, targets.carbs) &&
          isMacroSuccessful('fat', macros.fat, targets.fat);

        if (proteinHit) {
          nutritionProteinTargetHitDays += 1;
        }

        if (macrosOnTarget) {
          nutritionOnTargetDays += 1;
          if (isBalancedNutritionDay(log)) {
            nutritionBalancedOnTargetDays += 1;
          }
        }

        for (const entry of log.customEntries ?? []) {
          const normalizedName = normalizeMealName(entry.name ?? '');
          if (!normalizedName) continue;

          repeatedCustomMeals.set(
            normalizedName,
            (repeatedCustomMeals.get(normalizedName) ?? 0) + 1,
          );
        }
      }

      nutritionRepeatedCustomMealCount = Math.max(0, ...repeatedCustomMeals.values());
    }
  } catch {
    // ignore
  }

  const todosCompletedTotal = todos.filter((t) => t.done).length;
  const todoCompletionHistory = userId ? loadTodoCompletionHistory(userId) : [];
  const completedTodoEvents = todoCompletionHistory.filter((entry) => entry.completed);
  const todoCompletionEventsTotal = completedTodoEvents.length;
  const todoCompletionDates = completedTodoEvents.map((entry) => entry.date);
  const todoCompletionStreak = getLongestConsecutiveDateRun(todoCompletionDates);
  const todoBestDayCompletions = Math.max(
    0,
    ...buildDailyCountMap(todoCompletionDates).values(),
  );

  let waterGoalHitDays = 0;
  let waterLoggedTotalMl = 0;
  let sleepLoggedDaysTotal = 0;
  let sleepSevenHourNights = 0;
  let sleepHighQualityNights = 0;
  let wellbeingCheckInsTotal = 0;
  let wellbeingJournalDays = 0;
  let wellbeingGratitudeDays = 0;
  let financeHasBudgetSet = false;
  let financeHasExpenseLogged = false;
  let financeMonthlyPlansBuilt = 0;
  let financeUnderBudgetCategoryWins = 0;

  try {
    if (userId) {
      const [
        waterResult,
        sleepResult,
        wellbeingResult,
        financeResult,
      ] = await Promise.all([
        supabase
          .from('water_logs')
          .select('log_date, ml, target_ml')
          .eq('user_id', userId),
        supabase
          .from('sleep_recovery_logs')
          .select('log_date, sleep_duration_minutes, sleep_quality_score')
          .eq('user_id', userId),
        supabase
          .from('mental_wellbeing_logs')
          .select('log_date, journal_entry, gratitude_entry')
          .eq('user_id', userId),
        supabase
          .from('finance_months')
          .select('state')
          .eq('user_id', userId)
          .eq('goal_id', financeGoalId),
      ]);

      const waterRows = (waterResult.data ?? []) as WaterLogRow[];
      waterLoggedTotalMl = waterRows.reduce(
        (sum, row) => sum + Math.max(Number(row.ml ?? 0), 0),
        0,
      );
      waterGoalHitDays = waterRows.filter((row) => {
        const ml = Math.max(Number(row.ml ?? 0), 0);
        const target = Math.max(Number(row.target_ml ?? 2500), 250);
        return ml >= target;
      }).length;

      const sleepRows = (sleepResult.data ??
        []) as Array<{
        log_date: string;
        sleep_duration_minutes: number | null;
        sleep_quality_score: number | null;
      }>;
      sleepLoggedDaysTotal = sleepRows.length;
      sleepSevenHourNights = sleepRows.filter(
        (row) => (row.sleep_duration_minutes ?? 0) >= 420,
      ).length;
      sleepHighQualityNights = sleepRows.filter(
        (row) => (row.sleep_quality_score ?? 0) >= 80,
      ).length;

      const wellbeingRows = (wellbeingResult.data ??
        []) as Array<{
        log_date: string;
        journal_entry: string | null;
        gratitude_entry: string | null;
      }>;
      wellbeingCheckInsTotal = wellbeingRows.length;
      wellbeingJournalDays = wellbeingRows.filter(
        (row) => (row.journal_entry?.trim() ?? '') !== '',
      ).length;
      wellbeingGratitudeDays = wellbeingRows.filter(
        (row) => (row.gratitude_entry?.trim() ?? '') !== '',
      ).length;

      const financeRows = (financeResult.data ?? []) as FinanceMonthRow[];
      for (const row of financeRows) {
        const monthState = row.state;
        if (!monthState) continue;

        const income = toPositiveNumber(monthState.income);
        const categories = Array.isArray(monthState.categories)
          ? monthState.categories
          : [];

        const budgetedCategories = categories.filter(
          (category) => toPositiveNumber(category.budget) > 0,
        );
        const spentCategories = categories.filter(
          (category) => toPositiveNumber(category.spent) > 0,
        );
        const underBudgetCategories = categories.filter((category) => {
          const budget = toPositiveNumber(category.budget);
          const spent = toPositiveNumber(category.spent);
          return budget > 0 && spent > 0 && spent <= budget;
        });

        if (budgetedCategories.length > 0) {
          financeHasBudgetSet = true;
        }
        if (spentCategories.length > 0) {
          financeHasExpenseLogged = true;
        }
        if (income > 0 && budgetedCategories.length >= 3) {
          financeMonthlyPlansBuilt += 1;
        }

        financeUnderBudgetCategoryWins += underBudgetCategories.length;
      }
    }
  } catch {
    // ignore
  }

  const skincareAmCompletedEver =
    skincareDaily.amDone || skincareStreakState.lastISO !== null;
  const skincarePmCompletedEver =
    skincareDaily.pmDone || skincareStreakState.lastISO !== null;
  const skincareFullDaysCompletedEver =
    (skincareDaily.amDone && skincareDaily.pmDone) || skincareStreakState.lastISO !== null;
  const skincareStreak = skincareStreakState.streak ?? 0;
  const skincareSkinLogsTotal = (skincareSkinLog.entries ?? []).length;
  const financeSavingsTotal = Math.max(0, toPositiveNumber(financeSavingsState.saved));

  const enabledModules =
    (profile as unknown as { enabled_modules?: string[] })?.enabled_modules ?? [];

  let accountAgeDays = 0;
  try {
    if (user?.created_at) {
      accountAgeDays = Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) / 86400000,
      );
    }
  } catch {
    // ignore
  }

  return {
    goals,
    goalsCompletedTotal,
    goalStepCompletionsTotal,
    fitness: toLegacyFitness(prGoals),
    fitnessCompletedWorkoutDays,
    fitnessWorkoutStreak,
    nutritionLog,
    nutritionLogsThisWeek,
    nutritionLoggedDaysTotal,
    nutritionProteinTargetHitDays,
    nutritionOnTargetDays,
    nutritionLongestLoggedStreak,
    nutritionRepeatedCustomMealCount,
    nutritionBalancedOnTargetDays,
    reading,
    readingStreak,
    readingGoalHitDays,
    readingPagesTotal,
    readingBooksCompleted,
    todos,
    todosCompletedTotal,
    todoCompletionEventsTotal,
    todoBestDayCompletions,
    todoCompletionStreak,
    waterGoalHitDays,
    waterLoggedTotalMl,
    sleepLoggedDaysTotal,
    sleepSevenHourNights,
    sleepHighQualityNights,
    wellbeingCheckInsTotal,
    wellbeingJournalDays,
    wellbeingGratitudeDays,
    skincareAmCompletedEver,
    skincarePmCompletedEver,
    skincareFullDaysCompletedEver,
    skincareStreak,
    skincareSkinLogsTotal,
    financeHasBudgetSet,
    financeHasExpenseLogged,
    financeMonthlyPlansBuilt,
    financeUnderBudgetCategoryWins,
    financeSavingsTotal,
    enabledModules,
    accountAgeDays,
  };
}
