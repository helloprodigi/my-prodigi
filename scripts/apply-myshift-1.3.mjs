import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function main() {
  console.log("Adding new columns for MyShift 1.3 to AbsensiRecord table...");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    await client.query(`
      ALTER TABLE "AbsensiRecord"
      ADD COLUMN "shiftStatus" TEXT NOT NULL DEFAULT 'OFF',
      ADD COLUMN "actualDuration" INTEGER,
      ADD COLUMN "creditedDuration" INTEGER,
      ADD COLUMN "closeReason" TEXT;
    `);
    console.log("Columns added successfully!");
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('column "shiftStatus" of relation "AbsensiRecord" already exists')) {
      console.log("Columns already exist, skipping.");
    } else {
      throw error;
    }
  } finally {
    await client.end();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
