import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

export const ThemeToggle: React.FC = () => {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="flex items-center gap-1.5 border border-line2 px-2.5 py-1 text-[10px] font-bold tracking-[0.2em] text-fog hover:border-neon hover:text-neon transition-colors focus:outline-none focus:ring-1 focus:ring-neon"
    >
      {isDark ? <Sun size={12} /> : <Moon size={12} />}
      {isDark ? "LIGHT" : "DARK"}
    </button>
  );
};
