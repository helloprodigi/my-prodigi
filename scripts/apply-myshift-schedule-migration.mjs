import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const MIGRATION_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "MyShiftSchedule" (
    "id" TEXT NOT NULL,
    "hari" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "namaSesi" TEXT,
    "waktuMulai" TEXT NOT NULL,
    "waktuSelesai" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MyShiftSchedule_pkey" PRIMARY KEY ("id")
  )`,
  `DO $$ BEGIN
    ALTER TABLE "MyShiftSchedule" ADD CONSTRAINT "MyShiftSchedule_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `CREATE INDEX IF NOT EXISTS "MyShiftSchedule_dayOfWeek_idx" ON "MyShiftSchedule"("dayOfWeek")`,
  `CREATE TABLE IF NOT EXISTS "MyShiftScheduleAssignment" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "userId" TEXT,
    "nama" TEXT NOT NULL,
    "nim" TEXT NOT NULL,
    "jabatan" TEXT,
    "divisi" TEXT,
    CONSTRAINT "MyShiftScheduleAssignment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MyShiftScheduleAssignment_scheduleId_nim_key" UNIQUE ("scheduleId", "nim")
  )`,
  `DO $$ BEGIN
    ALTER TABLE "MyShiftScheduleAssignment" ADD CONSTRAINT "MyShiftScheduleAssignment_scheduleId_fkey"
      FOREIGN KEY ("scheduleId") REFERENCES "MyShiftSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "MyShiftScheduleAssignment" ADD CONSTRAINT "MyShiftScheduleAssignment_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `CREATE INDEX IF NOT EXISTS "MyShiftScheduleAssignment_scheduleId_idx" ON "MyShiftScheduleAssignment"("scheduleId")`,
];

function normalizeConnectionUrl(url) {
  const parsed = new URL(url);
  parsed.searchParams.set("uselibpqcompat", "true");
  parsed.searchParams.set("sslmode", "require");
  return parsed.toString();
}

function getConnectionString() {
  const pooled = process.env.DATABASE_URL;
  const direct = process.env.DIRECT_URL;
  if (pooled) return { url: normalizeConnectionUrl(pooled), source: "DATABASE_URL (pooler)" };
  if (direct) return { url: normalizeConnectionUrl(direct), source: "DIRECT_URL" };
  return null;
}

async function main() {
  const connection = getConnectionString();
  if (!connection) {
    console.error("DIRECT_URL atau DATABASE_URL tidak ditemukan di .env");
    process.exit(1);
  }

  console.log(`Menjalankan migrasi MyShiftSchedule via ${connection.source}...`);
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const client = new Client({
    connectionString: connection.url,
    ssl: true,
  });

  await client.connect();

  try {
    for (let i = 0; i < MIGRATION_STATEMENTS.length; i++) {
      await client.query(MIGRATION_STATEMENTS[i]);
      console.log(`  OK (${i + 1}/${MIGRATION_STATEMENTS.length})`);
    }
    console.log("\n✓ MyShiftSchedule & MyShiftScheduleAssignment migration applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error.message || error);
  console.error(error);
  process.exit(1);
});
