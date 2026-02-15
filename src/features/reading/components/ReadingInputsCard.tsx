import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReadingFieldPath, ReadingInputs } from "../readingTypes";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function ReadingInputsCard(props: {
    value: ReadingInputs;
    onChange: (path: ReadingFieldPath, value: string) => void;
}) {
    const { value, onChange } = props;

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">Inputs</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
                <div className="grid gap-3 md:grind-cols-2">
                    <div className="space-y-2">
                        <Label>Current book title</Label>
                        <Input
                            value={value.current.title}
                            onChange={(e) => onChange("current.title", e.target.value)}
                            placeholder="e.g. Atomic Habits"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Current author</Label>
                        <Input
                            value={value.current.author}
                            onChange={(e) => onChange("current.author", e.target.value)}
                            placeholder="e.g. James Clear"
                        />
                    </div>
                </div>

                <div className="grid gap-3 md:grind-cols-3">
                    <div className="space-y-2">
                        <Label>Current page</Label>
                        <Input
                            inputMode="numeric"
                            value={value.current.currentPage}
                            onChange={(e) => onChange("current.currentPage", e.target.value)}
                            placeholder="e.g. 257"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Total pages</Label>
                        <Input
                            inputMode="numeric"
                            value={value.current.totalPages}
                            onChange={(e) => onChange("current.totalPages", e.target.value)}
                            placeholder="e.g. 400"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Daily goal (pages)</Label>
                        <Input
                            inputMode="numeric"
                            value={value.dailyGoalPages}
                            onChange={(e) => onChange("dailyGoalPages", e.target.value)}
                            placeholder="e.g. 20"
                        />
                    </div>
                </div>

                {value.next && (
                    <>
                        <Separator />
                        <div className="text-xs font-medium text-muted-foreground">
                            Up next (optional)
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Next book title</Label>
                                <Input
                                    value={value.next.title}
                                    onChange={(e) => onChange("next.title", e.target.value)}
                                    placeholder="e.g. The 7 Habits..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Next author</Label>
                                <Input
                                    value={value.next.author}
                                    onChange={(e) => onChange("next.author", e.target.value)}
                                    placeholder="e.g. Stephen Covey"
                                />
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-1">
                                <Label>Next total pages</Label>
                                <Input
                                    inputMode="numeric"
                                    value={value.next.totalPages}
                                    onChange={(e) => onChange("next.totalPages", e.target.value)}
                                    placeholder="e.g. 360"
                                />
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}