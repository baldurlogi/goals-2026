import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOKENS } from "../theme/tokens";
import type { ThemeMode } from "../types";

type ThemeToggleProps = {
  theme: ThemeMode;
  onToggleTheme: () => void;
};

export function ThemeToggle({ theme, onToggleTheme }: ThemeToggleProps) {
  const t = TOKENS[theme];
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onToggleTheme}
      aria-label="Toggle theme"
      className="h-10 w-10 rounded-xl border"
      style={{
        background: t.surface,
        borderColor: t.border,
        color: t.text,
      }}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}