import { Badge } from "@/components/ui/badge";

const userProfile = {
    age: 25,
    gender: "Male",
    weight: "78kg",
    height: "180cm",
    goal: "Build muscle + lean out for summer",
    maintenance: "~2,700 kcal",
    target: "~2,300-2,500 kcal (300-400 deficit)",
};

export function DailyPlanHeader() {
    return (
        <header className="border-b bg-background/70 backdrop-blur">
            <div className="container mx-auto max-w-5xl px-4 py-6">
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            🎯 50 Hard — Daily System
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {userProfile.gender} · {userProfile.age}yo · {userProfile.weight}/{userProfile.height} · {userProfile.goal}
                        </p>
                    </div>

                    <div className="hidden md:flex flex-col items-end gap-1">
                        <Badge variant="secondary">Maintenance: {userProfile.maintenance}</Badge>
                        <span className="text-xs text-muted-foreground">Target: {userProfile.target}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}