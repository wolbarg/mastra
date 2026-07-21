/**
 * Stable markers for Wolbarg-injected memory content.
 */

export const WOLBARG_INJECTED_MEMORY_KEY = "injectedMemory" as const;

/** Invisible-separator wrapped token — unlikely to collide with user prompts. */
export const WOLBARG_MEMORY_CONTENT_MARKER = "\u2063wolbarg:memory\u2063";

export function isInjectedMemoryText(text: string): boolean {
  return text.includes(WOLBARG_MEMORY_CONTENT_MARKER);
}
