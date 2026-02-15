import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GoalDefinition } from "../goalTypes"
import { getGoalProgress } from "../goalUtils";
import { Progress } from "@/components/ui/progress";
import { StepChecklist } from "./StepChecklist";
import { Button } from "@/components/ui/button";

type Props = {
    goal: GoalDefinition;
    doneMap?: Record<string, boolean>;
    onToggleStep: (stepId: string) => void;
    onReset: () => void;
};

export function GoalCard({ goal, doneMap, onToggleStep, onReset }: Props) {
    const { pct, doneCount, total } = getGoalProgress(goal, doneMap);

    return (
        <Card>
            <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="text-base">
                            <span className="mr-2">{goal.emoji ?? "🎯"}</span>
                            {goal.title}
                        </CardTitle>
                        {goal.subtitle ? <p className="text-sm text-muted-foreground">{goal.subtitle}</p> : null}
                    </div>

                    <div className="text-right">
                        <div className="text-sm font-semibold">{pct}%</div>
                        <div className="text-xs text-muted-foreground">
                            {doneCount}/{total}
                        </div>
                    </div>
                </div>

                <Progress value={pct} />
            </CardHeader>

            <CardContent className="space-y-3">
                <StepChecklist steps={goal.steps} doneMap={doneMap} onToggle={onToggleStep} />
        
                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={onReset}>
                            Reset goal
                        </Button>
                    </div>
            </CardContent>
        </Card>
    );
}