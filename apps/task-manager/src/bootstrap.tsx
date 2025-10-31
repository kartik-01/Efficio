import "@efficio/theme";
import "sonner/dist/styles.css";

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
      <Toaster 
        position="top-right" 
        richColors
        expand={true}
        closeButton
        visibleToasts={5}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'white',
            color: '#000',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 99999,
          },
        }}
      />
      {console.log('🔍 Toaster component rendered in bootstrap')}
    </StrictMode>
  );
}

