import type { UserProfile } from "@/features/onboarding/profileStorage";
import type { Meal, Macros } from "./nutritionTypes";

export type NutritionPhase =
  | "fat_loss"
  | "maintain"
  | "recomp"
  | "muscle_gain"
  | "performance";

export type StoredNutritionPhase = NutritionPhase | "cut";

export const DEFAULT_VISIBLE_NUTRITION_PHASES: NutritionPhase[] = [
  "fat_loss",
  "maintain",
];

export const NUTRITION_PHASE_OPTIONS: Array<{
  value: NutritionPhase;
  label: string;
  helper: string;
  emoji: string;
}> = [
  {
    value: "fat_loss",
    label: "Fat loss",
    helper: "Pull calories down while keeping protein higher.",
    emoji: "✂️",
  },
  {
    value: "maintain",
    label: "Maintain",
    helper: "Hold steady with balanced daily targets.",
    emoji: "⚖️",
  },
  {
    value: "recomp",
    label: "Recomp",
    helper: "Small deficit with extra protein for body recomposition.",
    emoji: "🔁",
  },
  {
    value: "muscle_gain",
    label: "Muscle gain",
    helper: "Lean-gain targets with a moderate calorie surplus.",
    emoji: "💪",
  },
  {
    value: "performance",
    label: "Performance",
    helper: "Higher-fuel setup with extra carbs for training output.",
    emoji: "⚡",
  },
];

export type NutritionTargetProfile = Pick<
  UserProfile,
  | "display_name"
  | "macro_maintain"
  | "macro_cut"
  | "macro_recomp"
  | "macro_muscle_gain"
  | "macro_performance"
>;

function roundToFive(value: number) {
  return Math.max(0, Math.round(value / 5) * 5);
}

function buildTargets(cal: number, protein: number, fat: number): Macros {
  const normalizedCalories = Math.max(1200, roundToFive(cal));
  const normalizedProtein = Math.max(0, roundToFive(protein));
  const normalizedFat = Math.max(35, roundToFive(fat));
  const carbsFromCalories =
    (normalizedCalories - normalizedProtein * 4 - normalizedFat * 9) / 4;

  return {
    cal: normalizedCalories,
    protein: normalizedProtein,
    carbs: Math.max(0, roundToFive(carbsFromCalories)),
    fat: normalizedFat,
  };
}

function deriveTargets(
  base: Macros,
  adjustments: {
    calorieDelta: number;
    proteinDelta?: number;
    fatDelta?: number;
  },
): Macros {
  return buildTargets(
    base.cal + adjustments.calorieDelta,
    base.protein + (adjustments.proteinDelta ?? 0),
    base.fat + (adjustments.fatDelta ?? 0),
  );
}

function deriveRecompTargets(
  maintain: Macros,
  cut: Macros | null,
): Macros {
  if (cut) {
    return buildTargets(
      (maintain.cal + cut.cal) / 2,
      Math.max(maintain.protein, cut.protein),
      (maintain.fat + cut.fat) / 2,
    );
  }

  return deriveTargets(maintain, {
    calorieDelta: -100,
    proteinDelta: 10,
    fatDelta: -5,
  });
}

function deriveMuscleGainTargets(maintain: Macros): Macros {
  return deriveTargets(maintain, {
    calorieDelta: 225,
    proteinDelta: 10,
    fatDelta: 5,
  });
}

function derivePerformanceTargets(maintain: Macros): Macros {
  return deriveTargets(maintain, {
    calorieDelta: 180,
    proteinDelta: 0,
    fatDelta: 0,
  });
}

export function normalizeNutritionPhase(
  phase: string | null | undefined,
): NutritionPhase {
  switch (phase) {
    case "fat_loss":
    case "maintain":
    case "recomp":
    case "muscle_gain":
    case "performance":
      return phase;
    case "cut":
      return "fat_loss";
    default:
      return "maintain";
  }
}

