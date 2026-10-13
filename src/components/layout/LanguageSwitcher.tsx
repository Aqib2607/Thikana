import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { LANG_KEY, type Lang } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = (i18n.language as Lang) ?? "bn";

  useEffect(() => {
    const saved = localStorage.getItem(LANG_KEY) as Lang | null;
    if (saved && saved !== i18n.language) i18n.changeLanguage(saved);
  }, [i18n]);

  useEffect(() => {
    document.documentElement.lang = current;
  }, [current]);

  const toggle = () => {
    const next: Lang = current === "bn" ? "en" : "bn";
    i18n.changeLanguage(next);
    localStorage.setItem(LANG_KEY, next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("lang.label")}
      className="inline-flex h-10 items-center gap-2 rounded-pill border border-border bg-surface px-4 text-sm font-medium transition-colors hover:bg-muted"
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      {current === "bn" ? t("lang.en") : t("lang.bn")}
    </button>
  );
}
