import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { PreferencesSchema, type TenantPreferencesData } from "@/lib/api/tenant";
import { PROPERTY_TYPES } from "@/lib/api/properties";
import { mockTenantApi, KHULNA_AREAS } from "@/lib/api/mock";
import { Sliders, CheckCircle, ShieldAlert, Info, Save, Check } from "lucide-react";
import { translateArea, translatePropertyType, translateFurnished, translateAmenity, toBnNumber } from "@/lib/i18n";

const AVAILABLE_AMENITIES = [
  "High-Speed WiFi",
  "24/7 Deep Tube-Well Water",
  "Generator / IPS Backup",
  "Elevator / Lift",
  "Balcony",
  "CCTV Security",
  "Gas Cylinder System",
  "Line Gas Supply",
  "Attached Bath",
  "Prepaid Electric Meter",
];

const FURNISHED_OPTIONS = ["Any", "Unfurnished", "Semi-Furnished", "Furnished"];

interface PreferencesFormProps {
  onSaved?: (prefs: TenantPreferencesData) => void;
}

export const PreferencesForm: React.FC<PreferencesFormProps> = ({ onSaved }) => {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TenantPreferencesData>({
    resolver: zodResolver(PreferencesSchema),
    defaultValues: {
      preferredArea: "KUET Gate / Teligati",
      maxBudget: 10000,
      preferredPropertyType: "Apartment / Flat",
      minRooms: 2,
      requiredAmenities: ["High-Speed WiFi", "24/7 Deep Tube-Well Water"],
      preferredFurnished: "Semi-Furnished",
    },
  });

  const selectedAmenities = watch("requiredAmenities") || [];
  const currentBudget = watch("maxBudget") || 10000;

  useEffect(() => {
    mockTenantApi.getPreferences().then((loaded) => {
      reset(loaded);
    });
  }, [reset]);

  const toggleAmenity = (amenity: string) => {
    const next = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter((a) => a !== amenity)
      : [...selectedAmenities, amenity];
    setValue("requiredAmenities", next, { shouldValidate: true });
  };

  const onSubmit = async (data: TenantPreferencesData) => {
    setIsSubmitting(true);
    try {
      const saved = await mockTenantApi.savePreferences(data);
      setSaveSuccess(true);
      if (onSaved) onSaved(saved);
      setTimeout(() => setSaveSuccess(false), 3500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
      aria-label={t("tenant.preferencesTitle")}
    >
      {/* Matching Weights Explanatory Card */}
      <div className="rounded-2xl border border-border bg-secondary/30 p-5">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            {isBn
              ? "ঠিকানা ম্যাচিং অ্যালগরিদম (৬টি মানদণ্ড)"
              : "Thikana Matching Formula (6 Weights)"}
          </h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {isBn
            ? "আপনার সেভ করা পছন্দের সাথে প্রতিটি প্রপার্টি এই নির্দিষ্ট ওজনে যাচাই করা হয় (কোনো কাল্পনিক AI নয়):"
            : "Every listing is dynamically scored against your explicit preferences using this transparent rule matrix:"}
        </p>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
          <div className="rounded-xl border border-border bg-surface p-2.5">
            <span className="block font-bold text-foreground">৩০%</span>
            <span className="text-[11px] text-muted-foreground">
              {t("tenant.progressLocation")}
            </span>
          </div>
          <div className="rounded-xl border border-border bg-surface p-2.5">
            <span className="block font-bold text-foreground">২৫%</span>
            <span className="text-[11px] text-muted-foreground">{t("tenant.progressBudget")}</span>
          </div>
          <div className="rounded-xl border border-border bg-surface p-2.5">
            <span className="block font-bold text-foreground">১৫%</span>
            <span className="text-[11px] text-muted-foreground">{t("tenant.progressType")}</span>
          </div>
          <div className="rounded-xl border border-border bg-surface p-2.5">
            <span className="block font-bold text-foreground">১০%</span>
            <span className="text-[11px] text-muted-foreground">
              {t("tenant.progressRooms")}
            </span>
          </div>
          <div className="rounded-xl border border-border bg-surface p-2.5">
            <span className="block font-bold text-foreground">১৫%</span>
            <span className="text-[11px] text-muted-foreground">
              {t("tenant.progressAmenities")}
            </span>
          </div>
          <div className="rounded-xl border border-border bg-surface p-2.5">
            <span className="block font-bold text-foreground">৫%</span>
            <span className="text-[11px] text-muted-foreground">
              {isBn ? "প্রাপ্যতা" : "Availability"}
            </span>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {t("tenant.preferencesSavedSuccess")}
          </span>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Preferred Area */}
        <div className="space-y-1.5">
          <label htmlFor="pref-area" className="text-xs font-semibold text-foreground">
            {t("tenant.preferredArea")}
          </label>
          <select
            id="pref-area"
            {...register("preferredArea")}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">{t("tenant.anyArea")}</option>
            {KHULNA_AREAS.map((area) => (
              <option key={area} value={area}>
                {translateArea(area, i18n.language)}
              </option>
            ))}
          </select>
          {errors.preferredArea && (
            <p className="text-[11px] text-destructive">{errors.preferredArea.message}</p>
          )}
        </div>

        {/* Preferred Property Type */}
        <div className="space-y-1.5">
          <label htmlFor="pref-type" className="text-xs font-semibold text-foreground">
            {t("tenant.preferredType")}
          </label>
          <select
            id="pref-type"
            {...register("preferredPropertyType")}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">{t("tenant.anyType")}</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {translatePropertyType(t, i18n.language)}
              </option>
            ))}
          </select>
          {errors.preferredPropertyType && (
            <p className="text-[11px] text-destructive">{errors.preferredPropertyType.message}</p>
          )}
        </div>

        {/* Max Budget */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="pref-budget" className="text-xs font-semibold text-foreground">
              {t("tenant.maxBudget")}
            </label>
            <span className="text-xs font-bold text-primary">
              ৳{toBnNumber(Number(currentBudget).toLocaleString(), i18n.language)}
            </span>
          </div>
          <input
            id="pref-budget"
            type="number"
            min={1000}
            max={100000}
            step={500}
            {...register("maxBudget", { valueAsNumber: true })}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.maxBudget && (
            <p className="text-[11px] text-destructive">{errors.maxBudget.message}</p>
          )}
        </div>

        {/* Minimum Rooms */}
        <div className="space-y-1.5">
          <label htmlFor="pref-rooms" className="text-xs font-semibold text-foreground">
            {t("tenant.minBedrooms")}
          </label>
          <select
            id="pref-rooms"
            {...register("minRooms", { valueAsNumber: true })}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value={1}>{toBnNumber(1, i18n.language)} {t("properties.bedrooms")}</option>
            <option value={2}>{toBnNumber(2, i18n.language)} {t("properties.bedrooms")}</option>
            <option value={3}>{toBnNumber(3, i18n.language)} {t("properties.bedrooms")}</option>
            <option value={4}>{toBnNumber(4, i18n.language)}+ {t("properties.bedrooms")}</option>
          </select>
          {errors.minRooms && (
            <p className="text-[11px] text-destructive">{errors.minRooms.message}</p>
          )}
        </div>

        {/* Preferred Furnished Status */}
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="pref-furnished" className="text-xs font-semibold text-foreground">
            {t("properties.furnishedStatus")}
          </label>
          <select
            id="pref-furnished"
            {...register("preferredFurnished")}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {FURNISHED_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {translateFurnished(opt, i18n.language)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Required Amenities Checkboxes */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">
          {t("tenant.requiredAmenities")}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AVAILABLE_AMENITIES.map((amenity) => {
            const isChecked = selectedAmenities.includes(amenity);
            return (
              <button
                type="button"
                key={amenity}
                onClick={() => toggleAmenity(amenity)}
                className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs transition-colors ${
                  isChecked
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border bg-surface text-muted-foreground hover:bg-secondary"
                }`}
              >
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    isChecked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface"
                  }`}
                >
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" aria-hidden="true" />}
                </div>
                <span className="truncate">{translateAmenity(amenity, i18n.language)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end pt-4 border-t border-border">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-xs font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          <span>
            {isSubmitting
              ? t("tenant.saving")
              : t("tenant.savePreferences")}
          </span>
        </button>
      </div>
    </form>
  );
};
