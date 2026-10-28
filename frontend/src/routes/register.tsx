import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { AuthCard, Field, FormAlert, SubmitButton } from "@/components/auth/AuthCard";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/api/client";
import { Home, Building } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — Thikana" },
      {
        name: "description",
        content: "Create an account on Thikana to discover or list rental properties.",
      },
    ],
  }),
  component: RegisterPage,
});

const registerSchema = z
  .object({
    name: z.string().min(2, { message: "auth.errors.required" }),
    email: z.string().email({ message: "auth.errors.invalidEmail" }),
    phone: z.string().regex(/^01[3-9]\d{8}$/, { message: "auth.errors.invalidPhone" }),
    role: z.enum(["tenant", "landlord"] as const),
    password: z.string().min(8, { message: "auth.errors.passwordMin8" }),
    confirmPassword: z.string().min(1, { message: "auth.errors.required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.errors.passwordMismatch",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

function RegisterPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "tenant",
      password: "",
      confirmPassword: "",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (values: RegisterValues) => {
    setServerError(null);
    try {
      const user = await authApi.register({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        role: values.role as Role,
      });
      setUser(user);
      navigate({ to: "/verify-email" });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setServerError(e.message ? t(e.message) : t("auth.errors.generic"));
    }
  };

  return (
    <AuthCard
      title={t("auth.registerTitle")}
      subtitle={t("auth.registerSubtitle")}
      footer={
        <p>
          {t("auth.alreadyHaveAccount")}{" "}
          <Link to="/login" className="font-semibold text-link underline hover:opacity-85">
            {t("auth.loginHere")}
          </Link>
        </p>
      }
    >
      {serverError && <FormAlert>{serverError}</FormAlert>}

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        {/* Role Selection (Tenant vs Landlord only) */}
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">{t("auth.roleLabel")}</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setValue("role", "tenant")}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all focus-visible:outline-2 ${
                selectedRole === "tenant"
                  ? "border-primary bg-secondary/80 ring-1 ring-primary"
                  : "border-border bg-surface hover:bg-secondary/40"
              }`}
            >
              <div className="mt-0.5 rounded-full bg-primary p-1.5 text-primary-foreground">
                <Home className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t("roles.tenant")}</p>
                <p className="text-xs text-muted-foreground">{t("auth.roleTenantDesc")}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setValue("role", "landlord")}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all focus-visible:outline-2 ${
                selectedRole === "landlord"
                  ? "border-primary bg-secondary/80 ring-1 ring-primary"
                  : "border-border bg-surface hover:bg-secondary/40"
              }`}
            >
              <div className="mt-0.5 rounded-full bg-primary p-1.5 text-primary-foreground">
                <Building className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t("roles.landlord")}</p>
                <p className="text-xs text-muted-foreground">{t("auth.roleLandlordDesc")}</p>
              </div>
            </button>
          </div>
        </fieldset>

        <Field
          label={t("auth.nameLabel")}
          placeholder={t("auth.namePlaceholder")}
          autoComplete="name"
          error={errors.name?.message ? t(errors.name.message) : undefined}
          {...register("name")}
        />

        <Field
          label={t("auth.emailLabel")}
          type="email"
          placeholder={t("auth.emailPlaceholder")}
          autoComplete="email"
          error={errors.email?.message ? t(errors.email.message) : undefined}
          {...register("email")}
        />

        <Field
          label={t("auth.phoneLabel")}
          type="tel"
          placeholder={t("auth.phonePlaceholder")}
          autoComplete="tel"
          hint="017xxxxxxxx (১১ ডিজিট)"
          error={errors.phone?.message ? t(errors.phone.message) : undefined}
          {...register("phone")}
        />

        <Field
          label={t("auth.passwordLabel")}
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={
            errors.password?.message
              ? t(
                  errors.password.message,
                  i18n.language === "en"
                    ? "Password must be at least 8 characters."
                    : "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।",
                )
              : undefined
          }
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
          {isSubmitting ? t("auth.registering") : t("auth.registerButton")}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
