"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { setRememberMe } from "@/utils/supabase/remember-me";
import { getSafeRedirect } from "@/utils/getSafeRedirect";
import { loadGoogleIdentityScript, createGoogleNonce } from "@/utils/google-identity";

type Props = {
  intent: "login" | "register";
  label: string;
  loadingLabel: string;
  remember?: boolean;
  onError: (message: string) => void;
};

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
      <path d="M533.5 278.4c0-17.4-1.5-34.1-4.3-50.4H272v95.4h147.3c-6.3 34.1-25.4 62.9-54.3 82.1v68h87.6c51.3-47.2 81.9-117.1 81.9-195.1z" fill="#4285F4" />
      <path d="M272 544.3c73.7 0 135.6-24.4 180.8-66.3l-87.6-68c-24.4 16.4-55.6 26-93.2 26-71.6 0-132.3-48.4-154.1-113.3H29.9v71.1C75.4 489.8 168.6 544.3 272 544.3z" fill="#34A853" />
      <path d="M117.9 332.7c-10.7-32.1-10.7-66.8 0-98.9V162.7H29.9c-39 77.6-39 169.7 0 247.3l88-77.3z" fill="#FBBC05" />
      <path d="M272 109.1c39.9 0 76 13.7 104.2 40.5l78-78C409.1 24.6 347.2 0 272 0 168.6 0 75.4 54.5 29.9 138.7l88 71.1C139.7 157.5 200.4 109.1 272 109.1z" fill="#EA4335" />
    </svg>
  );
}

export function GoogleSignInButton({ intent, label, loadingLabel, remember, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        onError("Google Sign-In belum dikonfigurasi (NEXT_PUBLIC_GOOGLE_CLIENT_ID kosong).");
        return;
      }

      try {
        await loadGoogleIdentityScript();
        if (cancelled || !containerRef.current || !window.google) return;

        const { nonce, hashedNonce } = await createGoogleNonce();

        window.google.accounts.id.initialize({
          client_id: clientId,
          nonce: hashedNonce,
          auto_select: false,
          callback: async (response) => {
            if (!response.credential) {
              onError("Google tidak mengembalikan credential.");
              return;
            }

            setLoading(true);
            try {
              if (remember !== undefined) {
                setRememberMe(remember);
              }

              const supabase = createClient();
              const { error } = await supabase.auth.signInWithIdToken({
                provider: "google",
                token: response.credential,
                nonce,
              });
              if (error) throw error;

              const postSignInRes = await fetch("/api/auth/google-post-signin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ intent }),
              });
              const result = await postSignInRes.json();
              if (!postSignInRes.ok) {
                throw new Error(
                  result.error === "google_not_registered"
                    ? "Akun Google ini belum terdaftar. Silakan register dulu."
                    : result.error || "Gagal masuk dengan Google.",
                );
              }

              window.location.href = getSafeRedirect();
            } catch (err: any) {
              onError(err.message || String(err));
              setLoading(false);
            }
          },
        });

        const width = Math.min(containerRef.current.parentElement?.offsetWidth || 400, 400);
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          width,
        });
      } catch (err: any) {
        onError(err.message || "Gagal memuat Google Sign-In.");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full" style={{ height: 46 }}>
      <button
        type="button"
        disabled={loading}
        tabIndex={-1}
        className="pointer-events-none absolute inset-0 w-full rounded-md flex items-center justify-center gap-2 text-gray-600 font-medium text-[11px] transition-all disabled:opacity-60"
        style={{ height: "46px", backgroundColor: "#ffffff", border: "1px solid #D9D9D9" }}
      >
        <GoogleIcon />
        {loading ? loadingLabel : label}
      </button>
      <div ref={containerRef} className="absolute inset-0 overflow-hidden opacity-0" />
    </div>
  );
}
