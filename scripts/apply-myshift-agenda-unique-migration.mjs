import "dotenv/config";
import pg from "pg";

const { Client } = pg;

// Partial unique index: only applies to MyShift-generated agendas
// (deskripsi IS NULL), leaving general/division agendas untouched. Prevents
// two concurrent requests from both auto-creating a duplicate agenda for the
// same recurring shift on the same day (findFirst-then-create race).
const MIGRATION_STATEMENTS = [
  `CREATE UNIQUE INDEX IF NOT EXISTS "AbsensiAgenda_myshift_nama_waktuMulai_key"
    ON "AbsensiAgenda" (nama, "waktuMulai")
    WHERE "deskripsi" IS NULL`,
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

  console.log(`Menjalankan migrasi AbsensiAgenda unique index via ${connection.source}...`);
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
    console.log("\n✓ AbsensiAgenda unique index migration applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error.message || error);
  console.error(error);
  process.exit(1);
});
