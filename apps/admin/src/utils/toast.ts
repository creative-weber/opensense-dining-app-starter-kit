import { default as hotToast, ToastOptions } from 'react-hot-toast';

const defaultOptions: ToastOptions = {
  duration: 4000,
  position: 'top-right',
};

export const toast = {
  /**
   * Show error message
   */
  error: (message: string, options?: ToastOptions) => {
    hotToast.error(message, {
      ...defaultOptions,
      ...options,
      duration: options?.duration ?? 4000,
    });
  },

  /**
   * Show success message
   */
  success: (message: string, options?: ToastOptions) => {
    hotToast.success(message, {
      ...defaultOptions,
      ...options,
      duration: options?.duration ?? 3000,
    });
  },

  /**
   * Show info message
   */
  info: (message: string, options?: ToastOptions) => {
    hotToast(message, {
      ...defaultOptions,
      ...options,
      duration: options?.duration ?? 4000,
    });
  },

  /**
   * Show loading message (requires manual dismiss)
   */
  loading: (message: string, options?: ToastOptions) => {
    return hotToast.loading(message, {
      ...defaultOptions,
      ...options,
      duration: Infinity,
    });
  },

  /**
   * Dismiss all toasts
   */
  dismiss: () => {
    hotToast.dismiss();
  },

  /**
   * Dismiss specific toast
   */
  dismissToast: (toastId: string) => {
    hotToast.dismiss(toastId);
  },

  /**
   * Update existing toast
   */
  update: (toastId: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    hotToast.dismiss(toastId);
    if (type === 'success') {
      toast.success(message, { duration: 3000 });
    } else if (type === 'error') {
      toast.error(message, { duration: 4000 });
    } else {
      toast.info(message, { duration: 4000 });
    }
  },
};
