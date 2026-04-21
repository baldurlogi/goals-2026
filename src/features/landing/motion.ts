import type { Variants } from "framer-motion";

export const landingEase: [number, number, number, number] = [
  0.16,
  1,
  0.3,
  1,
];

export const landingViewport = {
  once: true,
  amount: 0.24,
  margin: "0px 0px -12% 0px",
} as const;

export function fadeUp(distance = 24, delay = 0): Variants {
  return {
    hidden: {
      opacity: 0,
      y: distance,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.62,
        delay,
        ease: landingEase,
      },
    },
  };
}

export function popIn(delay = 0): Variants {
  return {
    hidden: {
      opacity: 0,
      y: 18,
      scale: 0.975,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.58,
        delay,
        ease: landingEase,
      },
    },
  };
}

export function staggerContainer(
  staggerChildren = 0.1,
  delayChildren = 0
): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
  };
}
