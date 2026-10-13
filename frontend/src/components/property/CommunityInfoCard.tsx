import { useTranslation } from "react-i18next";
import { Bus, CloudRain, Wifi, Volume2, ShieldAlert, Info } from "lucide-react";
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
      title: isBn ? "যাতায়াত ও ট্রান্সপোর্ট" : "Transport & Connectivity",
      desc: community.transport,
    },
    {
      icon: CloudRain,
      title: isBn ? "জলাবদ্ধতা (বর্ষাকালীন অবস্থা)" : "Waterlogging & Drainage",
      desc: community.waterlogging,
    },
    {
      icon: Wifi,
      title: isBn ? "ইন্টারনেট ও ব্রডব্যান্ড" : "Internet & ISP Availability",
      desc: community.internet,
    },
    {
      icon: Volume2,
      title: isBn ? "শব্দ ও পরিবেশের শান্তি" : "Noise & Study Environment",
      desc: community.noise,
    },
    {
      icon: ShieldAlert,
      title: isBn ? "নিরাপত্তা ও গার্ড ব্যবস্থা" : "Safety & Neighborhood Security",
      desc: community.safety,
    },
    {
      icon: Info,
      title: isBn ? "এলাকার সার্বিক বিবরণ" : "General Area Information",
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
          {isBn ? `${areaName} এলাকার কমিউনিটি তথ্য` : `Community & Neighborhood: ${areaName}`}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isBn
            ? "শিক্ষার্থী ও নতুন ভাড়াটিয়াদের জন্য খুলনার বাস্তব গ্রাউন্ড রিপোর্ট"
            : "Ground-level neighborhood intelligence for students & tenants in Khulna"}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex flex-col rounded-xl border border-border/70 bg-secondary/30 p-4 transition-colors hover:bg-secondary/60"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-primary shadow-xs">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
