// Design tokens for DANZ STORE V5 - Dark theme only
import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  surface: "#0A0A0A",
  onSurface: "#FFFFFF",
  surfaceSecondary: "#1A1A1E",
  onSurfaceSecondary: "#F4F4F5",
  surfaceTertiary: "#27272A",
  onSurfaceTertiary: "#E4E4E7",
  surfaceInverse: "#FAFAFA",
  onSurfaceInverse: "#0A0A0A",
  muted: "#A1A1AA",

  brand: "#FF003C",
  onBrand: "#FFFFFF",
  brandPrimary: "#E60036",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#FF3366",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#33000C",
  onBrandTertiary: "#FFB3C6",

  success: "#00E676",
  onSuccess: "#000000",
  warning: "#FFC400",
  onWarning: "#000000",
  error: "#FF1744",
  onError: "#FFFFFF",
  info: "#00E5FF",
  onInfo: "#000000",

  border: "#27272A",
  borderStrong: "#3F3F46",
  divider: "#1F1F22",
};

export type ThemeColors = typeof dark;

export const defaultScheme = "dark" satisfies ColorScheme;
export const themes: { light?: ThemeColors; dark: ThemeColors } = { dark };
export const colors = dark;

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const _system = useColorScheme();
  return { scheme: "dark", colors: dark };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

export const formatRupiah = (n: number): string => {
  if (n == null || isNaN(n)) return "Rp0";
  return "Rp" + Math.round(n).toLocaleString("id-ID");
};
