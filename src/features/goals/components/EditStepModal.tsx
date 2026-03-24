import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { UserGoalStep } from "@/features/goals/goalTypes";
import {
  buildStepNotes,
  parseStepDetails,
  parseStepLinksInput,
} from "@/features/goals/stepDetails";

type Props = {
  step: UserGoalStep;
  stepNumber: number;
  onSave: (step: UserGoalStep) => void;
  onClose: () => void;
  saving?: boolean;
};

export function EditStepModal({
  step,
  stepNumber,
  onSave,
  onClose,
  saving = false,
}: Props) {
  const parsedStep = parseStepDetails(step);
  const [draft, setDraft] = useState<UserGoalStep>({
    ...step,
    links: step.links?.length ? step.links : parsedStep.links,
  });
  const [guidance, setGuidance] = useState(parsedStep.guidance.join("\n"));
  const [doneWhen, setDoneWhen] = useState(parsedStep.doneWhen ?? "");

  useEffect(() => {
    const parsed = parseStepDetails(step);
    setDraft({
      ...step,
      links: step.links?.length ? step.links : parsed.links,
    });
    setGuidance(parsed.guidance.join("\n"));
    setDoneWhen(parsed.doneWhen ?? "");
  }, [step]);

  const isValid = draft.label.trim().length > 0;

  function updateDraft(patch: Partial<UserGoalStep>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function handleSave() {
    if (!isValid || saving) return;

    onSave({
      ...draft,
      label: draft.label.trim(),
      notes: buildStepNotes(guidance, doneWhen),
      estimatedTime: draft.estimatedTime.trim(),
      links: draft.links?.length ? draft.links : undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-0 sm:items-center sm:px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border bg-card shadow-2xl sm:max-w-xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 border-b px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">Step {stepNumber}</div>
              <h2 className="text-base font-semibold">Edit step</h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="text-xl leading-none text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">Step title</div>
            <Input
              value={draft.label}
              onChange={(event) => updateDraft({ label: event.target.value })}
              placeholder="Step label"
              className="text-base"
            />
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">How</div>
            <Textarea
              placeholder="How to do it, notes, examples, or checklist"
              value={guidance}
              onChange={(event) => setGuidance(event.target.value)}
              rows={5}
              className="resize-none text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">Done when</div>
            <Textarea
              placeholder="What must be true for this step to count as done?"
              value={doneWhen}
              onChange={(event) => setDoneWhen(event.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">Links</div>
            <Textarea
              placeholder="One link per line"
              value={(draft.links ?? []).join("\n")}
              onChange={(event) =>
                updateDraft({ links: parseStepLinksInput(event.target.value) })
              }
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground">Due date</div>
              <Input
                type="date"
                value={draft.idealFinish ?? ""}
                onChange={(event) =>
                  updateDraft({ idealFinish: event.target.value || null })
                }
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground">Est. time</div>
              <Input
                placeholder="e.g. 30 min"
                value={draft.estimatedTime}
                onChange={(event) =>
                  updateDraft({ estimatedTime: event.target.value })
                }
                className="h-10 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={!isValid || saving}
            >
              {saving ? "Saving…" : "Save step"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
