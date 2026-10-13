import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Navigation, ExternalLink, ShieldCheck } from "lucide-react";
import type { PropertyItem } from "@/lib/api/properties";
import { Link } from "@tanstack/react-router";

interface PropertyMapProps {
  properties: PropertyItem[];
  selectedId?: string;
  onSelectProperty?: (id: string) => void;
}

export function PropertyMap({ properties, selectedId, onSelectProperty }: PropertyMapProps) {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const [activeProperty, setActiveProperty] = useState<PropertyItem | null>(() => {
    return properties.find((p) => p.id === selectedId) || properties[0] || null;
  });

  // Khulna Bounding Box for SVG Map Projection
  // Latitude: ~22.79 to ~22.91
  // Longitude: ~89.49 to ~89.57
  const minLat = 22.79;
  const maxLat = 22.91;
  const minLng = 89.49;
  const maxLng = 89.57;

  const projectToMap = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    // Invert Y because latitude increases northward (upward)
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100;
    return {
      x: Math.max(8, Math.min(92, x)),
      y: Math.max(8, Math.min(92, y)),
    };
  };

  const handleMarkerClick = (p: PropertyItem) => {
    setActiveProperty(p);
    if (onSelectProperty) {
      onSelectProperty(p.id);
    }
  };

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xs"
      aria-label="Khulna Interactive Rental Map"
    >
      {/* Top Map Bar */}
      <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <Navigation className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span>{isBn ? "খুলনা মেকানিকাল ও একাডেমি ম্যাপ" : "Khulna Academic & City Map"}</span>
        </div>
        <span>
          {properties.length} {isBn ? "পিন প্রদর্শিত" : "pins plotted"}
        </span>
      </div>

      {/* Interactive Map Visual Stage */}
      <div className="relative h-[380px] w-full overflow-hidden bg-radial from-secondary/40 to-secondary/80 md:h-[500px]">
        {/* Subtle Map Grid Lines & Rupsha River Curve */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full opacity-35"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.2" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          {/* Simulated Bhairab / Rupsha River stream curve on Eastern edge */}
          <path
            d="M 85 0 Q 75 40 88 70 T 82 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="2 1"
            className="text-primary/30"
          />
        </svg>

        {/* Khulna Key Regional Landmark Watermarks */}
        <div className="pointer-events-none absolute left-6 top-6 rounded-md bg-surface/70 px-2 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur-xs">
          KUET / Teligati Zone
        </div>
        <div className="pointer-events-none absolute bottom-8 left-8 rounded-md bg-surface/70 px-2 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur-xs">
          Khulna University / Gallamari
        </div>
        <div className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 rounded-md bg-surface/70 px-2 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur-xs">
          Sonadanga R/A & Central
        </div>

        {/* Plotted Property Pins */}
        {properties.map((p) => {
          const { x, y } = projectToMap(p.lat, p.lng);
          const isSelected = activeProperty?.id === p.id;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleMarkerClick(p)}
              style={{ left: `${x}%`, top: `${y}%` }}
              aria-label={`Property: ${p.title}, ৳${p.rent}`}
              aria-pressed={isSelected}
              className={`group absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 focus-visible:outline-2 focus-visible:outline-primary ${
                isSelected ? "z-20 scale-110" : "z-10 hover:scale-105"
              }`}
            >
              <div
                className={`flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-bold shadow-md transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/40"
                    : "bg-surface text-foreground border border-border group-hover:border-primary"
                }`}
              >
                <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span>৳{p.rent >= 1000 ? `${(p.rent / 1000).toFixed(1)}k` : p.rent}</span>
              </div>
            </button>
          );
        })}

        {/* Floating Active Property Card Overlay on Map */}
        {activeProperty && (
          <div className="absolute bottom-4 left-4 right-4 z-30 mx-auto max-w-sm rounded-xl border border-border bg-surface p-3.5 shadow-xl backdrop-blur-md md:left-6 md:right-auto md:w-80">
            <div className="flex gap-3">
              <img
                src={activeProperty.featuredImage}
                alt={activeProperty.title}
                className="h-18 w-20 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-foreground">
                    ৳{activeProperty.rent.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-muted-foreground">/{isBn ? "মাস" : "mo"}</span>
                  {activeProperty.verifications.length > 0 && (
                    <ShieldCheck
                      className="ml-auto h-3.5 w-3.5 text-primary shrink-0"
                      aria-label="Verified"
                    />
                  )}
                </div>
                <h4 className="mt-0.5 truncate text-xs font-semibold text-foreground">
                  {isBn && activeProperty.banglaTitle
                    ? activeProperty.banglaTitle
                    : activeProperty.title}
                </h4>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {activeProperty.area}
                </p>
                <Link
                  to="/properties/$propertyId"
                  params={{ propertyId: activeProperty.id }}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  <span>{isBn ? "বিস্তারিত দেখুন" : "View Details"}</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* WCAG Accessible List Alternative to Map Content */}
      <div className="border-t border-border bg-surface p-4">
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground hover:text-primary">
            {isBn
              ? "ম্যাপের অ্যাক্সেসিবল টেক্সট লিস্ট দেখুন (Screen Reader Friendly)"
              : "View Accessible Text List of Plotted Locations (Screen Reader Alternative)"}
          </summary>
          <ul className="mt-3 space-y-2 max-h-36 overflow-y-auto">
            {properties.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between border-b border-border/40 pb-1"
              >
                <span>
                  <strong>{p.area}</strong>: {p.title} (৳{p.rent}/mo)
                </span>
                <Link
                  to="/properties/$propertyId"
                  params={{ propertyId: p.id }}
                  className="font-medium text-primary hover:underline"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
