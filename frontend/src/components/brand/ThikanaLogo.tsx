import { cn } from "@/lib/utils";

/** Thikana mark: a location pin whose head is a doorway. Scales with font-size via `className`. */
export function ThikanaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("h-8 w-8", className)}>
      <path
        d="M16 2c-6.6 0-12 5.2-12 11.7C4 22 16 30 16 30s12-8 12-16.3C28 7.2 22.6 2 16 2Z"
        fill="currentColor"
      />
      <path d="M11 20v-6.2L16 10l5 3.8V20h-3.4v-4h-3.2v4Z" className="fill-primary-foreground" />
    </svg>
  );
}

export function ThikanaLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-foreground", className)}>
      <ThikanaMark />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-semibold tracking-tight">ঠিকানা</span>
        <span className="text-xs font-medium tracking-[0.2em] text-muted-foreground">THIKANA</span>
      </span>
    </span>
  );
}
