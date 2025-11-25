"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  vertical?: boolean;
  repeat?: number;
  duration?: number;
  gap?: number;
}

export function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = true,
  vertical = false,
  repeat = 4,
  duration = 40,
  gap = 24,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        "group relative flex overflow-hidden",
        vertical ? "flex-col" : "flex-row",
        className
      )}
      style={
        {
          "--gap": `${gap}px`,
          "--duration": `${duration}s`,
        } as React.CSSProperties
      }
    >
      {/* Alpha mask for fade edges */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: vertical
            ? "linear-gradient(to bottom, hsl(var(--background)), transparent 15%, transparent 85%, hsl(var(--background)))"
            : "linear-gradient(to right, hsl(var(--background)), transparent 10%, transparent 90%, hsl(var(--background)))",
        }}
      />

      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex shrink-0",
            vertical ? "flex-col" : "flex-row",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
            vertical
              ? reverse
                ? "animate-marquee-vertical-reverse"
                : "animate-marquee-vertical"
              : reverse
                ? "animate-marquee-reverse"
                : "animate-marquee"
          )}
          style={{
            gap: `${gap}px`,
          }}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

