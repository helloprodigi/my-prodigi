export function isLikelyFirstGoogleOAuthSignIn(user: { app_metadata?: { provider?: string }; created_at?: string; last_sign_in_at?: string } | null | undefined): boolean {
  if (!user) return false;

  const provider = user.app_metadata?.provider;
  if (provider !== "google") return false;

  const createdAt = user.created_at;
  const lastSignInAt = user.last_sign_in_at;

  if (!createdAt || !lastSignInAt) return false;

  const createdAtMs = Date.parse(createdAt);
  const lastSignInAtMs = Date.parse(lastSignInAt);

  if (Number.isNaN(createdAtMs) || Number.isNaN(lastSignInAtMs)) return false;

  return Math.abs(lastSignInAtMs - createdAtMs) < 15_000;
}
