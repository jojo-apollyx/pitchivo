"use client";

import { cn } from "@/lib/utils";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface VerticalCutRevealProps {
  children: string;
  className?: string;
  splitBy?: "words" | "characters";
  staggerDuration?: number;
  staggerFrom?: "first" | "last";
  transition?: {
    duration?: number;
    delay?: number;
  };
}

export function VerticalCutReveal({
  children,
  className,
  splitBy = "characters",
  staggerDuration = 0.03,
  staggerFrom = "first",
  transition = {
    duration: 0.5,
    delay: 0,
  },
}: VerticalCutRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.5 });
  
  const words = children.split(" ");

  // Calculate total character count for proper indexing
  let globalCharIndex = 0;

  return (
    <div ref={containerRef} className={cn("flex flex-wrap", className)}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-flex overflow-hidden mr-[0.25em]">
          {splitBy === "characters"
            ? word.split("").map((char, charIndex) => {
                const currentGlobalIndex = globalCharIndex;
                globalCharIndex++;
                
                const delay = 
                  staggerFrom === "first"
                    ? currentGlobalIndex * staggerDuration
                    : (children.replace(/ /g, "").length - currentGlobalIndex) * staggerDuration;

                return (
                  <motion.span
                    key={charIndex}
                    className="inline-block"
                    initial={{ y: "-100%" }}
                    animate={isInView ? { y: 0 } : { y: "-100%" }}
                    transition={{
                      duration: transition.duration || 0.5,
                      delay: (transition.delay || 0) + delay,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    {char}
                  </motion.span>
                );
              })
            : (
                <motion.span
                  className="inline-block"
                  initial={{ y: "-100%" }}
                  animate={isInView ? { y: 0 } : { y: "-100%" }}
                  transition={{
                    duration: transition.duration || 0.5,
                    delay: (transition.delay || 0) + wordIndex * staggerDuration,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  {word}
                </motion.span>
              )
          }
        </span>
      ))}
    </div>
  );
}

