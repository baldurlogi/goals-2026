export type TimelineItem = {
    time: string;
    label: string;
    detail: string;
    icon: string;
    tag?: string;
};

export type ScheduleView = "wfh" | "office" | "weekend";

export type ScheduleConfig = {
    label: string;
    colorClass: string; // tailwind text/bg helpers
    accentClass: string; // border / ring
    blocks: TimelineItem[];
};

export type DailySchedule = Record<ScheduleView, ScheduleConfig>;