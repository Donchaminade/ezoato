export const colors = {
  primary: "#006A4E",
  primaryDark: "#004D38",
  accent: "#FFCE00",
  accentDark: "#E6B800",
  background: "#F8FAF9",
  surface: "#FFFFFF",
  text: "#1A2E28",
  textMuted: "#5C7269",
  border: "#D8E6E0",
  error: "#D21034",
  success: "#006A4E",
  warning: "#FFCE00",
  offline: "#6B7280",
  white: "#FFFFFF",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

export const typography = {
  title: { fontSize: 22, fontWeight: "700" as const, color: colors.text },
  subtitle: { fontSize: 16, fontWeight: "600" as const, color: colors.text },
  body: { fontSize: 15, fontWeight: "400" as const, color: colors.text },
  caption: { fontSize: 13, fontWeight: "400" as const, color: colors.textMuted },
  label: { fontSize: 14, fontWeight: "600" as const, color: colors.textMuted },
};
