import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth, ROLE_HOME } from "@/lib/auth";
import type { Role } from "@/lib/api/client";
import { AppShell } from "./AppShell";
import {
  ShieldAlert,
  ArrowLeft,
  LayoutDashboard,
  Search,
  Heart,
  Sliders,
  Columns3,
  MessageSquare,
  CalendarCheck,
  Star,
  PlusCircle,
  Building2,
  Users,
  ShieldCheck,
  AlertTriangle,
  FileText,
  BarChart3,
  ScrollText,
} from "lucide-react";

interface RoleLayoutProps {
  requiredRole: Role;
  title: string;
  subtitle?: string;
  children: ReactNode;
  activeTab?: string;
}

export function RoleLayout({
  requiredRole,
  title,
  subtitle,
  children,
  activeTab = "dashboard",
}: RoleLayoutProps) {
  const { t } = useTranslation();
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  if (!ready) {
    return (
      <AppShell>
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">{t("home.loginNote")}</p>
        </div>
      </AppShell>
    );
  }

  // Unauthenticated guard
  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <ShieldAlert className="h-7 w-7 text-destructive" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            {t("dashboard.unauthorizedTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("dashboard.unauthorizedDesc")}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => navigate({ to: "/login" })}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {t("nav.login")}
            </button>
            <Link
              to="/"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-5 text-sm font-medium hover:bg-secondary"
            >
              {t("dashboard.backHome")}
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // Cross-role authorization guard
  if (user.role !== requiredRole) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <ShieldAlert className="h-7 w-7 text-destructive" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            {t("dashboard.unauthorizedTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("dashboard.unauthorizedDesc")}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to={ROLE_HOME[user.role]}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {t("dashboard.goToMyDashboard")}
            </Link>
            <Link
              to="/"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-5 text-sm font-medium hover:bg-secondary"
            >
              {t("dashboard.backHome")}
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // Role nav items
  const tenantNav = [
    {
      key: "dashboard",
      href: "/tenant/dashboard",
      label: t("auth.dashboard"),
      icon: LayoutDashboard,
    },
    {
      key: "preferences",
      href: "/tenant/preferences",
      label: t("dashboard.myPreferences"),
      icon: Sliders,
    },
    { key: "favorites", href: "/tenant/favorites", label: t("dashboard.myFavorites"), icon: Heart },
    {
      key: "comparison",
      href: "/tenant/comparison",
      label: t("dashboard.myComparisons"),
      icon: Columns3,
    },
    {
      key: "messages",
      href: "/tenant/messages",
      label: t("dashboard.myMessages"),
      icon: MessageSquare,
    },
    { key: "visits", href: "/tenant/visits", label: t("dashboard.myVisits"), icon: CalendarCheck },
    { key: "reviews", href: "/tenant/reviews", label: t("dashboard.myReviews"), icon: Star },
  ];

  const landlordNav = [
    {
      key: "dashboard",
      href: "/landlord/dashboard",
      label: t("auth.dashboard"),
      icon: LayoutDashboard,
    },
    {
      key: "properties",
      href: "/landlord/properties",
      label: t("dashboard.myProperties"),
      icon: Building2,
    },
    {
      key: "new",
      href: "/landlord/properties/new",
      label: t("dashboard.newProperty"),
      icon: PlusCircle,
    },
    {
      key: "requests",
      href: "/landlord/contact-requests",
      label: t("dashboard.contactRequests"),
      icon: FileText,
    },
    {
      key: "messages",
      href: "/landlord/messages",
      label: t("dashboard.myMessages"),
      icon: MessageSquare,
    },
    {
      key: "visits",
      href: "/landlord/visits",
      label: t("dashboard.myVisits"),
      icon: CalendarCheck,
    },
  ];

  const adminNav = [
    {
      key: "dashboard",
      href: "/admin/dashboard",
      label: t("auth.dashboard"),
      icon: LayoutDashboard,
    },
    {
      key: "pending",
      href: "/admin/properties/pending",
      label: t("dashboard.pendingApprovals"),
      icon: AlertTriangle,
    },
    {
      key: "properties",
      href: "/admin/properties",
      label: t("dashboard.allProperties"),
      icon: Building2,
    },
    { key: "users", href: "/admin/users", label: t("dashboard.userManagement"), icon: Users },
    {
      key: "verifications",
      href: "/admin/verifications",
      label: t("dashboard.verifications"),
      icon: ShieldCheck,
    },
    {
      key: "reports",
      href: "/admin/reports",
      label: t("dashboard.reportsModeration"),
      icon: AlertTriangle,
    },
    {
      key: "community",
      href: "/admin/community",
      label: t("dashboard.communityManagement"),
      icon: Building2,
    },
    {
      key: "analytics",
      href: "/admin/analytics",
      label: t("dashboard.analytics"),
      icon: BarChart3,
    },
    { key: "audit", href: "/admin/audit-logs", label: t("dashboard.auditLogs"), icon: ScrollText },
  ];

  const navItems =
    requiredRole === "tenant" ? tenantNav : requiredRole === "landlord" ? landlordNav : adminNav;

  return (
    <AppShell>
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-foreground">
                  {t(`roles.${user.role}`)}
                </span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {requiredRole === "tenant" && (
              <Link
                to="/properties"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                {t("dashboard.searchProperties")}
              </Link>
            )}
            {requiredRole === "landlord" && (
              <Link
                to="/landlord/properties/new"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                {t("dashboard.newProperty")}
              </Link>
            )}
          </div>

          {/* Accessible Subnavigation Bar (Scrollable on mobile, no horizontal overflow) */}
          <nav
            aria-label="Role Portal Navigation"
            className="mt-6 -mb-6 flex gap-1 overflow-x-auto pb-2 scrollbar-none"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <Link
                  key={item.key}
                  to={item.href}
                  className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border-strong hover:text-foreground"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5">{children}</main>
    </AppShell>
  );
}
