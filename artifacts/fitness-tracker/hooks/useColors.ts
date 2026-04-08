import { useContext } from "react";
import { AppContext } from "@/context/AppContext";
import colors from "@/constants/colors";

export function useColors() {
  const ctx = useContext(AppContext);
  const isDark = ctx?.darkMode ?? true;
  const palette = isDark && "dark" in colors
    ? (colors as Record<string, typeof colors.light>).dark
    : colors.light;
  return { ...palette, radius: colors.radius };
}
