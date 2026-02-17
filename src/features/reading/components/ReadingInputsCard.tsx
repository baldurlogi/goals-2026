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
        <CardTitle className="text-sm">Reading</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Current book title</Label>
            <Input
              value={value.current.title}
              onChange={(e) => onChange("current.title", e.target.value)}
              placeholder="e.g. Atomic Habits"
            />
          </div>

          <div className="space-y-2">
            <Label>Current book author</Label>
            <Input
              value={value.current.author}
              onChange={(e) => onChange("current.author", e.target.value)}
              placeholder="e.g. James Clear"
            />
          </div>

          <div className="space-y-2">
            <Label>Current page</Label>
            <Input
              value={value.current.currentPage}
              onChange={(e) => onChange("current.currentPage", e.target.value)}
              placeholder="e.g. 120"
            />
          </div>

          <div className="space-y-2">
            <Label>Total pages</Label>
            <Input
              value={value.current.totalPages}
              onChange={(e) => onChange("current.totalPages", e.target.value)}
              placeholder="e.g. 320"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Daily goal (pages)</Label>
          <Input
            value={value.dailyGoalPages}
            onChange={(e) => onChange("dailyGoalPages", e.target.value)}
            placeholder="e.g. 20"
          />
        </div>
      </CardContent>
    </Card>
  );
}