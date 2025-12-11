import { useCallback, useEffect, useState, lazy, Suspense } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { initializeTimeApi, isTimeApiReady } from "./services/timeApi";
import { initializeTaskApi, isTaskApiReady } from "./services/taskApi";

// Lazy load TodayView to defer zustand store creation until after React is ready
const TodayView = lazy(() => import('./components/TodayView').then(module => ({ default: module.TodayView })));

interface TimeTrackerAppProps {
  getAccessToken?: () => Promise<string | undefined>;
}

export const TimeTrackerApp = ({ getAccessToken: propGetAccessToken }: TimeTrackerAppProps = {}) => {
  const [apiReady, setApiReady] = useState(false);
  // Always call the hook - with @auth0/auth0-react in shared modules, context should work
  // If it fails, the component won't render, but we can provide propGetAccessToken as fallback
  const auth0 = useAuth0();

  // Create a reusable token getter function
  const tokenGetter = useCallback(async () => {
    try {
      // Use prop token getter if provided (from host app - more reliable for module federation)
      if (propGetAccessToken) {
        const token = await propGetAccessToken();
        return token;
      }
      
      // Otherwise use Auth0 hook from context
      // @ts-ignore - process.env is injected by webpack DefinePlugin at build time
      const audience: string | undefined = process.env.REACT_APP_AUTH0_AUDIENCE;
      
      const options: { authorizationParams?: { audience: string } } = {};
      if (audience) {
        options.authorizationParams = { audience };
      }
      
      const token = await auth0.getAccessTokenSilently(options);
      return token;
    } catch (error) {
      console.error("Failed to get access token:", error);
      return undefined;
    }
  }, [propGetAccessToken, auth0]);

  // Initialize all APIs with token getter (prop takes precedence over hook)
  useEffect(() => {
    initializeTimeApi(tokenGetter);
    initializeTaskApi(tokenGetter);
    setApiReady(true);
  }, [tokenGetter]);

  // Only render TodayView when all APIs are ready
  if (!apiReady || !isTimeApiReady() || !isTaskApiReady()) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Initializing...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="max-w-[1280px] mx-auto w-full">
        {/* Header */}

        {/* Main Content */}
        <main className="w-full px-4 py-6 text-neutral-900 dark:text-neutral-100">
          <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading...</p></div>}>
            <TodayView getAccessToken={tokenGetter} />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default TimeTrackerApp;
