import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const MIGRATION_STATEMENTS = [
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hasProkerAccess" BOOLEAN NOT NULL DEFAULT false`,
];

function normalizeConnectionUrl(url) {
  const parsed = new URL(url);
  parsed.searchParams.set("uselibpqcompat", "true");
  parsed.searchParams.set("sslmode", "require");
  return parsed.toString();
}

function getConnectionString() {
  // Prefer pooler (port 6543) since direct port 5432 may be blocked
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

  console.log(`Menjalankan migrasi User.hasProkerAccess via ${connection.source}...`);
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
    console.log("\n✓ User.hasProkerAccess migration applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error.message || error);
  console.error(error);
  process.exit(1);
});
