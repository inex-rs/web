import { createMediaQuery } from "@solid-primitives/media";

export const useReducedMotion = () =>
  createMediaQuery("(prefers-reduced-motion: reduce)");
