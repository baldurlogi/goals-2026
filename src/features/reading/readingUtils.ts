import { clamp, digitsOnly, toInt } from "@/lib/utils";
import type { ReadingInputs, ReadingPlan, ReadingStats } from "./readingTypes";

export function inputsToPlan(inputs: ReadingInputs): ReadingPlan {
    return {
        current: {
            title: inputs.current.title,
            author: inputs.current.author,
            currentPage: toInt(inputs.current.currentPage, 0),
            totalPages: toInt(inputs.current.totalPages, 1),
        },
        next: inputs.next
            ? {
                title: inputs.next.title,
                author: inputs.next.author,
                totalPages: toInt(inputs.next.totalPages, 0),
              }
            : undefined,
        dailyGoalPages: toInt(inputs.dailyGoalPages, 1),
    };
}

export function getReadingStats(plan: ReadingPlan): ReadingStats {
    const currentPage = clamp(plan.current.currentPage, 0, plan.current.totalPages);
    const totalPages = Math.max(1, plan.current.totalPages);

    const pagesLeft = Math.max(0, totalPages - currentPage);
    const pct = Math.round((currentPage / totalPages) * 100);

    const daily = Math.max(1, plan.dailyGoalPages);
    const daysToFinishCurrent = Math.ceil(pagesLeft / daily);

    const daysToFinishNext = plan.next && plan.next.totalPages > 0 ? Math.ceil(plan.next.totalPages / daily) : undefined;

    return {
        ...plan,
        current: { ...plan.current, currentPage, totalPages},
        pct,
        pagesLeft,
        daysToFinishCurrent,
        daysToFinishNext
    };
}

export function canAcceptDigitsOrBlank(value: string) {
    return digitsOnly(value);
}