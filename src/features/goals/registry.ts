import type { GoalDefinition } from "./goalTypes";

export const goalsRegistry: GoalDefinition[] = [
    {
        id: "half-marathon",
        title: "Half Marathon Training Plan",
        subtitle: "Build endurance + complete a 21km race in 2026",
        emoji: "🏃‍♂️",
        steps: [
            {id: "shoes", label: "Buy proper running shoes" },
            {id: "baseline-5k", label: "Run baseline 5k (record time)" },
            {id: "3x-week", label: "Run 3x/week for 4 weeks" },
            {id: "longrun-10k", label: "Complete a 10km long run" },
            {id: "longrun-15k", label: "Complete a 15km long run" },
            {id: "longrun-18k", label: "Complete a 18km long run" },
            {id: "strength-2x", label: "Strength train 2x/week for 6 weeks" },
            {id: "taper", label: "Complete taper week" },
            {id: "race-day", label: "Run the half marathon (21.1km)" },
        ]
    }
];