import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, Trash2, Plus, AlertCircle, Image as ImageIcon, Sparkles } from "lucide-react";

interface PropertyImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  error?: string;
}

// Curated academic student room & apartment image presets for convenience
const PRESET_PHOTOS = [
  {
    name: "Living Room / হলরুম",
    url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Bedroom / বেডরুম",
    url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Study Desk / পড়ার টেবিল",
    url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Kitchen / রান্নাঘর",
    url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Balcony / বারান্দা",
    url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
  },
];

export function PropertyImageUploader({ images, onChange, error }: PropertyImageUploaderProps) {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const [inputUrl, setInputUrl] = useState("");
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  const handleAddImage = (urlToAdd: string) => {
    setLimitWarning(null);
    const trimmed = urlToAdd.trim();
    if (!trimmed) return;

    if (images.length >= 5) {
      setLimitWarning(
        isBn
          ? "সর্বোচ্চ ৫টি ছবি যোগ করা যাবে। নতুন ছবি যোগ করতে আগের ছবি মুছে ফেলুন।"
          : "Maximum 5 photos allowed. Please remove an existing photo to add a new one.",
      );
      return;
    }

    if (images.includes(trimmed)) {
      setLimitWarning(isBn ? "এই ছবিটি ইতোমধ্যে যুক্ত আছে।" : "This photo has already been added.");
      return;
    }

    onChange([...images, trimmed]);
    setInputUrl("");
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setLimitWarning(null);
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleSetFeatured = (indexToFeature: number) => {
    if (indexToFeature === 0) return;
    const target = images[indexToFeature];
    const rest = images.filter((_, idx) => idx !== indexToFeature);
    // Put target as 1st image (Featured)
    onChange([target, ...rest]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="block text-sm font-semibold text-foreground">
            {isBn ? "বাসার ছবিসমূহ (সর্বোচ্চ ৫টি)" : "Property Photos (Max 5)"}
            <span className="text-destructive ml-1">*</span>
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isBn
              ? "প্রথম ছবিটি স্বয়ংক্রিয়ভাবে প্রধান ছবি (Featured Image) হিসেবে প্রদর্শিত হবে।"
              : "The first image will automatically be set as the featured photo."}
          </p>
        </div>
        <div
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            images.length >= 5
              ? "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700"
              : "border-border bg-secondary text-foreground"
          }`}
          aria-live="polite"
        >
          {images.length} / 5 {isBn ? "ছবি" : "photos"}
        </div>
      </div>

      {/* Limit or Validation Errors */}
      {limitWarning && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
          <p>{limitWarning}</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Grid of uploaded images */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {images.map((imgUrl, index) => {
          const isFeatured = index === 0;
          return (
            <div
              key={`${imgUrl}-${index}`}
              className={`group relative aspect-[4/3] rounded-xl overflow-hidden border-2 bg-muted transition-all shadow-sm ${
                isFeatured
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-border-strong"
              }`}
            >
              <img
                src={imgUrl}
                alt={`Property photo ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />

              {/* Featured Badge */}
              {isFeatured ? (
                <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow">
                  <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                  <span>{isBn ? "প্রধান ছবি" : "Featured"}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetFeatured(index)}
                  className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] font-medium text-foreground hover:bg-background shadow transition-opacity"
                  title={isBn ? "প্রধান ছবি করুন" : "Set as featured"}
                >
                  {isBn ? "প্রধান করুন" : "Make featured"}
                </button>
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                aria-label={`${isBn ? "ছবি মুছুন" : "Remove photo"} ${index + 1}`}
                className="absolute top-2 right-2 rounded-md bg-destructive/90 p-1 text-destructive-foreground hover:bg-destructive shadow opacity-90 hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              <div className="absolute bottom-1 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-white">
                #{index + 1}
              </div>
            </div>
          );
        })}

        {/* Empty placeholder slot if < 5 */}
        {images.length < 5 && (
          <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center p-3 text-center bg-muted/30 text-muted-foreground">
            <ImageIcon className="h-6 w-6 mb-1 opacity-50" aria-hidden="true" />
            <span className="text-[11px]">
              {isBn ? `স্লট ${images.length + 1}` : `Slot ${images.length + 1}`}
            </span>
          </div>
        )}
      </div>

      {/* URL input controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder={
            isBn
              ? "ছবির সরাসরি ওয়েব লিংক দিন (https://...)"
              : "Paste direct image URL (https://...)"
          }
          className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddImage(inputUrl);
            }
          }}
          disabled={images.length >= 5}
        />
        <button
          type="button"
          onClick={() => handleAddImage(inputUrl)}
          disabled={!inputUrl.trim() || images.length >= 5}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-50 transition-all"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{isBn ? "ছবি যোগ করুন" : "Add Photo"}</span>
        </button>
      </div>

      {/* Quick Academic Preset Photos */}
      {images.length < 5 && (
        <div className="rounded-xl border border-border/70 bg-secondary/30 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>
              {isBn ? "নমুনা ছবি থেকে দ্রুত নির্বাচন:" : "Quick add from student room samples:"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PHOTOS.map((p) => {
              const alreadyAdded = images.includes(p.url);
              return (
                <button
                  key={p.url}
                  type="button"
                  disabled={alreadyAdded || images.length >= 5}
                  onClick={() => handleAddImage(p.url)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    alreadyAdded
                      ? "border-transparent bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                      : "border-border bg-surface text-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  + {p.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
