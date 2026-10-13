import { type ReactNode, type HTMLAttributes } from "react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

interface ImageMaskRevealProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  delay?: number;
  delayMs?: number;
  duration?: number;
  durationMs?: number;
  shape?: "rectangle" | "arch";
  hoverZoom?: boolean;
}

export function ImageMaskReveal({
  children,
  delay,
  delayMs,
  duration,
  durationMs,
  shape = "rectangle",
  hoverZoom = false,
  className,
  style,
  ...props
}: ImageMaskRevealProps) {
  const effectiveDelay = delay ?? delayMs ?? 0;
  const effectiveDuration = duration ?? durationMs ?? 1100;
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.15, triggerOnce: true });

  const archStyle =
    shape === "arch"
      ? {
          borderTopLeftRadius: "150px",
          borderTopRightRadius: "150px",
        }
      : {};

  return (
    <div
      ref={ref}
      className={cn(
        "group overflow-hidden transition-all will-change-[clip-path,transform,opacity]",
        isInView
          ? "opacity-100 scale-100 [clip-path:inset(0%_0%_0%_0%)]"
          : "opacity-0 scale-[0.97] [clip-path:inset(10%_0%_10%_0%)]",
        className,
      )}
      style={{
        ...archStyle,
        transitionDuration: `${effectiveDuration}ms`,
        transitionDelay: `${effectiveDelay}ms`,
        transitionTimingFunction: "cubic-bezier(0.65, 0, 0.2, 1)",
        ...style,
      }}
      {...props}
    >
      <div
        className={cn(
          "h-full w-full transition-transform will-change-transform",
          isInView ? "scale-100" : "scale-105",
          hoverZoom && "transition-transform duration-700 ease-out group-hover:scale-105",
        )}
        style={{
          transitionDuration: `${effectiveDuration + 300}ms`,
          transitionDelay: `${effectiveDelay}ms`,
          transitionTimingFunction: "cubic-bezier(0.2, 0.7, 0.2, 1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
