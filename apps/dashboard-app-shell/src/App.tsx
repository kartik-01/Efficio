
import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import HomePage from "./HomePage";
import DashboardApp from "./DashboardApp";
import "@efficio/ui";

export default function App() {
  const { isAuthenticated } = useAuth0();

  useEffect(() => {
    if (isAuthenticated) {
      // Ensure default hash route after login
      if (!window.location.hash || window.location.hash === "#/" || window.location.hash === "#") {
        window.location.hash = "#/task-manager";
      }
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <HomePage />;
  }
  return <DashboardApp />;
}
