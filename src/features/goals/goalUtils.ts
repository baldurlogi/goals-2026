export function getGoalProgress(def: { steps: { id: string; weight?: number }[] }, doneMap?:Record<string, boolean>) {
    const steps = def.steps;
    if (steps.length === 0) return { pct: 0, doneCount: 0, total: 0};

    // unweighted for now
    const doneCount = steps.reduce((acc, step) => acc + (doneMap?.[step.id] ? 1 : 0), 0);
    const pct = Math.round((doneCount / steps.length) * 100);
    return { pct, doneCount, total: steps.length };
}