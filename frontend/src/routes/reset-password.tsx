import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { AuthCard, Field, FormAlert, SubmitButton } from "@/components/auth/AuthCard";
import { mockAuth, MOCK_CODE } from "@/lib/api/mock/auth";
import { CheckCircle2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Thikana" },
      { name: "description", content: "Set a new password for your Thikana account." },
    ],
  }),
  component: ResetPasswordPage,
});

const resetSchema = z
  .object({
    code: z
      .string()
      .min(6, { message: "auth.errors.code" })
      .max(6, { message: "auth.errors.code" }),
    password: z.string().min(6, { message: "auth.errors.passwordMin" }),
    confirmPassword: z.string().min(1, { message: "auth.errors.required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.errors.passwordMismatch",
    path: ["confirmPassword"],
  });

type ResetValues = z.infer<typeof resetSchema>;

function ResetPasswordPage() {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetValues) => {
    setServerError(null);
    try {
      await mockAuth.resetPassword(values.code, values.password);
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setServerError(e.message ? t(e.message) : t("auth.errors.code"));
    }
  };

  if (success) {
    return (
      <AuthCard title={t("auth.resetPasswordTitle")}>
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <CheckCircle2 className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">{t("auth.resetSuccess")}</h2>
          <div className="mt-6">
            <Link
              to="/login"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground hover:opacity-90"
            >
              <span>{t("nav.login")}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t("auth.resetPasswordTitle")}
      subtitle={t("auth.resetPasswordSubtitle")}
      footer={
        <Link to="/login" className="font-medium text-muted-foreground hover:text-foreground">
          {t("auth.loginHere")}
        </Link>
      }
    >
      {serverError && <FormAlert>{serverError}</FormAlert>}

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

        <div className="flex justify-start text-xs">
          <button
            type="button"
            onClick={() => setValue("code", MOCK_CODE, { shouldValidate: true })}
            className="font-medium text-link underline hover:opacity-85"
          >
            অটো-ফিল কোড ({MOCK_CODE})
          </button>
        </div>

        <Field
          label={t("auth.newPasswordLabel")}
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.password?.message ? t(errors.password.message) : undefined}
          {...register("password")}
        />

        <Field
          label={t("auth.confirmPasswordLabel")}
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message ? t(errors.confirmPassword.message) : undefined}
          {...register("confirmPassword")}
        />

        <SubmitButton loading={isSubmitting}>
          {isSubmitting ? t("auth.sending") : t("auth.resetButton")}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
