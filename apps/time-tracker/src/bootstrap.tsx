import "@efficio/theme";
import "sonner/dist/styles.css";

// Prevent direct access to this standalone app in production.
// If the host is NOT the main app-shell, redirect immediately to the primary URL.
const PRIMARY_HOST = "go-efficio.netlify.app";
if (typeof window !== "undefined") {
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  if (!isLocal && host !== PRIMARY_HOST) {
    window.location.replace(`https://${PRIMARY_HOST}`);
  }
}

import { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";

import App from "./App";

// Export mount function for testing
export function mount(container: HTMLElement): Root {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  return root;
}

const container = document.getElementById("root");

if (container) {
  mount(container);
}
