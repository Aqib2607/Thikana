import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { AuthCard, Field, FormAlert, SubmitButton } from "@/components/auth/AuthCard";
import { authApi, MOCK_CODE } from "@/lib/api/auth";
import { useAuth, ROLE_HOME } from "@/lib/auth";
import { CheckCircle2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [
      { title: "Verify Email — Thikana" },
      { name: "description", content: "Verify your email address on Thikana." },
    ],
  }),
  component: VerifyEmailPage,
});

const verifySchema = z.object({
  code: z.string().min(6, { message: "auth.errors.code" }).max(6, { message: "auth.errors.code" }),
});

type VerifyValues = z.infer<typeof verifySchema>;

function VerifyEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: "" },
  });

  const onSubmit = async (values: VerifyValues) => {
    setServerError(null);
    try {
      const updated = await authApi.verifyEmail(values.code);
      setUser(updated);
      navigate({ to: ROLE_HOME[updated.role] });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setServerError(e.message ? t(e.message) : t("auth.errors.code"));
    }
  };

  const handleResend = async () => {
    await authApi.resendCode();
    setResendSuccess(true);
    setTimeout(() => setResendSuccess(false), 4000);
  };

  return (
    <AuthCard
      title={t("auth.verifyEmailTitle")}
      subtitle={
        user?.email
          ? `${t("auth.verifyEmailSubtitle")} (${user.email})`
          : t("auth.verifyEmailSubtitle")
      }
    >
      {serverError && <FormAlert>{serverError}</FormAlert>}

      {resendSuccess && (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-secondary/80 p-3 text-sm font-medium text-foreground"
        >
          <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>{t("auth.resendSuccess")}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <Field
          label={t("auth.codeLabel")}
          placeholder={t("auth.codePlaceholder")}
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          error={errors.code?.message ? t(errors.code.message) : undefined}
          {...register("code")}
        />

        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setValue("code", MOCK_CODE, { shouldValidate: true })}
            className="font-medium text-link underline hover:opacity-85"
          >
            অটো-ফিল কোড ({MOCK_CODE})
          </button>
          <button
            type="button"
            onClick={handleResend}
            className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            {t("auth.resendCode")}
          </button>
        </div>

        <SubmitButton loading={isSubmitting}>
          {isSubmitting ? t("auth.verifying") : t("auth.verifyButton")}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
