import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ReadingFieldPath, ReadingInputs } from "../readingTypes";

type ReadingInputsCardProps = {
  value: ReadingInputs;
  onChange: (path: ReadingFieldPath, value: string) => void;
};

type FieldProps = {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

function Field({ id, label, value, placeholder, onChange }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function ReadingInputsCard({
  value,
  onChange,
}: ReadingInputsCardProps) {
  return (
    <Card className="border-rose-200/60 dark:border-rose-900/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Reading inputs</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Field
          id="reading-title"
          label="Current book"
          value={value.current.title}
          placeholder="Atomic Habits"
          onChange={(next) => onChange("current.title", next)}
        />

        <Field
          id="reading-author"
          label="Author"
          value={value.current.author}
          placeholder="James Clear"
          onChange={(next) => onChange("current.author", next)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="reading-current-page"
            label="Current page"
            value={value.current.currentPage}
            placeholder="0"
            onChange={(next) => onChange("current.currentPage", next)}
          />

          <Field
            id="reading-total-pages"
            label="Total pages"
            value={value.current.totalPages}
            placeholder="320"
            onChange={(next) => onChange("current.totalPages", next)}
          />
        </div>

        <Field
          id="reading-daily-goal"
          label="Daily goal (pages)"
          value={value.dailyGoalPages}
          placeholder="10"
          onChange={(next) => onChange("dailyGoalPages", next)}
        />
      </CardContent>
    </Card>
  );
}