export function normalizeNutritionGoalFocuses(
  focuses: unknown,
): NutritionPhase[] {
  if (!Array.isArray(focuses)) {
    return [...DEFAULT_VISIBLE_NUTRITION_PHASES];
  }

  const normalized = focuses
    .map((value) =>
      typeof value === "string" ? normalizeNutritionPhase(value) : null,
    )
    .filter((value): value is NutritionPhase => value !== null);

  const deduped = [...new Set(normalized)];
  return deduped.length > 0
    ? deduped
    : [...DEFAULT_VISIBLE_NUTRITION_PHASES];
}

export function getPreferredNutritionPhase(
  focuses: NutritionPhase[] | null | undefined,
  fallback: NutritionPhase = "maintain",
): NutritionPhase {
  return Array.isArray(focuses) && focuses.length > 0
    ? normalizeNutritionGoalFocuses(focuses)[0] ?? fallback
    : fallback;
}

export function getFallbackNutritionPhaseForServer(
  phase: NutritionPhase,
): "maintain" | "cut" {
  return phase === "fat_loss" ? "cut" : "maintain";
}

function getPhaseMeta(phase: NutritionPhase) {
  return (
    NUTRITION_PHASE_OPTIONS.find((option) => option.value === phase) ??
    NUTRITION_PHASE_OPTIONS[1]
  );
}

// Fallback hardcoded targets — used only if profile has no macros set yet
const FALLBACK_TARGETS: Record<NutritionPhase, Macros & { note: string }> = {
  fat_loss: {
    cal: 2000,
    protein: 170,
    carbs: 185,
    fat: 58,
    note: "Default fat-loss targets — complete onboarding to personalise.",
  },
  maintain: {
    cal: 2700,
    protein: 160,
    carbs: 340,
    fat: 75,
    note: "Default targets — complete onboarding to personalise.",
  },
  recomp: {
    cal: 2600,
    protein: 170,
    carbs: 295,
    fat: 70,
    note: "Default recomp targets — complete onboarding to personalise.",
  },
  muscle_gain: {
    cal: 2925,
    protein: 170,
    carbs: 380,
    fat: 80,
    note: "Default muscle-gain targets — complete onboarding to personalise.",
  },
  performance: {
    cal: 2880,
    protein: 160,
    carbs: 390,
    fat: 70,
    note: "Default performance targets — complete onboarding to personalise.",
  },
};

/** Returns macro targets — from user profile if available, fallback otherwise */
export function getTargets(
  phase: NutritionPhase,
  profile?: NutritionTargetProfile | null,
): Macros & { note: string } {
  const baseMaintain = profile?.macro_maintain ?? FALLBACK_TARGETS.maintain;
  const baseFatLoss =
    profile?.macro_cut ??
    deriveTargets(baseMaintain, {
      calorieDelta: -400,
      proteinDelta: 10,
      fatDelta: -8,
    });

  const displayName = profile?.display_name ?? "you";
  const phaseMeta = getPhaseMeta(phase);

  if (phase === "maintain" && profile?.macro_maintain) {
    return {
      ...profile.macro_maintain,
      note: `Personalised maintain target for ${displayName}.`,
    };
  }

  if (phase === "fat_loss" && profile?.macro_cut) {
    return {
      ...profile.macro_cut,
      note: `Personalised fat-loss target for ${displayName}.`,
    };
  }

  if (phase === "recomp" && profile?.macro_recomp) {
    return {
      ...profile.macro_recomp,
      note: `Personalised recomp target for ${displayName}.`,
    };
  }

  if (phase === "muscle_gain" && profile?.macro_muscle_gain) {
    return {
      ...profile.macro_muscle_gain,
      note: `Personalised muscle-gain target for ${displayName}.`,
    };
  }

  if (phase === "performance" && profile?.macro_performance) {
    return {
      ...profile.macro_performance,
      note: `Personalised performance target for ${displayName}.`,
    };
  }

  if (!profile?.macro_maintain && !(phase === "fat_loss" && profile?.macro_cut)) {
    return FALLBACK_TARGETS[phase];
  }

  switch (phase) {
    case "fat_loss":
      return {
        ...baseFatLoss,
        note:
          profile?.macro_cut
            ? `Personalised fat-loss target for ${displayName}.`
            : `Derived fat-loss target from your current macros.`,
      };
    case "maintain":
      return {
        ...baseMaintain,
        note: `Personalised maintain target for ${displayName}.`,
      };
    case "recomp":
      return {
        ...deriveRecompTargets(baseMaintain, profile?.macro_cut ?? null),
        note:
          profile?.macro_recomp
            ? `Personalised recomp target for ${displayName}.`
            : `Derived recomp target from your current macros.`,
      };
    case "muscle_gain":
      return {
        ...deriveMuscleGainTargets(baseMaintain),
        note:
          profile?.macro_muscle_gain
            ? `Personalised ${phaseMeta.label.toLowerCase()} target for ${displayName}.`
            : `Derived ${phaseMeta.label.toLowerCase()} target from your current macros.`,
      };
    case "performance":
      return {
        ...derivePerformanceTargets(baseMaintain),
        note:
          profile?.macro_performance
            ? `Personalised ${phaseMeta.label.toLowerCase()} target for ${displayName}.`
            : `Derived ${phaseMeta.label.toLowerCase()} target from your current macros.`,
      };
  }
}

