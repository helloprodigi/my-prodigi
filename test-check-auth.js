const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) console.error(error);
  console.log("Auth users:", users.map(u => ({ id: u.id, email: u.email })));
}
run();
