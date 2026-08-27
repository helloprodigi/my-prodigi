// Only honor same-origin relative paths from a `?redirect=` query param —
// prevents an open redirect via something like `?redirect=https://evil.com`.
export function getSafeRedirect(fallback: string = "/"): string {
  if (typeof window === "undefined") return fallback;
  const redirect = new URLSearchParams(window.location.search).get("redirect");
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }
  return fallback;
}
