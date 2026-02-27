import type { Meal, Macros } from "./nutritionTypes";

export type NutritionPhase = "maintain" | "cut";

/*
 - Two target profiles - swap with the phase toggle
 - Cut season: ~4-6 weeks before summer, tighter calories, same protein
*/

export const PHASE_TARGETS: Record<NutritionPhase, Macros & { note: string }> = {
    maintain: {
        cal: 2400,
        protein: 156,
        carbs: 260,
        fat: 68,
        note: "Maintenance / lean bulk, Male · 25yo · 78kg · 180cm · Training 6-7x/week."
    },
    cut: {
        cal: 2000,
        protein: 170, // higher protein protects muscle during cut
        carbs: 185,
        fat: 58,
        note: "Cut phase (4-6 weeks pre-summer) 400 kcal deficit, high protein."
    },
};

/* Convenience - used everywhere a single target object is needed */
export function getTargets(phase: NutritionPhase) {
    return PHASE_TARGETS[phase];
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
            items: ["80g rolled oats", "200ml milk", "1 tbsp chia seeds", "1 banana, sliced", "1 scoop protein powder (30g) mixed in"],
            macros: { cal: 480, protein: 45, carbs: 62, fat: 10},
            when: "WFH days (Mon/Tue) or any day - prep night before",
        },
        option2: {
            name: "Skyr Bowl with PB + Granola",
            items: ["200g skyr", "1 banana", "1 tbsp peanut butter", "30g granola"],
            macros: { cal: 400, protein: 27, carbs: 52, fat: 11 },
            when: "Office days (Wed-Fri) or any day - quick, no prep",
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
            note: "Estimate. Ask for chicken/fish when available. If light on protein, supplement with afternoon snack.",
            when: "Wed-Fri at office",
        },
    },
    afternoonSnack: {
        name: "Cottage Cheese + Rice Cakes + Apple",
        items: ["150g cottage cheese", "2 rice cakes (or lentil cakes)", "1 apple, sliced"],
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
        note: "Cut olive oil by half to save 80-120 kcal. Average across different recipes.",
        when: "~6:00pm",
    },
};