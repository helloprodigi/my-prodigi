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
// allowed for the org's Ketua/Wakil Ketua, or for that division's own PIC.
export function canEditProker(jabatan: string | null | undefined, divisiName: string) {
  return isKetuaOrWakilKetua(jabatan) || isKepalaDivisiOf(jabatan, divisiName);
}
