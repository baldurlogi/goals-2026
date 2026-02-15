import type { ComponentType } from "react";

export type GoalId = string;
export type StepId = string;

export type GoalStep = {
    id: StepId;
    label: string;
    done?: boolean;
    weight?: number; // optional, for weighted progress calculation
};

export type GoalDefinition = {
    id: GoalId;
    title: string;
    subtitle?: string;
    emoji?: string;
    steps: GoalStep[];
    Details?: ComponentType;
};