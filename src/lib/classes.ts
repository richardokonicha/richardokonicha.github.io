/**
 * Shared class strings.
 *
 * The reveal state is opt-in on `.js` (set inline in <head>), so a visitor
 * without JavaScript — or a crawler — always sees the final, visible page.
 */
export const reveal =
  "reveal js:translate-y-4 js:opacity-0 motion-safe:js:transition-[opacity,transform] motion-safe:js:duration-[800ms] motion-safe:js:ease-silk js:data-[in=true]:translate-y-0 js:data-[in=true]:opacity-100";

/** Section shell: generous vertical rhythm plus nav-aware scroll offset. */
export const section = "scroll-mt-20 py-[clamp(4.5rem,12vh,9rem)]";

/** Joins conditional class fragments, dropping the falsy ones. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}