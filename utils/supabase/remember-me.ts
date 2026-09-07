"use client";

// @supabase/ssr always persists its auth cookies for the browser-allowed
// max (400 days) on every write -- including token refreshes -- and
// ignores any custom `maxAge` passed via cookieOptions (see
// createStorageFromOptions in @supabase/ssr/dist/module/cookies.js, which
// hardcodes `maxAge: DEFAULT_COOKIE_OPTIONS.maxAge` on every setItem).
// So "don't remember me" can't be configured on the client -- instead we
// let the SDK write its cookie as usual, then immediately rewrite it
// ourselves as a session cookie (no Max-Age), which the browser discards
// once fully closed. sessionStorage holds the user's choice so this can
// be re-applied on every SIGNED_IN/TOKEN_REFRESHED event for the tab's
// lifetime (matches the single-tab-per-origin design in client.ts).
const REMEMBER_ME_KEY = "sb-remember-me";
const AUTH_COOKIE_PATTERN = /^sb-.*-auth-token(\.\d+)?$/;

export function setRememberMe(remember: boolean) {
  if (remember) {
    sessionStorage.removeItem(REMEMBER_ME_KEY);
  } else {
    sessionStorage.setItem(REMEMBER_ME_KEY, "0");
  }
}

export function isRememberMeEnabled(): boolean {
  return sessionStorage.getItem(REMEMBER_ME_KEY) !== "0";
}

export function downgradeAuthCookiesToSessionOnly() {
  const isSecure = window.location.protocol === "https:";

  document.cookie.split("; ").forEach((entry) => {
    const separatorIndex = entry.indexOf("=");
    if (separatorIndex === -1) return;

    const name = entry.slice(0, separatorIndex);
    if (!AUTH_COOKIE_PATTERN.test(name)) return;

    const value = entry.slice(separatorIndex + 1);
    document.cookie = `${name}=${value}; path=/; samesite=lax${isSecure ? "; secure" : ""}`;
  });
}
