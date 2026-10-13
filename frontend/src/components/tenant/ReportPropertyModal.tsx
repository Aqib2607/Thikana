import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { mockTenantApi } from "@/lib/api/mock";
import { REPORT_REASONS, type ReportReason } from "@/lib/api/tenant";
import type { PropertyItem } from "@/lib/api/properties";
import { X, Flag, CheckCircle, AlertCircle, ShieldAlert } from "lucide-react";

interface ReportPropertyModalProps {
  property: PropertyItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReportPropertyModal: React.FC<ReportPropertyModalProps> = ({
  property,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { i18n } = useTranslation();
  const isBn = i18n.language === "bn";

  const [reason, setReason] = useState<ReportReason>("Incorrect information");
  const [details, setDetails] = useState("");
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
    if (details.trim().length < 5) {
      setError(
        isBn
          ? "দয়া করে রিপোর্টের কারণ বিস্তারিতভাবে লিখুন (কমপক্ষে ৫ অক্ষর)।"
          : "Please describe the issue in detail (at least 5 characters).",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await mockTenantApi.submitReport({
        propertyId: property.id,
        reason,
        details: details.trim(),
      });
      setSubmitted(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null;
      setError(msg || (isBn ? "রিপোর্ট পাঠাতে ব্যর্থ হয়েছে।" : "Failed to submit report."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label={isBn ? "বন্ধ করুন" : "Close"}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <Flag className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="report-modal-title" className="text-base font-bold text-foreground">
              {isBn ? "প্রপার্টি রিপোর্ট করুন" : "Report Property Listing"}
            </h2>
            <p className="text-xs text-muted-foreground line-clamp-1">{property.title}</p>
          </div>
        </div>

        {submitted ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle
              className="mx-auto h-12 w-12 text-emerald-500 animate-in zoom-in"
              aria-hidden="true"
            />
            <h3 className="text-base font-bold text-foreground">
              {isBn ? "রিপোর্ট জমা দেওয়া হয়েছে" : "Report Received"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isBn
                ? "আমাদের মডারেশন টিম তথ্য যাচাই করে দ্রুত ব্যবস্থা গ্রহণ করবে।"
                : "Our moderation team will review this listing against platform guidelines."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* Predefined Reasons */}
            <div className="space-y-1.5">
              <label htmlFor="report-reason" className="text-xs font-semibold text-foreground">
                {isBn ? "রিপোর্টের কারণ নির্বাচন করুন" : "Select Report Reason"}
              </label>
              <select
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Explanation / Details */}
            <div className="space-y-1.5">
              <label htmlFor="report-details" className="text-xs font-semibold text-foreground">
                {isBn ? "বিস্তারিত বিবরণ" : "Additional Details"}
              </label>
              <textarea
                id="report-details"
                rows={4}
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={
                  isBn
                    ? "কেন মনে করছেন লিস্টিংটি সঠিক নয় বা কী সমস্যা লক্ষ্য করেছেন তা লিখুন..."
                    : "Please explain what is wrong with this listing (e.g. rent stated differs from actual, already rented)..."
                }
                className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="rounded-xl border border-border bg-secondary/30 p-3 flex items-start gap-2.5 text-[11px] text-muted-foreground">
              <ShieldAlert className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                {isBn
                  ? "ঠিকানা একটি নিরাপদ শিক্ষাঙ্গন-বান্ধব প্ল্যাটফর্ম। মিথ্যা তথ্য প্রদান বা স্প্যাম প্রতিহত করতে প্রতিটি রিপোর্ট নথিভুক্ত করা হয়।"
                  : "Thikana logs all reports for trust & safety audit trails to protect student renters."}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
              >
                {isBn ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-destructive px-5 py-2 text-xs font-semibold text-destructive-foreground shadow-sm hover:opacity-95 disabled:opacity-50"
              >
                <span>
                  {isSubmitting
                    ? isBn
                      ? "পাঠানো হচ্ছে..."
                      : "Submitting..."
                    : isBn
                      ? "রিপোর্ট জমা দিন"
                      : "Submit Report"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
