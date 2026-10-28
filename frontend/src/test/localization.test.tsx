import { describe, it, expect, vi, beforeEach } from "vitest";
import i18n, {
  translatePropertyType,
  translateRentalType,
  translateAvailability,
  translateAmenity,
  translateArea,
  translateFurnished,
  translateVerification,
  translateBill,
  translateAdminStat,
} from "@/lib/i18n";
import bn from "@/locales/bn.json";
import en from "@/locales/en.json";
import {
  PROPERTY_TYPES,
  RENTAL_TYPES,
  AVAILABILITY_STATUSES,
  FURNISHED_STATUSES,
  VERIFICATION_STATES,
} from "@/lib/api/properties";
import { KHULNA_AREAS, ALL_AMENITIES } from "@/lib/api/mock/properties";

function getAllKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  let keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys = keys.concat(getAllKeys(v as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe("Bangla & English Localization Infrastructure", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("bn");
    vi.restoreAllMocks();
  });

  it("has 100% key parity between bn.json and en.json", () => {
    const bnKeys = getAllKeys(bn).sort();
    const enKeys = getAllKeys(en).sort();

    const missingInEn = bnKeys.filter((k) => !enKeys.includes(k));
    const missingInBn = enKeys.filter((k) => !bnKeys.includes(k));

    expect(missingInEn).toEqual([]);
    expect(missingInBn).toEqual([]);
    expect(bnKeys.length).toBe(enKeys.length);
  });

  it("contains no empty string or undefined values in dictionaries", () => {
    const checkNoEmpty = (obj: Record<string, unknown>, path = "") => {
      for (const [k, v] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${k}` : k;
        if (typeof v === "object" && v !== null) {
          checkNoEmpty(v as Record<string, unknown>, fullPath);
        } else {
          expect(typeof v).toBe("string");
          expect((v as string).trim().length).toBeGreaterThan(0);
        }
      }
    };
    checkNoEmpty(bn);
    checkNoEmpty(en);
  });

  it("maps all PROPERTY_TYPES in Bangla mode without returning raw English or warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const type of PROPERTY_TYPES) {
      const translated = translatePropertyType(type, "bn");
      expect(translated).toBeTruthy();
      expect(translated).not.toBe(type);
    }
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("maps all RENTAL_TYPES in Bangla mode without returning raw English or warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const type of RENTAL_TYPES) {
      const translated = translateRentalType(type, "bn");
      expect(translated).toBeTruthy();
      expect(translated).not.toBe(type);
    }
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("maps all AVAILABILITY_STATUSES in Bangla mode without returning raw English or warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const status of AVAILABILITY_STATUSES) {
      const translated = translateAvailability(status, "bn");
      expect(translated).toBeTruthy();
      expect(translated).not.toBe(status);
    }
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("maps all ALL_AMENITIES (14 items) in Bangla mode to proper Bangla terminology", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const amenity of ALL_AMENITIES) {
      const translated = translateAmenity(amenity, "bn");
      expect(translated).toBeTruthy();
      expect(translated).not.toBe(amenity);
    }
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("maps all KHULNA_AREAS (11 items) in Bangla mode to proper Bangla names", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const area of KHULNA_AREAS) {
      const translated = translateArea(area, "bn");
      expect(translated).toBeTruthy();
      expect(translated).not.toBe(area);
    }
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("maps all FURNISHED_STATUSES in Bangla mode", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const status of FURNISHED_STATUSES) {
      const translated = translateFurnished(status, "bn");
      expect(translated).toBeTruthy();
      expect(translated).not.toBe(status);
    }
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("maps all VERIFICATION_STATES in Bangla mode", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const v of VERIFICATION_STATES) {
      const translated = translateVerification(v, "bn");
      expect(translated).toBeTruthy();
      expect(translated).not.toBe(v);
    }
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("maps bills and admin stats without warnings", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(translateBill("Electricity", "bn")).toBe("বিদ্যুৎ বিল");
    expect(translateBill("Water", "bn")).toBe("পানি বিল");
    expect(translateAdminStat("pending", "bn")).toBe("অনুমোদনাধীন");
    expect(translateAdminStat("total", "bn")).toBe("মোট");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("warns in development console for unmapped dynamic values", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const unmapped = translateAmenity("Unknown Laser Beam", "bn");
    expect(unmapped).toBe("Unknown Laser Beam");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Missing bn mapping in category "amenities"'),
    );
  });

  it("switches language reactively between bn and en", async () => {
    await i18n.changeLanguage("bn");
    expect(i18n.language).toBe("bn");
    expect(i18n.t("nav.why")).toBe("কেন ঠিকানা");
    expect(translateArea("Boyra", "bn")).toBe("বয়রা");

    await i18n.changeLanguage("en");
    expect(i18n.language).toBe("en");
    expect(i18n.t("nav.why")).toBe("Why Thikana");
    expect(translateArea("Boyra", "en")).toBe("Boyra");
  });
});

