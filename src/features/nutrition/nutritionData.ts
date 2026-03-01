import type { Meal, Macros } from "./nutritionTypes";
import { readProfileCache } from "@/features/onboarding/profileStorage";

export type NutritionPhase = "maintain" | "cut";

// Fallback hardcoded targets — used only if profile has no macros set yet
const FALLBACK_TARGETS: Record<NutritionPhase, Macros & { note: string }> = {
  maintain: {
    cal: 2400, protein: 156, carbs: 260, fat: 68,
    note: "Default targets — complete onboarding to personalise.",
  },
  cut: {
    cal: 2000, protein: 170, carbs: 185, fat: 58,
    note: "Default cut targets — complete onboarding to personalise.",
  },
};

/** Returns macro targets — from user profile if available, fallback otherwise */
export function getTargets(phase: NutritionPhase): Macros & { note: string } {
  const profile = readProfileCache();

  if (phase === "maintain" && profile?.macro_maintain) {
    return { ...profile.macro_maintain, note: `Personalised · ${profile.display_name ?? "you"}` };
  }
  if (phase === "cut" && profile?.macro_cut) {
    return { ...profile.macro_cut, note: "Personalised cut phase" };
  }

  return FALLBACK_TARGETS[phase];
}

export const meals: {
  breakfast: { option1: Meal; option2: Meal };
  lunch: { wfh: Meal; office: Meal };
  afternoonSnack: Meal;
  postWorkout: Meal;
  dinner: Meal;
} = {
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
};