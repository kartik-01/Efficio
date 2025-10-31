import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { TaskManager } from "./pages/task-manager";
import { initializeTaskApi, isTaskApiReady } from "./services/taskApi";

interface TaskManagerAppProps {
  getAccessToken?: () => Promise<string | undefined>;
}

export const TaskManagerApp = ({ getAccessToken: propGetAccessToken }: TaskManagerAppProps = {}) => {
  const [apiReady, setApiReady] = useState(false);
  // Always call the hook - with @auth0/auth0-react in shared modules, context should work
  // If it fails, the component won't render, but we can provide propGetAccessToken as fallback
  const auth0 = useAuth0();

  // Initialize taskApi with token getter (prop takes precedence over hook)
  useEffect(() => {
    initializeTaskApi(async () => {
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
    });
    setApiReady(true);
  }, [propGetAccessToken, auth0]);

  // Only render TaskManager when API is ready
  if (!apiReady || !isTaskApiReady()) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Initializing...</p>
      </div>
    );
  }

  return <TaskManager />;
};

