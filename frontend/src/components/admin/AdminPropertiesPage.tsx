import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { mockAdminApi } from "@/lib/api/mock/admin";
import type { PropertyItem, ApprovalStatus } from "@/lib/api/properties";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Building2,
  AlertTriangle,
  X,
  MapPin,
} from "lucide-react";

export function AdminPropertiesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ApprovalStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  // Review modal state
  const [activeProperty, setActiveProperty] = useState<PropertyItem | null>(null);

  // Reject modal state
  const [rejectingProperty, setRejectingProperty] = useState<PropertyItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

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

  const handleApprove = async (property: PropertyItem) => {
    if (!user) return;
    setSubmittingAction(true);
    try {
      const updated = await mockAdminApi.approveProperty(
        property.id,
        user.id,
        user.name || "Admin",
      );
      setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (activeProperty?.id === property.id) {
        setActiveProperty(updated);
      }
      setActionNotice(`'${property.title}' সফলভাবে অনুমোদিত হয়েছে।`);
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!user || !rejectingProperty) return;
    setSubmittingAction(true);
    try {
      const updated = await mockAdminApi.rejectProperty(
        rejectingProperty.id,
        rejectReason.trim() || "তথ্য অসম্পূর্ণ বা যাচাইয়ে ত্রুটি পাওয়া গেছে।",
        user.id,
        user.name || "Admin",
      );
      setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (activeProperty?.id === rejectingProperty.id) {
        setActiveProperty(updated);
      }
      setActionNotice(`'${rejectingProperty.title}' বাতিল করা হয়েছে। কারণ অডিটে সংরক্ষিত হয়েছে।`);
      setRejectingProperty(null);
      setRejectReason("");
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setSubmittingAction(false);
    }
  };

  const filtered = properties.filter((p) => {
    const matchesStatus = filter === "ALL" ? true : p.approvalStatus === filter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.area.toLowerCase().includes(q) ||
      p.landlord.name.toLowerCase().includes(q) ||
      p.exactAddress.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status?: ApprovalStatus) => {
    if (status === "Pending Approval") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-semibold text-warning-foreground">
          <AlertTriangle className="h-3 w-3" />
          {t("landlord.pendingApproval")}
        </span>
      );
    }
    if (status === "Rejected") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-semibold text-destructive">
          <XCircle className="h-3 w-3" />
          {t("landlord.rejected")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
        <CheckCircle2 className="h-3 w-3" />
        {t("landlord.approved")}
      </span>
    );
  };

  return (
    <RoleLayout
      requiredRole="admin"
      title={t("dashboard.allProperties")}
      subtitle="প্ল্যাটফর্মের সকল লিস্টিং যাচাই, অনুমোদন এবং স্থিতি ব্যবস্থাপনা"
      activeTab="properties"
    >
      {/* Action Notification Alert */}
      {actionNotice && (
        <div
          role="status"
          className="mb-6 flex items-center justify-between rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success"
        >
          <span>{actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="hover:opacity-75"
            aria-label="Dismiss notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Control Bar: Search and Status Tabs */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-surface p-1">
          {(["ALL", "Pending Approval", "Approved", "Rejected"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {tab === "ALL"
                ? "সকল লিস্টিং"
                : tab === "Pending Approval"
                  ? "অনুমোদনাধীন"
                  : tab === "Approved"
                    ? "অনুমোদিত"
                    : "প্রত্যাখ্যাত"}
              <span className="ml-1.5 opacity-75">
                (
                {tab === "ALL"
                  ? properties.length
                  : properties.filter((p) => p.approvalStatus === tab).length}
                )
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="বাসার নাম, এলাকা বা বাড়িওয়ালা খুঁজুন..."
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

      {/* Properties Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">লিস্টিং লোড হচ্ছে...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <p className="mt-3 text-base font-semibold text-foreground">
              কোনো প্রপার্টি পাওয়া যায়নি
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              অনুসন্ধান শর্ত বা ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/50 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3.5">
                    বাসা ও বিবরণ
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    বাড়িওয়ালা
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    ভাড়া
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    অবস্থা
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    যাচাইকরণ
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    কার্যক্রম
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
                          className="h-12 w-16 shrink-0 rounded-lg object-cover border border-border"
                        />
                        <div className="min-w-0 max-w-xs">
                          <p className="truncate font-semibold text-foreground">{p.title}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{p.area}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="text-xs">
                        <p className="font-semibold text-foreground">{p.landlord.name}</p>
                        <p className="text-muted-foreground">
                          {p.landlord.phone || "ফোন উল্লেখ নেই"}
                        </p>
                        <span
                          className={`mt-0.5 inline-block text-[10px] font-semibold ${
                            p.landlord.publicContactVisible
                              ? "text-success"
                              : "text-muted-foreground"
                          }`}
                        >
                          {p.landlord.publicContactVisible
                            ? "প্রকাশ্যে দৃশ্যমান"
                            : "গোপন (অনুরোধ সাপেক্ষ)"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="font-bold text-foreground">৳{p.rent.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">/{t("properties.month")}</p>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(p.approvalStatus)}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {p.verifications.length > 0 ? (
                          p.verifications.map((v) => (
                            <span
                              key={v}
                              className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                            >
                              {v.replace(" Verified", "")}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">কোনো যাচাই নেই</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveProperty(p)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
                          title="বিস্তারিত বিবরণ দেখুন"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>বিবরণ</span>
                        </button>

                        {p.approvalStatus !== "Approved" && (
                          <button
                            type="button"
                            onClick={() => handleApprove(p)}
                            disabled={submittingAction}
                            className="inline-flex items-center gap-1 rounded-lg bg-success px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>অনুমোদন</span>
                          </button>
                        )}

                        {p.approvalStatus !== "Rejected" && (
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingProperty(p);
                              setRejectReason("");
                            }}
                            disabled={submittingAction}
                            className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>বাতিল</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Details Modal */}
      {activeProperty && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {activeProperty.propertyType}
                  </span>
                  {getStatusBadge(activeProperty.approvalStatus)}
                </div>
                <h3 className="mt-1 text-xl font-bold text-foreground">{activeProperty.title}</h3>
                <p className="text-sm text-muted-foreground">{activeProperty.exactAddress}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveProperty(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Photos Preview */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted-foreground">
                আপলোডকৃত ছবিসমূহ (সর্বোচ্চ ৫টি)
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {activeProperty.images.map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-4/3 overflow-hidden rounded-lg border border-border"
                  >
                    <img
                      src={img}
                      alt={`Preview ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 py-0.5 text-[9px] font-bold text-white">
                        প্রধান ছবি
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Key Specifications Grid */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-border bg-secondary/30 p-4 text-xs">
              <div>
                <span className="text-muted-foreground">মাসিক ভাড়া</span>
                <p className="font-bold text-foreground text-sm">
                  ৳{activeProperty.rent.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">অগ্রিম জামানত</span>
                <p className="font-bold text-foreground text-sm">
                  ৳{activeProperty.advance?.toLocaleString() || "0"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">রুম ও বাথ</span>
                <p className="font-bold text-foreground text-sm">
                  {activeProperty.rooms} রুম · {activeProperty.bathrooms} বাথ
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">পছন্দনীয় ভাড়াটিয়া</span>
                <p className="font-bold text-foreground text-sm">
                  {activeProperty.preferredTenant}
                </p>
              </div>
            </div>

            {/* Landlord Contact Info */}
            <div className="mt-4 rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-bold text-foreground">বাড়িওয়ালার তথ্য</p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-foreground">{activeProperty.landlord.name}</p>
                  <p className="text-muted-foreground">{activeProperty.landlord.email}</p>
                  <p className="text-muted-foreground">{activeProperty.landlord.phone}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      activeProperty.landlord.publicContactVisible
                        ? "bg-success/15 text-success"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {activeProperty.landlord.publicContactVisible
                      ? "পাবলিক কন্টাক্ট অন"
                      : "পাবলিক কন্টাক্ট অফ"}
                  </span>
                </div>
              </div>
            </div>

            {/* Neighborhood / Community Insight */}
            <div className="mt-4 rounded-xl border border-border bg-surface p-4 text-xs">
              <p className="font-bold text-foreground">কমিউনিটি ও যাতায়াত তথ্য</p>
              <p className="mt-1 text-muted-foreground leading-relaxed">
                <strong>যাতায়াত:</strong> {activeProperty.community.transport}
              </p>
              <p className="mt-1 text-muted-foreground leading-relaxed">
                <strong>জলাবদ্ধতা:</strong> {activeProperty.community.waterlogging}
              </p>
              <p className="mt-1 text-muted-foreground leading-relaxed">
                <strong>ইন্টারনেট:</strong> {activeProperty.community.internet}
              </p>
            </div>

            {/* Actions Inside Modal */}
            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
              {activeProperty.approvalStatus !== "Approved" && (
                <button
                  type="button"
                  onClick={() => handleApprove(activeProperty)}
                  disabled={submittingAction}
                  className="rounded-lg bg-success px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  অনুমোদন দিন
                </button>
              )}
              {activeProperty.approvalStatus !== "Rejected" && (
                <button
                  type="button"
                  onClick={() => {
                    setRejectingProperty(activeProperty);
                    setRejectReason("");
                  }}
                  disabled={submittingAction}
                  className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50"
                >
                  প্রত্যাখ্যান করুন
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveProperty(null)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject with Reason Dialog */}
      {rejectingProperty && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  লিস্টিং প্রত্যাখ্যান নিশ্চিতকরণ
                </h3>
                <p className="text-xs text-muted-foreground">{rejectingProperty.title}</p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              বাড়িওয়ালার অবগতির জন্য লিস্টিংটি প্রত্যাখ্যান করার কারণ লিখুন। এটি অডিট লগে সংরক্ষিত
              হবে।
            </p>

            <div className="mt-3">
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="যেমন: ছবি স্পষ্ট নয়, ঠিকানায় অসংগতি রয়েছে, অথবা অস্বাভাবিক ভাড়া চাওয়া হয়েছে..."
                className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingProperty(null)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={submittingAction}
                className="rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {submittingAction ? "প্রক্রিয়াধীন..." : "প্রত্যাখ্যান নিশ্চিত করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}
