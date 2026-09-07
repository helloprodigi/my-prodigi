import { createBrowserClient } from "@supabase/ssr";
import { authCookieOptions } from "./cookie-options";
import { isRememberMeEnabled, downgradeAuthCookiesToSessionOnly } from "./remember-me";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// The default auth lock uses the browser's Web Locks API (navigator.locks) to
// serialize token refresh/getUser calls across tabs. If that lock is ever left
// orphaned (e.g. a crashed/suspended tab still holding it), every subsequent
// auth call in every tab hangs forever waiting to acquire it, with no network
// request ever being sent. Running single-tab-per-origin here doesn't need
// cross-tab coordination, so skip the browser lock entirely.
const noOpLock = async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn();

// createBrowserClient caches a singleton internally, so this listener must
// only be attached once even though createClient() is called from many
// components.
let rememberMeListenerAttached = false;

export const createClient = () => {
  const client = createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
    {
      auth: {
        lock: noOpLock,
      },
      cookieOptions: authCookieOptions,
    },
  );

  if (typeof window !== "undefined" && !rememberMeListenerAttached) {
    rememberMeListenerAttached = true;
    client.auth.onAuthStateChange((event) => {
      if (
        !isRememberMeEnabled() &&
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")
      ) {
        downgradeAuthCookiesToSessionOnly();
      }
    });
  }

  return client;
};
