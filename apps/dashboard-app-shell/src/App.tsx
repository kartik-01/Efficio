import React, { useEffect, useState, Suspense } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { loadRemoteSafely } from "./utils/loadRemoteSafely";
import { motion, AnimatePresence } from "framer-motion";

type RemoteModule = React.ComponentType | null;

export default function App() {
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout,
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
  const [token, setToken] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Validate hash on every render
  useEffect(() => {
    const protectedRoutes = ["#/task-manager", "#/time-tracker", "#/analytics"];
    const currentHash = window.location.hash;

    // If user is not logged in OR hash is invalid → always reset to base
    const invalidOrProtected =
      !isAuthenticated ||
      !protectedRoutes.some((route) => currentHash.startsWith(route));

    if (invalidOrProtected && currentHash) {
      // Strip hash from URL entirely
      window.history.replaceState({}, "", window.location.origin);
    }
  }, [isAuthenticated, isLoading]);

  // Fetch Auth0 token when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      getAccessTokenSilently().then(setToken).catch(console.error);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  // Lazy-load MFEs only when selected
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
        } else {
          console.warn("Remote returned invalid component:", mod);
          setter(null);
        }
      } catch (err) {
        console.error("Failed to load remote:", err);
        setter(null);
      }
    };

    if (activeApp === "task" && !TaskManager)
      loadRemote(() => import("task_manager/Widget"), setTaskManager);
    if (activeApp === "time" && !TimeTracker)
      loadRemote(() => import("time_tracker/Widget"), setTimeTracker);
    if (activeApp === "analytics" && !Analytics)
      loadRemote(() => import("analytics/Widget"), setAnalytics);
  }, [activeApp, isAuthenticated]);

  // Hash → state
  useEffect(() => {
    const onHashChange = () => {
      const newHash = window.location.hash;
      const validRoutes = ["#/task-manager", "#/time-tracker", "#/analytics"];
      if (isAuthenticated && validRoutes.includes(newHash)) {
        setActiveApp(hashToApp(newHash));
      } else if (!isAuthenticated && newHash) {
        // Logged out & trying to access protected route → reset
        window.history.replaceState({}, "", window.location.origin);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [isAuthenticated]);

  // State → hash (only when logged in)
  useEffect(() => {
    if (!isAuthenticated) return;
    const hashMap: Record<string, string> = {
      task: "#/task-manager",
      time: "#/time-tracker",
      analytics: "#/analytics",
    };
    if (window.location.hash !== hashMap[activeApp]) {
      window.location.hash = hashMap[activeApp];
    }
  }, [activeApp, isAuthenticated]);

  // Render selected MFE
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
      {/* Navbar */}
      <nav className="w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Left: Logo + Tabs */}
          <div className="flex items-center space-x-8">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Efficio</h1>

            {isAuthenticated && (
              <div className="hidden sm:flex space-x-8 text-sm font-medium text-gray-600">
                {[
                  { id: "task", label: "Task Manager" },
                  { id: "time", label: "Time Tracker" },
                  { id: "analytics", label: "Analytics" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveApp(tab.id as any)}
                    className={`relative pb-1 transition hover:text-gray-900 ${
                      activeApp === tab.id ? "text-blue-600 font-semibold" : ""
                    }`}
                  >
                    {tab.label}
                    {activeApp === tab.id && (
                      <motion.span
                        layoutId="underline"
                        className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600 rounded-t-md"
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Auth Section */}
          {!isAuthenticated ? (
            <button
              onClick={() => loginWithRedirect()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
            >
              Sign In / Sign Up
            </button>
          ) : (
<div className="flex items-center space-x-4 text-sm">
  {user?.picture && (
    <img
      src={user.picture}
      alt="User Profile"
      className="w-8 h-8 rounded-full border border-gray-300"
    />
  )}

  <span className="hidden sm:inline text-gray-700">
    Hi, {user?.name?.split(" ")[0]}
  </span>

  <button
    onClick={() => {
      setActiveApp("task");
      window.history.replaceState({}, "", window.location.origin);
      logout({ logoutParams: { returnTo: window.location.origin } });
    }}
    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition hidden sm:inline"
  >
    Log Out
  </button>

  {/* Hamburger toggle for mobile */}
  <button
    className="sm:hidden text-gray-700 p-2 rounded-md hover:bg-gray-100"
    onClick={() => setMenuOpen(!menuOpen)}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className="w-6 h-6"
    >
      {menuOpen ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  </button>
</div>

          )}
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {menuOpen && isAuthenticated && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="sm:hidden border-t border-gray-100 bg-white"
            >
              <div className="flex flex-col px-4 py-3 space-y-3 text-sm text-gray-700">
                {[
                  { id: "task", label: "Task Manager" },
                  { id: "time", label: "Time Tracker" },
                  { id: "analytics", label: "Analytics" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveApp(tab.id as any);
                      setMenuOpen(false);
                    }}
                    className={`text-left transition ${
                      activeApp === tab.id
                        ? "text-blue-600 font-semibold"
                        : "hover:text-gray-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                <hr className="border-gray-200" />
                <div className="flex items-center justify-between">
                  <span>Hi, {user?.name?.split(" ")[0]}</span>
                  <button
                    onClick={() => {
                      setActiveApp("task");
                      window.history.replaceState({}, "", window.location.origin);
                      logout({ logoutParams: { returnTo: window.location.origin } });
                    }}
                    className="px-3 py-1.5 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center">
            <h2 className="text-xl font-semibold mb-3">Welcome to Efficio</h2>
            <p className="text-gray-500 mb-6">
              Please sign in to access micro-frontends.
            </p>
            <button
              onClick={() => loginWithRedirect()}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Sign In
            </button>
          </div>
        ) : (
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
        )}
      </main>
    </div>
  );
}
