
import { toast } from "sonner";

// Configure default toast duration
const defaultToast = toast;

// Export a pre-configured toast with 5 second duration
export const toast = Object.assign(
  (props: Parameters<typeof defaultToast>[0], options?: Parameters<typeof defaultToast>[1]) => {
    return defaultToast(props, {
      duration: 5000, // 5 seconds
      ...options
    });
  },
  {
    ...defaultToast
  }
);
