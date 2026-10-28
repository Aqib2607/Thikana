import React from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { PropertyItem } from "@/lib/api/properties";
import { X, Plus, ShieldCheck, Check, Building, MapPin, ExternalLink } from "lucide-react";
import { translatePropertyType, translateFurnished, translateAvailability, translateArea, translateBill, translateVerification, toBnNumber } from "@/lib/i18n";

interface ComparisonTableProps {
  properties: PropertyItem[];
  onRemove: (propertyId: string) => void;
  userPreferences?: unknown;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ properties, onRemove }) => {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";

  if (properties.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
        <Building className="mx-auto h-12 w-12 text-muted-foreground/60" aria-hidden="true" />
        <h3 className="mt-4 text-lg font-bold text-foreground">
          {t("tenant.comparisonEmptyTitle")}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          {t("tenant.comparisonEmptyDesc")}
        </p>
        <div className="mt-6">
          <Link
            to="/properties"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            {t("tenant.exploreProperties")}
          </Link>
        </div>
      </div>
    );
  }

  // 14 fields definition
  const fields = [
    {
      id: "rent",
      label: t("tenant.fieldRent"),
      render: (p: PropertyItem) => (
        <span className="text-base font-bold text-primary">
          ৳{toBnNumber(p.rent.toLocaleString(), i18n.language)}{" "}
          <span className="text-xs font-normal text-muted-foreground">
            /{t("properties.month")}
          </span>
        </span>
      ),
    },
    {
      id: "advance",
      label: t("tenant.fieldAdvance"),
      render: (p: PropertyItem) => (
        <span className="font-semibold text-foreground">
          {p.advance ? `৳${toBnNumber(p.advance.toLocaleString(), i18n.language)}` : t("tenant.fieldNegotiable")}
        </span>
      ),
    },
    {
      id: "additional_charges",
      label: t("tenant.fieldService"),
      render: (p: PropertyItem) => (
        <div className="text-xs text-muted-foreground space-y-0.5">
          {p.additionalCharges ? (
            <p>
              {isBn
                ? `সার্ভিস চার্জ: ৳${p.additionalCharges}`
                : `Service/Utility: ৳${p.additionalCharges}`}
            </p>
          ) : (
            <p>{t("tenant.fieldChargesIncluded")}</p>
          )}
          {p.billsIncluded && p.billsIncluded.length > 0 && (
            <p className="text-[11px] text-muted-foreground/80">
              {isBn
                ? `অন্তর্ভুক্ত: ${p.billsIncluded.join(", ")}`
                : `Included: ${p.billsIncluded.join(", ")}`}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "type",
      label: t("tenant.fieldType"),
      render: (p: PropertyItem) => (
        <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
          {translatePropertyType(p.propertyType, i18n.language)}
        </span>
      ),
    },
    {
      id: "rooms",
      label: t("tenant.fieldBedrooms"),
      render: (p: PropertyItem) => (
        <span className="font-semibold text-foreground">
          {toBnNumber(p.rooms, i18n.language)} {t("tenant.unitBeds")}
        </span>
      ),
    },
    {
      id: "bathrooms",
      label: t("tenant.fieldBathrooms"),
      render: (p: PropertyItem) => (
        <span className="font-semibold text-foreground">
          {toBnNumber(p.bathrooms, i18n.language)} {t("tenant.unitBaths")}
        </span>
      ),
    },
    {
      id: "size",
      label: t("tenant.fieldSize"),
      render: (p: PropertyItem) => (
        <span className="font-semibold text-foreground">
          {toBnNumber(p.size, i18n.language)} {t("tenant.unitSqft")}
        </span>
      ),
    },
    {
      id: "floor",
      label: t("tenant.fieldFloor"),
      render: (p: PropertyItem) => (
        <span className="text-xs text-muted-foreground">
          {toBnNumber(p.floor, i18n.language)}{" "}
          {p.totalFloors
            ? isBn
              ? `(মোট ${p.totalFloors} তলা)`
              : `(Total ${p.totalFloors} floors)`
            : ""}
        </span>
      ),
    },
    {
      id: "furnished",
      label: t("tenant.fieldFurnished"),
      render: (p: PropertyItem) => (
        <span className="text-xs font-medium text-foreground">{translateFurnished(p.furnishedStatus, i18n.language)}</span>
      ),
    },
    {
      id: "amenities",
      label: t("tenant.fieldAmenities"),
      render: (p: PropertyItem) => (
        <div className="flex flex-wrap gap-1">
          {(p.amenities || []).slice(0, 5).map((a) => (
            <span
              key={a}
              className="inline-flex items-center gap-1 rounded bg-secondary/80 px-1.5 py-0.5 text-[10px] text-foreground"
            >
              <Check className="h-2.5 w-2.5 text-primary" aria-hidden="true" />
              <span>{a}</span>
            </span>
          ))}
          {(p.amenities || []).length > 5 && (
            <span className="text-[10px] text-muted-foreground self-center">
              +{(p.amenities || []).length - 5}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "availability",
      label: t("tenant.fieldAvailability"),
      render: (p: PropertyItem) => {
        const isAvail = p.availability === "Available";
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isAvail
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
            }`}
          >
            {translateAvailability(p.availability, i18n.language)}
          </span>
        );
      },
    },
    {
      id: "verification",
      label: t("tenant.fieldVerification"),
      render: (p: PropertyItem) => (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {(p.verifications || []).map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] text-foreground font-medium"
              >
                <ShieldCheck className="h-3 w-3 text-primary" aria-hidden="true" />
                <span>{v}</span>
              </span>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {isBn
              ? "*প্ল্যাটফর্ম-স্তরের সিমুলেটেড তথ্য যাচাই"
              : "*Platform-level simulated verification"}
          </p>
        </div>
      ),
    },
    {
      id: "location",
      label: t("tenant.fieldLocation"),
      render: (p: PropertyItem) => (
        <div className="text-xs space-y-1">
          <p className="font-semibold text-foreground flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
            <span>{translateArea(p.area, i18n.language)}</span>
          </p>
          <p className="text-[11px] text-muted-foreground line-clamp-2">{p.exactAddress}</p>
        </div>
      ),
    },
    {
      id: "matching",
      label: t("tenant.fieldMatch"),
      render: () => {
        const score = 88;
        return (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">{score}%</span>
              <span className="text-[10px] text-muted-foreground">
                {t("tenant.fieldWeights")}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all rounded-full"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
      {/* Table header bar */}
      <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-6 py-4">
        <div>
          <h2 className="text-base font-bold text-foreground">
            {isBn
              ? "পাশাপাশি প্রপার্টি তুলনা (সর্বোচ্চ ৩টি)"
              : "Side-by-Side Property Comparison (Max 3)"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isBn
              ? `বর্তমান নির্বাচিত: ${properties.length}/৩টি প্রপার্টি`
              : `Currently comparing: ${properties.length}/3 listings`}
          </p>
        </div>

        {properties.length < 3 && (
          <Link
            to="/properties"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-secondary"
          >
            <Plus className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>{t("tenant.addAnother")}</span>
          </Link>
        )}
      </div>

      {/* Responsive Horizontal Scroll Protected Wrapper */}
      <div className="overflow-x-auto w-full">
        <table
          className="w-full min-w-[720px] border-collapse text-left text-xs"
          aria-label={t("tenant.comparisonMatrixAria")}
        >
          <caption className="sr-only">
            {isBn
              ? "৩টি নির্বাচিত প্রপার্টির বিস্তারিত বৈশিষ্ট্যের তুলনা"
              : "Detailed comparison matrix for up to 3 selected properties"}
          </caption>
          <thead>
            <tr className="border-b border-border bg-secondary/10">
              <th
                scope="col"
                className="w-48 p-4 font-semibold text-muted-foreground border-r border-border sticky left-0 bg-surface z-10"
              >
                {t("tenant.specField")}
              </th>
              {properties.map((property) => (
                <th
                  key={property.id}
                  scope="col"
                  className="w-64 p-4 font-normal align-top border-r border-border last:border-r-0"
                >
                  <div className="relative flex flex-col justify-between h-full">
                    <button
                      type="button"
                      onClick={() => onRemove(property.id)}
                      aria-label={t("tenant.removeFromComparison", { title: isBn && property.banglaTitle ? property.banglaTitle : property.title })}
                      className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-secondary hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <div className="pr-6">
                      <img
                        src={property.featuredImage}
                        alt=""
                        className="h-28 w-full rounded-xl object-cover border border-border mb-2.5"
                      />
                      <h3 className="font-bold text-foreground text-xs line-clamp-2">
                        {property.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{property.area}</p>
                    </div>
                    <div className="mt-3">
                      <Link
                        to="/properties/$propertyId"
                        params={{ propertyId: property.id }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                      >
                        <span>{t("properties.viewDetails")}</span>
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </th>
              ))}
              {/* If fewer than 3 properties, render slot for empty */}
              {Array.from({ length: 3 - properties.length }).map((_, idx) => (
                <th
                  key={`empty-${idx}`}
                  scope="col"
                  className="w-64 p-4 align-middle text-center border-r border-border last:border-r-0 bg-secondary/5"
                >
                  <div className="rounded-xl border border-dashed border-border p-6 text-center">
                    <Building
                      className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2"
                      aria-hidden="true"
                    />
                    <p className="text-xs font-medium text-muted-foreground mb-3">
                      {t("tenant.emptySlot")}
                    </p>
                    <Link
                      to="/properties"
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-surface px-3 text-[11px] font-semibold text-foreground hover:bg-secondary"
                    >
                      {t("tenant.selectListing")}
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {fields.map((field) => (
              <tr key={field.id} className="hover:bg-secondary/15 transition-colors">
                <th
                  scope="row"
                  className="p-3.5 font-medium text-muted-foreground border-r border-border bg-surface sticky left-0 z-10"
                >
                  {field.label}
                </th>
                {properties.map((p) => (
                  <td
                    key={`${p.id}-${field.id}`}
                    className="p-3.5 align-middle border-r border-border last:border-r-0"
                  >
                    {field.render(p)}
                  </td>
                ))}
                {Array.from({ length: 3 - properties.length }).map((_, idx) => (
                  <td
                    key={`empty-cell-${idx}-${field.id}`}
                    className="p-3.5 text-center text-muted-foreground/40 border-r border-border last:border-r-0 bg-secondary/5"
                  >
                    —
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
