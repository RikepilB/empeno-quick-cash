// Same-origin redirect guard for login `?redirect=...` params.
// Blocks `//evil.com`, `javascript:`, `\\evil`, and non-relative inputs.
export function safeRedirect(input: string | undefined, fallback: string): string {
  if (!input) return fallback;
  if (!input.startsWith("/")) return fallback;
  if (input.startsWith("//")) return fallback;
  if (input.includes("\\")) return fallback;
  return input;
}
