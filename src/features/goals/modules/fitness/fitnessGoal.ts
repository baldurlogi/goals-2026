import type { GoalDefinition } from "../../goalTypes";


export const fitnessGoal: GoalDefinition = {
    id: "fitness-nutrition",
    title: "Fitness & Nutrition Master Plan",
    subtitle: "Stay lean at 76-78kg while building muscle",
    emoji: "💪",
    priority: "high",
    steps: [
        {
            id: "buy-supplements",
            label: "Buy supplement stack",
            notes: "Creatine (5g/day), Vitamin D3 (4000 IU), Omega-3 (2-3g), Magnesium Glycinate (400mg before bed). Order from Bodylab.dk or Matas.",
            idealFinish: "2026-02-20",
            estimatedTime: "1 hour",
            links: ["https://bodylab.dk", "https://matas.dk"]
        },
        {
            id: "calculate-macros",
            label: "Calculate exact daily macros",
            notes: "Use MyFitnessPal or MacroFactor. Target: 170-185g protein, 230-260g carbs, 60-70g fats = 2,450-2,650 kcal",
            idealFinish: "2026-02-21",
            estimatedTime: "30 min"
        },
        {
            id: "meal-prep-first",
            label: "Complete first week meal prep",
            notes: "Prep breakfast (overnight oats + eggs), pre-workout snacks (bananas, yogurt), evening snacks (cottage cheese)",
            idealFinish: "2026-02-23",
            estimatedTime: "2 hours"
        },
        {
            id: "track-week-1",
            label: "Track food for 1 full week",
            notes: "Use MyFitnessPal daily. Hit protein target first, then fill in carbs/fats. Adjust HelloFresh portions.",
            idealFinish: "2026-03-01",
            estimatedTime: "10 min/day"
        },
        {
            id: "workout-split-4-weeks",
            label: "Complete 4 weeks of workout split consistently",
            notes: "Mon: Upper Push, Tue: Lower Squat, Wed: Swim, Thu: Upper Pull, Fri: Lower Hinge, Sat: CrossFit, Sun: Rest. Track every workout.",
            idealFinish: "2026-03-22",
            estimatedTime: "8-10 hrs/week"
        },
        {
            id: "progress-photos-1",
            label: "Take first progress photos",
            notes: "Front, side, back in mirror. Same lighting, same time of day. Store in private folder.",
            idealFinish: "2026-02-25",
            estimatedTime: "5 min"
        },
        {
            id: "progressive-overload-8-weeks",
            label: "Track progressive overload for 8 weeks",
            notes: "Use Strong app or notebook. Add 2.5-5kg to compounds every 2 weeks, or +1-2 reps on accessories.",
            idealFinish: "2026-04-15",
            estimatedTime: "5 min/workout"
        },
        {
            id: "deload-week-1",
            label: "Complete first deload week",
            notes: "Reduce volume by 50%, maintain intensity. Focus on recovery and sleep.",
            idealFinish: "2026-04-20",
            estimatedTime: "4-5 hrs/week"
        },
        {
            id: "body-comp-check",
            label: "Get body composition analysis",
            notes: "InBody scan at SATS or local clinic. Track body fat %, lean mass. Target: 10-12% body fat.",
            idealFinish: "2026-05-01",
            estimatedTime: "30 min",
            links: ["https://sats.com"]
        },
        {
            id: "progress-photos-2",
            label: "Take mid-year progress photos",
            notes: "Same setup as first photos. Compare side-by-side. Celebrate wins!",
            idealFinish: "2026-07-01",
            estimatedTime: "5 min"
        },
        {
            id: "summer-body-ready",
            label: "Achieve summer body goal",
            notes: "76-78kg, visible abs, defined shoulders/back. Final progress photos + measurements.",
            idealFinish: "2026-08-01",
            estimatedTime: "ongoing"
        },
        {
            id: "maintain-through-dec",
            label: "Maintain physique through December",
            notes: "Continue consistent training + nutrition. Adjust for travel. Take final year-end photos.",
            idealFinish: "2026-12-31",
            estimatedTime: "ongoing"
        }
    ]
}