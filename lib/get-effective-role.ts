import { cookies } from "next/headers";

export async function getEffectiveRole(userDbRole: string | null | undefined): Promise<string> {
  const realRole = (userDbRole || "talent").toLowerCase();
  const normalizedRealRole = realRole === "aslab" ? "asisten_lab" : realRole;

  const availableRoles = normalizedRealRole === "admin"
    ? ["talent", "asisten_lab", "admin"]
    : normalizedRealRole === "asisten_lab"
      ? ["talent", "asisten_lab"]
      : ["talent"];

  try {
    const cookieStore = await cookies();
    const activeRoleCookie = cookieStore.get("activeRole")?.value;
    const normalizedCookie = activeRoleCookie === "aslab" ? "asisten_lab" : activeRoleCookie;

    if (normalizedCookie && availableRoles.includes(normalizedCookie)) {
      return normalizedCookie;
    }
  } catch (e) {
    // Fallback if not in cookie context
  }

  return normalizedRealRole;
}
