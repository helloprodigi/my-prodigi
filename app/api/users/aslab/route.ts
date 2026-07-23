import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(req: Request) {
  try {
    const dataPath = path.join(process.cwd(), "data", "data_prodigi.json");
    const fileContent = await fs.readFile(dataPath, "utf-8");
    const parsedData = JSON.parse(fileContent);

    const aslabList = parsedData["CHAMP PRODIGI"] || [];
    
    // Map to a cleaner format
    const formattedList = aslabList.map((aslab: any) => ({
      nim: String(aslab["NIM"]),
      nama: aslab["Nama "] || aslab["Nama"], // Handle trailing space in JSON key
      divisi: aslab["DIVISI"],
      posisi: aslab["Posisi"]
    })).filter((a: any) => a.nim && a.nama);

    return NextResponse.json(formattedList);
  } catch (error) {
    console.error("Error reading aslab data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
