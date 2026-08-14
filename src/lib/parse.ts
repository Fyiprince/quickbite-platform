/**
 * Parse a Convex error into a human-readable message. Backend helpers throw
 * `ConvexError(JSON.stringify({ code, message }))`; this unwraps that shape
 * and falls back to plain Error messages.
 */
export function parseError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const anyErr = error as { data?: unknown; message?: string; toString?: () => string };
    if (typeof anyErr.data === "string") {
      try {
        const parsed = JSON.parse(anyErr.data);
        if (parsed && typeof parsed.message === "string") return parsed.message;
      } catch {
        /* not our shape */
      }
      return anyErr.data;
    }
    if (typeof anyErr.message === "string" && anyErr.message) return anyErr.message;
  }
  return "Something went wrong. Please try again.";
}
