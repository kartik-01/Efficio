import "@efficio/theme";
import "sonner/dist/styles.css";

// Prevent direct access to this standalone app in production.
// If the host is NOT the main app-shell, redirect immediately to the primary URL.
const PRIMARY_HOST = "go-efficio.netlify.app";
if (typeof window !== "undefined") {
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  if (!isLocal && host !== PRIMARY_HOST) {
    // Use replace so browser history doesn't keep the secondary URL
    window.location.replace(`https://${PRIMARY_HOST}`);
  }
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

