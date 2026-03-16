import { memo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Sex } from "@/features/onboarding/profileStorage";

type Props = {
  displayName: string;
  sex: Sex;
  onDisplayNameChange: (value: string) => void;
  onSexChange: (value: Sex) => void;
};

function PillSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
            value === o.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const IdentitySection = memo(function IdentitySection({
  displayName,
  sex,
  onDisplayNameChange,
  onSexChange,
}: Props) {
  return (
    <>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Your name</label>
        <Input value={displayName} onChange={(e) => onDisplayNameChange(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Sex</label>
        <PillSelect
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
          value={sex}
          onChange={onSexChange}
        />
      </div>
    </>
  );
});
