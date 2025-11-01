import React from "react";
import { Auth0Provider } from "@auth0/auth0-react";

interface Props {
  children: React.ReactNode;
}

// Auth0 API Audience - This should match your Auth0 API Identifier (optional)
// Get this from: Auth0 Dashboard → Applications → APIs → Your API → Settings → Identifier
// This can be configured via REACT_APP_AUTH0_AUDIENCE environment variable when running webpack
// If not set, Auth0 will use default tokens without API audience
// @ts-ignore - process.env is injected by webpack DefinePlugin
const AUTH0_AUDIENCE: string | undefined = process.env.REACT_APP_AUTH0_AUDIENCE;

export const AuthProvider = ({ children }: Props) => {
  const authorizationParams: { redirect_uri: string; audience?: string } = {
    redirect_uri: window.location.origin,
  };
  
  // Only add audience if it's configured
  if (AUTH0_AUDIENCE) {
    authorizationParams.audience = AUTH0_AUDIENCE;
  }

  return (
    <Auth0Provider
      domain="dev-dkdxpljfvflt1jgs.us.auth0.com"
      clientId="lzbVOYeSERkab4468jFAYWUABT4VvjwM"
      authorizationParams={authorizationParams}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
};

