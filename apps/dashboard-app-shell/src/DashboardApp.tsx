import React, { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";

import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { RemoteBoundary } from "./components/RemoteBoundary";
import { useTheme } from "./hooks/useTheme";
import { initializeUserApi, isUserApiReady, userApi } from "./services/userApi";

const TaskManagerModule = React.lazy(() => import("task_manager/Module"));
const TimeTrackerModule = React.lazy(() => import("time_tracker/Module"));
const AnalyticsModule = React.lazy(() => import("analytics/Module"));

type RemoteModule = React.ComponentType<{ getAccessToken?: () => Promise<string | undefined> }> | null;

// Map pathname → app
const pathnameToApp = (pathname: string): "task" | "time" | "analytics" => {
  if (pathname.includes("time-tracker")) return "time";
  if (pathname.includes("analytics")) return "analytics";
  return "task";
};

export default function DashboardApp() {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const location = useLocation();
  const { loadTheme } = useTheme();

  const [activeApp, setActiveApp] = useState<"task" | "time" | "analytics">(
    () => pathnameToApp(location.pathname || "/task-manager")
  );

  const [TaskManager, setTaskManager] = useState<RemoteModule>(null);
  const [TimeTracker, setTimeTracker] = useState<RemoteModule>(null);
  const [Analytics, setAnalytics] = useState<RemoteModule>(null);

  // Keep URL pathname and state in sync
  useEffect(() => {
    const pathname = location.pathname || "/task-manager";
    setActiveApp(pathnameToApp(pathname));
  }, [location.pathname]);

  // Track if we've checked for reactivation to prevent duplicate checks
  const reactivationCheckedRef = useRef(false);

  // Initialize userApi and load theme when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initializeUserApi(async () => {
        try {
          // Get token - only include audience if configured
          // @ts-ignore - process.env is injected by webpack DefinePlugin at build time
          const audience: string | undefined = process.env.REACT_APP_AUTH0_AUDIENCE;
          
          const options: { authorizationParams?: { audience: string } } = {};
          if (audience) {
            options.authorizationParams = { audience };
          }
          
          return await getAccessTokenSilently(options);
        } catch (error) {
          console.error("Failed to get access token:", error);
          return undefined;
        }
      });
      
      // Check for account reactivation and load theme after a short delay
      const timer = setTimeout(async () => {
        if (isUserApiReady() && !reactivationCheckedRef.current) {
          reactivationCheckedRef.current = true;
          
          try {
            // Check if account was reactivated
            const result = await userApi.getOrCreateUser();
            if (result.reactivated) {
              toast.success("Welcome back", {
                description: "Your account has been reactivated and all your data has been preserved.",
                duration: 5000,
              });
            }
          } catch (error) {
            console.error("Failed to check for account reactivation:", error);
          }
          
          // Load theme
          loadTheme();
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        if (!isAuthenticated) {
          reactivationCheckedRef.current = false;
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, getAccessTokenSilently]);

  // Create stable token getter function to pass to remote modules
  const getAccessToken = useCallback(async () => {
    try {
      // Get token - only include audience if configured
      // @ts-ignore - process.env is injected by webpack DefinePlugin at build time
      const audience: string | undefined = process.env.REACT_APP_AUTH0_AUDIENCE;
      
      const options: { authorizationParams?: { audience: string } } = {};
      if (audience) {
        options.authorizationParams = { audience };
      }
      
      return await getAccessTokenSilently(options);
    } catch (error) {
      console.error("Failed to get access token:", error);
      return undefined;
    }
  }, [getAccessTokenSilently]);

  // Load correct MFE
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadRemote = async (
      importer: () => Promise<any>,
      setter: React.Dispatch<React.SetStateAction<RemoteModule>>
    ) => {
      try {
        const mod = await importer();
        const Component = mod?.default;
        if (Component && typeof Component === "function") {
          setter(() => Component);
        }
      } catch (err) {
        console.error("Failed to load remote:", err);
      }
    };

    if (activeApp === "task" && !TaskManager)
      loadRemote(() => import("task_manager/Module"), setTaskManager);
    if (activeApp === "time" && !TimeTracker)
      loadRemote(() => import("time_tracker/Module"), setTimeTracker);
    if (activeApp === "analytics" && !Analytics)
      loadRemote(() => import("analytics/Module"), setAnalytics);
  }, [activeApp, isAuthenticated]);

  const renderSelectedApp = () => {
    const Component =
      activeApp === "task"
        ? TaskManager
        : activeApp === "time"
        ? TimeTracker
        : Analytics;

    if (Component)
      return (
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Loading...</p>
            </div>
          }
        >
          <Component getAccessToken={getAccessToken} />
        </Suspense>
      );

    const appName =
      activeApp === "task"
        ? "Task Manager"
        : activeApp === "time"
        ? "Time Tracker"
        : "Analytics";

    return (
      <p className="text-center text-gray-500 py-8">
        ⚠️ {appName} is not available yet.
      </p>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center text-gray-600">
        <p>Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Toaster 
        position="bottom-center" 
        richColors
        expand={true}
        visibleToasts={5}
        toastOptions={{
          duration: 4000,
        }}
      />
      <Navbar activeTab={activeApp} />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeApp}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="max-w-[1280px] mx-auto px-8 w-full">
              <RemoteBoundary
                title={
                  activeApp === "task"
                    ? "Task Manager"
                    : activeApp === "time"
                    ? "Time Tracker"
                    : "Analytics"
                }
                moduleName={
                  activeApp === "task"
                    ? "task-manager"
                    : activeApp === "time"
                    ? "time-tracker"
                    : "analytics"
                }
              >
                {renderSelectedApp()}
              </RemoteBoundary>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

