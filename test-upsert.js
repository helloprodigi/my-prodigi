const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabaseAdmin.from('User').upsert({
    id: 'e7a3899f-2194-454d-9ef3-9317785d83ce',
    email: 'gentahalilintar36@gmail.com',
    name: 'Genta (Updated)',
    isOnboarded: true
  }, { onConflict: 'email' }).select();
  if (error) console.error("Error:", error);
  else console.log("Success:", data);
}
run();
