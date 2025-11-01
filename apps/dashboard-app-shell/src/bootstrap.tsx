import "@efficio/theme";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AuthProvider } from "./auth/AuthProvider";
import App from "./App";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element #root was not found");
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