export function getPhaseTargetsForEditor(
  phase: NutritionPhase,
  profile?: NutritionTargetProfile | null,
): Macros {
  const targets = getTargets(phase, profile);
  return {
    cal: targets.cal,
    protein: targets.protein,
    carbs: targets.carbs,
    fat: targets.fat,
  };
}

export const meals = {
  breakfast: {
    option1: {
      name: "Overnight Oats + Protein Powder",
      items: ["80g rolled oats", "200ml milk", "1 tbsp chia seeds", "1 banana, sliced", "1 scoop protein powder (30g)"],
      macros: { cal: 480, protein: 45, carbs: 62, fat: 10 },
      when: "WFH days (Mon/Tue) or any day — prep night before",
    },
    option2: {
      name: "Skyr Bowl with PB + Granola",
      items: ["200g skyr", "1 banana", "1 tbsp peanut butter", "30g granola"],
      macros: { cal: 400, protein: 27, carbs: 52, fat: 11 },
      when: "Office days (Wed-Fri) or any day — quick, no prep",
    },
  },
  lunch: {
    wfh: {
      name: "Turkey/Chicken Wrap",
      items: ["1 whole wheat tortilla", "100g turkey or chicken slices", "1 cheese slice", "Handful of spinach", "Sriracha"],
      macros: { cal: 320, protein: 28, carbs: 32, fat: 10 },
      when: "Mon/Tue WFH — make 2-3 on Sunday, store in fridge",
    },
    office: {
      name: "Office Lunch (provided)",
      items: ["Varies — aim for protein-heavy options"],
      macros: { cal: 500, protein: 35, carbs: 50, fat: 15 },
      note: "Estimate. Ask for chicken/fish when available.",
      when: "Wed-Fri at office",
    },
  },
  afternoonSnack: {
    name: "Cottage Cheese + Rice Cakes + Apple",
    items: ["150g cottage cheese", "2 rice cakes", "1 apple, sliced"],
    macros: { cal: 280, protein: 22, carbs: 38, fat: 3 },
    when: "Between lunch and gym (3-4pm)",
  },
  postWorkout: {
    name: "Protein Shake",
    items: ["1 scoop protein powder (30g)", "250ml sweet milk"],
    macros: { cal: 260, protein: 31, carbs: 13, fat: 11 },
    when: "Right after gym (~5:30pm)",
  },
  dinner: {
    name: "Hello Fresh Meal",
    items: ["Varies — typically protein + veggies + carbs"],
    macros: { cal: 550, protein: 37, carbs: 55, fat: 18 },
    note: "Cut olive oil by half to save 80-120 kcal.",
    when: "~6:00pm",
  },
} satisfies {
  breakfast: { option1: Meal; option2: Meal };
  lunch: { wfh: Meal; office: Meal };
  afternoonSnack: Meal;
  postWorkout: Meal;
  dinner: Meal;
};
