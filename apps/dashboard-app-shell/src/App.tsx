import React, { useEffect, useState, Suspense } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { loadRemoteSafely } from "./utils/loadRemoteSafely";

export default function App() {
  const { isAuthenticated, user, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0();
  const [RemoteA, setRemoteA] = useState<React.ComponentType | null>(null);
  const [RemoteB, setRemoteB] = useState<React.ComponentType | null>(null);
  const [RemoteC, setRemoteC] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // dynamically import each remote with safety wrapper
    loadRemoteSafely(() => import("remote_a/Widget")).then((mod) => setRemoteA(() => mod?.default || null));
    loadRemoteSafely(() => import("remote_b/Widget")).then((mod) => setRemoteB(() => mod?.default || null));
    loadRemoteSafely(() => import("remote_c/Widget")).then((mod) => setRemoteC(() => mod?.default || null));
  }, []);

  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    if (isAuthenticated) {
      getAccessTokenSilently().then(setToken).catch(console.error);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">App Shell</h1>
        {!isAuthenticated ? (
          <button
            onClick={() => loginWithRedirect()}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Sign In / Sign Up
          </button>
        ) : (
          <div className="space-x-2">
            <span>Welcome, {user?.name}</span>
            <button
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Log Out
            </button>
          </div>
        )}
      </header>

      {isAuthenticated ? (
        <>
          <p className="text-sm text-gray-600">
            Access Token: {token ? token.substring(0, 30) + "..." : "Loading..."}
          </p>

          <div className="grid gap-6">
            <Suspense fallback={<p>Loading Task Manager…</p>}>
              {RemoteA ? <RemoteA /> : <p className="text-red-500"> ⚠️ Task Manager is not up and running yet</p>}
            </Suspense>

            <Suspense fallback={<p>Loading Time Tracker…</p>}>
              {RemoteB ? <RemoteB /> : <p className="text-red-500"> ⚠️ Time Trackeris not up and running yet</p>}
            </Suspense>

            <Suspense fallback={<p>Loading Analytics…</p>}>
              {RemoteC ? <RemoteC /> : <p className="text-red-500"> ⚠️ Analytics is not up and running yet</p>}
            </Suspense>
          </div>
        </>
      ) : (
        <p className="text-gray-500">Please sign in to access microfrontends.</p>
      )}
    </div>
  );
}
