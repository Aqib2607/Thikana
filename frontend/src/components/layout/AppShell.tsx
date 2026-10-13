import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ThikanaLogo } from "@/components/brand/ThikanaLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";

import { useAuth, ROLE_HOME } from "@/lib/auth";
import { User as UserIcon, LogOut, LayoutDashboard } from "lucide-react";

export function SiteHeader() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-5">
        <Link to="/" aria-label="Thikana" className="shrink-0">
          <ThikanaLogo />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                to={ROLE_HOME[user.role]}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
              >
                <LayoutDashboard
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">{t("auth.dashboard")}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-foreground">
                  {t(`roles.${user.role}`)}
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="max-w-[120px] truncate font-medium text-foreground">
                  {user.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-2 focus-visible:outline-ring"
                title={t("auth.logout")}
                aria-label={t("auth.logout")}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t("auth.logout")}</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
              >
                {t("nav.login")}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring"
              >
                {t("nav.register")}
              </Link>
            </>
          )}
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <ThikanaLogo />
        <p className="max-w-md">{t("footer.note")}</p>
      </div>
    </footer>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {t("nav.skip")}
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
