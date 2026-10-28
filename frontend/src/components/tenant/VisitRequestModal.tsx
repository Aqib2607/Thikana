import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { mockTenantApi } from "@/lib/api/mock";
import type { PropertyItem } from "@/lib/api/properties";
import { X, Calendar, Clock, MessageSquare, CheckCircle, AlertCircle } from "lucide-react";

interface VisitRequestModalProps {
  property: PropertyItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const TIME_SLOTS = [
  "Morning (10:00 AM - 12:00 PM)",
  "Afternoon (02:00 PM - 04:00 PM)",
  "Evening (04:00 PM - 06:00 PM)",
];

export const VisitRequestModal: React.FC<VisitRequestModalProps> = ({
  property,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";

  // Tomorrow as default date (min date)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split("T")[0];

  const [date, setDate] = useState(minDateStr);
  const [slot, setSlot] = useState(TIME_SLOTS[0]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError(isBn ? "দয়া করে পরিদর্শনের তারিখ নির্বাচন করুন।" : "Please select a visit date.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await mockTenantApi.createVisit({
        propertyId: property.id,
        visitDate: date,
        visitTimeSlot: slot,
        note: note.trim() || undefined,
      });
      setSubmitted(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null;
      setError(msg || (isBn ? "অনুরোধ পাঠাতে সমস্যা হয়েছে।" : "Failed to request visit."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="visit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Calendar className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="visit-modal-title" className="text-base font-bold text-foreground">
              {t("tenant.scheduleVisitTitle")}
            </h2>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {property.title} • {property.area}
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle
              className="mx-auto h-12 w-12 text-emerald-500 animate-in zoom-in"
              aria-hidden="true"
            />
            <h3 className="text-base font-bold text-foreground">
              {isBn ? "পরিদর্শনের আবেদন সফলভাবে পাঠানো হয়েছে!" : "Visit Request Sent Successfully!"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isBn
                ? "বাড়িওয়ালা আবেদনটি পর্যালোচনা করে অনুমোদন দেবেন। আপনার ভিজিট লিস্টে স্ট্যাটাস দেখতে পারবেন।"
                : "The landlord will review your request. You can track this in your Tenant Visits dashboard."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* Visit Date */}
            <div className="space-y-1.5">
              <label
                htmlFor="visit-date"
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
              >
                <Calendar className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>{isBn ? "পরিদর্শনের তারিখ" : "Preferred Date"}</span>
              </label>
              <input
                id="visit-date"
                type="date"
                min={minDateStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Time Slot */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>{isBn ? "পছন্দের সময় স্লট" : "Preferred Time Slot"}</span>
              </label>
              <div className="space-y-2">
                {TIME_SLOTS.map((s) => (
                  <label
                    key={s}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs cursor-pointer transition-colors ${
                      slot === s
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-surface text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <input
                      type="radio"
                      name="timeSlot"
                      value={s}
                      checked={slot === s}
                      onChange={() => setSlot(s)}
                      className="sr-only"
                    />
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        slot === s ? "border-primary" : "border-border"
                      }`}
                    >
                      {slot === s && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Optional Note */}
            <div className="space-y-1.5">
              <label
                htmlFor="visit-note"
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
              >
                <MessageSquare className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>
                  {isBn ? "মালিকের জন্য বার্তা (ঐচ্ছিক)" : "Note for Landlord (Optional)"}
                </span>
              </label>
              <textarea
                id="visit-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  isBn
                    ? "যেমন: পানির চাপ বা পড়ার পরিবেশ দেখতে চাই..."
                    : "e.g., I'd like to inspect water supply and natural sunlight..."
                }
                className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:scale-[1.02] disabled:opacity-50"
              >
                <span>
                  {isSubmitting
                    ? isBn
                      ? "পাঠানো হচ্ছে..."
                      : "Scheduling..."
                    : isBn
                      ? "অনুরোধ নিশ্চিত করুন"
                      : "Confirm Schedule"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
