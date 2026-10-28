import { useTranslation } from "react-i18next";
import { Bus, CloudRain, Wifi, Volume2, ShieldAlert, Info } from "lucide-react";
import { translateArea } from "@/lib/i18n";
import type { CommunityInfo } from "@/lib/api/properties";

interface CommunityInfoCardProps {
  community: CommunityInfo;
  areaName: string;
}

export function CommunityInfoCard({ community, areaName }: CommunityInfoCardProps) {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";

  const items = [
    {
      icon: Bus,
      title: t("community.transportTitle"),
      desc: community.transport,
    },
    {
      icon: CloudRain,
      title: t("community.waterloggingTitle"),
      desc: community.waterlogging,
    },
    {
      icon: Wifi,
      title: t("community.internetTitle"),
      desc: community.internet,
    },
    {
      icon: Volume2,
      title: t("community.noiseTitle"),
      desc: community.noise,
    },
    {
      icon: ShieldAlert,
      title: t("community.safetyTitle"),
      desc: community.safety,
    },
    {
      icon: Info,
      title: t("community.generalTitle"),
      desc: community.general,
    },
  ];

  return (
    <section
      aria-labelledby="community-info-heading"
      className="rounded-2xl border border-border bg-surface p-6 shadow-xs"
    >
      <div className="border-b border-border pb-4">
        <h2
          id="community-info-heading"
          className="text-xl font-bold tracking-tight text-foreground"
        >
          {t("community.heading", { area: translateArea(areaName, i18n.language) })}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("community.subtitle")}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex flex-col rounded-xl border border-border/70 bg-secondary/30 p-4 transition-colors hover:bg-secondary/60 h-full"
            >
              <div className="flex items-center gap-2.5 min-h-[44px]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-primary shadow-xs">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="text-sm font-semibold text-foreground leading-snug">{item.title}</h3>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground flex-1">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
