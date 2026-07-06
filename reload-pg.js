const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:DTC%40tult1508@db.hwlbbaqpeefhdmflshsv.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log("Connected to database.");
  
  // First let's check if the column exists
  const res = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name='User' AND column_name='photoUrl';
  `);
  
  if (res.rows.length === 0) {
    console.log("Adding photoUrl column...");
    await client.query('ALTER TABLE "User" ADD COLUMN "photoUrl" TEXT;');
  } else {
    console.log("Column photoUrl already exists.");
  }
  
  await client.query("NOTIFY pgrst, 'reload schema';");
  console.log("Schema reloaded.");
  await client.end();
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
