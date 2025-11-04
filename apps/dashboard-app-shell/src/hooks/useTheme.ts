import { useEffect, useState, useCallback, useRef } from "react";
import { userApi, UserProfile, isUserApiReady } from "../services/userApi";

type Theme = "light" | "dark" | "auto";

const THEME_STORAGE_KEY = "efficio-theme";

// Get theme from localStorage synchronously (for initial render)
const getStoredTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return (stored as Theme) || "light";
};

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const isLoadingRef = useRef(false);

  // Apply theme to document
  const applyTheme = useCallback((themeValue: Theme) => {
    const root = document.documentElement;

    if (themeValue === "auto") {
      // Check time of day (6 AM - 8 PM = day/light, else night/dark)
      const hour = new Date().getHours();
      const isDayTime = hour >= 6 && hour < 20;
      root.classList.toggle("dark", !isDayTime);
    } else {
      root.classList.toggle("dark", themeValue === "dark");
    }
    
    // Store theme in localStorage for immediate application on next load
    localStorage.setItem(THEME_STORAGE_KEY, themeValue);
  }, []);

  // Load theme from user profile - memoized to prevent infinite loops
  const loadTheme = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current || !isUserApiReady()) {
      return;
    }

    isLoadingRef.current = true;
    try {
      const profile = await userApi.getUserProfile();
      setUserProfile(profile);
      const userTheme = (profile.preferences?.theme as Theme) || "light";
      setTheme(userTheme);
      applyTheme(userTheme);
    } catch (error) {
      console.error("Failed to load theme:", error);
      // On error, use stored theme if available
      const storedTheme = getStoredTheme();
      if (storedTheme !== theme) {
        setTheme(storedTheme);
        applyTheme(storedTheme);
      }
    } finally {
      isLoadingRef.current = false;
    }
  }, [applyTheme, theme]);

  // Update theme preference
  const updateTheme = useCallback(async (newTheme: Theme) => {
    try {
      // Apply theme immediately and store in localStorage
      setTheme(newTheme);
      applyTheme(newTheme);
      
      if (isUserApiReady()) {
        const updated = await userApi.updateTheme(newTheme);
        setUserProfile(updated);
      }
    } catch (error) {
      console.error("Failed to update theme:", error);
      throw error;
    }
  }, [applyTheme]);

  // Effect to apply theme on mount and theme change
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Effect to check for auto theme time updates
  useEffect(() => {
    if (theme === "auto") {
      // Check every minute for time changes
      const interval = setInterval(() => {
        applyTheme("auto");
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [theme, applyTheme]);

  return {
    theme,
    userProfile,
    loadTheme,
    updateTheme,
    applyTheme,
  };
};
