import React, { useEffect, useState, Suspense } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { loadRemoteSafely } from "./utils/loadRemoteSafely";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

type RemoteModule = React.ComponentType | null;

export default function DashboardApp() {
  const {
    isAuthenticated,
    isLoading,
    getAccessTokenSilently,
  } = useAuth0();

  // Map hash → app
  const hashToApp = (hash: string): "task" | "time" | "analytics" => {
    if (hash.includes("time-tracker")) return "time";
    if (hash.includes("analytics")) return "analytics";
    return "task";
  };

  const [activeApp, setActiveApp] = useState<"task" | "time" | "analytics">(
    () => hashToApp(window.location.hash)
  );

  const [TaskManager, setTaskManager] = useState<RemoteModule>(null);
  const [TimeTracker, setTimeTracker] = useState<RemoteModule>(null);
  const [Analytics, setAnalytics] = useState<RemoteModule>(null);

  // Keep URL hash and state in sync
  useEffect(() => {
    const onHashChange = () => {
      setActiveApp(hashToApp(window.location.hash));
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Load correct MFE
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadRemote = async (
      importer: () => Promise<any>,
      setter: React.Dispatch<React.SetStateAction<RemoteModule>>
    ) => {
      try {
        const mod = await loadRemoteSafely(importer);
        const Component = mod?.default;
        if (Component && typeof Component === "function") {
          setter(() => Component);
        }
      } catch (err) {
        console.error("Failed to load remote:", err);
      }
    };

    if (activeApp === "task" && !TaskManager)
      loadRemote(() => import("task_manager/Widget"), setTaskManager);
    if (activeApp === "time" && !TimeTracker)
      loadRemote(() => import("time_tracker/Widget"), setTimeTracker);
    if (activeApp === "analytics" && !Analytics)
      loadRemote(() => import("analytics/Widget"), setAnalytics);
  }, [activeApp, isAuthenticated]);

  const renderSelectedApp = () => {
    const Component =
      activeApp === "task"
        ? TaskManager
        : activeApp === "time"
        ? TimeTracker
        : Analytics;

    if (Component) return <Component />;

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
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">

      <Navbar activeTab={activeApp} onTabChange={setActiveApp} />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeApp}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <Suspense
              fallback={
                <p className="text-gray-500 text-center py-10">Loading...</p>
              }
            >
              {renderSelectedApp()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
