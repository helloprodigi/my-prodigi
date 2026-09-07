import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  let connectionString = process.env.DATABASE_URL || "";
  let hostname = "";
  if (connectionString) {
    const url = new URL(connectionString);
    hostname = url.hostname;
    url.searchParams.delete('sslmode');
    connectionString = url.toString();
    console.log("Modified connection string:", connectionString);
  }

  const pool = new Pool({
    connectionString,
    ssl: { 
      rejectUnauthorized: false,
      servername: hostname
    }
  });
  
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connected successfully:', res.rows[0]);
  } catch (err) {
    console.error('Error connecting:', err);
  } finally {
    await pool.end();
  }
}

main();
