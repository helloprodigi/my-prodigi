import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const MIGRATION_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "AppStats" (
    "id" TEXT NOT NULL,
    "totalTeamsCreated" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AppStats_pkey" PRIMARY KEY ("id")
  )`,
  // Seed the single global row, and backfill it with however many Team rows
  // currently exist so the counter starts accurate for teams already active
  // rather than at zero.
  `INSERT INTO "AppStats" ("id", "totalTeamsCreated")
   VALUES ('global', (SELECT COUNT(*) FROM "Team"))
   ON CONFLICT ("id") DO NOTHING`,
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

  console.log(`Menjalankan migrasi AppStats via ${connection.source}...`);
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
    const { rows } = await client.query(`SELECT * FROM "AppStats" WHERE id = 'global'`);
    console.log("Seeded row:", rows[0]);
    console.log("\n✓ AppStats migration applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error.message || error);
  console.error(error);
  process.exit(1);
});
