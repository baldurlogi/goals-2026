import { clamp } from "@/lib/utils";

type SanitizeOptions = {
  min: number;
  max: number;
  allowDecimal?: boolean;
  maxDecimals?: number;
};

type ClampOptions = {
  min: number;
  max: number;
  integer?: boolean;
  decimals?: number;
};

type ValidationResult = {
  nextValue: string | null;
  error: string | null;
};

export function validateClampedNumberInput(
  value: string,
  options: SanitizeOptions,
): ValidationResult {
  const { min, max, allowDecimal = false, maxDecimals = 1 } = options;

  if (value === "") return { nextValue: "", error: null };

  if (value.startsWith("-")) {
    return {
      nextValue: null,
      error: `This number needs to be ${formatBound(min, options)} or higher.`,
    };
  }

  const pattern = allowDecimal
    ? new RegExp(`^\\d*(?:\\.\\d{0,${maxDecimals}})?$`)
    : /^\d*$/;

  if (!pattern.test(value)) {
    return {
      nextValue: null,
      error: allowDecimal
        ? `Use numbers only with up to ${maxDecimals} decimals.`
        : "Use whole numbers only.",
    };
  }

  if (allowDecimal && value === ".") {
    return { nextValue: "0.", error: null };
  }

  const hasTrailingDot = allowDecimal && value.endsWith(".");
  const normalizedValue = hasTrailingDot ? value.slice(0, -1) : value;

  if (!normalizedValue) {
    return { nextValue: value, error: null };
  }

  const parsed = Number(normalizedValue);
  if (!Number.isFinite(parsed)) {
    return { nextValue: null, error: "Enter a valid number." };
  }

  if (parsed < min) {
    return {
      nextValue: null,
      error: `This number needs to be ${formatBound(min, options)} or higher.`,
    };
  }

  if (parsed > max) {
    return {
      nextValue: null,
      error: `This number needs to be ${formatBound(max, options)} or lower.`,
    };
  }

  return {
    nextValue: hasTrailingDot ? `${normalizedValue}.` : value,
    error: null,
  };
}

export function sanitizeClampedNumberInput(
  value: string,
  options: SanitizeOptions,
): string | null {
  return validateClampedNumberInput(value, options).nextValue;
}

export function clampNumberValue(
  value: unknown,
  options: ClampOptions,
): number | null {
  if (value === null || value === undefined || value === "") return null;

  const { min, max, integer = false, decimals = 1 } = options;
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) return null;

  const clamped = clamp(parsed, min, max);
  return integer
    ? Math.round(clamped)
    : Number(clamped.toFixed(decimals));
}

function formatBound(
  value: number,
  options: Pick<SanitizeOptions, "allowDecimal" | "maxDecimals">,
): string {
  if (!options.allowDecimal) {
    return String(Math.round(value));
  }

  return String(Number(value.toFixed(options.maxDecimals ?? 1)));
}
