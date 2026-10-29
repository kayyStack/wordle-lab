// Timings shared with index.css (the flip there is 0.5s, staggered 0.25s).
export const FLIP_MS = 500;
export const STAGGER_MS = 250;

/** How long a row of tiles takes to finish flipping. */
export function revealMs(tiles: number): number {
  return (tiles - 1) * STAGGER_MS + FLIP_MS;
}

/** True when the player has asked their device to reduce motion. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
