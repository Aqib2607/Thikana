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
      title={current === "bn" ? "Switch to English" : "বাংলায় পরিবর্তন করুন"}
      aria-label={t("lang.label")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-surface/90 text-xs font-bold text-foreground transition-all duration-180 hover:bg-secondary active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-ring"
    >
      <span aria-hidden="true">{current === "bn" ? "EN" : "বাং"}</span>
    </button>
  );
}
