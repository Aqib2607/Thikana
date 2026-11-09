import { useState, useEffect, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ThikanaLogo } from "@/components/brand/ThikanaLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAuth, ROLE_HOME } from "@/lib/auth";
import {
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import { NotificationBell } from "@/components/notifications/NotificationBell";

export function SiteHeader({ hideDashboardButton }: { hideDashboardButton?: boolean }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const shouldHideDashboard =
    hideDashboardButton ||
    Boolean(
      typeof window !== "undefined" && user && window.location.pathname === ROLE_HOME[user.role],
    );

  const closeMobileMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setMobileMenuOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const toggleMobileMenu = () => {
    if (mobileMenuOpen) {
      closeMobileMenu();
    } else {
      setMobileMenuOpen(true);
    }
  };

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMobileMenu();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-4 z-40 px-4 sm:px-5 mb-4 transition-all">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-full bg-glass-nav px-4 sm:px-5 transition-all duration-200">
        {/* Brand */}
        <Link
          to="/"
          aria-label="Thikana"
          className="shrink-0 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
        >
          <ThikanaLogo />
        </Link>

        {/* Center Navigation Links (Editorial style) */}
        <nav
          aria-label="Main"
          className="hidden md:flex items-center gap-4 text-xs font-medium text-muted-foreground"
        >
          <Link
            to="/properties"
            className="px-3 py-1.5 rounded-full transition-all duration-200 hover:text-foreground hover:bg-secondary/60"
          >
            {t("nav.properties")}
          </Link>

          <a
            href="#why-thikana"
            className="px-3 py-1.5 rounded-full transition-all duration-200 hover:text-foreground hover:bg-secondary/60"
          >
            {t("nav.why")}
          </a>

          <a
            href="#contact"
            className="px-3 py-1.5 rounded-full transition-all duration-200 hover:text-foreground hover:bg-secondary/60"
          >
            {t("nav.contact")}
          </a>
        </nav>

        {/* Right Action Island */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {!shouldHideDashboard && (
                <Link
                  to={ROLE_HOME[user.role]}
                  aria-label={`${t("auth.dashboard")} (${t(`roles.${user.role}`)})`}
                  title={`${t("auth.dashboard")} (${t(`roles.${user.role}`)})`}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-border/80 bg-surface/90 px-3.5 text-xs font-semibold text-foreground transition-all duration-180 hover:bg-secondary active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <LayoutDashboard
                    className="h-3.5 w-3.5 shrink-0 text-primary"
                    aria-hidden="true"
                  />

                  <span className="hidden sm:inline font-semibold">{t("auth.dashboard")}</span>
                </Link>
              )}

              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>

              <NotificationBell />

              <Link
                to="/profile"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-surface/90 text-muted-foreground transition-all duration-180 hover:text-foreground hover:bg-secondary active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-ring"
                title={t("nav.profile")}
                aria-label={t("nav.profile")}
              >
                <UserIcon className="h-4 w-4" aria-hidden="true" />
              </Link>

              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-surface/90 text-muted-foreground transition-all duration-180 hover:text-destructive hover:bg-secondary active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
                title={t("auth.logout")}
                aria-label={t("auth.logout")}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex h-9 items-center rounded-full px-3.5 text-xs font-semibold text-foreground transition-all duration-180 hover:bg-secondary active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-ring"
              >
                {t("nav.login")}
              </Link>

              <Link
                to="/register"
                className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-180 hover:bg-primary/90 hover-lift-sm active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-ring"
              >
                {t("nav.register")}
              </Link>

              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>
            </>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-surface/80 p-1.5 text-foreground hover:bg-secondary active:scale-95 transition-all duration-180 cursor-pointer"
            aria-expanded={mobileMenuOpen}
            aria-label={t("nav.toggleMenu")}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden mt-2 mx-auto max-w-5xl rounded-3xl border border-border/80 bg-surface/98 p-5 shadow-xl backdrop-blur-xl ${
            isClosing
              ? "animate-out fade-out slide-out-to-top-2 duration-200 ease-in"
              : "animate-in fade-in slide-in-from-top-2 duration-250 ease-out"
          }`}
        >
          <nav className="flex flex-col gap-3 text-sm font-medium">
            <Link
              to="/properties"
              onClick={closeMobileMenu}
              className="px-3 py-2 rounded-xl hover:bg-secondary text-foreground transition-colors duration-150"
            >
              {t("nav.properties")}
            </Link>

            <a
              href="#why-thikana"
              onClick={closeMobileMenu}
              className="px-3 py-2 rounded-xl hover:bg-secondary text-foreground transition-colors duration-150"
            >
              {t("nav.why")}
            </a>

            <a
              href="#contact"
              onClick={closeMobileMenu}
              className="px-3 py-2 rounded-xl hover:bg-secondary text-foreground transition-colors duration-150"
            >
              {t("nav.contact")}
            </a>

            <div className="border-t border-border pt-3 flex items-center justify-between">
              <LanguageSwitcher />

              {!user && (
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="text-xs font-semibold px-4 py-2 rounded-full border border-border hover:bg-secondary transition-colors duration-150"
                >
                  {t("nav.login")}
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-black bg-black text-white">
      {/* Background Ghost Watermark from Reference Video (111s) */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 select-none text-8xl sm:text-9xl font-black uppercase tracking-tighter text-white/[0.03] leading-none whitespace-nowrap"
      >
        THIKANA
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-5">
        {/* Rebalanced Editorial Contact Header */}

        <div className="border-b border-neutral-800 pb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold tracking-wider text-neutral-400">
                {t("footer.inquiry")}
              </p>

              <a
                href="mailto:hello@thikana.com.bd"
                className="group mt-2 inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-white hover:text-neutral-300 transition-colors"
              >
                <span>hello@thikana.com.bd</span>

                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-neutral-400 group-hover:text-white" />
              </a>

              <p className="mt-2 text-xs sm:text-sm text-neutral-400 max-w-xl">
                {t("footer.tagline")}
              </p>
            </div>

            <div className="shrink-0">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold text-black shadow-md transition-all hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-white"
              >
                <span>{t("nav.listHome")}</span>

                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Directory columns */}

        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 md:grid-cols-4 border-b border-neutral-800 text-sm">
          {/* Brand info */}

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <Building2 className="h-5 w-5 text-neutral-400" />

              <span className="font-bold tracking-tight text-base text-white">
                ঠিকানা <span className="text-neutral-400 font-medium text-sm">/ Thikana</span>
              </span>
            </div>

            <p className="text-xs leading-relaxed text-neutral-400">{t("footer.brandBio")}</p>

            <div className="pt-2 flex items-center gap-2 text-xs text-neutral-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />

              <span>{t("footer.verifiedHosts")}</span>
            </div>
          </div>

          {/* Categories */}

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              {t("footer.colCategories")}
            </h3>

            <ul className="mt-3 space-y-2 text-xs text-neutral-400">
              <li>
                <Link
                  to="/properties"

                  search={{ propertyType: "apartment" }}
                  className="hover:text-white transition-colors"
                >
                  {t("footer.aptFamily")}
                </Link>
              </li>

              <li>
                <Link
                  to="/properties"

                  search={{ propertyType: "bachelor_room" }}
                  className="hover:text-white transition-colors"
                >
                  {t("footer.roomBachelor")}
                </Link>
              </li>

              <li>
                <Link
                  to="/properties"

                  search={{ propertyType: "hostel" }}
                  className="hover:text-white transition-colors"
                >
                  {t("footer.hostelStudent")}
                </Link>
              </li>

              <li>
                <Link
                  to="/properties"

                  search={{ propertyType: "sublet" }}
                  className="hover:text-white transition-colors"
                >
                  {t("footer.subletRoom")}
                </Link>
              </li>

              <li>
                <Link
                  to="/properties"

                  search={{ propertyType: "commercial" }}
                  className="hover:text-white transition-colors"
                >
                  {t("footer.commercialSpace")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Khulna Locations */}

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              {t("footer.colLocations")}
            </h3>

            <ul className="mt-3 space-y-2 text-xs text-neutral-400">
              <li>
                <Link
                  to="/properties"

                  search={{ area: "Zero Point" }}
                  className="hover:text-white transition-colors"
                >
                  {t("footer.locZeroPoint")}
                </Link>
              </li>

              <li>
                <Link
                  to="/properties"

                  search={{ area: "Sonadanga" }}
                  className="hover:text-white transition-colors"
                >
                  {t("footer.locSonadanga")}
                </Link>
              </li>

              <li>
                <Link
                  to="/properties"

                  search={{ area: "Boyra" }}
                  className="hover:text-white transition-colors"
                >
                  {t("footer.locBoyra")}
                </Link>
              </li>

              <li>
                <Link
                  to="/properties"

                  search={{ area: "Gollamari" }}
                  className="hover:text-white transition-colors"
                >
                  {t("footer.locGollamari")}
                </Link>
              </li>

              <li>
                <Link
                  to="/properties"

                  search={{ area: "Khalishpur" }}
                  className="hover:text-white transition-colors"
                >
                  {t("footer.locKhalishpur")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              {t("footer.colSupport")}
            </h3>

            <ul className="mt-3 space-y-2.5 text-xs text-neutral-400">
              <li className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-neutral-500" />

                <span>{t("footer.addressText")}</span>
              </li>

              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-neutral-500" />

                <a
                  href="tel:+8801712345678"
                  className="hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-ring rounded-xs"
                >
                  +880 1712 345678
                </a>
              </li>

              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-neutral-500" />

                <a
                  href="mailto:support@thikana.com.bd"
                  className="hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-ring rounded-xs"
                >
                  support@thikana.com.bd
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & legal row */}

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-neutral-900 pt-8 text-xs text-neutral-500 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-start">
            <p>
              © {new Date().getFullYear()} Thikana Technologies Ltd. {t("footer.rights")}
            </p>
            <span className="hidden sm:inline text-neutral-700" aria-hidden="true">
              ·
            </span>
            <a href="#why-thikana" className="hover:text-white transition-colors py-1">
              {t("footer.privacy")}
            </a>
            <span className="hidden sm:inline text-neutral-700" aria-hidden="true">
              ·
            </span>
            <a href="#why-thikana" className="hover:text-white transition-colors py-1">
              {t("footer.terms")}
            </a>
          </div>

          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="hover:text-white transition-colors py-1 cursor-pointer flex items-center gap-1 shrink-0"
            aria-label={t("footer.backToTop")}
          >
            <span>{t("footer.backToTop")}</span>
            <span aria-hidden="true">↑</span>
          </button>
        </div>
      </div>
    </footer>
  );
}

interface AppShellProps {
  children: ReactNode;
  hideDashboardButton?: boolean;
}

export function AppShell({ children, hideDashboardButton }: AppShellProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-neutral-900 selection:text-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground shadow-lg"
      >
        {t("nav.skip")}
      </a>

      <SiteHeader hideDashboardButton={hideDashboardButton} />

      <main id="main" className="flex-1">
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
