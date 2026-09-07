import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const MIGRATION_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "DraftCompetition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "tab" TEXT NOT NULL,
    "skills" TEXT[] NOT NULL DEFAULT '{}',
    "description" TEXT,
    "link" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DraftCompetition_pkey" PRIMARY KEY ("id")
  )`,
  `DO $$ BEGIN
    ALTER TABLE "DraftCompetition" ADD CONSTRAINT "DraftCompetition_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `CREATE INDEX IF NOT EXISTS "DraftCompetition_tab_idx" ON "DraftCompetition"("tab")`,
];

function normalizeConnectionUrl(url) {
  const parsed = new URL(url);
  parsed.searchParams.set("uselibpqcompat", "true");
  parsed.searchParams.set("sslmode", "require");
  return parsed.toString();
}

function getConnectionString() {
  const direct = process.env.DIRECT_URL;
  const pooled = process.env.DATABASE_URL;

  if (direct) return { url: normalizeConnectionUrl(direct), source: "DIRECT_URL" };

  if (pooled?.includes("6543") || pooled?.includes("pgbouncer=true")) {
    console.warn("Peringatan: DATABASE_URL memakai pooler. Set DIRECT_URL (port 5432) di .env untuk migrasi.");
  }

  if (pooled) return { url: normalizeConnectionUrl(pooled), source: "DATABASE_URL" };
  return null;
}

async function main() {
  const connection = getConnectionString();
  if (!connection) {
    console.error("DIRECT_URL atau DATABASE_URL tidak ditemukan di .env");
    process.exit(1);
  }

  console.log(`Menjalankan migrasi DraftCompetition via ${connection.source}...`);

  const isLocal = /localhost|127\.0\.0\.1/.test(connection.url);
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const client = new Client({
    connectionString: connection.url,
    ssl: isLocal ? false : true,
  });

  await client.connect();

  try {
    for (let i = 0; i < MIGRATION_STATEMENTS.length; i++) {
      const statement = MIGRATION_STATEMENTS[i];
      try {
        await client.query(statement);
        console.log(`OK (${i + 1}/${MIGRATION_STATEMENTS.length})`);
      } catch (error) {
        console.error(`Gagal pada statement ${i + 1}/${MIGRATION_STATEMENTS.length}:`);
        console.error(statement.slice(0, 120) + "...");
        throw error;
      }
    }

    try {
      await client.query("NOTIFY pgrst, 'reload schema';");
      console.log("Schema cache reloaded.");
    } catch (error) {
      console.warn("Gagal memicu reload schema, lanjutkan manual bila perlu:", error.message);
    }

    console.log("DraftCompetition migration applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error.message || error);
  if (error.message?.includes("prepared statement")) {
    console.error("\nTip: Gunakan DIRECT_URL (Supabase → Database → Connection string URI, port 5432) di .env.");
  }
  process.exit(1);
});