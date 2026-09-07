import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const MIGRATION_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
  )`,
  `DO $$ BEGIN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId")`,
  `CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead")`,
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

  console.log(`Menjalankan migrasi Notification via ${connection.source}...`);
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
    console.log("\n✓ Notification table migration applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error.message || error);
  console.error(error);
  process.exit(1);
});
