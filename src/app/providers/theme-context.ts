import { createContext, useContext } from "react";

export type Theme = "dark" | "light";

export type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
};

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => undefined,
});

export function useTheme() {
  return useContext(ThemeContext);
}