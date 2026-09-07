import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function GET(req: Request) {
  try {
    // 1. Fetch real registered users with role asisten_lab from database
    const dbAslabs = await prisma.user.findMany({
      where: { role: "asisten_lab" },
      select: {
        id: true,
        name: true,
        email: true,
        nim: true,
        divisi: true,
        jabatan: true,
        photoUrl: true,
      },
      orderBy: { name: "asc" }
    });

    // 2. Load data_prodigi.json to auto-enrich any missing metadata (NIM, Divisi, Posisi/Jabatan)
    let staticMap = new Map<string, { nim: string; divisi: string; posisi: string; nama: string }>();
    try {
      const dataPath = path.join(process.cwd(), "data", "data_prodigi.json");
      const fileContent = await fs.readFile(dataPath, "utf-8");
      const parsedData = JSON.parse(fileContent);
      const champList = parsedData["CHAMP PRODIGI"] || [];
      
      for (const item of champList) {
        const email = String(item["Email"] || "").toLowerCase().trim();
        const nim = String(item["NIM"] || "").trim();
        const nama = String(item["Nama "] || item["Nama"] || "").trim();
        const divisi = String(item["DIVISI"] || "").trim();
        const posisi = String(item["Posisi"] || "").trim();

        if (email) staticMap.set(email, { nim, divisi, posisi, nama });
        if (nim) staticMap.set(nim, { nim, divisi, posisi, nama });
        if (nama) staticMap.set(nama.toLowerCase(), { nim, divisi, posisi, nama });
      }
    } catch (e) {
      console.warn("Could not load data_prodigi.json for enrichment:", e);
    }

    // 3. Format registered database Aslabs
    const formattedDbList = dbAslabs.map(user => {
      const emailKey = user.email?.toLowerCase().trim() || "";
      const nameKey = user.name?.toLowerCase().trim() || "";
      const staticInfo = staticMap.get(emailKey) || staticMap.get(user.nim || "") || staticMap.get(nameKey);

      const nim = user.nim || staticInfo?.nim || `NIM-${user.id.substring(0, 8)}`;
      const nama = user.name || staticInfo?.nama || user.email?.split("@")[0] || "Asisten Lab";
      const divisi = user.divisi || staticInfo?.divisi || "Asisten Lab";
      const posisi = user.jabatan || staticInfo?.posisi || divisi || "Asisten Lab";

      return {
        id: user.id,
        userId: user.id,
        nim,
        nama,
        divisi,
        posisi,
        jabatan: posisi,
        photoUrl: user.photoUrl
      };
    });

    // If there are registered aslabs in database, return them
    if (formattedDbList.length > 0) {
      return NextResponse.json(formattedDbList);
    }

    // Fallback: If no aslabs have registered yet in the DB, return static list so UI is testable
    const dataPath = path.join(process.cwd(), "data", "data_prodigi.json");
    const fileContent = await fs.readFile(dataPath, "utf-8");
    const parsedData = JSON.parse(fileContent);
    const aslabList = parsedData["CHAMP PRODIGI"] || [];
    
    const fallbackList = aslabList.map((aslab: any, index: number) => ({
      id: `static-${index}`,
      userId: null,
      nim: String(aslab["NIM"]),
      nama: aslab["Nama "] || aslab["Nama"],
      divisi: aslab["DIVISI"] || "Asisten Lab",
      posisi: aslab["Posisi"] || aslab["DIVISI"] || "Asisten Lab",
      jabatan: aslab["Posisi"] || aslab["DIVISI"] || "Asisten Lab",
      photoUrl: null
    })).filter((a: any) => a.nim && a.nama);

    return NextResponse.json(fallbackList);
  } catch (error) {
    console.error("Error reading aslab data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
