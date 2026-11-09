import { type ReactNode, type HTMLAttributes } from "react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

export type MotionPreset =
  "fadeUp" | "fadeDown" | "fadeIn" | "scaleIn" | "slideInLeft" | "slideInRight" | "blurIn";

interface MotionRevealProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: MotionPreset;
  delay?: number;
  delayMs?: number;
  duration?: number;
  durationMs?: number;
  threshold?: number;
  triggerOnce?: boolean;
  staggerIndex?: number;
}

export function MotionReveal({
  children,
  variant = "fadeUp",
  delay,
  delayMs,
  duration,
  durationMs,
  threshold = 0.1,
  triggerOnce = true,
  staggerIndex,
  className,
  style,
  ...props
}: MotionRevealProps) {
  const baseDelay = delay ?? delayMs ?? 0;
  const staggerDelay = staggerIndex !== undefined ? Math.min(staggerIndex * 50, 350) : 0;
  const effectiveDelay = baseDelay + staggerDelay;
  const effectiveDuration = duration ?? durationMs ?? 550;
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold, triggerOnce });

  const initialClasses: Record<MotionPreset, string> = {
    fadeUp: "opacity-0 translate-y-6",
    fadeDown: "opacity-0 -translate-y-6",
    fadeIn: "opacity-0",
    scaleIn: "opacity-0 scale-[0.97] translate-y-3",
    slideInLeft: "opacity-0 -translate-x-6",
    slideInRight: "opacity-0 translate-x-6",
    blurIn: "opacity-0 blur-xs",
  };

  const activeClasses: Record<MotionPreset, string> = {
    fadeUp: "opacity-100 translate-y-0",
    fadeDown: "opacity-100 translate-y-0",
    fadeIn: "opacity-100",
    scaleIn: "opacity-100 scale-100 translate-y-0",
    slideInLeft: "opacity-100 translate-x-0",
    slideInRight: "opacity-100 translate-x-0",
    blurIn: "opacity-100 blur-none",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all",
        isInView ? activeClasses[variant] : initialClasses[variant],
        className,
      )}
      style={{
        transitionDuration: `${effectiveDuration}ms`,
        transitionDelay: `${effectiveDelay}ms`,
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: isInView ? "auto" : "transform, opacity",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
