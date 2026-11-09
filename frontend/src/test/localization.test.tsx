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
  translateTenantPreference,
  translateAdminStat,
  getInitialLanguage,
  LANG_KEY,
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

function validateAndFlatten(
  obj: Record<string, unknown>,
  lang: string,
  prefix = ""
): Record<string, string> {
  const flattened: Record<string, string> = {};
  const entries = Object.entries(obj);
  if (entries.length === 0 && prefix.length > 0) {
    throw new Error(`[${lang}] Empty nested object found at path "${prefix}"`);
  }
  for (const [key, value] of entries) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value === null || value === undefined) {
      throw new Error(`[${lang}] Value at "${fullPath}" is ${value}`);
    }
    if (typeof value === "object" && !Array.isArray(value)) {
      Object.assign(flattened, validateAndFlatten(value as Record<string, unknown>, lang, fullPath));
    } else if (typeof value === "string") {
      if (value.trim().length === 0) {
        throw new Error(`[${lang}] String value at "${fullPath}" is empty or whitespace-only`);
      }
      flattened[fullPath] = value;
    } else {
      throw new Error(
        `[${lang}] Invalid leaf value type at "${fullPath}": ${typeof value} (${JSON.stringify(value)})`
      );
    }
  }
  return flattened;
}

const PROPOSED_62_ADDITIONS: Array<{ key: string; bn: string; en: string }> = [
  { key: "common.cancel", bn: "বাতিল করুন", en: "Cancel" },
  { key: "common.networkError", bn: "নেটওয়ার্ক ত্রুটি। অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।", en: "Network error. Please check your internet connection." },
  { key: "common.viewDetails", bn: "বিস্তারিত দেখুন", en: "View Details" },
  { key: "common.backToHome", bn: "প্রধান পৃষ্ঠায় ফিরে যান", en: "Back to Home" },
  { key: "common.loadingAreas", bn: "এলাকা লোড হচ্ছে...", en: "Loading areas..." },
  { key: "common.failedToLoadAreas", bn: "এলাকা লোড করতে ব্যর্থ হয়েছে", en: "Failed to load areas" },
  { key: "common.loadingAmenities", bn: "সুযোগ-সুবিধা লোড হচ্ছে...", en: "Loading amenities..." },
  { key: "common.noAreasAvailable", bn: "কোনো এলাকা পাওয়া যায়নি", en: "No areas available" },
  { key: "dashboard.findHomes", bn: "নতুন বাসা খুঁজুন", en: "Find Homes" },
  { key: "nav.dashboard", bn: "ড্যাশবোর্ড", en: "Dashboard" },
  { key: "properties.allProperties", bn: "টি মোট প্রপার্টি", en: "all properties" },
  { key: "properties.rooms", bn: "রুম", en: "Rooms" },
  { key: "properties.baths", bn: "বাথ", en: "Baths" },
  { key: "properties.verifiedBadge", bn: "যাচাইকৃত", en: "Verified" },
  { key: "properties.perMonth", bn: "মাসিক", en: "month" },
  { key: "types.family_apartment", bn: "ফ্যামিলি অ্যাপার্টমেন্ট", en: "Family Apartment" },
  { key: "types.sublet_single_room", bn: "সাবলেট / সিঙ্গেল রুম", en: "Sublet / Single Room" },
  { key: "types.bachelor_flat", bn: "ব্যাচেলর ফ্ল্যাট", en: "Bachelor Flat" },
  { key: "types.student_mess", bn: "স্টুডেন্ট মেস", en: "Student Mess" },
  { key: "types.duplex", bn: "ডুপ্লেক্স", en: "Duplex" },
  { key: "types.family_flat", bn: "ফ্যামিলি ফ্ল্যাট", en: "Family Flat" },
  { key: "rentalTypes.family", bn: "পরিবার", en: "Family" },
  { key: "rentalTypes.bachelor", bn: "ব্যাচেলর", en: "Bachelor" },
  { key: "rentalTypes.female_only", bn: "শুধুমাত্র ছাত্রী/মহিলা", en: "Female-only" },
  { key: "rentalTypes.bachelor_flat", bn: "ব্যাচেলর ফ্ল্যাট", en: "Bachelor Flat" },
  { key: "rentalTypes.family_flat", bn: "ফ্যামিলি ফ্ল্যাট", en: "Family Flat" },
  { key: "furnished.any", bn: "যেকোনো", en: "Any" },
  { key: "tenantPreferences.students_only", bn: "শুধুমাত্র শিক্ষার্থী", en: "Students Only" },
  { key: "tenantPreferences.male_students_only", bn: "শুধুমাত্র ছাত্র", en: "Male Students Only" },
  { key: "tenantPreferences.female_students_only", bn: "শুধুমাত্র ছাত্রী", en: "Female Students Only" },
  { key: "tenantPreferences.family_only", bn: "শুধুমাত্র পরিবার", en: "Family Only" },
  { key: "tenantPreferences.job_holders", bn: "চাকরিজীবী", en: "Job Holders" },
  { key: "tenantPreferences.bachelors_only", bn: "শুধুমাত্র ব্যাচেলর", en: "Bachelors Only" },
  { key: "tenantPreferences.families_only", bn: "শুধুমাত্র পরিবার", en: "Families Only" },
  { key: "areas.nirala", bn: "নিরালা", en: "Nirala" },
  { key: "areas.daulatpur", bn: "দৌলতপুর", en: "Daulatpur" },
  { key: "areas.shibbari", bn: "শিববাড়ি", en: "Shibbari" },
  { key: "areas.gollamari", bn: "গল্লামারী", en: "Gollamari" },
  { key: "areas.kda_avenue", bn: "কেডিএ এভিনিউ", en: "KDA Avenue" },
  { key: "areas.rupsha", bn: "রূপসা", en: "Rupsha" },
  { key: "verification.nid_matched", bn: "এনআইডি যাচাইকৃত", en: "NID Verified" },
  { key: "verification.holding_tax_verified", bn: "হোল্ডিং ট্যাক্স যাচাইকৃত", en: "Holding Tax Verified" },
  { key: "verification.physically_inspected", bn: "সরেজমিনে পরিদর্শিত", en: "Physically Inspected" },
  { key: "verification.document_verified", bn: "কাগজপত্র যাচাইকৃত", en: "Document Verified" },
  { key: "verification.in_person_verified", bn: "সরেজমিনে পরিদর্শিত", en: "In-Person Verified" },
  { key: "verification.physical_visit_verified", bn: "সরেজমিনে পরিদর্শিত", en: "Physical Visit Verified" },
  { key: "verification.pending_verification", bn: "যাচাইকরণ অপেক্ষমাণ", en: "Pending Verification" },
  { key: "bills.water_supply", bn: "পানি সরবরাহ", en: "Water Supply" },
  { key: "bills.trash_management", bn: "ময়লা নিষ্কাশন ব্যবস্থাপনা", en: "Trash Management" },
  { key: "bills.high_speed_wifi", bn: "দ্রুতগতির ওয়াইফাই", en: "High-Speed WiFi" },
  { key: "bills.gas_cylinder_line", bn: "গ্যাস লাইন / সিলিন্ডার", en: "Gas Cylinder / Line" },
  { key: "bills.security_guard", bn: "নিরাপত্তা প্রহরী", en: "Security Guard" },
  { key: "bills.waste", bn: "ময়লা নিষ্কাশন বিল", en: "Waste Collection" },
  { key: "bills.wifi", bn: "ওয়াইফাই বিল", en: "WiFi Bill" },
  { key: "bills.wifi_internet", bn: "ওয়াইফাই / ইন্টারনেট", en: "WiFi / Internet" },
  { key: "bills.trash_collection", bn: "ময়লা নিষ্কাশন বিল", en: "Trash Collection" },
  { key: "auth.feedback.alreadyVerified", bn: "ইমেইল ঠিকানা ইতিমধ্যে যাচাই করা হয়েছে।", en: "Email address is already verified." },
  { key: "auth.feedback.verified", bn: "ইমেইল ঠিকানা সফলভাবে যাচাই করা হয়েছে!", en: "Email address verified successfully!" },
  { key: "auth.verifySuccessSubtitle", bn: "আপনি এখন সকল অনুমোদিত সুবিধা ব্যবহার করতে পারবেন।", en: "You can now access all authenticated features." },
  { key: "auth.invalidLinkTitle", bn: "যাচাইকরণ লিংকটি অকার্যকর বা মেয়াদোত্তীর্ণ", en: "Verification Link Invalid or Expired" },
  { key: "auth.invalidLinkSubtitle", bn: "এই লিংকটির মেয়াদ শেষ হয়ে গেছে অথবা ইতিমধ্যে ব্যবহৃত হয়েছে। দয়া করে নিচে নতুন লিংকের অনুরোধ করুন।", en: "This link may have expired or was already used. Please request a new one below." },
  { key: "auth.verifyInstruction", bn: "আপনার অ্যাকাউন্ট সুরক্ষিতভাবে যাচাই করতে ইমেইলের ভেতরের বাটনে ক্লিক করুন। না পেলে স্প্যাম ফোল্ডার পরীক্ষা করুন।", en: "Please log in to your account and request a fresh verification link." },
];

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

  it("asserts 100% bidirectional key parity between flattened bn and en dictionaries without omissions", () => {
    const flatBn = validateAndFlatten(bn as Record<string, unknown>, "bn");
    const flatEn = validateAndFlatten(en as Record<string, unknown>, "en");
    const bnKeys = Object.keys(flatBn).sort();
    const enKeys = Object.keys(flatEn).sort();
    expect(bnKeys.filter((k) => !(k in flatEn)), "Keys in bn.json missing from en.json").toEqual([]);
    expect(enKeys.filter((k) => !(k in flatBn)), "Keys in en.json missing from bn.json").toEqual([]);
    expect(bnKeys.length).toBe(enKeys.length);
    expect(bnKeys.length).toBeGreaterThan(0);
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

  it("asserts all 62 proposed additions exist with exact expected values in both bn and en", async () => {
    await i18n.changeLanguage("bn");
    for (const item of PROPOSED_62_ADDITIONS) {
      expect(i18n.t(item.key, { lng: "bn" }), `Key "${item.key}" must match expected bn value`).toBe(item.bn);
    }
    await i18n.changeLanguage("en");
    for (const item of PROPOSED_62_ADDITIONS) {
      expect(i18n.t(item.key, { lng: "en" }), `Key "${item.key}" must match expected en value`).toBe(item.en);
    }
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

  it("maps furnishing 'Any' and tenant preferences without returning raw English or warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(translateFurnished("Any", "bn")).toBe("যেকোনো");
    expect(translateTenantPreference("Students Only", "bn")).toBe("শুধুমাত্র শিক্ষার্থী");
    expect(translateTenantPreference("Female Students Only", "bn")).toBe("শুধুমাত্র ছাত্রী");
    expect(translateTenantPreference("Family Only", "bn")).toBe("শুধুমাত্র পরিবার");
    expect(translateTenantPreference("Job Holders", "bn")).toBe("চাকরিজীবী");
    expect(translateTenantPreference("Any", "bn")).toBe("যেকোনো");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("maps seeded municipal areas and seeded verification states without warnings", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(translateArea("Nirala", "bn")).toBe("নিরালা");
    expect(translateArea("Daulatpur", "bn")).toBe("দৌলতপুর");
    expect(translateArea("Shibbari", "bn")).toBe("শিববাড়ি");
    expect(translateArea("Gollamari", "bn")).toBe("গল্লামারী");
    expect(translateArea("KDA Avenue", "bn")).toBe("কেডিএ এভিনিউ");
    expect(translateArea("Rupsha", "bn")).toBe("রূপসা");
    expect(translateVerification("nid_matched", "bn")).toBe("এনআইডি যাচাইকৃত");
    expect(translateVerification("holding_tax_verified", "bn")).toBe("হোল্ডিং ট্যাক্স যাচাইকৃত");
    expect(translateVerification("physically_inspected", "bn")).toBe("সরেজমিনে পরিদর্শিত");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("maps seeded bills including water, waste, and wifi without warnings", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(translateBill("waste", "bn")).toBe("ময়লা নিষ্কাশন বিল");
    expect(translateBill("wifi", "bn")).toBe("ওয়াইফাই বিল");
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

  describe("Language Initialization & Persistence Regressions", () => {
    it("defaults to 'bn' when no language is stored in localStorage", () => {
      const storageSpy = vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
      expect(getInitialLanguage()).toBe("bn");
      storageSpy.mockRestore();
    });

    it("initializes with stored Bengali when 'bn' is in localStorage", () => {
      window.localStorage.setItem(LANG_KEY, "bn");
      expect(getInitialLanguage()).toBe("bn");
      window.localStorage.removeItem(LANG_KEY);
    });

    it("initializes with stored English when 'en' is in localStorage", () => {
      window.localStorage.setItem(LANG_KEY, "en");
      expect(getInitialLanguage()).toBe("en");
      window.localStorage.removeItem(LANG_KEY);
    });

    it("falls back to 'bn' when an invalid language string is stored", () => {
      window.localStorage.setItem(LANG_KEY, "fr_unsupported");
      expect(getInitialLanguage()).toBe("bn");
      window.localStorage.removeItem(LANG_KEY);
    });

    it("gracefully falls back to 'bn' when localStorage.getItem throws SecurityError", () => {
      const storageSpy = vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
        throw new Error("SecurityError: Access to localStorage is denied");
      });
      expect(getInitialLanguage()).toBe("bn");
      storageSpy.mockRestore();
    });

    it("switches language after initialization and preserves dynamic reactivity", async () => {
      await i18n.changeLanguage("en");
      expect(i18n.language).toBe("en");
      expect(i18n.t("common.cancel")).toBe("Cancel");

      await i18n.changeLanguage("bn");
      expect(i18n.language).toBe("bn");
      expect(i18n.t("common.cancel")).toBe("বাতিল করুন");
    });
  });
});
