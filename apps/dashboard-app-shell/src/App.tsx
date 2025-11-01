import { useEffect } from "react";
import { HashRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

import HomePage from "./pages/HomePage";
import DashboardApp from "./DashboardApp";

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  // Route protection: redirect to homepage if not authenticated and trying to access app routes
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const pathname = location.pathname;
      // If user tries to access any app route (/task-manager, /time-tracker, /analytics) while not authenticated
      if (
        pathname.includes("/task-manager") ||
        pathname.includes("/time-tracker") ||
        pathname.includes("/analytics")
      ) {
        navigate("/");
      }
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  // Set default route after login
  useEffect(() => {
    if (isAuthenticated && (!location.pathname || location.pathname === "/")) {
      navigate("/task-manager");
    }
  }, [isAuthenticated, location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center text-gray-600">
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <HomePage />;
  }

  return <DashboardApp />;
}

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="*" element={<AppRoutes />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
