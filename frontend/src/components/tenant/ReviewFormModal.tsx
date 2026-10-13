import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { mockTenantApi } from "@/lib/api/mock";
import type { PropertyItem } from "@/lib/api/properties";
import { X, Star, CheckCircle, AlertCircle, BadgeCheck } from "lucide-react";

interface ReviewFormModalProps {
  property: PropertyItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReviewFormModal: React.FC<ReviewFormModalProps> = ({
  property,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { i18n } = useTranslation();
  const isBn = i18n.language === "bn";

  const [accuracy, setAccuracy] = useState(5);
  const [behavior, setBehavior] = useState(5);
  const [location, setLocation] = useState(5);
  const [overall, setOverall] = useState(5);
  const [comment, setComment] = useState("");
  const [hasVisited, setHasVisited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      mockTenantApi.getVisits().then((visits) => {
        const completed = visits.some(
          (v) => v.propertyId === property.id && v.status === "Completed",
        );
        setHasVisited(completed);
      });
    }
  }, [isOpen, property.id]);

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
    if (comment.trim().length < 5) {
      setError(
        isBn
          ? "দয়া করে অন্তত ৫ অক্ষরের একটি বাস্তব মন্তব্য লিখুন।"
          : "Please write a comment of at least 5 characters.",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await mockTenantApi.submitReview({
        propertyId: property.id,
        accuracyRating: accuracy,
        landlordBehaviorRating: behavior,
        locationRating: location,
        overallExperienceRating: overall,
        comment: comment.trim(),
      });
      setSubmitted(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null;
      setError(msg || (isBn ? "রিভিউ যোগ করতে সমস্যা হয়েছে।" : "Failed to submit review."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarPicker = (label: string, value: number, onChange: (v: number) => void) => (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => onChange(star)}
            aria-label={`${star} star`}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`h-4 w-4 ${
                star <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
              }`}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Star className="h-5 w-5 fill-amber-500" aria-hidden="true" />
          </div>
          <div>
            <h2 id="review-modal-title" className="text-base font-bold text-foreground">
              {isBn ? "বাসা ও মালিক সম্পর্কে রিভিউ দিন" : "Submit Rental Review"}
            </h2>
            <p className="text-xs text-muted-foreground line-clamp-1">{property.title}</p>
          </div>
        </div>

        {/* Visited Status Indicator */}
        <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-3">
          {hasVisited ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>
                {isBn
                  ? "যাচাইকৃত পরিদর্শক (Visited Badge): আপনি পূর্বে এই বাসা পরিদর্শন করেছেন।"
                  : "Verified Visitor (Visited Badge): You have completed a verified visit to this listing."}
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {isBn
                ? "সাধারণ ভাড়াটিয়া রিভিউ। বাসা পরিদর্শন সম্পন্ন হলে স্বয়ংক্রিয় 'Visited' ব্যাজ যুক্ত হয়।"
                : "Standard tenant review. Completing a scheduled visit adds an automatic 'Visited' verified badge."}
            </p>
          )}
        </div>

        {submitted ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle
              className="mx-auto h-12 w-12 text-emerald-500 animate-in zoom-in"
              aria-hidden="true"
            />
            <h3 className="text-base font-bold text-foreground">
              {isBn ? "রিভিউ সফলভাবে গৃহীত হয়েছে!" : "Review Submitted Successfully!"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isBn
                ? "আপনার রিভিউ অন্যান্য শিক্ষার্থীদের বাসা নির্বাচনে সাহায্য করবে।"
                : "Thank you for your feedback! It helps fellow tenants find authentic academic rentals."}
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

            {/* 4 Criteria Star Ratings */}
            <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
              {renderStarPicker(
                isBn ? "১. প্রপার্টির তথ্যের নির্ভুলতা" : "1. Property Accuracy",
                accuracy,
                setAccuracy,
              )}
              {renderStarPicker(
                isBn ? "২. বাড়িওয়ালার ব্যবহার ও সহযোগিতা" : "2. Landlord Behavior",
                behavior,
                setBehavior,
              )}
              {renderStarPicker(
                isBn ? "৩. এলাকার অবস্থান ও নিরাপত্তা" : "3. Location & Safety",
                location,
                setLocation,
              )}
              {renderStarPicker(
                isBn ? "৪. সার্বিক অভিজ্ঞতা" : "4. Overall Experience",
                overall,
                setOverall,
              )}
            </div>

            {/* Detailed Comment */}
            <div className="space-y-1.5">
              <label htmlFor="review-comment" className="text-xs font-semibold text-foreground">
                {isBn ? "আপনার বিস্তারিত অভিজ্ঞতা" : "Your Review & Feedback"}
              </label>
              <textarea
                id="review-comment"
                rows={4}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  isBn
                    ? "বাসার পানির অবস্থা, পরিবেশ, পড়াশোনার সুযোগ বা বাড়িওয়ালার নিয়মকানুন সম্পর্কে লিখুন..."
                    : "Share details on water supply, study environment, quiet hours, or landlord responsiveness..."
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
                {isBn ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:scale-[1.02] disabled:opacity-50"
              >
                <span>
                  {isSubmitting
                    ? isBn
                      ? "জমা হচ্ছে..."
                      : "Submitting..."
                    : isBn
                      ? "রিভিউ জমা দিন"
                      : "Submit Review"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
