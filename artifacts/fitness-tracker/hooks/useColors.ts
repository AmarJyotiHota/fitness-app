import { useContext } from "react";
import { AppContext } from "@/context/AppContext";
import colors from "@/constants/colors";

export function useColors() {
  const ctx = useContext(AppContext);
  const isDark = ctx?.darkMode ?? true;
  const palette = isDark && "dark" in colors
    ? (colors as any).dark
    : colors.light;
  return { ...palette, radius: colors.radius };
}
