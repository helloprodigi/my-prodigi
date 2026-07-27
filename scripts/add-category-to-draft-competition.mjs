import "dotenv/config";
import pg from "pg";

const { Client } = pg;

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
  if (pooled) return { url: normalizeConnectionUrl(pooled), source: "DATABASE_URL" };
  return null;
}

async function main() {
  const connection = getConnectionString();
  if (!connection) {
    console.error("No database connection string found.");
    process.exit(1);
  }

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const client = new Client({
    connectionString: connection.url,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    await client.query(`
      ALTER TABLE "DraftCompetition" 
      ADD COLUMN IF NOT EXISTS "category" TEXT;
    `);
    console.log("Successfully added category column to DraftCompetition table.");
    await client.query("NOTIFY pgrst, 'reload schema';").catch(() => {});
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await client.end();
  }
}

main();
