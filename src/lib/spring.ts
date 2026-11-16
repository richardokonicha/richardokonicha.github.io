/**
 * The spring integrator from the Motion Studies shared runtime, reduced to what
 * this project needs: a state, a retune, and one step.
 *
 * The stiffness and damping numbers are the ones from the shared tokens, so a
 * component rebuilt here moves the same way it does in the original.
 */

export interface Spring {
  /** current value */
  x: number;
  /** velocity */
  v: number;
  /** target */
  t: number;
  /** stiffness */
  k: number;
  /** damping */
  c: number;
}

let motionQuery: MediaQueryList | null = null;

/**
 * Live `prefers-reduced-motion` check. The MediaQueryList is cached (making a
 * new one every frame is not free) but `.matches` stays live, so a change to
 * the OS setting is picked up without a reload.
 */
export function reducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  if (!motionQuery) {
    motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  }
  return motionQuery.matches;
}

/** Create a spring at rest on `x`. */
export function spring(x: number, k = 400, c = 30): Spring {
  return { x, v: 0, t: x, k, c };
}

/**
 * Retune a spring. Under reduced motion the damping is raised to critical, so
 * the value arrives without overshooting.
 */
export function tune(s: Spring, k: number, c: number): void {
  s.k = k;
  s.c = reducedMotion() ? 2 * Math.sqrt(k) : c;
}

/** Semi-implicit Euler. Call with a small fixed dt. */
export function step(s: Spring, dt: number): void {
  const a = -s.k * (s.x - s.t) - s.c * s.v;
  s.v += a * dt;
  s.x += s.v * dt;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}