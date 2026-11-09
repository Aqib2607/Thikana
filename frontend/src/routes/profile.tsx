import { useState, useEffect, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { authApi } from "@/lib/api/auth";
import { AppShell } from "@/components/layout/AppShell";
import { toBnNumber } from "@/lib/i18n";
import {
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Save,
  RotateCcw,
  Sliders,
  Heart,
  CalendarCheck,
  Building2,
  MessageSquare,
  ScrollText,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "User Profile — Thikana" },
      {
        name: "description",
        content: "View and manage your Thikana account profile and role details.",
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
  component: ProfilePage,
});

interface ProfileFieldErrors {
  name?: string;
  phone?: string;
}

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const { user, ready, setUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state whenever the authenticated user updates
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  // Route-guard: redirect unauthenticated users
  useEffect(() => {
    if (ready && !user) {
      navigate({ to: "/login", search: { redirect: "/profile" } });
    }
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[50vh] max-w-4xl items-center justify-center px-4">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{t("profile.saving")}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const hasUnsavedChanges = name !== (user.name || "") || phone !== (user.phone || "");

  const handleReset = () => {
    setName(user.name || "");
    setPhone(user.phone || "");
    setFieldErrors({});
    setApiError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);
    setFieldErrors({});

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    // Client-side validation
    const errors: ProfileFieldErrors = {};
    if (!trimmedName) {
      errors.name = t("profile.errors.nameRequired");
    } else if (trimmedName.length > 255) {
      errors.name = t("profile.errors.nameMax");
    }

    if (trimmedPhone && trimmedPhone.length > 20) {
      errors.phone = t("profile.errors.phoneMax");
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser = await authApi.updateProfile({
        name: trimmedName,
        phone: trimmedPhone,
      });

      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["activeSessionData"] });
      setSuccessMessage(t("profile.feedback.updated"));
    } catch (err: unknown) {
      const errorObj = err as {
        status?: number;
        message?: string;
        fieldErrors?: Record<string, string[]>;
      };

      if (errorObj?.fieldErrors) {
        const mappedErrors: ProfileFieldErrors = {};
        if (errorObj.fieldErrors["name"]?.[0]) {
          mappedErrors.name = errorObj.fieldErrors["name"][0];
        }
        if (errorObj.fieldErrors["phone"]?.[0]) {
          mappedErrors.phone = errorObj.fieldErrors["phone"][0];
        }
        setFieldErrors(mappedErrors);
      }

      setApiError(
        errorObj?.message && errorObj.message !== "auth.errors.invalid"
          ? errorObj.message
          : t("profile.errors.updateFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatted date
  const memberSinceFormatted = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(isBn ? "bn-BD" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Header Breadcrumbs & Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              {t("profile.home")}
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{t("profile.title")}</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("profile.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("profile.description")}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Left Column: Account Summary Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-2xl border border-border/80 bg-surface/90 p-6 shadow-sm backdrop-blur-md">
              <div className="flex flex-col items-center text-center">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-primary shadow-inner">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                  )}
                  {user.verified && (
                    <span
                      title={t("profile.verified")}
                      className="absolute bottom-0 right-0 rounded-full bg-emerald-500 p-1 text-white shadow-sm ring-2 ring-surface"
                    >
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    </span>
                  )}
                </div>

                <h2 className="mt-4 text-lg font-bold text-foreground">{user.name}</h2>
                <p className="text-xs text-muted-foreground">{user.email}</p>

                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <span>{t(`roles.${user.role}`)}</span>
                </div>

                <div className="mt-6 w-full space-y-3 border-t border-border/60 pt-4 text-left text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("profile.statusLabel")}
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                      {user.status || "active"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("profile.verificationLabel")}
                    </span>
                    <span
                      className={`font-semibold ${user.verified ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}
                    >
                      {user.verified ? t("profile.verified") : t("profile.unverified")}
                    </span>
                  </div>

                  {memberSinceFormatted && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {t("profile.memberSince")}
                      </span>
                      <span className="font-medium text-foreground">{memberSinceFormatted}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Role-Aware Shortcuts */}
            <div className="rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-sm">
              {user.role === "tenant" && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t("profile.tenantSectionTitle")}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("profile.tenantSectionDesc")}
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Link
                      to="/tenant/preferences"
                      className="inline-flex items-center justify-between rounded-xl border border-border/80 bg-secondary/50 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Sliders className="h-3.5 w-3.5 text-primary" />
                        {t("profile.tenantPreferencesLink")}
                      </span>
                      <span aria-hidden="true">→</span>
                    </Link>
                    <Link
                      to="/tenant/favorites"
                      className="inline-flex items-center justify-between rounded-xl border border-border/80 bg-secondary/50 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Heart className="h-3.5 w-3.5 text-rose-500" />
                        {t("profile.tenantFavoritesLink")}
                      </span>
                      <span aria-hidden="true">→</span>
                    </Link>
                    <Link
                      to="/tenant/visits"
                      className="inline-flex items-center justify-between rounded-xl border border-border/80 bg-secondary/50 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <CalendarCheck className="h-3.5 w-3.5 text-amber-500" />
                        {t("profile.tenantVisitsLink")}
                      </span>
                      <span aria-hidden="true">→</span>
                    </Link>
                    <Link
                      to="/tenant/dashboard"
                      className="inline-flex items-center justify-between rounded-xl border border-border/80 bg-secondary/50 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                        {t("auth.dashboard")}
                      </span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              )}

              {user.role === "landlord" && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t("profile.landlordSectionTitle")}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("profile.landlordSectionDesc")}
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Link
                      to="/landlord/properties"
                      className="inline-flex items-center justify-between rounded-xl border border-border/80 bg-secondary/50 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                        {t("profile.landlordPropertiesLink")}
                      </span>
                      <span aria-hidden="true">→</span>
                    </Link>
                    <Link
                      to="/landlord/contact-requests"
                      className="inline-flex items-center justify-between rounded-xl border border-border/80 bg-secondary/50 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                        {t("profile.landlordInquiriesLink")}
                      </span>
                      <span aria-hidden="true">→</span>
                    </Link>
                    <Link
                      to="/landlord/dashboard"
                      className="inline-flex items-center justify-between rounded-xl border border-border/80 bg-secondary/50 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                        {t("auth.dashboard")}
                      </span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              )}

              {user.role === "admin" && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t("profile.adminSectionTitle")}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("profile.adminSectionDesc")}
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Link
                      to="/admin/dashboard"
                      className="inline-flex items-center justify-between rounded-xl border border-border/80 bg-secondary/50 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                        {t("profile.adminDashboardLink")}
                      </span>
                      <span aria-hidden="true">→</span>
                    </Link>
                    <Link
                      to="/admin/audit-logs"
                      className="inline-flex items-center justify-between rounded-xl border border-border/80 bg-secondary/50 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <ScrollText className="h-3.5 w-3.5 text-amber-500" />
                        {t("profile.adminAuditLogsLink")}
                      </span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Editable Profile Form */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border/80 bg-surface/90 p-6 sm:p-8 shadow-sm backdrop-blur-md">
              <h2 className="text-xl font-bold text-foreground">{t("profile.editTitle")}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{t("profile.readOnlyNote")}</p>

              {/* Success Notification */}
              {successMessage && (
                <div
                  role="status"
                  className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Error Notification */}
              {apiError && (
                <div
                  role="alert"
                  className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{apiError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="profile-name"
                    className="block text-xs font-semibold text-foreground"
                  >
                    {t("profile.nameLabel")} <span className="text-destructive">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="profile-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSubmitting}
                      placeholder={t("profile.namePlaceholder")}
                      className={`block w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        fieldErrors.name ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
                      }`}
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="mt-1 text-xs text-destructive">{fieldErrors.name}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label
                    htmlFor="profile-phone"
                    className="block text-xs font-semibold text-foreground"
                  >
                    {t("profile.phoneLabel")}
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="profile-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isSubmitting}
                      placeholder={t("profile.phonePlaceholder")}
                      className={`block w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        fieldErrors.phone ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="mt-1 text-xs text-destructive">{fieldErrors.phone}</p>
                  )}
                </div>

                {/* Read-Only: Email Address */}
                <div>
                  <label
                    htmlFor="profile-email"
                    className="block text-xs font-semibold text-foreground flex items-center justify-between"
                  >
                    <span>{t("profile.emailLabel")}</span>
                    <span className="text-[11px] font-normal text-muted-foreground flex items-center gap-1">
                      <Lock className="h-3 w-3" aria-hidden="true" />
                      {t("profile.protected")}
                    </span>
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="profile-email"
                      type="email"
                      value={user.email}
                      disabled
                      readOnly
                      className="block w-full cursor-not-allowed rounded-xl border border-border/60 bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Read-Only: Role */}
                <div>
                  <label
                    htmlFor="profile-role"
                    className="block text-xs font-semibold text-foreground flex items-center justify-between"
                  >
                    <span>{t("profile.roleLabel")}</span>
                    <span className="text-[11px] font-normal text-muted-foreground flex items-center gap-1">
                      <Lock className="h-3 w-3" aria-hidden="true" />
                      {t("profile.protected")}
                    </span>
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="profile-role"
                      type="text"
                      value={t(`roles.${user.role}`)}
                      disabled
                      readOnly
                      className="block w-full cursor-not-allowed rounded-xl border border-border/60 bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isSubmitting || !hasUnsavedChanges}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t("profile.cancel")}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || !hasUnsavedChanges}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Save className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>{isSubmitting ? t("profile.saving") : t("profile.saveChanges")}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

