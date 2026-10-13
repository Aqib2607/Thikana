import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Search, Percent, Columns3, ShieldCheck, Lock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Thikana — Verified rental homes in Khulna" },
      {
        name: "description",
        content:
          "Search, compare and visit rental flats, rooms, sublets and messes in Bangladesh. Bangla-first, Khulna first.",
      },
      { property: "og:title", content: "Thikana — Verified rental homes in Khulna" },
      {
        property: "og:description",
        content: "Search, compare and visit rental homes in Bangladesh.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TYPES = ["apartment", "house", "room", "sublet", "hostel", "mess"] as const;

function Index() {
  const { t } = useTranslation();
  const features = [
    { icon: Percent, title: t("home.f1t"), desc: t("home.f1d") },
    { icon: Columns3, title: t("home.f2t"), desc: t("home.f2d") },
    { icon: ShieldCheck, title: t("home.f3t"), desc: t("home.f3d") },
  ];
  const field =
    "h-12 w-full rounded-lg border border-input bg-surface px-4 text-base text-foreground placeholder:text-muted-foreground";

  return (
    <AppShell>
      <section className="relative overflow-hidden bg-hero">
        <svg
          aria-hidden="true"
          viewBox="0 0 600 600"
          className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] text-surface"
        >
          <path
            fill="currentColor"
            d="M421 92c58 43 103 117 96 189s-67 142-139 182-156 50-219 15S56 357 61 284s49-134 108-176 194-59 252-16Z"
          />
        </svg>
        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-16 md:pt-24">
          <p className="reveal-up inline-flex rounded-pill border border-border-strong bg-surface px-4 py-1 text-sm font-medium">
            {t("home.eyebrow")}
          </p>
          <h1 className="reveal-up mt-6 max-w-3xl text-[length:var(--text-xl)] font-semibold leading-[1.2] tracking-tight md:text-[length:var(--text-2xl)]">
            {t("home.title")}
          </h1>
          <p className="reveal-up mt-5 max-w-2xl text-lg text-muted-foreground">
            {t("home.subtitle")}
          </p>

          <form
            role="search"
            onSubmit={(e) => e.preventDefault()}
            className="reveal-up mt-10 grid gap-3 rounded-2xl bg-surface p-4 shadow-md md:grid-cols-[2fr_1fr_1fr_auto] md:items-end"
          >
            <label className="grid gap-1 text-sm font-medium">
              {t("home.searchLabel")}
              <input className={field} placeholder={t("home.searchPlaceholder")} />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              {t("home.typeLabel")}
              <select className={field} defaultValue="">
                <option value="">—</option>
                {TYPES.map((k) => (
                  <option key={k} value={k}>
                    {t(`types.${k}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              {t("home.budgetLabel")}
              <input className={field} type="number" inputMode="numeric" min={0} />
            </label>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground transition-opacity hover:opacity-85"
            >
              <Search className="h-4 w-4" aria-hidden="true" /> {t("home.search")}
            </button>
          </form>
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" aria-hidden="true" /> {t("home.loginNote")}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-20 md:grid-cols-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <article key={title} className="rounded-2xl border border-border bg-surface p-6">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-pill bg-inverse text-inverse-foreground">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-muted-foreground">{desc}</p>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
