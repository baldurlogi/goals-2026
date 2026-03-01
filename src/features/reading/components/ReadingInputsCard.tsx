import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReadingFieldPath, ReadingInputs } from "../readingTypes";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type Props = {
  value: ReadingInputs;
  onChange: (path: ReadingFieldPath, value: string) => void;
};

function getByPath(v: ReadingInputs, path: ReadingFieldPath): string {
  switch (path) {
    case "current.title":
      return v.current.title ?? "";
    case "current.author":
      return v.current.author ?? "";
    case "current.currentPage":
      return String(v.current.currentPage ?? "");
    case "current.totalPages":
      return String(v.current.totalPages ?? "");
    case "dailyGoalPages":
      return String(v.dailyGoalPages ?? "");
    default:
      return "";
  }
}

export function ReadingInputsCard({ value, onChange }: Props) {
  // Local draft values so typing is always instant.
  const [draft, setDraft] = useState(() => ({
    "current.title": getByPath(value, "current.title"),
    "current.author": getByPath(value, "current.author"),
    "current.currentPage": getByPath(value, "current.currentPage"),
    "current.totalPages": getByPath(value, "current.totalPages"),
    dailyGoalPages: getByPath(value, "dailyGoalPages"),
  }));

  // Keep draft in sync if parent value changes elsewhere (e.g. load, reset).
  const valueKey = useMemo(() => JSON.stringify(value), [value]);
  useEffect(() => {
    setDraft({
      "current.title": getByPath(value, "current.title"),
      "current.author": getByPath(value, "current.author"),
      "current.currentPage": getByPath(value, "current.currentPage"),
      "current.totalPages": getByPath(value, "current.totalPages"),
      dailyGoalPages: getByPath(value, "dailyGoalPages"),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueKey]);

  // Debounce commits to parent so we don't re-render the whole app per keystroke.
  const timersRef = useRef<Record<string, number | undefined>>({});

  function commitDebounced(path: ReadingFieldPath, next: string) {
    const timers = timersRef.current;
    const key = path as string;

    if (timers[key]) window.clearTimeout(timers[key]);
    timers[key] = window.setTimeout(() => {
      onChange(path, next);
      timers[key] = undefined;
    }, 250);
  }

  function commitNow(path: ReadingFieldPath) {
    const timers = timersRef.current;
    const key = path as string;

    if (timers[key]) window.clearTimeout(timers[key]);
    timers[key] = undefined;
    onChange(path, draft[path]);
  }

  function bind(path: ReadingFieldPath) {
    return {
      value: draft[path],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        setDraft((d) => ({ ...d, [path]: next }));
        commitDebounced(path, next);
      },
      onBlur: () => commitNow(path),
    };
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Reading</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Current book title</Label>
            <Input {...bind("current.title")} placeholder="e.g. Atomic Habits" />
          </div>

          <div className="space-y-2">
            <Label>Current book author</Label>
            <Input {...bind("current.author")} placeholder="e.g. James Clear" />
          </div>

          <div className="space-y-2">
            <Label>Current page</Label>
            <Input
              {...bind("current.currentPage")}
              inputMode="numeric"
              placeholder="e.g. 120"
            />
          </div>

          <div className="space-y-2">
            <Label>Total pages</Label>
            <Input
              {...bind("current.totalPages")}
              inputMode="numeric"
              placeholder="e.g. 320"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Daily goal (pages)</Label>
          <Input
            {...bind("dailyGoalPages")}
            inputMode="numeric"
            placeholder="e.g. 20"
          />
        </div>
      </CardContent>
    </Card>
  );
}