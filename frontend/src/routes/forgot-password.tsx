import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { AuthCard, Field, FormAlert, SubmitButton } from "@/components/auth/AuthCard";
import { authApi } from "@/lib/api/auth";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — Thikana" },
      { name: "description", content: "Recover access to your Thikana account." },
    ],
  }),
  component: ForgotPasswordPage,
});

const forgotSchema = z.object({
  email: z.string().email({ message: "auth.errors.invalidEmail" }),
});

type ForgotValues = z.infer<typeof forgotSchema>;

function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotValues) => {
    setServerError(null);
    try {
      await authApi.forgotPassword(values.email);
      navigate({ to: "/reset-password" });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setServerError(e.message ? t(e.message) : t("auth.errors.generic"));
    }
  };

  return (
    <AuthCard
      title={t("auth.forgotPasswordTitle")}
      subtitle={t("auth.forgotPasswordSubtitle")}
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("auth.loginHere")}
        </Link>
      }
    >
      {serverError && <FormAlert>{serverError}</FormAlert>}

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <Field
          label={t("auth.emailLabel")}
          type="email"
          placeholder="tenant@demo.test"
          autoComplete="email"
          error={errors.email?.message ? t(errors.email.message) : undefined}
          {...register("email")}
        />

        <div className="flex justify-start text-xs">
          <button
            type="button"
            onClick={() => setValue("email", "tenant@demo.test", { shouldValidate: true })}
            className="font-medium text-link underline hover:opacity-85"
          >
            অটো-ফিল ডেমো ইমেইল (tenant@demo.test)
          </button>
        </div>

        <SubmitButton loading={isSubmitting}>
          {isSubmitting ? t("auth.sending") : t("auth.sendResetLink")}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
