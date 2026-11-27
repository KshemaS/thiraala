"use client";

import { LazyMotion } from "framer-motion";

const loadFeatures = () => import("@/lib/motionFeatures").then((mod) => mod.default);

/**
 * Pages use framer-motion's lightweight `m` components; the animation code
 * itself is fetched separately once the page is up (see lib/motionFeatures).
 * `strict` makes any leftover full `motion` component fail loudly in
 * development, so the full library can't creep back into every page.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
