
import { toast as sonnerToast } from "sonner";

// Export a pre-configured toast with 5 second duration
export const toast = Object.assign(
  (props: any, options?: any) => {
    return sonnerToast(props, {
      duration: 5000, // 5 seconds
      ...options
    });
  },
  {
    // Copy all methods from the original toast
    success: sonnerToast.success,
    error: sonnerToast.error,
    warning: sonnerToast.warning,
    info: sonnerToast.info,
    promise: sonnerToast.promise,
    dismiss: sonnerToast.dismiss,
    custom: sonnerToast.custom,
    message: sonnerToast.message,
    loading: sonnerToast.loading,
  }
);
