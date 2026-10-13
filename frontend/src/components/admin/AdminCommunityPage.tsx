import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { mockAdminApi } from "@/lib/api/mock/admin";
import type { CommunityInfo } from "@/lib/api/properties";
import { KHULNA_AREAS } from "@/lib/api/mock/properties";
import {
  Bus,
  Droplets,
  Wifi,
  Volume2,
  ShieldAlert,
  Info,
  Save,
  MapPin,
} from "lucide-react";

const DEFAULT_COMMUNITY_INFO: CommunityInfo = {
  transport: "সহজ ইজিবাইক ও লোকাল রিকশা সংযোগ।",
  waterlogging: "ভারী বৃষ্টিতেও দ্রুত পানি নিষ্কাশন হয়।",
  internet: "অপটিক্যাল ফাইবার নেটওয়ার্ক সক্রিয়।",
  noise: "শান্ত ও ছাত্রবান্ধব পরিবেশ।",
  safety: "প্রধান প্রবেশপথে নিরাপত্তা ব্যবস্থা রয়েছে।",
  general: "কাছেই মুদি দোকান ও নিত্যপ্রয়োজনীয় বাজার সুবিধা।",
};

export function AdminCommunityPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [communityMap, setCommunityMap] = useState<Record<string, CommunityInfo>>({});
  const [selectedArea, setSelectedArea] = useState<string>("KUET Gate / Teligati");
  const [formData, setFormData] = useState<CommunityInfo>(DEFAULT_COMMUNITY_INFO);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const areas = KHULNA_AREAS.slice(1); // Exclude "All Areas"

  useEffect(() => {
    let mounted = true;
    mockAdminApi.getCommunityData().then((data) => {
      if (mounted) {
        setCommunityMap(data);
        if (data[selectedArea]) {
          setFormData(data[selectedArea]);
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, [selectedArea]);

  const handleSelectArea = (area: string) => {
    setSelectedArea(area);
    setFormData(communityMap[area] || DEFAULT_COMMUNITY_INFO);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await mockAdminApi.updateCommunityData(selectedArea, formData, user.id, user.name || "Admin");
      setCommunityMap((prev) => ({ ...prev, [selectedArea]: formData }));
      setNotice(`'${selectedArea}'-এর কমিউনিটি তথ্য সফলভাবে হালনাগাদ করা হয়েছে।`);
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleLayout
      requiredRole="admin"
      title={t("dashboard.communityManagement")}
      subtitle="খুলনার বিভিন্ন এলাকার যাতায়াত, জলাবদ্ধতা, ইন্টারনেট ও পরিবেশ সংক্রান্ত তথ্য নিয়ন্ত্রণ"
      activeTab="community"
    >
      {/* Notice */}
      {notice && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success"
        >
          {notice}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Khulna Areas Selector Sidebar */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>খুলনার এলাকাসমূহ</span>
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              সম্পাদনা করতে যেকোনো এলাকা নির্বাচন করুন
            </p>

            <div className="mt-3 flex flex-col gap-1 max-h-[500px] overflow-y-auto">
              {areas.map((area) => {
                const isSelected = selectedArea === area;
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => handleSelectArea(area)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span>{area}</span>
                    {communityMap[area] && (
                      <span
                        className={`text-[10px] font-normal ${
                          isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                        }`}
                      >
                        কাস্টমাইজড
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Community Criteria Editor Form */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  কমিউনিটি তথ্য এডিটর
                </span>
                <h3 className="mt-1 text-xl font-bold text-foreground">{selectedArea}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  এই তথ্যটি এই এলাকার সকল বাসার বিস্তারিত পাতায় শিক্ষার্থীদের সহায়তায় দেখানো হবে
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="mt-6 space-y-4">
              {/* Transport */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-foreground mb-1">
                  <Bus className="h-4 w-4 text-primary" />
                  <span>যাতায়াত ও পরিবহন (Transport Connectivity)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.transport}
                  onChange={(e) => setFormData({ ...formData, transport: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Waterlogging */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-foreground mb-1">
                  <Droplets className="h-4 w-4 text-sky-500" />
                  <span>জলাবদ্ধতা পরিস্থিতি (Monsoon Waterlogging)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.waterlogging}
                  onChange={(e) => setFormData({ ...formData, waterlogging: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Internet */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-foreground mb-1">
                  <Wifi className="h-4 w-4 text-indigo-500" />
                  <span>ইন্টারনেট ও ব্রডব্যান্ড নেটওয়ার্ক (Internet Providers)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.internet}
                  onChange={(e) => setFormData({ ...formData, internet: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Noise */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-foreground mb-1">
                  <Volume2 className="h-4 w-4 text-amber-500" />
                  <span>শব্দদূষণ ও পরিবেশ (Noise Level & Study Atmosphere)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.noise}
                  onChange={(e) => setFormData({ ...formData, noise: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Safety */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-foreground mb-1">
                  <ShieldAlert className="h-4 w-4 text-emerald-500" />
                  <span>নিরাপত্তা ব্যবস্থা (Neighborhood Safety)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.safety}
                  onChange={(e) => setFormData({ ...formData, safety: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* General */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-foreground mb-1">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span>সাধারণ পরামর্শ ও সুযোগ-সুবিধা (General Notes & Amenities)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.general}
                  onChange={(e) => setFormData({ ...formData, general: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </RoleLayout>
  );
}
