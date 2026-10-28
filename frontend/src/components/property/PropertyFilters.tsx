import { useTranslation } from "react-i18next";
import { Filter, RotateCcw, Check } from "lucide-react";
import {
  PROPERTY_TYPES,
  RENTAL_TYPES,
  FURNISHED_STATUSES,
  AVAILABILITY_STATUSES,
  type PropertyFilter,
} from "@/lib/api/properties";
import { KHULNA_AREAS, ALL_AMENITIES } from "@/lib/api/mock/properties";
import { translatePropertyType, translateRentalType, translateFurnished, translateArea, translateAmenity } from "@/lib/i18n";

interface PropertyFiltersProps {
  filters: PropertyFilter;
  onChange: (next: PropertyFilter) => void;
  onReset: () => void;
  className?: string;
}

export function PropertyFilters({
  filters,
  onChange,
  onReset,
  className = "",
}: PropertyFiltersProps) {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";

  const handleAreaChange = (val: string) => {
    onChange({ ...filters, area: val === "All Areas" ? undefined : val, page: 1 });
  };

  const handlePropertyTypeChange = (val: string) => {
    onChange({
      ...filters,
      propertyType: val ? (val as PropertyFilter["propertyType"]) : undefined,
      page: 1,
    });
  };

  const handleRentalTypeChange = (val: string) => {
    onChange({
      ...filters,
      rentalType: val ? (val as PropertyFilter["rentalType"]) : undefined,
      page: 1,
    });
  };

  const handleMinRentChange = (val: string) => {
    const num = val ? Number(val) : undefined;
    onChange({ ...filters, minRent: num, page: 1 });
  };

  const handleMaxRentChange = (val: string) => {
    const num = val ? Number(val) : undefined;
    onChange({ ...filters, maxRent: num, page: 1 });
  };

  const handleRoomsChange = (val: string) => {
    const num = val ? Number(val) : undefined;
    onChange({ ...filters, rooms: num, page: 1 });
  };

  const handleFurnishedChange = (val: string) => {
    onChange({
      ...filters,
      furnishedStatus: val ? (val as PropertyFilter["furnishedStatus"]) : undefined,
      page: 1,
    });
  };

  const handleVerifiedToggle = (checked: boolean) => {
    onChange({ ...filters, verifiedOnly: checked || undefined, page: 1 });
  };

  const toggleAmenity = (amenity: string) => {
    const current = filters.amenities || [];
    const next = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    onChange({ ...filters, amenities: next.length > 0 ? next : undefined, page: 1 });
  };

  const field =
    "h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary";

  return (
    <aside
      className={`rounded-2xl border border-border bg-surface p-5 shadow-xs ${className}`}
      aria-label={t("properties.filterProperties")}
    >
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Filter className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>{t("properties.filters")}</span>
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t("properties.reset")}</span>
        </button>
      </div>

      <div className="mt-5 space-y-5">
        {/* Khulna Area Selector */}
        <div>
          <label htmlFor="filter-area" className="text-xs font-semibold text-foreground">
            {t("properties.khulnaArea")}
          </label>
          <select
            id="filter-area"
            value={filters.area || "All Areas"}
            onChange={(e) => handleAreaChange(e.target.value)}
            className={`mt-1.5 ${field}`}
          >
            {KHULNA_AREAS.map((a) => (
              <option key={a} value={a}>
                {translateArea(a, i18n.language)}
              </option>
            ))}
          </select>
        </div>

        {/* Property Type */}
        <div>
          <label htmlFor="filter-type" className="text-xs font-semibold text-foreground">
            {t("properties.propertyType")}
          </label>
          <select
            id="filter-type"
            value={filters.propertyType || ""}
            onChange={(e) => handlePropertyTypeChange(e.target.value)}
            className={`mt-1.5 ${field}`}
          >
            <option value="">{t("properties.allTypes")}</option>
            {PROPERTY_TYPES.map((pt) => (
              <option key={pt} value={pt}>
                {translatePropertyType(pt, i18n.language)}
              </option>
            ))}
          </select>
        </div>

        {/* Rental Type */}
        <div>
          <label htmlFor="filter-rental-type" className="text-xs font-semibold text-foreground">
            {t("properties.rentalType")}
          </label>
          <select
            id="filter-rental-type"
            value={filters.rentalType || ""}
            onChange={(e) => handleRentalTypeChange(e.target.value)}
            className={`mt-1.5 ${field}`}
          >
            <option value="">{t("properties.allRentalTypes")}</option>
            {RENTAL_TYPES.map((rt) => (
              <option key={rt} value={rt}>
                {translateRentalType(rt, i18n.language)}
              </option>
            ))}
          </select>
        </div>

        {/* Budget Min / Max in BDT */}
        <div>
          <label className="text-xs font-semibold text-foreground">
            {t("properties.monthlyBudget")}
          </label>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              step={500}
              placeholder={t("properties.min")}
              value={filters.minRent !== undefined ? filters.minRent : ""}
              onChange={(e) => handleMinRentChange(e.target.value)}
              className={field}
              aria-label={t("properties.minRent")}
            />
            <input
              type="number"
              min={0}
              step={500}
              placeholder={t("properties.max")}
              value={filters.maxRent !== undefined ? filters.maxRent : ""}
              onChange={(e) => handleMaxRentChange(e.target.value)}
              className={field}
              aria-label={t("properties.maxRent")}
            />
          </div>
        </div>

        {/* Minimum Rooms */}
        <div>
          <label htmlFor="filter-rooms" className="text-xs font-semibold text-foreground">
            {t("properties.bedroomsCount")}
          </label>
          <select
            id="filter-rooms"
            value={filters.rooms !== undefined ? String(filters.rooms) : ""}
            onChange={(e) => handleRoomsChange(e.target.value)}
            className={`mt-1.5 ${field}`}
          >
            <option value="">{t("properties.anyRooms")}</option>
            <option value="1">1+ {t("properties.bedrooms")}</option>
            <option value="2">2+ {t("properties.bedrooms")}</option>
            <option value="3">3+ {t("properties.bedrooms")}</option>
          </select>
        </div>

        {/* Furnished Status */}
        <div>
          <label htmlFor="filter-furnished" className="text-xs font-semibold text-foreground">
            {t("properties.furnishedStatus")}
          </label>
          <select
            id="filter-furnished"
            value={filters.furnishedStatus || ""}
            onChange={(e) => handleFurnishedChange(e.target.value)}
            className={`mt-1.5 ${field}`}
          >
            <option value="">{t("properties.anyFurnished")}</option>
            {FURNISHED_STATUSES.map((fs) => (
              <option key={fs} value={fs}>
                {translateFurnished(fs, i18n.language)}
              </option>
            ))}
          </select>
        </div>

        {/* Simulated Verified Only Toggle */}
        <div className="rounded-xl border border-border/80 bg-secondary/40 p-3">
          <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-foreground">
            <input
              type="checkbox"
              checked={!!filters.verifiedOnly}
              onChange={(e) => handleVerifiedToggle(e.target.checked)}
              className="h-4 w-4 rounded-sm border-input text-primary focus:ring-primary"
            />
            <span>{t("properties.verifiedOnly")}</span>
          </label>
        </div>

        {/* Amenities Checklist */}
        <div>
          <span className="text-xs font-semibold text-foreground">
            {t("properties.keyAmenities")}
          </span>
          <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {ALL_AMENITIES.map((amenity) => {
              const checked = filters.amenities?.includes(amenity) || false;
              return (
                <label
                  key={amenity}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAmenity(amenity)}
                    className="h-3.5 w-3.5 rounded-sm border-input text-primary focus:ring-primary"
                  />
                  <span>{translateAmenity(amenity, i18n.language)}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
