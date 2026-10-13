import { AlertCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title, message, onRetry, className = "" }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center sm:p-12 ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive shadow-sm">
        <AlertCircle className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">
        {title || t("common.errorTitle", "Something went wrong")}
      </h3>
      {message && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{message}</p>}
      {onRetry && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-surface border border-border px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>{t("common.retry", "Try Again")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
