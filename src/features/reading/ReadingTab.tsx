import { useMemo, useState } from "react";
import type { ReadingFieldPath, ReadingInputs } from "./readingTypes";
import { canAcceptDigitsOrBlank, getReadingStats, inputsToPlan } from "./readingUtils";
import { ReadingInputsCard } from "./components/ReadingInputsCard";
import { Button } from "@/components/ui/button";
import { ReadingNowCard } from "./components/ReadingNowCard";
import { ReadingNextCard } from "./components/ReadingNextCard";

const DEFAULT_INPUTS: ReadingInputs = {
    current: {
        title: "The Hunger Games: Sunrise of the Reaping",
        author: "Suzan Collins",
        currentPage: "257",
        totalPages: "382",
    },
    next: {
        title: "The 7 Habits of Highly Effective People",
        author: "Stephen Covey",
        totalPages: "366",
    },
    dailyGoalPages: "20",
};

export function ReadingTab() {
    const [inputs, setInputs] = useState<ReadingInputs>(DEFAULT_INPUTS);

    const stats = useMemo(() => {
        const plan = inputsToPlan(inputs);
        return getReadingStats(plan);
    }, [inputs]);

    function updateField(path: ReadingFieldPath, value: string) {
        // digit-only fields
        const digitOnlyPaths: ReadingFieldPath[] = [
            "current.currentPage",
            "current.totalPages",
            "dailyGoalPages",
            "next.totalPages",
        ];

        if (digitOnlyPaths.includes(path) && !canAcceptDigitsOrBlank(value)) return;

        setInputs((prev) => {
            if (path === "current.title") return { ...prev, current: { ...prev.current, title: value } };
            if (path === "current.author") return { ...prev, current: { ...prev.current, author: value } };
            if (path === "current.currentPage") return { ...prev, current: { ...prev.current, currentPage: value } };
            if (path === "current.totalPages") return { ...prev, current: { ...prev.current, totalPages: value } };
            if (path === "dailyGoalPages") return { ...prev, dailyGoalPages: value };

            if (path === "next.title" && prev.next) return { ...prev, next: { ...prev.next, title: value } };
            if (path === "next.author" && prev.next) return { ...prev, next: { ...prev.next, author: value } };
            if (path === "next.totalPages" && prev.next) return { ...prev, next: { ...prev.next, totalPages: value } };

            return prev;
        })
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: inputs */}
            <div className="space-y-4">
                <ReadingInputsCard value={inputs} onChange={updateField} />

                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setInputs(DEFAULT_INPUTS)}>
                        Reset
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() =>
                            setInputs((prev) => ({
                                ...prev,
                                next: prev.next
                                    ? undefined
                                    : { title: "Next book", author: "Author", totalPages: "300" },
                            }))
                        }
                    >
                        {inputs.next ? "Remove Up Next" : "Add Up Next"}
                    </Button>
                </div>
            </div>

            {/* Right: results */}
            <div className="space-y-4">
                <ReadingNowCard stats={stats} />
                <ReadingNextCard stats={stats} />
            </div>
        </div>
    );
}