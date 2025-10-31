import "@efficio/theme";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";

import App from "./App";

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
      <Toaster position="top-right" richColors />
    </StrictMode>
  );
}

