import type { Transition, Variants } from 'framer-motion';

export const EASE_OUT_EXPO: Transition['ease'] = [0.16, 1, 0.3, 1];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: EASE_OUT_EXPO },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.24, ease: 'easeOut' } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.32, ease: EASE_OUT_EXPO },
  },
};

export const slideInRight: Variants = {
  hidden: { x: '100%' },
  show: {
    x: 0,
    transition: { duration: 0.32, ease: EASE_OUT_EXPO },
  },
  exit: {
    x: '100%',
    transition: { duration: 0.24, ease: 'easeIn' },
  },
};

export const backdropFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.16 } },
};

export const containerStagger = (
  staggerChildren = 0.04,
  delayChildren = 0.04
): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren, delayChildren },
  },
});

export const drawerHover = {
  scale: 1.04,
  transition: { duration: 0.2, ease: EASE_OUT_EXPO },
};

export const cardHover = {
  y: -2,
  scale: 1.01,
  transition: { duration: 0.2, ease: EASE_OUT_EXPO },
};

export const tapDown = {
  scale: 0.97,
  transition: { duration: 0.12 },
};
