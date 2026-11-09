import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { PreferencesSchema, type TenantPreferencesData, tenantApi } from "@/lib/api/tenant";
import { PROPERTY_TYPES, propertyApi } from "@/lib/api/properties";
import { CheckCircle, Info, Save, Check, Download, X, RotateCcw, Loader2, RefreshCw } from "lucide-react";
import {
  translateArea,
  translatePropertyType,
  translateFurnished,
  translateAmenity,
  toBnNumber,
} from "@/lib/i18n";

const FURNISHED_OPTIONS = ["Any", "Unfurnished", "Semi-Furnished", "Furnished"];

interface PreferencesFormProps {
  onSaved?: (prefs: TenantPreferencesData) => void;
}

export const PreferencesForm: React.FC<PreferencesFormProps> = ({ onSaved }) => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { user, ready } = useAuth();
  const isBn = i18n.language === "bn";
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(false);
  const [legacyPrefs, setLegacyPrefs] = useState<TenantPreferencesData | null>(null);
  const [availableLegacyData, setAvailableLegacyData] = useState<TenantPreferencesData | null>(
    null,
  );

  const {
    data: areas = [],
    isLoading: areasLoading,
    isError: areasError,
    refetch: refetchAreas,
  } = useQuery({
    queryKey: ["areas"],
    queryFn: () => propertyApi.getAreas(),
    staleTime: 1000 * 60 * 30,
  });

  const {
    data: amenities = [],
    isLoading: amenitiesLoading,
    isError: amenitiesError,
    refetch: refetchAmenities,
  } = useQuery({
    queryKey: ["amenities"],
    queryFn: () => propertyApi.getAmenities(),
    staleTime: 1000 * 60 * 30,
  });

  const isCatalogLoading = areasLoading || amenitiesLoading;
  const hasCatalogError = areasError || amenitiesError;

  const userDismissalKey = user?.id
    ? `thikana.legacy_prefs_dismissed.${user.id}`
    : "thikana.legacy_prefs_dismissed.anonymous";

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
      preferredArea: "",
      maxBudget: undefined,
      preferredPropertyType: "",
      minRooms: undefined,
      minBathrooms: undefined,
      requiredAmenities: [],
      preferredFurnished: "Any",
    },
  });

  const selectedAmenities = watch("requiredAmenities") || [];
  const currentBudget = watch("maxBudget");

  const loadPreferences = React.useCallback(() => {
    if (!ready) return () => {};

    let mounted = true;
    setIsLoadingPrefs(true);
    setLoadError(null);

    tenantApi
      .getPreferences()
      .then((loaded) => {
        if (!mounted) return;
        if (
          loaded &&
          Object.keys(loaded).length > 0 &&
          (loaded.preferredArea || loaded.maxBudget || loaded.hasMeaningfulPreferences)
        ) {
          reset(loaded);
          setLegacyPrefs(null);
        } else {
          // Check for legacy localStorage data to review
          try {
            const raw = localStorage.getItem("thikana.tenant.preferences");
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && typeof parsed === "object") {
                setAvailableLegacyData(parsed);
                const isDismissed = localStorage.getItem(userDismissalKey) === "true";
                if (!isDismissed) {
                  setLegacyPrefs(parsed);
                } else {
                  setLegacyPrefs(null);
                }
              }
            }
          } catch {
            // Ignore parse errors
          }
        }
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : "Failed to load preferences from server";
        setLoadError(msg);
      })
      .finally(() => {
        if (mounted) setIsLoadingPrefs(false);
      });

    return () => {
      mounted = false;
    };
  }, [reset, ready, userDismissalKey]);

  useEffect(() => {
    return loadPreferences();
  }, [loadPreferences]);

  const toggleAmenity = (amenity: string) => {
    const next = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter((a) => a !== amenity)
      : [...selectedAmenities, amenity];
    setValue("requiredAmenities", next, { shouldValidate: true });
  };

  const handleImportLegacy = () => {
    const dataToImport = legacyPrefs || availableLegacyData;
    if (dataToImport) {
      reset(dataToImport);
      setLegacyPrefs(null);
    }
  };

  const handleDismissLegacy = () => {
    setLegacyPrefs(null);
    try {
      localStorage.setItem(userDismissalKey, "true");
    } catch {
      // Ignore
    }
  };

  const handleRestoreLegacy = () => {
    if (availableLegacyData) {
      setLegacyPrefs(availableLegacyData);
      try {
        localStorage.removeItem(userDismissalKey);
      } catch {
        // Ignore
      }
    }
  };

  const onSubmit = async (data: TenantPreferencesData) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const saved = await tenantApi.savePreferences(data);
      setSaveSuccess(true);
      try {
        // Only clear legacy localStorage data AFTER successful server persistence
        localStorage.removeItem("thikana.tenant.preferences");
        localStorage.removeItem(userDismissalKey);
      } catch {
        // Ignore
      }
      setAvailableLegacyData(null);
      setLegacyPrefs(null);
      queryClient.invalidateQueries({ queryKey: ["tenantPreferences"] });
      queryClient.invalidateQueries({ queryKey: ["tenantDashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["tenant", "preferences"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      if (onSaved) onSaved(saved);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" &&
              err !== null &&
              "message" in err &&
              typeof (err as { message: unknown }).message === "string"
            ? (err as { message: string }).message
            : "Failed to save preferences";
      setErrorMessage(message);
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
      {/* Server Preference Load Error Notice */}
      {loadError && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive"
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={() => loadPreferences()}
            disabled={isLoadingPrefs}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-destructive/30 bg-surface px-3 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingPrefs ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>{isBn ? "পুনরায় চেষ্টা করুন" : "Retry"}</span>
          </button>
        </div>
      )}

      {/* Matching Weights Explanatory Card */}
      <div className="rounded-2xl border border-border bg-secondary/30 p-5">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            {isBn
              ? "ঠিকানা ম্যাচিং অ্যালগরিদম (৭টি মানদণ্ড)"
              : "Thikana Matching Formula (7 Weights)"}
          </h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {isBn
            ? "আপনার সেভ করা পছন্দের সাথে প্রতিটি প্রপার্টি এই নির্দিষ্ট ওজনে যাচাই করা হয় (কোনো কাল্পনিক AI নয়):"
            : "Every listing is dynamically scored against your explicit preferences using this transparent rule matrix:"}
        </p>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
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
            <span className="block font-bold text-foreground">৫%</span>
            <span className="text-[11px] text-muted-foreground">{t("tenant.progressRooms")}</span>
          </div>
          <div className="rounded-xl border border-border bg-surface p-2.5">
            <span className="block font-bold text-foreground">৫%</span>
            <span className="text-[11px] text-muted-foreground">{isBn ? "বাথরুম" : "Baths"}</span>
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

      {/* Legacy LocalStorage Import Review Banner */}
      {legacyPrefs && (
        <div
          role="region"
          aria-label="Legacy Preferences Import Review"
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
              <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {isBn
                  ? "পূর্ববর্তী ব্রাউজারে সংরক্ষিত পছন্দসমূহ পাওয়া গেছে"
                  : "Legacy local preferences found from previous session"}
              </span>
            </div>
            <p className="text-muted-foreground">
              {isBn
                ? `এলাকা: ${legacyPrefs.preferredArea || "যেকোনো"}, বাজেট: ৳${legacyPrefs.maxBudget || "অনির্দিষ্ট"}, বেডরুম: ${legacyPrefs.minRooms || "যেকোনো"}`
                : `Area: ${legacyPrefs.preferredArea || "Any"}, Budget: ৳${legacyPrefs.maxBudget || "None"}, Rooms: ${legacyPrefs.minRooms || "Any"}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleImportLegacy}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isBn ? "ইমপোর্ট করুন" : "Import"}</span>
            </button>
            <button
              type="button"
              onClick={handleDismissLegacy}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isBn ? "বাতিল" : "Dismiss"}</span>
            </button>
          </div>
        </div>
      )}

      {availableLegacyData && !legacyPrefs && (
        <div className="flex items-center justify-end -mt-2">
          <button
            type="button"
            onClick={handleRestoreLegacy}
            className="inline-flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isBn
                ? "পূর্ববর্তী ব্রাউজারের পছন্দসমূহ পর্যালোচনা করুন"
                : "Review dismissed browser preferences"}
            </span>
          </button>
        </div>
      )}

      {saveSuccess && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t("tenant.preferencesSavedSuccess")}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-semibold text-destructive"
        >
          <X className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
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
            disabled={areasLoading}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
          >
            <option value="">
              {areasLoading ? t("common.loadingAreas") : t("tenant.anyArea")}
            </option>
            {areasError && <option disabled>{t("common.failedToLoadAreas")}</option>}
            {areas.map((area) => (
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
              {currentBudget
                ? `৳${toBnNumber(Number(currentBudget).toLocaleString(), i18n.language)}`
                : isBn
                  ? "যেকোনো"
                  : "Any"}
            </span>
          </div>
          <input
            id="pref-budget"
            type="number"
            min={1000}
            max={100000}
            step={500}
            placeholder={isBn ? "যেমন: ১২০০০" : "e.g. 12000"}
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
            <option value="">{isBn ? "যেকোনো" : "Any"}</option>
            <option value={1}>
              {toBnNumber(1, i18n.language)} {t("properties.bedrooms")}
            </option>
            <option value={2}>
              {toBnNumber(2, i18n.language)} {t("properties.bedrooms")}
            </option>
            <option value={3}>
              {toBnNumber(3, i18n.language)} {t("properties.bedrooms")}
            </option>
            <option value={4}>
              {toBnNumber(4, i18n.language)}+ {t("properties.bedrooms")}
            </option>
          </select>
          {errors.minRooms && (
            <p className="text-[11px] text-destructive">{errors.minRooms.message}</p>
          )}
        </div>

        {/* Minimum Bathrooms */}
        <div className="space-y-1.5">
          <label htmlFor="pref-bathrooms" className="text-xs font-semibold text-foreground">
            {isBn ? "নূন্যতম বাথরুম" : "Minimum Bathrooms"}
          </label>
          <select
            id="pref-bathrooms"
            {...register("minBathrooms", { valueAsNumber: true })}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">{isBn ? "যেকোনো" : "Any"}</option>
            <option value={1}>
              {toBnNumber(1, i18n.language)} {t("properties.bathrooms")}
            </option>
            <option value={2}>
              {toBnNumber(2, i18n.language)} {t("properties.bathrooms")}
            </option>
            <option value={3}>
              {toBnNumber(3, i18n.language)}+ {t("properties.bathrooms")}
            </option>
          </select>
          {errors.minBathrooms && (
            <p className="text-[11px] text-destructive">{errors.minBathrooms.message}</p>
          )}
        </div>

        {/* Preferred Furnished Status */}
        <div className="space-y-1.5">
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
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground">
            {t("tenant.requiredAmenities")}
          </label>
          {amenitiesError && (
            <button
              type="button"
              onClick={() => refetchAmenities()}
              className="inline-flex items-center gap-1 text-[11px] text-destructive hover:underline"
            >
              <RefreshCw className="h-2.5 w-2.5" />
              Retry
            </button>
          )}
        </div>
        {amenitiesLoading && (
          <div className="flex items-center space-x-2 py-3 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("common.loadingAmenities")}</span>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {amenities.map((amenity) => {
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
          disabled={isSubmitting || isCatalogLoading || hasCatalogError}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-xs font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          <span>{isSubmitting ? t("tenant.saving") : t("tenant.savePreferences")}</span>
        </button>
      </div>
    </form>
  );
};
