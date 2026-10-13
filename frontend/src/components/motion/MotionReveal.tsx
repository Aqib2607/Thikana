import { type ReactNode, type HTMLAttributes } from "react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

export type MotionPreset =
  | "fadeUp"
  | "fadeDown"
  | "fadeIn"
  | "scaleIn"
  | "slideInLeft"
  | "slideInRight";

interface MotionRevealProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: MotionPreset;
  delay?: number;
  delayMs?: number;
  duration?: number;
  durationMs?: number;
  threshold?: number;
  triggerOnce?: boolean;
}

export function MotionReveal({
  children,
  variant = "fadeUp",
  delay,
  delayMs,
  duration,
  durationMs,
  threshold = 0.15,
  triggerOnce = true,
  className,
  style,
  ...props
}: MotionRevealProps) {
  const effectiveDelay = delay ?? delayMs ?? 0;
  const effectiveDuration = duration ?? durationMs ?? 800;
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold, triggerOnce });

  const initialClasses: Record<MotionPreset, string> = {
    fadeUp: "opacity-0 translate-y-8",
    fadeDown: "opacity-0 -translate-y-8",
    fadeIn: "opacity-0",
    scaleIn: "opacity-0 scale-[0.96] translate-y-4",
    slideInLeft: "opacity-0 -translate-x-8",
    slideInRight: "opacity-0 translate-x-8",
  };

  const activeClasses: Record<MotionPreset, string> = {
    fadeUp: "opacity-100 translate-y-0",
    fadeDown: "opacity-100 translate-y-0",
    fadeIn: "opacity-100",
    scaleIn: "opacity-100 scale-100 translate-y-0",
    slideInLeft: "opacity-100 translate-x-0",
    slideInRight: "opacity-100 translate-x-0",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all will-change-[transform,opacity]",
        isInView ? activeClasses[variant] : initialClasses[variant],
        className,
      )}
      style={{
        transitionDuration: `${effectiveDuration}ms`,
        transitionDelay: `${effectiveDelay}ms`,
        transitionTimingFunction: "cubic-bezier(0.2, 0.7, 0.2, 1)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
