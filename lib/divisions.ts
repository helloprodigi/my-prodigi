// `orgName` is the exact sub-team name used in data/struktur_organisasi.json's
// `posisi` field (e.g. "Competitive Programming (Kepala Divisi)"), used to look
// up the division head (PIC) from the User table via `jabatan`.
export const divisions = [
  { name: "Competitive Programming", orgName: "Competitive Programming", color: "#2563EB", badgeBg: "#E0E9FC", badgeText: "#2563EB" },
  { name: "Data Mining", orgName: "Data Mining", color: "#EA580C", badgeBg: "#FCE8DD", badgeText: "#EA580C" },
  { name: "Cybersecurity", orgName: "Cyber", color: "#8A92FF", badgeBg: "#EFF0FF", badgeText: "#8A92FF" },
  { name: "Entrepreneurship", orgName: "Entrepreneur", color: "#9333EA", badgeBg: "#F0E2FC", badgeText: "#9333EA" },
  { name: "Event Originazer", orgName: "Event Organizer", color: "#DC2626", badgeBg: "#FAE1E1", badgeText: "#DC2626" },
  { name: "Human Capital", orgName: "Human Capital", color: "#587300", badgeBg: "#E8EBDB", badgeText: "#587300" },
  { name: "Innovation", orgName: "Inovasi", color: "#00ABA3", badgeBg: "#DBF3F2", badgeText: "#00ABA3" },
  { name: "Media & Design", orgName: "Media", color: "#987400", badgeBg: "#F1ECDB", badgeText: "#987400" },
  { name: "Partnertship", orgName: "Partnership", color: "#D97706", badgeBg: "#FAECDC", badgeText: "#D97706" },
  { name: "Product", orgName: "Product Team", color: "#059669", badgeBg: "#DCF0EA", badgeText: "#059669" },
] as const;

// INTI (Ketua, Wakil Ketua, Bendahara, Sekretaris, VP External/Internal) is the
// club's executive team, not one of the 10 proker divisions above — kept as a
// separate constant since it isn't a valid `divisi` value for ProgramKerja.
export const intiGroup = {
  name: "INTI",
  orgName: "INTI",
  color: "#FFC917",
  badgeBg: "#FFF3CC",
  badgeText: "#987400",
} as const;
