import { type ReactNode, type HTMLAttributes } from "react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

interface TextRevealProps extends HTMLAttributes<HTMLDivElement> {
  lines?: string[];
  children?: ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "div" | "span";
  delay?: number;
  delayMs?: number;
  duration?: number;
  durationMs?: number;
  lineClassName?: string;
}

export function TextReveal({
  lines,
  children,
  as: Component = "span",
  delay,
  delayMs,
  duration,
  durationMs,
  lineClassName,
  className,
  ...props
}: TextRevealProps) {
  const effectiveDelay = delay ?? delayMs ?? 0;
  const effectiveDuration = duration ?? durationMs ?? 900;
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.1, triggerOnce: true });

  if (lines && lines.length > 0) {
    return (
      <Component
        ref={ref as any}
        className={cn("block tracking-tight", className)}
        {...(props as any)}
      >
        {lines.map((line, i) => (
          <span key={i} className="block overflow-hidden pb-1 -mb-1">
            <span
              className={cn(
                "block transition-transform will-change-transform",
                isInView ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
                lineClassName,
              )}
              style={{
                transitionDuration: `${effectiveDuration}ms`,
                transitionDelay: `${effectiveDelay + i * 110}ms`,
                transitionTimingFunction: "cubic-bezier(0.2, 0.7, 0.2, 1)",
              }}
            >
              {line}
            </span>
          </span>
        ))}
      </Component>
    );
  }

  return (
    <Component
      ref={ref as any}
      className={cn("block overflow-hidden pb-1 -mb-1 tracking-tight", className)}
      {...(props as any)}
    >
      <span
        className={cn(
          "block transition-transform will-change-transform",
          isInView ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
          lineClassName,
        )}
        style={{
          transitionDuration: `${effectiveDuration}ms`,
          transitionDelay: `${effectiveDelay}ms`,
          transitionTimingFunction: "cubic-bezier(0.2, 0.7, 0.2, 1)",
        }}
      >
        {children}
      </span>
    </Component>
  );
}
