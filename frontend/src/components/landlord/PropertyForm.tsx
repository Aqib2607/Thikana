import { useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { PropertyFormSchema, type PropertyFormData } from "@/lib/api/landlord";
import {
  PROPERTY_TYPES,
  RENTAL_TYPES,
  AVAILABILITY_STATUSES,
  FURNISHED_STATUSES,
  TENANT_PREFERENCES,
  type PropertyItem,
} from "@/lib/api/properties";
import { KHULNA_AREAS, ALL_AMENITIES } from "@/lib/api/mock/properties";
import {
  translatePropertyType,
  translateRentalType,
  translateAvailability,
  translateArea,
  translateFurnished,
  translateTenantPreference,
  translateAmenity,
  translateBill,
} from "@/lib/i18n";
import { PropertyImageUploader } from "./PropertyImageUploader";
import {
  Building2,
  MapPin,
  CircleDollarSign,
  Layers,
  Sparkles,
  Phone,
  FileText,
  CheckCircle2,
  Info,
} from "lucide-react";

interface PropertyFormProps {
  initialData?: PropertyItem;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

const BILLS_OPTIONS = [
  "Water Supply",
  "Trash Management",
  "High-Speed WiFi",
  "Gas Cylinder / Line",
  "Electricity",
  "Security Guard",
];

export function PropertyForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}: PropertyFormProps) {
  const { t, i18n } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultValues: PropertyFormData = {
    title: initialData?.title || "",
    banglaTitle: initialData?.banglaTitle || "",
    propertyType: initialData?.propertyType || "Apartment / Flat",
    rentalType: initialData?.rentalType || "Monthly Rental",
    rent: initialData?.rent || 8000,
    advance: initialData?.advance || 10000,
    additionalCharges: initialData?.additionalCharges || 1000,
    billsIncluded: initialData?.billsIncluded || ["Water Supply", "Trash Management"],
    availability: initialData?.availability || "Available",
    availableFrom: initialData?.availableFrom || new Date().toISOString().slice(0, 10),

    division: initialData?.division || "Khulna",
    district: initialData?.district || "Khulna",
    city: initialData?.city || "Khulna",
    area: initialData?.area || "KUET Gate / Teligati",
    exactAddress: initialData?.exactAddress || "",
    lat: initialData?.lat || 22.8456,
    lng: initialData?.lng || 89.5403,

    size: initialData?.size || 600,
    rooms: initialData?.rooms || 2,
    bathrooms: initialData?.bathrooms || 1,
    balconies: initialData?.balconies || 1,
    floor: initialData?.floor || "2nd Floor",
    totalFloors: initialData?.totalFloors || 5,
    furnishedStatus: initialData?.furnishedStatus || "Semi-Furnished",
    preferredTenant: initialData?.preferredTenant || "Students Only",

    images: initialData?.images || [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    ],
    featuredImage: initialData?.featuredImage || "",

    amenities: initialData?.amenities || [
      "High-Speed WiFi",
      "24/7 Deep Tube-Well Water",
      "Security Guard",
    ],
    publicContactVisible: initialData?.landlord.publicContactVisible ?? false,

    community: {
      transport: initialData?.community.transport || "",
      waterlogging: initialData?.community.waterlogging || "",
      internet: initialData?.community.internet || "",
      noise: initialData?.community.noise || "",
      safety: initialData?.community.safety || "",
      general: initialData?.community.general || "",
    },
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(PropertyFormSchema) as unknown as Resolver<PropertyFormData>,
    defaultValues,
  });

  const selectedAmenities = watch("amenities") || [];
  const selectedBills = watch("billsIncluded") || [];
  const publicContactVisible = watch("publicContactVisible");

  const handleFormSubmit = async (data: PropertyFormData) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: PropertyFormData = {
        ...data,
        featuredImage: data.images[0],
      };
      await onSubmit(payload);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : t("landlord.failedSave"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {submitError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {submitError}
        </div>
      )}

      {/* 1. Basic Information */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5 border-b border-border pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {t("landlord.basicInfoTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("landlord.basicInfoDesc")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-foreground">
              {t("landlord.titleLabel")}
              <span className="text-destructive ml-1">*</span>
            </label>
            <input
              type="text"
              {...register("title")}
              placeholder={t("landlord.titlePlaceholder")}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-foreground">
              {t("landlord.banglaTitleLabel")}
            </label>
            <input
              type="text"
              {...register("banglaTitle")}
              placeholder={t("landlord.banglaTitlePlaceholder")}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground">
              {t("landlord.propertyTypeLabel")}
              <span className="text-destructive ml-1">*</span>
            </label>
            <select
              {...register("propertyType")}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {PROPERTY_TYPES.map((pt) => (
                <option key={pt} value={pt}>
                  {translatePropertyType(pt, i18n.language)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground">
              {t("landlord.rentalTypeLabel")}
              <span className="text-destructive ml-1">*</span>
            </label>
            <select
              {...register("rentalType")}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {RENTAL_TYPES.map((rt) => (
                <option key={rt} value={rt}>
                  {translateRentalType(rt, i18n.language)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground">
              {t("landlord.availabilityLabel")}
            </label>
            <select
              {...register("availability")}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {AVAILABILITY_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {translateAvailability(st, i18n.language)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground">
              {t("landlord.availableFromLabel")}
              <span className="text-destructive ml-1">*</span>
            </label>
            <input
              type="date"
              {...register("availableFrom")}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.availableFrom && (
              <p className="mt-1 text-xs text-destructive">{errors.availableFrom.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* 2. Location Hierarchy (Khulna-Prioritized) */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5 border-b border-border pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {t("landlord.locationTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("landlord.locationDesc")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground">
              {t("landlord.divisionLabel")}
            </label>
            <input
              type="text"
              readOnly
              {...register("division")}
              className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2 text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground">
              {t("landlord.districtLabel")}
            </label>
            <input
              type="text"
              readOnly
              {...register("district")}
              className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2 text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground">
              {t("landlord.cityLabel")}
            </label>
            <input
              type="text"
              readOnly
              {...register("city")}
              className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2 text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-semibold text-foreground">
              {t("landlord.areaSelectLabel")}
              <span className="text-destructive ml-1">*</span>
            </label>
            <select
              {...register("area")}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {KHULNA_AREAS.filter((a) => a !== "All Areas").map((area) => (
                <option key={area} value={area}>
                  {translateArea(area, i18n.language)}
                </option>
              ))}
            </select>
            {errors.area && <p className="mt-1 text-xs text-destructive">{errors.area.message}</p>}
          </div>

          <div className="sm:col-span-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-foreground">
                {t("landlord.exactAddressLabel")}
                <span className="text-destructive ml-1">*</span>
              </label>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
                {t("landlord.exactAddressNotice")}
              </span>
            </div>
            <textarea
              rows={2}
              {...register("exactAddress")}
              placeholder={t("landlord.exactAddressPlaceholder")}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.exactAddress && (
              <p className="mt-1 text-xs text-destructive">{errors.exactAddress.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* 3. Pricing & Financials */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5 border-b border-border pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CircleDollarSign className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {t("landlord.pricingTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("landlord.pricingDesc")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold text-foreground">
              {t("landlord.rentLabel")}
              <span className="text-destructive ml-1">*</span>
            </label>
            <input
              type="number"
              {...register("rent", { valueAsNumber: true })}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.rent && <p className="mt-1 text-xs text-destructive">{errors.rent.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground">
              {t("landlord.advanceLabel")}
            </label>
            <input
              type="number"
              {...register("advance", { valueAsNumber: true })}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.advance && (
              <p className="mt-1 text-xs text-destructive">{errors.advance.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground">
              {t("landlord.chargesLabel")}
            </label>
            <input
              type="number"
              {...register("additionalCharges", { valueAsNumber: true })}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.additionalCharges && (
              <p className="mt-1 text-xs text-destructive">{errors.additionalCharges.message}</p>
            )}
          </div>

          <div className="sm:col-span-3 mt-2">
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
              {t("landlord.billsIncludedLabel")}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {BILLS_OPTIONS.map((bill) => {
                const isChecked = selectedBills.includes(bill);
                return (
                  <label
                    key={bill}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      isChecked
                        ? "border-primary bg-primary/5 text-foreground font-semibold"
                        : "border-border bg-surface text-muted-foreground hover:border-border-strong"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setValue("billsIncluded", [...selectedBills, bill]);
                        } else {
                          setValue(
                            "billsIncluded",
                            selectedBills.filter((b) => b !== bill),
                          );
                        }
                      }}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>{translateBill(bill, i18n.language)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Specifications & Tenant Preference */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5 border-b border-border pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Layers className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {t("landlord.specsTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("landlord.specsDesc")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold text-foreground">
              {t("landlord.sizeLabel")}
              <span className="text-destructive ml-1">*</span>
            </label>
            <input
              type="number"
              {...register("size", { valueAsNumber: true })}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.size && <p className="mt-1 text-xs text-destructive">{errors.size.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground">
              {t("landlord.roomsLabel")}
              <span className="text-destructive ml-1">*</span>
            </label>
            <input
              type="number"
              {...register("rooms", { valueAsNumber: true })}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.rooms && (
              <p className="mt-1 text-xs text-destructive">{errors.rooms.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground">
              {t("landlord.bathroomsLabel")}
              <span className="text-destructive ml-1">*</span>
            </label>
            <input
              type="number"
              {...register("bathrooms", { valueAsNumber: true })}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.bathrooms && (
              <p className="mt-1 text-xs text-destructive">{errors.bathrooms.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground">
              {t("landlord.balconiesLabel")}
            </label>
            <input
              type="number"
              {...register("balconies", { valueAsNumber: true })}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground">
              {t("landlord.floorLabel")}
              <span className="text-destructive ml-1">*</span>
            </label>
            <input
              type="text"
              {...register("floor")}
              placeholder={t("landlord.floorPlaceholder")}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.floor && (
              <p className="mt-1 text-xs text-destructive">{errors.floor.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground">
              {t("landlord.furnishedStatusLabel")}
            </label>
            <select
              {...register("furnishedStatus")}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {FURNISHED_STATUSES.map((fs) => (
                <option key={fs} value={fs}>
                  {translateFurnished(fs, i18n.language)}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-semibold text-foreground">
              {t("landlord.preferredTenantLabel")}
            </label>
            <select
              {...register("preferredTenant")}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {TENANT_PREFERENCES.map((tp) => (
                <option key={tp} value={tp}>
                  {translateTenantPreference(tp, i18n.language)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* 5. Photos Uploader (5 Image Max, First is Featured) */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <Controller
          control={control}
          name="images"
          render={({ field }) => (
            <PropertyImageUploader
              images={field.value}
              onChange={(newImages) => field.onChange(newImages)}
              error={errors.images?.message}
            />
          )}
        />
      </section>

      {/* 6. Amenities */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5 border-b border-border pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {t("landlord.amenitiesTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("landlord.amenitiesDesc")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {ALL_AMENITIES.map((amenity) => {
            const isChecked = selectedAmenities.includes(amenity);
            return (
              <label
                key={amenity}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                  isChecked
                    ? "border-primary bg-primary/5 text-foreground font-semibold"
                    : "border-border bg-surface text-muted-foreground hover:border-border-strong"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setValue("amenities", [...selectedAmenities, amenity]);
                    } else {
                      setValue(
                        "amenities",
                        selectedAmenities.filter((a) => a !== amenity),
                      );
                    }
                  }}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <span>{translateAmenity(amenity, i18n.language)}</span>
              </label>
            );
          })}
        </div>
      </section>

      {/* 7. Public Contact Visibility Setting */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4 border-b border-border pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Phone className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {t("landlord.contactPrivacyTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("landlord.contactPrivacyDesc")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-4">
          <input
            id="publicContactVisibleToggle"
            type="checkbox"
            {...register("publicContactVisible")}
            className="mt-1 h-5 w-5 rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="publicContactVisibleToggle" className="cursor-pointer text-sm">
            <span className="font-semibold text-foreground">
              {t("landlord.contactPrivacyCheckbox")}
            </span>
            <p className="mt-1 text-xs text-muted-foreground">
              {publicContactVisible
                ? t("landlord.contactPrivacyPublicNotice")
                : t("landlord.contactPrivacyProtectedNotice")}
            </p>
          </label>
        </div>
      </section>

      {/* 8. Community Information */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5 border-b border-border pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {t("landlord.communityTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("landlord.communityDesc")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-foreground">
              {t("landlord.transportLabel")}
            </label>
            <input
              type="text"
              {...register("community.transport")}
              placeholder={t("landlord.transportPlaceholder")}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">
              {t("landlord.waterloggingLabel")}
            </label>
            <input
              type="text"
              {...register("community.waterlogging")}
              placeholder={t("landlord.waterloggingPlaceholder")}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">
              {t("landlord.internetLabel")}
            </label>
            <input
              type="text"
              {...register("community.internet")}
              placeholder={t("landlord.internetPlaceholder")}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">
              {t("landlord.noiseLabel")}
            </label>
            <input
              type="text"
              {...register("community.noise")}
              placeholder={t("landlord.noisePlaceholder")}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">
              {t("landlord.safetyLabel")}
            </label>
            <input
              type="text"
              {...register("community.safety")}
              placeholder={t("landlord.safetyPlaceholder")}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">
              {t("landlord.generalLabel")}
            </label>
            <input
              type="text"
              {...register("community.general")}
              placeholder={t("landlord.generalPlaceholder")}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </section>

      {/* Form Action Controls */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
        >
          {t("landlord.cancel")}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:opacity-95 disabled:opacity-50 transition-all"
        >
          {submitting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          )}
          <span>
            {isEditing ? t("landlord.saveChanges") : t("landlord.submitPending")}
          </span>
        </button>
      </div>
    </form>
  );
}
