import type { Macros } from "./nutritionTypes";
import { meals } from "./nutritionData";

export function calculateDailyTotals(breakfastOption: 1 | 2): Macros {
    const breakfast = breakfastOption === 1 ? meals.breakfast.option1 : meals.breakfast.option2;
    const lunch =  meals.lunch.wfh;
    const snack = meals.afternoonSnack;
    const shake = meals.postWorkout;
    const dinner = meals.dinner;

    return {
        cal: breakfast.macros.cal + lunch.macros.cal + snack.macros.cal + shake.macros.cal + dinner.macros.cal,
        protein: breakfast.macros.protein + lunch.macros.protein + snack.macros.protein + shake.macros.protein + dinner.macros.protein,
        carbs: breakfast.macros.carbs + lunch.macros.carbs + snack.macros.carbs + shake.macros.carbs + dinner.macros.carbs,
        fat: breakfast.macros.fat + lunch.macros.fat + snack.macros.fat + shake.macros.fat + dinner.macros.fat,
    };
}