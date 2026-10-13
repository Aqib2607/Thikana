import { useState, useEffect, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { mockLandlordApi } from "@/lib/api/mock/landlord";
import type { PropertyItem, AvailabilityStatus } from "@/lib/api/properties";
import {
  Building2,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Edit3,
  ExternalLink,
  Power,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/landlord/properties/")({
  head: () => ({
    meta: [
      { title: "Manage Properties — Landlord Portal — Thikana" },
      {
        name: "description",
        content: "Manage your rental listings, availability, approval states, and contact privacy.",
      },
    ],
  }),
  component: LandlordPropertiesPage,
});

function LandlordPropertiesPage() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadProperties = useCallback(async () => {
    if (!user) return;
    try {
      const data = await mockLandlordApi.getMyProperties(user.id);
      setProperties(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const handleAvailabilityChange = async (id: string, newStatus: AvailabilityStatus) => {
    try {
      await mockLandlordApi.updateAvailability(id, newStatus);
      setActionMessage(
        isBn
          ? "বাসার প্রাপ্যতা স্ট্যাটাস সফলভাবে আপডেট হয়েছে।"
          : "Property availability status updated successfully.",
      );
      loadProperties();
    } catch {
      // Ignore
    }
  };

  const handleToggleContactVisibility = async (id: string, currentVisible: boolean) => {
    try {
      await mockLandlordApi.toggleContactVisibility(id, !currentVisible);
      setActionMessage(
        !currentVisible
          ? isBn
            ? "যোগাযোগের তথ্য জনসম্মুখে দৃশ্যমান করা হয়েছে।"
            : "Contact details are now publicly visible."
          : isBn
            ? "যোগাযোগের তথ্য লুকানো হয়েছে (অনুরোধের মাধ্যমে যোগাযোগ)।"
            : "Contact details are now hidden (request required).",
      );
      loadProperties();
    } catch {
      // Ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        isBn
          ? "আপনি কি নিশ্চিতভাবে এই লিস্টিংটি মুছে ফেলতে চান?"
          : "Are you sure you want to remove this listing?",
      )
    ) {
      return;
    }
    try {
      await mockLandlordApi.deleteProperty(id);
      setActionMessage(isBn ? "লিস্টিং মুছে ফেলা হয়েছে।" : "Listing removed.");
      loadProperties();
    } catch {
      // Ignore
    }
  };

  return (
    <RoleLayout
      requiredRole="landlord"
      title={isBn ? "আমার প্রপার্টি লিস্টিং" : "My Property Listings"}
      subtitle={
        isBn
          ? "আপনার বাসাগুলোর অনুমোদন স্ট্যাটাস, প্রাপ্যতা এবং দৃশ্যমানতা নিয়ন্ত্রণ করুন"
          : "Manage your listings, review approval states, and control availability"
      }
      activeTab="properties"
    >
      {/* Top action bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {isBn
              ? `মোট ${properties.length}টি লিস্টিং পাওয়া গেছে`
              : `Found ${properties.length} listings in your account`}
          </p>
        </div>
        <Link
          to="/landlord/properties/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-all"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          <span>{isBn ? "নতুন বাসা যোগ করুন" : "Add New Property"}</span>
        </Link>
      </div>

      {actionMessage && (
        <div
          role="status"
          className="mb-6 flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-xs font-semibold hover:underline"
          >
            {isBn ? "বন্ধ করুন" : "Dismiss"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">
            {isBn ? "লিস্টিং লোড হচ্ছে..." : "Loading listings..."}
          </p>
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground opacity-40" />
          <h3 className="mt-4 text-base font-bold text-foreground">
            {isBn ? "কোনো লিস্টিং পাওয়া যায়নি" : "No listings yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            {isBn
              ? "আপনার বাসাটি ছাত্র ও চাকরিপ্রার্থীদের কাছে দৃশ্যমান করতে প্রথম লিস্টিং যোগ করুন।"
              : "Create your first listing to start discovering student and professional tenants."}
          </p>
          <Link
            to="/landlord/properties/new"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            <span>{isBn ? "এখনই বাসা যোগ করুন" : "Create Listing"}</span>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3.5 pl-6 pr-4">
                    {isBn ? "বাসা ও অবস্থান" : "Property & Location"}
                  </th>
                  <th className="px-4 py-3.5">{isBn ? "ভাড়া / মাস" : "Monthly Rent"}</th>
                  <th className="px-4 py-3.5">{isBn ? "অনুমোদন স্ট্যাটাস" : "Approval State"}</th>
                  <th className="px-4 py-3.5">{isBn ? "প্রাপ্যতা" : "Availability"}</th>
                  <th className="px-4 py-3.5">
                    {isBn ? "যোগাযোগ গোপনীয়তা" : "Contact Visibility"}
                  </th>
                  <th className="py-3.5 pl-4 pr-6 text-right">{isBn ? "পদক্ষেপ" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {properties.map((property) => {
                  const isApproved = property.approvalStatus === "Approved";
                  const isPending = property.approvalStatus === "Pending Approval";
                  const isRejected = property.approvalStatus === "Rejected";

                  return (
                    <tr key={property.id} className="hover:bg-muted/30 transition-colors">
                      {/* Property Title & Image */}
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={property.featuredImage || property.images[0]}
                            alt={property.title}
                            className="h-14 w-18 rounded-lg object-cover shrink-0 border border-border"
                          />
                          <div className="min-w-0">
                            <h4 className="font-semibold text-foreground truncate max-w-xs">
                              {isBn && property.banglaTitle ? property.banglaTitle : property.title}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                              {property.area}, {property.city}
                            </p>
                            <span className="inline-block text-[11px] font-mono text-muted-foreground mt-0.5">
                              {property.rooms} Bed • {property.bathrooms} Bath • {property.size}{" "}
                              sqft
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rent */}
                      <td className="px-4 py-4 whitespace-nowrap font-semibold text-foreground">
                        ৳{property.rent.toLocaleString()}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          {isBn ? "/মাস" : "/mo"}
                        </span>
                      </td>

                      {/* Approval Status Badge */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{isBn ? "অনুমোদিত" : "Approved"}</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{isBn ? "অনুমোদনাধীন" : "Pending Approval"}</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{isBn ? "প্রত্যাখ্যাত" : "Rejected"}</span>
                          </span>
                        )}
                      </td>

                      {/* Availability Dropdown */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <select
                          value={property.availability}
                          onChange={(e) =>
                            handleAvailabilityChange(
                              property.id,
                              e.target.value as AvailabilityStatus,
                            )
                          }
                          className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="Available">
                            {isBn ? "খালি আছে (Available)" : "Available"}
                          </option>
                          <option value="Reserved">
                            {isBn ? "বুকিং করা (Reserved)" : "Reserved"}
                          </option>
                          <option value="Rented">
                            {isBn ? "ভাড়া হয়ে গেছে (Rented)" : "Rented"}
                          </option>
                          <option value="Temporarily Unavailable">
                            {isBn ? "সাময়িক বন্ধ (Unavailable)" : "Temporarily Unavailable"}
                          </option>
                        </select>
                      </td>

                      {/* Public Contact Visibility Toggle */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleContactVisibility(
                              property.id,
                              property.landlord.publicContactVisible,
                            )
                          }
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                            property.landlord.publicContactVisible
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300"
                              : "border-border bg-surface text-muted-foreground hover:bg-muted"
                          }`}
                          title={
                            property.landlord.publicContactVisible
                              ? isBn
                                ? "ফোন নম্বর সবার জন্য উন্মুক্ত (ক্লিক করে লুকান)"
                                : "Phone visible publicly (click to hide)"
                              : isBn
                                ? "অনুরোধ সাপেক্ষে যোগাযোগ (ক্লিক করে উন্মুক্ত করুন)"
                                : "Request required (click to make public)"
                          }
                        >
                          {property.landlord.publicContactVisible ? (
                            <>
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{isBn ? "প্রকাশ্যে দৃশ্যমান" : "Public"}</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{isBn ? "অনুরোধ সাপেক্ষে" : "Protected"}</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to="/properties/$propertyId"
                            params={{ propertyId: property.id }}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title={isBn ? "প্রিভিউ দেখুন" : "View preview"}
                          >
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <Link
                            to="/landlord/properties/$propertyId/edit"
                            params={{ propertyId: property.id }}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title={isBn ? "সম্পাদনা করুন" : "Edit listing"}
                          >
                            <Edit3 className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(property.id)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            title={isBn ? "মুছে ফেলুন" : "Delete listing"}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}
