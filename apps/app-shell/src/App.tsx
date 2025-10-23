import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Routes } from "./Routes";

export default function App() {
  const {
    isAuthenticated,
    user,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0();

  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      getAccessTokenSilently()
        .then((t) => setToken(t))
        .catch((err) => console.error(err));
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">App Shell</h1>
        <div className="space-x-2">
          {!isAuthenticated ? (
            <button
              onClick={() => loginWithRedirect()}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Sign In / Sign Up
            </button>
          ) : (
            <>
              <span>Welcome, {user?.name}</span>
              <button
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Log Out
              </button>
            </>
          )}
        </div>
      </div>

      {isAuthenticated ? (
        <>
          <p className="text-sm text-gray-600">
            Access Token: {token ? token.substring(0, 30) + "..." : "Loading..."}
          </p>
          <Routes />
        </>
      ) : (
        <p className="text-gray-500">Please sign in to access microfrontends.</p>
      )}
    </div>
  );
}
