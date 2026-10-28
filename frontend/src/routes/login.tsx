import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { AuthCard, Field, FormAlert, SubmitButton } from "@/components/auth/AuthCard";
import { authApi } from "@/lib/api/auth";
import { useAuth, ROLE_HOME } from "@/lib/auth";
import { KeyRound, ShieldCheck, UserCheck } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log In — Thikana" },
      {
        name: "description",
        content: "Log in to your Thikana account to search and manage rental properties.",
      },
    ],
  }),
  component: LoginPage,
});

const loginSchema = z.object({
  identifier: z.string().min(1, { message: "auth.errors.required" }),
  password: z.string().min(1, { message: "auth.errors.required" }),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      const user = await authApi.login(values.identifier, values.password);
      setUser(user);
      navigate({ to: ROLE_HOME[user.role] });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setServerError(e.message ? t(e.message) : t("auth.errors.invalid"));
    }
  };

  const setDemo = (identifier: string) => {
    setValue("identifier", identifier, { shouldValidate: true });
    setValue("password", "Password1", { shouldValidate: true });
    setServerError(null);
  };

  return (
    <AuthCard
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      footer={
        <p>
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="font-semibold text-link underline hover:opacity-85">
            {t("auth.registerHere")}
          </Link>
        </p>
      }
    >
      {serverError && <FormAlert>{serverError}</FormAlert>}

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <Field
          label={t("auth.identifierLabel")}
          placeholder={t("auth.identifierPlaceholder")}
          autoComplete="username"
          error={errors.identifier?.message ? t(errors.identifier.message) : undefined}
          {...register("identifier")}
        />

        <div className="grid gap-1">
          <Field
            label={t("auth.passwordLabel")}
            type="password"
            placeholder={t("auth.passwordPlaceholder")}
            autoComplete="current-password"
            error={errors.password?.message ? t(errors.password.message) : undefined}
            {...register("password")}
          />
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-link underline hover:opacity-85"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>
        </div>

        <SubmitButton loading={isSubmitting}>
          {isSubmitting ? t("auth.loggingIn") : t("auth.loginButton")}
        </SubmitButton>
      </form>

      {/* Demo Credentials Helper for Academic Testing */}
      <div className="mt-6 rounded-xl border border-dashed border-border bg-secondary/50 p-4 text-xs">
        <p className="font-semibold text-foreground flex items-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
          {t("auth.demoCredentialsTitle")}
        </p>
        <p className="mt-1 text-muted-foreground">{t("auth.demoCredentialsDesc")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDemo("tenant@demo.test")}
            className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 font-medium text-foreground hover:bg-secondary focus-visible:outline-2"
          >
            <UserCheck className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            {t("roles.tenant")}
          </button>
          <button
            type="button"
            onClick={() => setDemo("landlord@demo.test")}
            className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 font-medium text-foreground hover:bg-secondary focus-visible:outline-2"
          >
            <UserCheck className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            {t("roles.landlord")}
          </button>
          <button
            type="button"
            onClick={() => setDemo("admin@demo.test")}
            className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 font-medium text-foreground hover:bg-secondary focus-visible:outline-2"
          >
            <ShieldCheck className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            {t("roles.admin")}
          </button>
        </div>
      </div>
    </AuthCard>
  );
}
