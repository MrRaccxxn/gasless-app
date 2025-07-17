import { create } from "zustand";

export type AlertType = "success" | "warning" | "error" | "info";

export interface AlertItem {
  id: string;
  type: AlertType;
  title?: string;
  message: string;
  duration?: number; // Auto-dismiss time in ms, 0 means no auto-dismiss
  dismissible?: boolean;
}

interface AlertState {
  alerts: AlertItem[];
  showAlert: (alert: Omit<AlertItem, "id">) => void;
  dismissAlert: (id: string) => void;
  clearAllAlerts: () => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],

  showAlert: (alert) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newAlert: AlertItem = {
      id,
      duration: 5000, // Default 5 seconds
      dismissible: true,
      ...alert,
    };

    set((state) => ({
      alerts: [...state.alerts, newAlert],
    }));

    // Auto-dismiss if duration is set
    if (newAlert.duration && newAlert.duration > 0) {
      setTimeout(() => {
        get().dismissAlert(id);
      }, newAlert.duration);
    }
  },

  dismissAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.id !== id),
    }));
  },

  clearAllAlerts: () => {
    set({ alerts: [] });
  },
}));

// Utility functions for different alert types
export const alertUtils = {
  success: (message: string, title?: string, options?: Partial<AlertItem>) =>
    useAlertStore.getState().showAlert({
      type: "success",
      message,
      title,
      ...options,
    }),

  warning: (message: string, title?: string, options?: Partial<AlertItem>) =>
    useAlertStore.getState().showAlert({
      type: "warning",
      message,
      title,
      ...options,
    }),

  error: (message: string, title?: string, options?: Partial<AlertItem>) =>
    useAlertStore.getState().showAlert({
      type: "error",
      message,
      title,
      ...options,
    }),

  info: (message: string, title?: string, options?: Partial<AlertItem>) =>
    useAlertStore.getState().showAlert({
      type: "info",
      message,
      title,
      ...options,
    }),
};
