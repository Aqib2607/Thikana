import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AuthCard, FormAlert } from "@/components/auth/AuthCard";
import { authApi } from "@/lib/api/auth";
import { useAuth, ROLE_HOME } from "@/lib/auth";
import { CheckCircle2, RefreshCw, Mail, AlertTriangle, ArrowRight } from "lucide-react";

interface VerifyEmailSearch {
  status?: "success" | "invalid" | "already_verified";
}

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>): VerifyEmailSearch => ({
    status: ["success", "invalid", "already_verified"].includes(String(search["status"]))
      ? (search["status"] as VerifyEmailSearch["status"])
      : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Verify Email — Thikana" },
      { name: "description", content: "Verify your email address on Thikana." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const { user, setUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (search.status === "success" || search.status === "already_verified") {
      authApi.session().then((refreshed) => {
        if (refreshed) setUser(refreshed);
      });
    }
  }, [search.status, setUser]);

  const handleResend = async () => {
    setServerError(null);
    setIsResending(true);
    try {
      await authApi.resendCode();
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setServerError(e.message ? t(e.message) : t("auth.errors.generic"));
    } finally {
      setIsResending(false);
    }
  };

  if (search.status === "success" || search.status === "already_verified") {
    return (
      <AuthCard title={t("auth.verifyEmailTitle")}>
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <CheckCircle2 className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">
            {search.status === "already_verified"
              ? t("auth.feedback.alreadyVerified", "Email address is already verified.")
              : t("auth.feedback.verified", "Email address verified successfully!")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.verifySuccessSubtitle", "You can now access all authenticated features.")}
          </p>
          <div className="mt-6">
            <Link
              to={user?.role ? ROLE_HOME[user.role] : "/login"}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground hover:opacity-90"
            >
              <span>{user ? t("nav.dashboard", "Dashboard") : t("nav.login", "Login")}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t("auth.verifyEmailTitle")}
      subtitle={
        user?.email
          ? `${t("auth.verifyEmailSubtitle", "A verification email has been sent to")} (${user.email})`
          : t("auth.verifyEmailSubtitle", "Please check your email for the verification link.")
      }
    >
      {search.status === "invalid" && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <p className="font-semibold">
              {t("auth.invalidLinkTitle", "Verification Link Invalid or Expired")}
            </p>
            <p className="mt-0.5 text-xs opacity-90">
              {t(
                "auth.invalidLinkSubtitle",
                "This link may have expired or was already used. Please request a new one below.",
              )}
            </p>
          </div>
        </div>
      )}

      {serverError && <FormAlert>{serverError}</FormAlert>}

      {resendSuccess && (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-secondary/80 p-3 text-sm font-medium text-foreground"
        >
          <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>{t("auth.resendSuccess", "A new verification email has been sent!")}</span>
        </div>
      )}

      <div className="grid gap-6">
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-muted/30 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {t(
              "auth.verifyInstruction",
              "Click the button inside the email to securely verify your account. If you don't see it, check your spam folder.",
            )}
          </p>
        </div>

        <button
          type="button"
          disabled={isResending}
          onClick={handleResend}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:opacity-60 gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          <span>
            {isResending
              ? t("auth.sending", "Sending...")
              : t("auth.resendCode", "Resend verification email")}
          </span>
        </button>

        <div className="text-center text-xs">
          <Link
            to={user?.role ? ROLE_HOME[user.role] : "/"}
            className="font-medium text-muted-foreground hover:text-foreground"
          >
            {t("common.backToHome", "Back to Home")}
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}
