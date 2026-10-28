import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import bn from "@/locales/bn.json";
import en from "@/locales/en.json";

export const LANG_KEY = "thikana.lang";
export type Lang = "bn" | "en";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: { bn: { translation: bn }, en: { translation: en } },
    lng: "bn",
    fallbackLng: "bn",
    interpolation: { escapeValue: false },
  });
}

function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function warnUnmapped(category: string, value: string, lang: string) {
  if (process.env["NODE_ENV"] !== "production") {
    console.warn(`[i18n] Missing ${lang} mapping in category "${category}" for value: "${value}"`);
  }
}

export function translatePropertyType(type?: string, lang: string = i18n.language): string {
  if (!type) return "";
  const key = `types.${normalizeKey(type)}`;
  if (i18n.exists(key, { lng: lang })) {
    return i18n.t(key, { lng: lang });
  }
  warnUnmapped("propertyType", type, lang);
  return type;
}

export function translateRentalType(type?: string, lang: string = i18n.language): string {
  if (!type) return "";
  const key = `rentalTypes.${normalizeKey(type)}`;
  if (i18n.exists(key, { lng: lang })) {
    return i18n.t(key, { lng: lang });
  }
  warnUnmapped("rentalType", type, lang);
  return type;
}

export function translateAvailability(status?: string, lang: string = i18n.language): string {
  if (!status) return "";
  const key = `availability.${normalizeKey(status)}`;
  if (i18n.exists(key, { lng: lang })) {
    return i18n.t(key, { lng: lang });
  }
  warnUnmapped("availability", status, lang);
  return status;
}

export function translateAmenity(amenity: string, lang: string = i18n.language): string {
  if (!amenity) return "";
  const key = `amenities.${normalizeKey(amenity)}`;
  if (i18n.exists(key, { lng: lang })) {
    return i18n.t(key, { lng: lang });
  }
  warnUnmapped("amenities", amenity, lang);
  return amenity;
}

export function translateArea(area: string, lang: string = i18n.language): string {
  if (!area) return "";
  const key = `areas.${normalizeKey(area)}`;
  if (i18n.exists(key, { lng: lang })) {
    return i18n.t(key, { lng: lang });
  }
  warnUnmapped("areas", area, lang);
  return area;
}

export function translateFurnished(status?: string, lang: string = i18n.language): string {
  if (!status) return "";
  const key = `furnished.${normalizeKey(status)}`;
  if (i18n.exists(key, { lng: lang })) {
    return i18n.t(key, { lng: lang });
  }
  warnUnmapped("furnished", status, lang);
  return status;
}

export function translateVerification(v: string, lang: string = i18n.language): string {
  if (!v) return "";
  const key = `verification.${normalizeKey(v)}`;
  if (i18n.exists(key, { lng: lang })) {
    return i18n.t(key, { lng: lang });
  }
  warnUnmapped("verification", v, lang);
  return v;
}

export function translateBill(b: string, lang: string = i18n.language): string {
  if (!b) return "";
  const key = `bills.${normalizeKey(b)}`;
  if (i18n.exists(key, { lng: lang })) {
    return i18n.t(key, { lng: lang });
  }
  warnUnmapped("bills", b, lang);
  return b;
}

export function translateAdminStat(statKey: string, lang: string = i18n.language): string {
  const key = `adminStats.${normalizeKey(statKey)}`;
  if (i18n.exists(key, { lng: lang })) {
    return i18n.t(key, { lng: lang });
  }
  warnUnmapped("adminStats", statKey, lang);
  return statKey;
}

export function toBnNumber(val: number | string, lng?: string): string {
  const targetLng = lng || i18n.language || "en";
  if (!targetLng.startsWith("bn")) {
    return val.toString();
  }
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return val.toString().replace(/\d/g, (d) => bnDigits[parseInt(d, 10)] ?? d);
}

export default i18n;
