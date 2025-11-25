"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode, ElementType } from "react";

interface ScrollAnimationProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /**
   * If true, this component will orchestrate the animation of its children.
   * Children must also be Motion components or ScrollAnimation components to receive the staggered animation.
   */
  container?: boolean;
  /**
   * Delay before starting the animation (in seconds).
   */
  delay?: number;
  /**
   * Duration of the animation (in seconds).
   */
  duration?: number;
  /**
   * Force this component to trigger its own animation on scroll, even if inside a container.
   * Useful for standalone items.
   */
  animateIn?: boolean;
  /**
   * If container is true, this sets the stagger delay between children.
   */
  staggerDelay?: number;
  /**
   * Threshold for triggering the animation (0 to 1).
   */
  threshold?: number;
  /**
   * Custom variants to override defaults
   */
  variants?: Variants;
}

export function ScrollAnimation({
  children,
  className,
  as: Component = "div",
  container = false,
  delay = 0,
  duration = 0.5,
  animateIn = false,
  staggerDelay = 0.1,
  threshold = 0.1,
  variants,
}: ScrollAnimationProps) {
  const MotionComponent = motion(Component);

  // Variants for the container to orchestrate children
  // We don't hide the container itself, just use it to stagger children
  const defaultContainerVariants: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  // Variants for individual items (or the container itself acting as an item)
  // Slide in from bottom, fade in, blur in
  const defaultItemVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 20, 
      filter: "blur(8px)" // Blur effect as requested
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100,
        duration: duration,
      }
    },
  };

  const usedVariants = variants || (container ? defaultContainerVariants : defaultItemVariants);
  
  // If it's a container, we trigger the animation view
  // If it's explicitly 'animateIn', we trigger
  // If it's just a child (neither container nor animateIn), we rely on parent propagation (so no initial/whileInView)
  // BUT, if it's a top-level standalone item (animateIn defaults to false), we usually WANT it to animate.
  // So we should probably default 'animateIn' to true if it's NOT a container?
  // No, because then children inside container would double-trigger or reset.
  // The pattern:
  // <ScrollAnimation container>
  //   <ScrollAnimation>Child</ScrollAnimation>
  // </ScrollAnimation>
  // Child inherits 'hidden' from container's initial='hidden'. Then container switches to 'visible', cascading to child.
  
  // So:
  // If container=true, we MUST set initial/whileInView.
  // If container=false, we MIGHT be a child or standalone.
  // If we are standalone, we need initial/whileInView.
  // If we are child, we DON'T want initial/whileInView (let parent control).
  
  // Since we can't easily know if we are a child, the user must be explicit.
  // I'll add a rule:
  // If you want a standalone item, use `animateIn={true}` OR just wrap it in a container?
  // Actually, most items on the page will be standalone blocks or lists.
  // Let's assume if `container` is false, and `animateIn` is not specified, 
  // we act as a child (passive).
  // So standalone items must be `<ScrollAnimation animateIn>...`.
  // Or better: `<ScrollAnimation>` is passive (child), `<ScrollAnimation container>` is active (parent).
  // For a single item that needs to animate: `<ScrollAnimation animateIn>`.
  
  const isController = container || animateIn;

  return (
    <MotionComponent
      className={className}
      variants={usedVariants}
      initial={isController ? "hidden" : undefined}
      whileInView={isController ? "visible" : undefined}
      viewport={isController ? { once: true, amount: threshold, margin: "0px 0px -50px 0px" } : undefined}
    >
      {children}
    </MotionComponent>
  );
}

