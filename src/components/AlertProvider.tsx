"use client";

import { useEffect } from "react";
import { X, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAlertStore, type AlertItem, type AlertType } from "@/lib/alert-store";
import { cn } from "@/lib/utils";

const alertConfig: Record<AlertType, {
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}> = {
  success: {
    icon: CheckCircle,
    className: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400",
  },
  error: {
    icon: XCircle,
    className: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
  },
  info: {
    icon: Info,
    className: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400",
  },
};

interface AlertItemProps {
  alert: AlertItem;
  onDismiss: (id: string) => void;
}

const AlertItem = ({ alert, onDismiss }: AlertItemProps) => {
  const config = alertConfig[alert.type];
  const Icon = config.icon;

  useEffect(() => {
    if (alert.duration && alert.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(alert.id);
      }, alert.duration);

      return () => clearTimeout(timer);
    }
  }, [alert.duration, alert.id, onDismiss]);

  return (
    <Alert className={cn(config.className, "relative animate-in slide-in-from-top-2 duration-300")}>
      <Icon className="h-4 w-4" />
      <div className="flex-1">
        {alert.title && <AlertTitle>{alert.title}</AlertTitle>}
        <AlertDescription>{alert.message}</AlertDescription>
      </div>
      {alert.dismissible && (
        <button
          onClick={() => onDismiss(alert.id)}
          className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          aria-label="Close alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </Alert>
  );
};

export const AlertProvider = () => {
  const { alerts, dismissAlert } = useAlertStore();

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-2">
      {alerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} onDismiss={dismissAlert} />
      ))}
    </div>
  );
};
