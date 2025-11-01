import { useEffect, useState, useCallback, useRef } from "react";
import { userApi, UserProfile, isUserApiReady } from "../services/userApi";

type Theme = "light" | "dark" | "auto";

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>("light");
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
    } finally {
      isLoadingRef.current = false;
    }
  }, [applyTheme]);

  // Update theme preference
  const updateTheme = useCallback(async (newTheme: Theme) => {
    try {
      if (isUserApiReady()) {
        const updated = await userApi.updateTheme(newTheme);
        setUserProfile(updated);
        setTheme(newTheme);
        applyTheme(newTheme);
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
