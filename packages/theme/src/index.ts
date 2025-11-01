import "./global.css";

export const theme = {
  brand: {
    primary: "#1D4ED8",
    secondary: "#9333EA",
    accent: "#F59E0B"
  },
  borderRadius: {
    sm: "0.375rem",
    md: "0.75rem",
    lg: "1.5rem"
  }
};

export type Theme = typeof theme;

export const loadTheme = () => theme;

