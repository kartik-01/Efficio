import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";

// Note: useToast hook not implemented - this component requires hook setup
// For now, returning empty component. If you need toast functionality,
// implement useToast hook or use sonner instead (which is already set up)

export function Toaster() {
  // Note: This component requires useToast hook which is not implemented
  // Use sonner's Toaster component instead (imported from "sonner")
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  );
}
