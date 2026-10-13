import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { mockAdminApi } from "@/lib/api/mock/admin";
import {
  type PropertyItem,
  type VerificationState,
  VERIFICATION_STATES,
} from "@/lib/api/properties";
import { ShieldAlert, Search, CheckCircle2, Building2, MapPin, X } from "lucide-react";

export function AdminVerificationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const data = await mockAdminApi.getProperties();
      setProperties(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const handleToggleVerification = async (prop: PropertyItem, verif: VerificationState) => {
    if (!user) return;
    const exists = prop.verifications.includes(verif);
    const nextVerifs = exists
      ? prop.verifications.filter((v) => v !== verif)
      : [...prop.verifications, verif];

    setUpdatingId(`${prop.id}-${verif}`);
    try {
      const updated = await mockAdminApi.updatePropertyVerifications(
        prop.id,
        nextVerifs,
        user.id,
        user.name || "Admin",
      );
      setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setNotice(
        `'${prop.title}'-এ '${verif.replace(" Verified", "")}' ব্যাজ ${
          exists ? "অপসারণ" : "যুক্ত"
        } করা হয়েছে।`,
      );
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase().trim();
    return (
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.area.toLowerCase().includes(q) ||
      p.landlord.name.toLowerCase().includes(q)
    );
  });

  return (
    <RoleLayout
      requiredRole="admin"
      title={t("dashboard.verifications")}
      subtitle="প্ল্যাটফর্ম-স্তরের সিমুলেটেড যাচাইকরণ ব্যবস্থাপনা ও ব্যাজ নিয়ন্ত্রণ"
      activeTab="verifications"
    >
      {/* Platform Disclaimer Banner */}
      <div
        role="alert"
        className="mb-8 rounded-2xl border border-warning/40 bg-warning/10 p-5 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/20 text-warning-foreground">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">{t("admin.disclaimerBanner")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t("admin.disclaimerDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success"
        >
          {notice}
        </div>
      )}

      {/* Search Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">লিস্টিংভিত্তিক যাচাইকরণ তালিকা</h2>
          <p className="text-xs text-muted-foreground">
            চেকবক্সগুলোতে ক্লিক করে রিয়েল-টাইমে ভেরিফিকেশন স্ট্যাটাস পরিবর্তন করুন
          </p>
        </div>

        <div className="relative min-w-[260px]">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="বাসার নাম বা এলাকা খুঁজুন..."
            className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Verifications Matrix Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">লিস্টিং লোড হচ্ছে...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <p className="mt-3 text-base font-semibold text-foreground">
              কোনো প্রপার্টি পাওয়া যায়নি
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/50 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3.5 min-w-[240px]">
                    প্রপার্টি ও বাড়িওয়ালা
                  </th>
                  {VERIFICATION_STATES.map((state) => (
                    <th key={state} scope="col" className="px-3 py-3.5 text-center">
                      <span className="block whitespace-nowrap text-foreground font-bold">
                        {state === "Owner Identity Verified"
                          ? "মালিক পরিচয়"
                          : state === "Phone Verified"
                            ? "ফোন নম্বর"
                            : state === "Availability Verified"
                              ? "প্রাপ্যতা"
                              : "নথিপত্র"}
                      </span>
                      <span className="block text-[10px] text-muted-foreground font-normal">
                        (Simulated)
                      </span>
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3.5 text-right whitespace-nowrap">
                    মোট ব্যাজ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.featuredImage || p.images[0]}
                          alt={p.title}
                          className="h-10 w-14 shrink-0 rounded-lg object-cover border border-border"
                        />
                        <div className="min-w-0 max-w-xs">
                          <p className="truncate font-semibold text-foreground">{p.title}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{p.area}</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            বাড়িওয়ালা: {p.landlord.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 4 Verification Badges Toggles */}
                    {VERIFICATION_STATES.map((verif) => {
                      const isActive = p.verifications.includes(verif);
                      const isUpdating = updatingId === `${p.id}-${verif}`;
                      return (
                        <td key={verif} className="px-3 py-3.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleVerification(p, verif)}
                            disabled={isUpdating}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                              isActive
                                ? "bg-success/15 text-success hover:bg-success/25 ring-1 ring-success/30"
                                : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                            }`}
                            title={`ক্লিক করে ${verif} স্ট্যাটাস পরিবর্তন করুন`}
                          >
                            {isActive ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>সক্রিয়</span>
                              </>
                            ) : (
                              <span>নিষ্ক্রিয়</span>
                            )}
                          </button>
                        </td>
                      );
                    })}

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                        {p.verifications.length} / 4
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleLayout>
  );
}
