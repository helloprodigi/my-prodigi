import type { CookieOptionsWithName } from "@supabase/ssr";

// NOTE: @supabase/ssr ignores this maxAge when it actually writes cookies --
// it always persists auth cookies for the browser-allowed max (400 days),
// on every login and every token refresh. This option only affects other
// cookie attributes (path, sameSite, etc.); it does NOT control session
// length. The "remember me" opt-out is implemented separately in
// utils/supabase/remember-me.ts by downgrading the cookie to a session
// cookie client-side after the SDK writes it.
export const authCookieOptions: CookieOptionsWithName = {};
