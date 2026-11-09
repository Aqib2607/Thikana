import { useState, useEffect, type ReactNode, type HTMLAttributes, type ElementType } from "react";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

type AllowedTag = "h1" | "h2" | "h3" | "h4" | "p" | "div" | "span";

interface TextRevealProps extends HTMLAttributes<HTMLElement> {
  lines?: string[];
  children?: ReactNode;
  as?: AllowedTag;
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
  const { ref, isInView } = useInView<HTMLElement>({ threshold: 0.1, triggerOnce: true });
  const Tag = Component as ElementType;

  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!isInView) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setRevealed(true);
    }, effectiveDelay + effectiveDuration + 50);
    return () => {
      clearTimeout(timer);
    };
  }, [isInView, effectiveDelay, effectiveDuration]);

  if (lines && lines.length > 0) {
    return (
      <Tag ref={ref} className={cn("block", className)} {...props}>
        {lines.map((line, i) => (
          <span
            key={i}
            className={cn(
              "block transition-all",
              revealed ? "overflow-visible" : "overflow-hidden pt-5 pb-5 -my-5",
            )}
          >
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
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref}
      className={cn(
        "block transition-all",
        revealed ? "overflow-visible" : "overflow-hidden pt-5 pb-5 -my-5",
        className,
      )}
      {...props}
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
    </Tag>
  );
}
