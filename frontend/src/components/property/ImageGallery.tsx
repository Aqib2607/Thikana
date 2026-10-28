import { useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Star, Images } from "lucide-react";
import { toBnNumber } from "@/lib/i18n";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const [activeIndex, setActiveIndex] = useState(0);

  // Enforce max 5 images per specification
  const galleryImages = images.slice(0, 5);

  const prev = () => {
    setActiveIndex((curr) => (curr === 0 ? galleryImages.length - 1 : curr - 1));
  };

  const next = () => {
    setActiveIndex((curr) => (curr === galleryImages.length - 1 ? 0 : curr + 1));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  return (
    <div
      className="space-y-3"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={t("properties.galleryAria")}
    >
      {/* Main Large Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-secondary md:aspect-[16/9]">
        <img
          key={activeIndex}
          src={galleryImages[activeIndex]}
          alt={`${title} - ${t("properties.viewPhoto")} ${toBnNumber(activeIndex + 1, i18n.language)}`}
          className="h-full w-full object-cover animate-fade-in transition-transform duration-500 hover:scale-105"
        />

        {/* Featured Image Badge (First Image is Featured per specification) */}
        {activeIndex === 0 && (
          <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-pill bg-foreground/90 px-3 py-1.5 text-xs font-semibold text-background shadow-md backdrop-blur-xs">
            <Star className="h-3.5 w-3.5 fill-current text-primary" aria-hidden="true" />
            <span>{t("properties.featuredPhoto")}</span>
          </div>
        )}

        {/* Counter Badge */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-pill bg-foreground/80 px-3 py-1 text-xs font-medium text-background backdrop-blur-xs">
          <Images className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {toBnNumber(activeIndex + 1, i18n.language)} / {toBnNumber(galleryImages.length, i18n.language)}
          </span>
        </div>

        {/* Prev / Next Controls */}
        {galleryImages.length > 1 && (
          <div className="absolute inset-y-0 left-3 right-3 flex items-center justify-between pointer-events-none">
            <button
              type="button"
              onClick={prev}
              aria-label={t("properties.prevImage")}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface/85 text-foreground shadow-md backdrop-blur-xs transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label={t("properties.nextImage")}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface/85 text-foreground shadow-md backdrop-blur-xs transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Thumbnails Strip */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none" role="tablist">
        {galleryImages.map((img, idx) => {
          const isSelected = activeIndex === idx;
          return (
            <button
              key={img + idx}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-label={`${t("properties.viewPhoto")} ${toBnNumber(idx + 1, i18n.language)}`}
              onClick={() => setActiveIndex(idx)}
              className={`relative aspect-[16/10] w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all md:w-24 ${
                isSelected
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border/60 opacity-70 hover:opacity-100"
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
              {idx === 0 && (
                <div
                  className="absolute bottom-1 left-1 rounded-sm bg-foreground/80 px-1 text-[9px] font-bold text-background"
                  title="Featured"
                >
                  *
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
