import type { ReactNode } from "react";
import { forwardRef, useId, type ComponentProps } from "react";
import { AlertCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MotionReveal } from "@/components/motion/MotionReveal";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <AppShell>
      <div className="bg-hero py-12 md:py-20">
        <div className="mx-auto w-full max-w-md px-5">
          <MotionReveal variant="scaleIn" duration={600}>
            <div className="rounded-3xl border border-border/80 bg-surface/95 p-6 shadow-xl backdrop-blur-md md:p-8">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
              <div className="mt-6">{children}</div>
            </div>
          </MotionReveal>
          {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </AppShell>
  );
}

interface FieldProps extends ComponentProps<"input"> {
  label: string;
  error?: string;
  hint?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, className: _c, ...rest },
  ref,
) {
  const id = useId();
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-foreground">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        aria-invalid={!!error}
        aria-describedby={
          [error ? errId : "", hint ? hintId : ""].filter(Boolean).join(" ") || undefined
        }
        className="h-11 w-full rounded-full border border-input bg-surface px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring aria-[invalid=true]:border-destructive"
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errId}
          role="alert"
          className="flex items-center gap-1.5 text-xs font-medium text-destructive"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
});

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-2 rounded-2xl border border-destructive bg-surface p-3.5 text-xs font-medium text-destructive"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> <span>{children}</span>
    </div>
  );
}

export function SubmitButton({ loading, children }: { loading?: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
    >
      {children}
    </button>
  );
}
