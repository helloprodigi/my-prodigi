const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminDb = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const today = new Date().toISOString();
  console.log('Today:', today);
  const { data, error } = await adminDb.from('Competition').delete().lt('deadline', today);
  console.log('Error:', error);
  console.log('Data:', data);
}

run();
