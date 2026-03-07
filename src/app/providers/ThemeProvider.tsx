import { useEffect, useState } from "react";
import { ThemeContext, type Theme } from "./theme-context";

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem("theme");
    return stored === "dark" || stored === "light" ? stored : "dark";
  } catch {
    return "dark";
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");

    try {
      localStorage.setItem("theme", theme);
    } catch {
      return;
    }
  }, [theme]);

  function toggle() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}