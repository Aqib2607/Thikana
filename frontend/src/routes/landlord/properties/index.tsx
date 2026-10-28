import { useState, useEffect, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { RoleLayout } from "@/components/layout/RoleLayout";
import { useAuth } from "@/lib/auth";
import { mockLandlordApi } from "@/lib/api/mock/landlord";
import { toBnNumber, translateAvailability } from "@/lib/i18n";
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
      setActionMessage(t("landlord.statusUpdated"));
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
          ? t("landlord.visibilityPublicMsg")
          : t("landlord.visibilityProtectedMsg"),
      );
      loadProperties();
    } catch {
      // Ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("landlord.deleteConfirm"))) {
      return;
    }
    try {
      await mockLandlordApi.deleteProperty(id);
      setActionMessage(t("landlord.listingDeleted"));
      loadProperties();
    } catch {
      // Ignore
    }
  };

  return (
    <RoleLayout
      requiredRole="landlord"
      title={t("dashboard.myProperties")}
      subtitle={t("landlord.propertiesSubtitle")}
      activeTab="properties"
    >
      {/* Top action bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {t("landlord.foundListings", {
              count: toBnNumber(properties.length, i18n.language),
            })}
          </p>
        </div>
        <Link
          to="/landlord/properties/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-all"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          <span>{t("landlord.addNewProperty")}</span>
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
            {t("landlord.dismiss")}
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">
            {t("landlord.loadingListings")}
          </p>
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground opacity-40" />
          <h3 className="mt-4 text-base font-bold text-foreground">
            {t("landlord.noListingsTitle")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            {t("landlord.noListingsDesc")}
          </p>
          <Link
            to="/landlord/properties/new"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            <span>{t("landlord.createListingCta")}</span>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3.5 pl-6 pr-4">
                    {t("landlord.propertyAndLocation")}
                  </th>
                  <th className="px-4 py-3.5">{t("landlord.monthlyRent")}</th>
                  <th className="px-4 py-3.5">{t("landlord.approvalStateCol")}</th>
                  <th className="px-4 py-3.5">{t("landlord.availabilityLabel")}</th>
                  <th className="px-4 py-3.5">
                    {t("landlord.contactVisibilityCol")}
                  </th>
                  <th className="py-3.5 pl-4 pr-6 text-right">{t("landlord.actionsCol")}</th>
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
                              {i18n.language.startsWith("bn") && property.banglaTitle
                                ? property.banglaTitle
                                : property.title}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                              {property.area}, {property.city}
                            </p>
                            <span className="inline-block text-[11px] font-mono text-muted-foreground mt-0.5">
                              {toBnNumber(property.rooms, i18n.language)} {t("properties.rooms")} • {toBnNumber(property.bathrooms, i18n.language)} {t("properties.baths")} • {toBnNumber(property.size, i18n.language)}{" "}
                              {t("properties.sqft")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rent */}
                      <td className="px-4 py-4 whitespace-nowrap font-semibold text-foreground">
                        ৳{toBnNumber(property.rent.toLocaleString(), i18n.language)}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          /{t("properties.month")}
                        </span>
                      </td>

                      {/* Approval Status Badge */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{t("landlord.approved")}</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{t("landlord.pendingApproval")}</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{t("landlord.rejected")}</span>
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
                            {translateAvailability("Available", i18n.language)}
                          </option>
                          <option value="Reserved">
                            {translateAvailability("Reserved", i18n.language)}
                          </option>
                          <option value="Rented">
                            {translateAvailability("Rented", i18n.language)}
                          </option>
                          <option value="Temporarily Unavailable">
                            {translateAvailability("Temporarily Unavailable", i18n.language)}
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
                        >
                          {property.landlord.publicContactVisible ? (
                            <>
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{t("landlord.publicBadge")}</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{t("landlord.protectedBadge")}</span>
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
                            title={t("landlord.viewPreview")}
                          >
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <Link
                            to="/landlord/properties/$propertyId/edit"
                            params={{ propertyId: property.id }}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title={t("landlord.editListing")}
                          >
                            <Edit3 className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(property.id)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            title={t("landlord.deleteListing")}
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
