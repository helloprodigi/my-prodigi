import { divisions } from "./divisions";

// Only the club's top leadership (Ketua / Wakil Ketua, from the INTI group in
// data/struktur_organisasi.json) may check off program kerja as done.
export function isKetuaOrWakilKetua(jabatan: string | null | undefined) {
  return jabatan === "Ketua" || jabatan === "Wakil Ketua";
}

// The head of a specific division (PIC), identified by a jabatan of the form
// "<orgName> (Kepala Divisi)" matching that division's orgName in lib/divisions.ts.
export function isKepalaDivisiOf(jabatan: string | null | undefined, divisiName: string) {
  if (!jabatan) return false;
  const division = divisions.find((d) => d.name === divisiName);
  if (!division) return false;
  return jabatan === `${division.orgName} (Kepala Divisi)`;
}

// Editing/cancelling a program kerja (fixing a mistake, calling it off) is
// allowed for the org's Ketua/Wakil Ketua, that division's own PIC, or anyone
// the PIC has explicitly granted proker access to (see /my-divisi).
export function canEditProker(
  jabatan: string | null | undefined,
  divisiName: string,
  hasProkerAccess?: boolean | null
) {
  return isKetuaOrWakilKetua(jabatan) || isKepalaDivisiOf(jabatan, divisiName) || !!hasProkerAccess;
}

// The 7 literal `posisi` strings under the "INTI" group in
// data/struktur_organisasi.json — the club's executive team, which sits
// outside the 10 regular proker divisions in lib/divisions.ts.
const INTI_ROLES = [
  "Ketua",
  "Wakil Ketua",
  "Bendahara",
  "Sekretaris I",
  "Sekretaris II",
  "Vice President External",
  "Vice President Internal",
];

// Resolves a jabatan to its "division group": one of the 10 lib/divisions.ts
// `name`s, or "INTI" for the executive team, or null if unrecognized/unset.
export function resolveDivisionGroup(jabatan: string | null | undefined): string | null {
  if (!jabatan) return null;
  if (INTI_ROLES.includes(jabatan)) return "INTI";
  const orgName = jabatan.replace(" (Kepala Divisi)", "").trim();
  return divisions.find((d) => d.orgName === orgName)?.name ?? null;
}

// The PIC of a division group: the INTI group's PIC is its Ketua; every other
// group's PIC is its Kepala Divisi.
export function isPicOf(jabatan: string | null | undefined, groupName: string | null) {
  if (!groupName) return false;
  if (groupName === "INTI") return jabatan === "Ketua";
  return isKepalaDivisiOf(jabatan, groupName);
}

const INTI_LABELS: Record<string, string> = {
  "Wakil Ketua": "Vice Leader",
  "Bendahara": "Treasurer",
  "Sekretaris I": "Secretary I",
  "Sekretaris II": "Secretary II",
  "Vice President External": "VP External",
  "Vice President Internal": "VP Internal",
};

// The label shown for a member's role on /my-divisi. INTI members show a
// title derived from their specific jabatan; every other division just shows
// "Anggota" for regular members ("Product Manager" for Product's PIC).
export function getMemberLabel(
  jabatan: string | null | undefined,
  groupName: string | null,
  isPic: boolean
) {
  if (groupName === "INTI") {
    if (isPic) return "Leader";
    return (jabatan && INTI_LABELS[jabatan]) || jabatan || "Anggota";
  }
  if (isPic) return groupName === "Product" ? "Product Manager" : "Ketua";
  return "Anggota";
}

// Which of the 10 proker divisions a user may create a program kerja/laporan
// for: the org's Ketua/Wakil Ketua may create for any of them; everyone else
// only for their own division, and only if they're its PIC or have been
// granted proker access by that PIC (see /my-divisi).
export function getCreatableDivisionNames(
  jabatan: string | null | undefined,
  hasProkerAccess?: boolean | null
): string[] {
  if (isKetuaOrWakilKetua(jabatan)) return divisions.map((d) => d.name);
  const group = resolveDivisionGroup(jabatan);
  if (group && group !== "INTI" && (isPicOf(jabatan, group) || hasProkerAccess)) {
    return [group];
  }
  return [];
}
